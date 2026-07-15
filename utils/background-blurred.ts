import { createCanvas, loadImage } from 'canvas';
import { shallowRef, watch } from 'vue';

export const MICA_TEXTURE_BLEED_PX = 128;

export const blurred = shallowRef(new Image());
export const blurredUpdateDate = shallowRef(0);
export const blurredRenderStatus = shallowRef<'loading' | 'ready' | 'error'>('loading');

const BACKGROUND_BLUR_PX = 30;
const FILTER_PADDING_PX = BACKGROUND_BLUR_PX * 2;
const BLUR_PASSES = 5;

type CanvasRectangle = [x: number, y: number, width: number, height: number];

let renderSequence = 0;

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

    viewportContext.drawImage(
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

    sourceContext.drawImage(viewportCanvas, workingBleed, workingBleed);

    const drawViewportRegion = (source: CanvasRectangle, destination: CanvasRectangle) => {
      sourceContext.drawImage(viewportCanvas, ...source, ...destination);
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

    const textureWidth = viewportWidth + MICA_TEXTURE_BLEED_PX * 2;
    const textureHeight = viewportHeight + MICA_TEXTURE_BLEED_PX * 2;
    const canvas = createCanvas(textureWidth, textureHeight);
    const context = canvas.getContext('2d');

    // node-canvas supports the filter property even though its public type omits it.
    (context as unknown as { filter: string }).filter = `blur(${BACKGROUND_BLUR_PX}px)`;

    // Extra filter padding keeps the final texture's outer bleed fully opaque.
    for (let pass = 0; pass < BLUR_PASSES; pass += 1) {
      context.drawImage(
        sourceCanvas,
        -FILTER_PADDING_PX,
        -FILTER_PADDING_PX,
      );
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
