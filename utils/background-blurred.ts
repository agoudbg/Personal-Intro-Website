import { createCanvas, loadImage } from 'canvas';
import type {
  Canvas,
  CanvasRenderingContext2D as NodeCanvasRenderingContext2D,
  Image as CanvasImage,
} from 'canvas';
import { shallowRef, watch } from 'vue';

export const MICA_TEXTURE_BLEED_PX = 128;

export const blurred = shallowRef(new Image());
export const blurredUpdateDate = shallowRef(0);
export const blurredRenderStatus = shallowRef<'loading' | 'ready' | 'error'>('loading');

const BACKGROUND_BLUR_PX = 30;
const FILTER_PADDING_PX = BACKGROUND_BLUR_PX * 2;
const BLUR_PASSES = 5;
const MICA_TEXTURE_RENDER_SCALE = 0.25;

type CanvasRectangle = [x: number, y: number, width: number, height: number];
type CanvasFilterMode = 'native' | 'polyfill';
type DrawImageCoordinates =
  | [dx: number, dy: number]
  | [
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ];

let renderSequence = 0;
let canvasFilterPolyfillPromise: Promise<CanvasFilterMode> | undefined;
const nativeDrawImage = CanvasRenderingContext2D.prototype.drawImage;

function drawImageWithoutFilter(
  context: NodeCanvasRenderingContext2D,
  image: Canvas | CanvasImage,
  ...coordinates: DrawImageCoordinates
) {
  Reflect.apply(nativeDrawImage, context, [image, ...coordinates]);
}

function hasNativeCanvasFilter() {
  return 'filter' in CanvasRenderingContext2D.prototype;
}

async function ensureCanvasFilterSupport(): Promise<CanvasFilterMode> {
  if (canvasFilterPolyfillPromise) return canvasFilterPolyfillPromise;
  if (hasNativeCanvasFilter()) return 'native';

  canvasFilterPolyfillPromise = import('context-filter-polyfill')
    .then(async () => {
      // The package installs its proxy in a queued microtask.
      await Promise.resolve();
      return 'polyfill' as const;
    })
    .catch((error: unknown) => {
      canvasFilterPolyfillPromise = undefined;
      throw new Error('Failed to initialize the canvas filter polyfill.', { cause: error });
    });

  return canvasFilterPolyfillPromise;
}

async function updateBlurredImage() {
  const currentRender = ++renderSequence;
  blurredRenderStatus.value = 'loading';

  try {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const image = await loadImage(backgroundImage.value);

    if (currentRender !== renderSequence) return;

    // Draw the source with the same cover geometry as the page background.
    const { width, height } = image;
    const aspectRatio = width / height;

    let renderedWidth = viewportWidth;
    let renderedHeight = viewportHeight;
    if (viewportWidth / viewportHeight > aspectRatio) {
      renderedHeight = viewportWidth / aspectRatio;
    } else {
      renderedWidth = viewportHeight * aspectRatio;
    }

    const offsetX = (viewportWidth - renderedWidth) / 2;
    const offsetY = (viewportHeight - renderedHeight) / 2;
    const viewportCanvas = createCanvas(viewportWidth, viewportHeight);
    const viewportContext = viewportCanvas.getContext('2d');

    drawImageWithoutFilter(
      viewportContext,
      image,
      0,
      0,
      width,
      height,
      offsetX,
      offsetY,
      renderedWidth,
      renderedHeight,
    );

    // Clamp the viewport's edge pixels into the bleed area so a delayed
    // counter-transform never exposes transparent canvas pixels while scrolling.
    const workingBleed = MICA_TEXTURE_BLEED_PX + FILTER_PADDING_PX;
    const workingWidth = viewportWidth + workingBleed * 2;
    const workingHeight = viewportHeight + workingBleed * 2;
    const sourceCanvas = createCanvas(workingWidth, workingHeight);
    const sourceContext = sourceCanvas.getContext('2d');

    drawImageWithoutFilter(sourceContext, viewportCanvas, workingBleed, workingBleed);

    const drawViewportRegion = (source: CanvasRectangle, destination: CanvasRectangle) => {
      drawImageWithoutFilter(sourceContext, viewportCanvas, ...source, ...destination);
    };

    drawViewportRegion(
      [0, 0, 1, viewportHeight],
      [0, workingBleed, workingBleed, viewportHeight],
    );
    drawViewportRegion(
      [viewportWidth - 1, 0, 1, viewportHeight],
      [workingBleed + viewportWidth, workingBleed, workingBleed, viewportHeight],
    );
    drawViewportRegion(
      [0, 0, viewportWidth, 1],
      [workingBleed, 0, viewportWidth, workingBleed],
    );
    drawViewportRegion(
      [0, viewportHeight - 1, viewportWidth, 1],
      [workingBleed, workingBleed + viewportHeight, viewportWidth, workingBleed],
    );

    drawViewportRegion([0, 0, 1, 1], [0, 0, workingBleed, workingBleed]);
    drawViewportRegion(
      [viewportWidth - 1, 0, 1, 1],
      [workingBleed + viewportWidth, 0, workingBleed, workingBleed],
    );
    drawViewportRegion(
      [0, viewportHeight - 1, 1, 1],
      [0, workingBleed + viewportHeight, workingBleed, workingBleed],
    );
    drawViewportRegion(
      [viewportWidth - 1, viewportHeight - 1, 1, 1],
      [
        workingBleed + viewportWidth,
        workingBleed + viewportHeight,
        workingBleed,
        workingBleed,
      ],
    );

    const canvasFilterMode = await ensureCanvasFilterSupport();

    if (currentRender !== renderSequence) return;

    const renderScale = MICA_TEXTURE_RENDER_SCALE;
    const fullTextureWidth = viewportWidth + MICA_TEXTURE_BLEED_PX * 2;
    const fullTextureHeight = viewportHeight + MICA_TEXTURE_BLEED_PX * 2;
    const textureWidth = Math.ceil(fullTextureWidth * renderScale);
    const textureHeight = Math.ceil(fullTextureHeight * renderScale);
    const canvas = createCanvas(textureWidth, textureHeight);
    const context = canvas.getContext('2d');
    const blurRadius = Math.max(1, Math.round(BACKGROUND_BLUR_PX * renderScale));

    // node-canvas supports the filter property even though its public type omits it.
    (context as unknown as { filter: string }).filter = `blur(${blurRadius}px)`;

    if (canvasFilterMode === 'polyfill') {
      // The polyfill runs a CPU blur for every pixel and drawing call. A reduced
      // texture remains smooth at this radius while avoiding a long main-thread stall.
      context.drawImage(
        sourceCanvas,
        FILTER_PADDING_PX,
        FILTER_PADDING_PX,
        fullTextureWidth,
        fullTextureHeight,
        0,
        0,
        textureWidth,
        textureHeight,
      );
    } else {
      // Extra filter padding keeps the final texture's outer bleed fully opaque.
      const scaledFilterPadding = FILTER_PADDING_PX * renderScale;
      const scaledSourceWidth = sourceCanvas.width * renderScale;
      const scaledSourceHeight = sourceCanvas.height * renderScale;
      for (let pass = 0; pass < BLUR_PASSES; pass += 1) {
        context.drawImage(
          sourceCanvas,
          -scaledFilterPadding,
          -scaledFilterPadding,
          scaledSourceWidth,
          scaledSourceHeight,
        );
      }
    }

    blurred.value.src = canvas.toDataURL();
    blurredUpdateDate.value = Date.now();
    blurredRenderStatus.value = 'ready';
  } catch (error: unknown) {
    if (currentRender !== renderSequence) return;

    blurredRenderStatus.value = 'error';
    console.error('Failed to render the blurred theme background.', {
      backgroundImage: backgroundImage.value,
      error,
    });
  }
}

void updateBlurredImage();

window.addEventListener('resize', updateBlurredImage);

watch(theme, () => {
  void updateBlurredImage();
});
