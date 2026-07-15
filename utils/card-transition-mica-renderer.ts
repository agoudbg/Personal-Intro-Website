import * as THREE from 'three';
import type {
  CardTransitionDirection,
  CardTransitionRect,
  CardTransitionViewport,
} from '~/utils/card-transition';

export interface CardTransitionTextureBleed {
  x: number;
  y: number;
}

export interface CardTransitionCornerRadius {
  x: number;
  y: number;
}

export interface CardTransitionBorderRadii {
  topLeft: CardTransitionCornerRadius;
  topRight: CardTransitionCornerRadius;
  bottomRight: CardTransitionCornerRadius;
  bottomLeft: CardTransitionCornerRadius;
}

export type CardTransitionEasing = (progress: number) => number;
export type CardTransitionBorderRadius = number | CardTransitionBorderRadii;

export interface CardTransitionMicaRendererOptions {
  canvas: HTMLCanvasElement;
  textureUrl: string;
  sourceRect: CardTransitionRect;
  targetRect: CardTransitionRect;
  duration: number;
  direction: CardTransitionDirection;
  easing?: CardTransitionEasing;
  sourceBorderRadius?: CardTransitionBorderRadius;
  targetBorderRadius?: CardTransitionBorderRadius;
  perspective?: number | null;
  textureBleed?: number | CardTransitionTextureBleed;
  textureOpacity?: number;
  surfaceColor?: string | number;
  surfaceOpacity?: number;
  maxPixelRatio?: number;
  antialias?: boolean;
  autoResize?: boolean;
  forceContextLossOnDispose?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials' | null;
  viewport?: CardTransitionViewport;
  signal?: AbortSignal;
}

export interface CardTransitionPlaybackOptions {
  fromProgress?: number;
  signal?: AbortSignal;
}

interface NormalizedCardTransitionOptions {
  canvas: HTMLCanvasElement;
  sourceRect: CardTransitionRect;
  targetRect: CardTransitionRect;
  duration: number;
  direction: CardTransitionDirection;
  easing: CardTransitionEasing;
  sourceBorderRadius: CardTransitionBorderRadii;
  targetBorderRadius: CardTransitionBorderRadii;
  perspective: number | null;
  textureBleed?: CardTransitionTextureBleed;
  textureOpacity: number;
  surfaceColor: string | number;
  surfaceOpacity: number;
  maxPixelRatio: number;
  antialias: boolean;
  autoResize: boolean;
  forceContextLossOnDispose: boolean;
  crossOrigin: 'anonymous' | 'use-credentials' | null;
  viewport: CardTransitionViewport;
}

interface MicaShaderUniforms {
  [name: string]: THREE.IUniform<unknown>;
  uTexture: THREE.IUniform<THREE.Texture>;
  uTextureSize: THREE.IUniform<THREE.Vector2>;
  uTextureViewportSize: THREE.IUniform<THREE.Vector2>;
  uTextureBleed: THREE.IUniform<THREE.Vector2>;
  uViewportSize: THREE.IUniform<THREE.Vector2>;
  uDrawingBufferSize: THREE.IUniform<THREE.Vector2>;
  uSourceRect: THREE.IUniform<THREE.Vector4>;
  uTargetRect: THREE.IUniform<THREE.Vector4>;
  uStateProgress: THREE.IUniform<number>;
  uSourceBorderRadiusX: THREE.IUniform<THREE.Vector4>;
  uSourceBorderRadiusY: THREE.IUniform<THREE.Vector4>;
  uTargetBorderRadiusX: THREE.IUniform<THREE.Vector4>;
  uTargetBorderRadiusY: THREE.IUniform<THREE.Vector4>;
  uFaceMix: THREE.IUniform<number>;
  uPerspective: THREE.IUniform<number>;
  uUsePerspective: THREE.IUniform<number>;
  uTextureOpacity: THREE.IUniform<number>;
  uSurfaceColor: THREE.IUniform<THREE.Color>;
  uSurfaceOpacity: THREE.IUniform<number>;
}

interface CanvasStyleSnapshot {
  position: string;
  inset: string;
  width: string;
  height: string;
  display: string;
  pointerEvents: string;
}

interface ActivePlayback {
  reject: (reason: Error) => void;
  signal?: AbortSignal;
  abortHandler?: () => void;
}

const VERTEX_SHADER = /* glsl */ `
  uniform vec4 uSourceRect;
  uniform vec4 uTargetRect;
  uniform vec2 uViewportSize;
  uniform float uStateProgress;
  uniform vec4 uSourceBorderRadiusX;
  uniform vec4 uSourceBorderRadiusY;
  uniform vec4 uTargetBorderRadiusX;
  uniform vec4 uTargetBorderRadiusY;
  uniform float uFaceMix;
  uniform float uPerspective;
  uniform float uUsePerspective;

  varying vec2 vCardUv;
  varying vec2 vCardSize;
  varying vec4 vBorderRadiiX;
  varying vec4 vBorderRadiiY;

  const float PI = 3.141592653589793;

  void main() {
    vec4 rect = mix(uSourceRect, uTargetRect, uStateProgress);
    vec2 cardSize = max(rect.zw, vec2(0.001));
    vec2 center = rect.xy + cardSize * 0.5;
    vec2 localPosition = position.xy * cardSize;
    float angle = PI * uStateProgress;
    float rotatedX = localPosition.x * cos(angle);
    float rotatedZ = -localPosition.x * sin(angle);
    float perspectiveW = mix(1.0, 1.0 - rotatedZ / uPerspective, uUsePerspective);

    // Keep the projection finite even if a caller supplies a very short perspective.
    perspectiveW = max(perspectiveW, 0.001);

    vec2 centerNdc = vec2(
      center.x / uViewportSize.x * 2.0 - 1.0,
      1.0 - center.y / uViewportSize.y * 2.0
    );
    vec2 projectedOffset = vec2(
      rotatedX / uViewportSize.x * 2.0,
      localPosition.y / uViewportSize.y * 2.0
    );

    gl_Position = vec4(centerNdc * perspectiveW + projectedOffset, 0.0, perspectiveW);
    vCardUv = uv;
    vCardSize = cardSize;
    vBorderRadiiX = mix(uSourceBorderRadiusX, uTargetBorderRadiusX, uFaceMix);
    vBorderRadiiY = mix(uSourceBorderRadiusY, uTargetBorderRadiusY, uFaceMix);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uTextureSize;
  uniform vec2 uTextureViewportSize;
  uniform vec2 uTextureBleed;
  uniform vec2 uViewportSize;
  uniform vec2 uDrawingBufferSize;
  uniform float uTextureOpacity;
  uniform vec3 uSurfaceColor;
  uniform float uSurfaceOpacity;

  varying vec2 vCardUv;
  varying vec2 vCardSize;
  varying vec4 vBorderRadiiX;
  varying vec4 vBorderRadiiY;

  float roundedRectangleDistance(vec2 point, vec2 halfSize, vec2 radius) {
    vec2 outerDistance = abs(point) - halfSize;
    if (radius.x <= 0.0 || radius.y <= 0.0) {
      return max(outerDistance.x, outerDistance.y);
    }

    vec2 distanceToCorner = abs(point) - (halfSize - radius);
    if (distanceToCorner.x > 0.0 && distanceToCorner.y > 0.0) {
      return (length(distanceToCorner / radius) - 1.0) * min(radius.x, radius.y);
    }

    return max(outerDistance.x, outerDistance.y);
  }

  vec2 cornerRadius(vec2 point, vec4 radiiX, vec4 radiiY) {
    float radiusX;
    float radiusY;
    if (point.x < 0.0) {
      radiusX = point.y >= 0.0 ? radiiX.x : radiiX.w;
      radiusY = point.y >= 0.0 ? radiiY.x : radiiY.w;
    } else {
      radiusX = point.y >= 0.0 ? radiiX.y : radiiX.z;
      radiusY = point.y >= 0.0 ? radiiY.y : radiiY.z;
    }
    return vec2(radiusX, radiusY);
  }

  vec3 linearToSrgb(vec3 linearColor) {
    vec3 safeColor = max(linearColor, vec3(0.0));
    vec3 linearSegment = safeColor * 12.92;
    vec3 exponentialSegment = 1.055
      * pow(safeColor, vec3(1.0 / 2.4))
      - 0.055;
    return mix(
      linearSegment,
      exponentialSegment,
      step(vec3(0.0031308), safeColor)
    );
  }

  vec3 srgbToLinear(vec3 srgbColor) {
    vec3 safeColor = max(srgbColor, vec3(0.0));
    vec3 linearSegment = safeColor / 12.92;
    vec3 exponentialSegment = pow(
      (safeColor + 0.055) / 1.055,
      vec3(2.4)
    );
    return mix(
      linearSegment,
      exponentialSegment,
      step(vec3(0.04045), safeColor)
    );
  }

  void main() {
    vec2 halfSize = vCardSize * 0.5;
    vec2 localPoint = (vCardUv - 0.5) * vCardSize;
    vec2 radius = clamp(
      cornerRadius(localPoint, vBorderRadiiX, vBorderRadiiY),
      vec2(0.0),
      halfSize
    );
    float edgeDistance = roundedRectangleDistance(localPoint, halfSize, radius);
    float edgeWidth = max(fwidth(edgeDistance), 0.0001);
    float shapeAlpha = 1.0 - smoothstep(-edgeWidth, edgeWidth, edgeDistance);

    vec2 viewportUv = gl_FragCoord.xy / uDrawingBufferSize;
    vec2 screenPosition = viewportUv * uViewportSize;
    vec2 viewportOffset = (uTextureViewportSize - uViewportSize) * 0.5;
    vec2 texturePosition = screenPosition + viewportOffset + uTextureBleed;
    vec2 textureUv = clamp(texturePosition / uTextureSize, vec2(0.0), vec2(1.0));
    vec4 textureSample = texture2D(uTexture, textureUv);

    float textureAlpha = clamp(textureSample.a * uTextureOpacity, 0.0, 1.0);
    float combinedAlpha = textureAlpha + uSurfaceOpacity * (1.0 - textureAlpha);
    vec3 textureSrgb = linearToSrgb(textureSample.rgb);
    vec3 surfaceSrgb = linearToSrgb(uSurfaceColor);

    // CSS opacity composites encoded sRGB colors, so match that blend before output encoding.
    vec3 premultipliedSrgb = textureSrgb * textureAlpha
      + surfaceSrgb * uSurfaceOpacity * (1.0 - textureAlpha);
    vec3 combinedSrgb = combinedAlpha > 0.0
      ? premultipliedSrgb / combinedAlpha
      : vec3(0.0);
    vec3 combinedColor = srgbToLinear(combinedSrgb);

    gl_FragColor = vec4(combinedColor, combinedAlpha * shapeAlpha);
    #include <colorspace_fragment>
  }
`;

const DEFAULT_EASING: CardTransitionEasing = (progress) => progress;
const DEFAULT_MAX_PIXEL_RATIO = 2;
const MIN_PERSPECTIVE_PX = 1;

function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
}

function assertUnitInterval(value: number, name: string): void {
  assertFiniteNumber(value, name);
  if (value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1.`);
  }
}

function normalizeRect(rect: CardTransitionRect, name: string): CardTransitionRect {
  assertFiniteNumber(rect.left, `${name}.left`);
  assertFiniteNumber(rect.top, `${name}.top`);
  assertFiniteNumber(rect.width, `${name}.width`);
  assertFiniteNumber(rect.height, `${name}.height`);

  if (rect.width <= 0 || rect.height <= 0) {
    throw new RangeError(`${name} must have a positive width and height.`);
  }

  return { ...rect };
}

function normalizeNonNegative(value: number, name: string): number {
  assertFiniteNumber(value, name);
  if (value < 0) {
    throw new RangeError(`${name} must not be negative.`);
  }
  return value;
}

function normalizeBorderRadii(
  value: CardTransitionBorderRadius,
  name: string,
): CardTransitionBorderRadii {
  if (typeof value === 'number') {
    const radius = normalizeNonNegative(value, name);
    return {
      topLeft: { x: radius, y: radius },
      topRight: { x: radius, y: radius },
      bottomRight: { x: radius, y: radius },
      bottomLeft: { x: radius, y: radius },
    };
  }

  return {
    topLeft: normalizeCornerRadius(value.topLeft, `${name}.topLeft`),
    topRight: normalizeCornerRadius(value.topRight, `${name}.topRight`),
    bottomRight: normalizeCornerRadius(value.bottomRight, `${name}.bottomRight`),
    bottomLeft: normalizeCornerRadius(value.bottomLeft, `${name}.bottomLeft`),
  };
}

function normalizeCornerRadius(
  value: CardTransitionCornerRadius,
  name: string,
): CardTransitionCornerRadius {
  return {
    x: normalizeNonNegative(value.x, `${name}.x`),
    y: normalizeNonNegative(value.y, `${name}.y`),
  };
}

function assertCornerRadius(corner: CardTransitionCornerRadius): void {
  if (!Number.isFinite(corner.x) || !Number.isFinite(corner.y)) {
    throw new TypeError('borderRadii values must be finite numbers.');
  }
  if (corner.x < 0 || corner.y < 0) {
    throw new RangeError('borderRadii values must not be negative.');
  }
}

function assertBorderRadii(value: CardTransitionBorderRadii): void {
  assertCornerRadius(value.topLeft);
  assertCornerRadius(value.topRight);
  assertCornerRadius(value.bottomRight);
  assertCornerRadius(value.bottomLeft);
}

function normalizeOpacity(value: number, name: string): number {
  assertUnitInterval(value, name);
  return value;
}

function normalizeDirection(direction: CardTransitionDirection): CardTransitionDirection {
  if (direction !== 'open' && direction !== 'close') {
    throw new TypeError('direction must be either "open" or "close".');
  }
  return direction;
}

function normalizeTextureBleed(
  bleed: number | CardTransitionTextureBleed | undefined,
): CardTransitionTextureBleed | undefined {
  if (bleed === undefined) return undefined;

  if (typeof bleed === 'number') {
    const normalized = normalizeNonNegative(bleed, 'textureBleed');
    return { x: normalized, y: normalized };
  }

  return {
    x: normalizeNonNegative(bleed.x, 'textureBleed.x'),
    y: normalizeNonNegative(bleed.y, 'textureBleed.y'),
  };
}

function normalizeOptions(
  options: CardTransitionMicaRendererOptions,
): NormalizedCardTransitionOptions {
  assertFiniteNumber(options.duration, 'duration');
  if (options.duration <= 0) {
    throw new RangeError('duration must be greater than zero.');
  }

  const sourceBorderRadius = normalizeBorderRadii(
    options.sourceBorderRadius ?? 0,
    'sourceBorderRadius',
  );
  const targetBorderRadius = normalizeBorderRadii(
    options.targetBorderRadius ?? sourceBorderRadius,
    'targetBorderRadius',
  );
  const perspective = options.perspective ?? null;
  if (perspective !== null) {
    assertFiniteNumber(perspective, 'perspective');
    if (perspective < MIN_PERSPECTIVE_PX) {
      throw new RangeError(`perspective must be at least ${MIN_PERSPECTIVE_PX}px.`);
    }
  }

  const maxPixelRatio = options.maxPixelRatio ?? DEFAULT_MAX_PIXEL_RATIO;
  assertFiniteNumber(maxPixelRatio, 'maxPixelRatio');
  if (maxPixelRatio <= 0) {
    throw new RangeError('maxPixelRatio must be greater than zero.');
  }

  const viewport = options.viewport ?? {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
  };
  assertFiniteNumber(viewport.width, 'viewport.width');
  assertFiniteNumber(viewport.height, 'viewport.height');
  assertFiniteNumber(viewport.pixelRatio, 'viewport.pixelRatio');
  if (viewport.width <= 0 || viewport.height <= 0 || viewport.pixelRatio <= 0) {
    throw new RangeError('viewport width, height, and pixelRatio must be greater than zero.');
  }

  return {
    canvas: options.canvas,
    sourceRect: normalizeRect(options.sourceRect, 'sourceRect'),
    targetRect: normalizeRect(options.targetRect, 'targetRect'),
    duration: options.duration,
    direction: normalizeDirection(options.direction),
    easing: options.easing ?? DEFAULT_EASING,
    sourceBorderRadius,
    targetBorderRadius,
    perspective,
    textureBleed: normalizeTextureBleed(options.textureBleed),
    textureOpacity: normalizeOpacity(options.textureOpacity ?? 1, 'textureOpacity'),
    surfaceColor: options.surfaceColor ?? 0x000000,
    surfaceOpacity: normalizeOpacity(options.surfaceOpacity ?? 0, 'surfaceOpacity'),
    maxPixelRatio,
    antialias: options.antialias ?? false,
    autoResize: options.autoResize ?? false,
    forceContextLossOnDispose: options.forceContextLossOnDispose ?? false,
    crossOrigin: options.crossOrigin === undefined ? 'anonymous' : options.crossOrigin,
    viewport: { ...viewport },
  };
}

function loadImage(
  textureUrl: string,
  crossOrigin: 'anonymous' | 'use-credentials' | null,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  if (textureUrl.trim().length === 0) {
    return Promise.reject(new TypeError('textureUrl must not be empty.'));
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError('Mica texture loading was aborted.'));
      return;
    }

    const image = new Image();
    if (crossOrigin !== null) image.crossOrigin = crossOrigin;
    image.decoding = 'async';

    const cleanup = () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
      signal?.removeEventListener('abort', handleAbort);
    };
    const handleLoad = () => {
      cleanup();
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        reject(new Error(`Mica texture has invalid dimensions: ${textureUrl}`));
        return;
      }
      resolve(image);
    };
    const handleError = () => {
      cleanup();
      reject(new Error(`Failed to load the Mica texture: ${textureUrl}`));
    };
    const handleAbort = () => {
      cleanup();
      image.src = '';
      reject(createAbortError('Mica texture loading was aborted.'));
    };

    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    signal?.addEventListener('abort', handleAbort, { once: true });
    image.src = textureUrl;
  });
}

function createTexture(image: HTMLImageElement): THREE.Texture {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function rectToVector(rect: CardTransitionRect): THREE.Vector4 {
  return new THREE.Vector4(rect.left, rect.top, rect.width, rect.height);
}

function borderRadiiXToVector(radii: CardTransitionBorderRadii): THREE.Vector4 {
  return new THREE.Vector4(
    radii.topLeft.x,
    radii.topRight.x,
    radii.bottomRight.x,
    radii.bottomLeft.x,
  );
}

function borderRadiiYToVector(radii: CardTransitionBorderRadii): THREE.Vector4 {
  return new THREE.Vector4(
    radii.topLeft.y,
    radii.topRight.y,
    radii.bottomRight.y,
    radii.bottomLeft.y,
  );
}

function createAbortError(message: string): DOMException {
  return new DOMException(message, 'AbortError');
}

export class CardTransitionMicaRenderer {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.Camera;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly material: THREE.ShaderMaterial;
  private readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly uniforms: MicaShaderUniforms;
  private readonly easing: CardTransitionEasing;
  private readonly duration: number;
  private readonly maxPixelRatio: number;
  private readonly forceContextLossOnDispose: boolean;
  private readonly explicitTextureBleed?: CardTransitionTextureBleed;
  private readonly resizeHandler: () => void;
  private readonly originalCanvasStyle: CanvasStyleSnapshot;
  private readonly originalAriaHidden: string | null;

  private texture: THREE.Texture;
  private direction: CardTransitionDirection;
  private linearProgress = 0;
  private easedProgress = 0;
  private animationFrameId: number | undefined;
  private activePlayback: ActivePlayback | undefined;
  private textureLoadSequence = 0;
  private automaticFaceMix = true;
  private disposed = false;

  static async create(
    options: CardTransitionMicaRendererOptions,
  ): Promise<CardTransitionMicaRenderer> {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      throw new Error('CardTransitionMicaRenderer can only be created in a browser.');
    }

    const normalizedOptions = normalizeOptions(options);
    const image = await loadImage(
      options.textureUrl,
      normalizedOptions.crossOrigin,
      options.signal,
    );
    if (options.signal?.aborted) throw createAbortError('Renderer creation was aborted.');
    return new CardTransitionMicaRenderer(normalizedOptions, image);
  }

  private constructor(
    options: NormalizedCardTransitionOptions,
    image: HTMLImageElement,
  ) {
    this.canvas = options.canvas;
    this.direction = options.direction;
    this.easing = options.easing;
    this.duration = options.duration;
    this.maxPixelRatio = options.maxPixelRatio;
    this.forceContextLossOnDispose = options.forceContextLossOnDispose;
    this.explicitTextureBleed = options.textureBleed;
    this.texture = createTexture(image);
    this.originalCanvasStyle = {
      position: this.canvas.style.position,
      inset: this.canvas.style.inset,
      width: this.canvas.style.width,
      height: this.canvas.style.height,
      display: this.canvas.style.display,
      pointerEvents: this.canvas.style.pointerEvents,
    };
    this.originalAriaHidden = this.canvas.getAttribute('aria-hidden');

    this.canvas.style.position = 'fixed';
    this.canvas.style.inset = '0';
    this.canvas.style.width = `${options.viewport.width}px`;
    this.canvas.style.height = `${options.viewport.height}px`;
    this.canvas.style.display = 'block';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.setAttribute('aria-hidden', 'true');

    try {
      const context = this.canvas.getContext('webgl2', {
        alpha: true,
        antialias: options.antialias,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance',
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
      });
      if (!context) throw new Error('WebGL2 is not available.');
      context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, false);
      context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        context,
        alpha: true,
        antialias: options.antialias,
        powerPreference: 'high-performance',
      });
    } catch (error: unknown) {
      this.texture.dispose();
      this.restoreCanvasAttributes();
      throw new Error('Failed to create the WebGL Mica transition renderer.', { cause: error });
    }

    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const initialViewportWidth = options.viewport.width;
    const initialViewportHeight = options.viewport.height;
    const textureBleed = this.resolveTextureBleed(
      image.naturalWidth,
      image.naturalHeight,
      initialViewportWidth,
      initialViewportHeight,
    );

    this.uniforms = {
      uTexture: { value: this.texture },
      uTextureSize: { value: new THREE.Vector2(image.naturalWidth, image.naturalHeight) },
      uTextureViewportSize: {
        value: new THREE.Vector2(
          Math.max(1, image.naturalWidth - textureBleed.x * 2),
          Math.max(1, image.naturalHeight - textureBleed.y * 2),
        ),
      },
      uTextureBleed: { value: new THREE.Vector2(textureBleed.x, textureBleed.y) },
      uViewportSize: { value: new THREE.Vector2() },
      uDrawingBufferSize: { value: new THREE.Vector2() },
      uSourceRect: { value: rectToVector(options.sourceRect) },
      uTargetRect: { value: rectToVector(options.targetRect) },
      uStateProgress: { value: options.direction === 'open' ? 0 : 1 },
      uSourceBorderRadiusX: { value: borderRadiiXToVector(options.sourceBorderRadius) },
      uSourceBorderRadiusY: { value: borderRadiiYToVector(options.sourceBorderRadius) },
      uTargetBorderRadiusX: { value: borderRadiiXToVector(options.targetBorderRadius) },
      uTargetBorderRadiusY: { value: borderRadiiYToVector(options.targetBorderRadius) },
      uFaceMix: { value: options.direction === 'open' ? 0 : 1 },
      uPerspective: { value: options.perspective ?? 1 },
      uUsePerspective: { value: options.perspective === null ? 0 : 1 },
      uTextureOpacity: { value: options.textureOpacity },
      uSurfaceColor: { value: new THREE.Color(options.surfaceColor) },
      uSurfaceOpacity: { value: options.surfaceOpacity },
    };

    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
    this.camera = new THREE.Camera();

    this.resizeHandler = () => this.resize();
    if (options.autoResize) {
      window.addEventListener('resize', this.resizeHandler, { passive: true });
      window.visualViewport?.addEventListener('resize', this.resizeHandler, { passive: true });
    }

    this.resize(
      initialViewportWidth,
      initialViewportHeight,
      Math.min(options.viewport.pixelRatio, options.maxPixelRatio),
    );
    this.applyProgress(0);
  }

  get progress(): number {
    return this.linearProgress;
  }

  get renderedProgress(): number {
    return this.easedProgress;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  setProgress(progress: number, faceMix?: number): void {
    this.assertActive();
    assertUnitInterval(progress, 'progress');
    this.cancelPlayback(createAbortError('Playback was replaced by manual progress.'));
    this.applyProgress(progress, faceMix);
  }

  setEasedProgress(progress: number, faceMix?: number): void {
    this.assertActive();
    assertFiniteNumber(progress, 'progress');
    this.cancelPlayback(createAbortError('Playback was replaced by manual eased progress.'));
    this.updateProgress(progress, progress, faceMix);
  }

  renderFrame(
    rect: CardTransitionRect,
    rotationProgress: number,
    borderRadii: CardTransitionBorderRadii,
  ): void {
    this.assertActive();
    assertFiniteNumber(rect.left, 'rect.left');
    assertFiniteNumber(rect.top, 'rect.top');
    assertFiniteNumber(rect.width, 'rect.width');
    assertFiniteNumber(rect.height, 'rect.height');
    if (rect.width <= 0 || rect.height <= 0) {
      throw new RangeError('rect must have a positive width and height.');
    }
    assertFiniteNumber(rotationProgress, 'rotationProgress');
    assertBorderRadii(borderRadii);
    if (this.activePlayback) {
      this.cancelPlayback(createAbortError('Playback was replaced by an external frame.'));
    }

    this.uniforms.uSourceRect.value.set(rect.left, rect.top, rect.width, rect.height);
    this.uniforms.uTargetRect.value.set(rect.left, rect.top, rect.width, rect.height);
    this.uniforms.uStateProgress.value = rotationProgress;
    this.uniforms.uFaceMix.value = 0;
    this.setBorderRadiiUniforms(borderRadii, borderRadii);
    this.linearProgress = rotationProgress;
    this.easedProgress = rotationProgress;
    this.automaticFaceMix = false;
    this.render();
  }

  setDirection(direction: CardTransitionDirection): void {
    this.assertActive();
    this.direction = normalizeDirection(direction);
    this.updateProgress(this.linearProgress, this.easedProgress);
  }

  setRects(sourceRect: CardTransitionRect, targetRect: CardTransitionRect): void {
    this.assertActive();
    const normalizedSource = normalizeRect(sourceRect, 'sourceRect');
    const normalizedTarget = normalizeRect(targetRect, 'targetRect');
    this.uniforms.uSourceRect.value.copy(rectToVector(normalizedSource));
    this.uniforms.uTargetRect.value.copy(rectToVector(normalizedTarget));
    this.render();
  }

  setBorderRadii(
    sourceBorderRadius: CardTransitionBorderRadius,
    targetBorderRadius: CardTransitionBorderRadius,
  ): void {
    this.assertActive();
    const normalizedSource = normalizeBorderRadii(sourceBorderRadius, 'sourceBorderRadius');
    const normalizedTarget = normalizeBorderRadii(targetBorderRadius, 'targetBorderRadius');
    this.uniforms.uSourceBorderRadiusX.value.copy(borderRadiiXToVector(normalizedSource));
    this.uniforms.uSourceBorderRadiusY.value.copy(borderRadiiYToVector(normalizedSource));
    this.uniforms.uTargetBorderRadiusX.value.copy(borderRadiiXToVector(normalizedTarget));
    this.uniforms.uTargetBorderRadiusY.value.copy(borderRadiiYToVector(normalizedTarget));
    this.render();
  }

  setFaceMix(faceMix: number): void {
    this.assertActive();
    assertUnitInterval(faceMix, 'faceMix');
    this.automaticFaceMix = false;
    this.uniforms.uFaceMix.value = faceMix;
    this.render();
  }

  useAutomaticFaceMix(): void {
    this.assertActive();
    this.automaticFaceMix = true;
    this.uniforms.uFaceMix.value = THREE.MathUtils.clamp(
      this.uniforms.uStateProgress.value,
      0,
      1,
    );
    this.render();
  }

  setSurface(
    surfaceColor: string | number,
    surfaceOpacity: number,
    textureOpacity: number,
  ): void {
    this.assertActive();
    this.uniforms.uSurfaceColor.value.set(surfaceColor);
    this.uniforms.uSurfaceOpacity.value = normalizeOpacity(surfaceOpacity, 'surfaceOpacity');
    this.uniforms.uTextureOpacity.value = normalizeOpacity(textureOpacity, 'textureOpacity');
    this.render();
  }

  async setTextureUrl(
    textureUrl: string,
    crossOrigin: 'anonymous' | 'use-credentials' | null = 'anonymous',
    signal?: AbortSignal,
  ): Promise<void> {
    this.assertActive();
    const loadSequence = ++this.textureLoadSequence;
    const image = await loadImage(textureUrl, crossOrigin, signal);

    if (this.disposed || signal?.aborted) {
      throw createAbortError('The renderer was disposed while loading a Mica texture.');
    }
    if (loadSequence !== this.textureLoadSequence) return;

    const nextTexture = createTexture(image);
    const previousTexture = this.texture;
    const viewportSize = this.uniforms.uViewportSize.value;
    const textureBleed = this.resolveTextureBleed(
      image.naturalWidth,
      image.naturalHeight,
      viewportSize.x,
      viewportSize.y,
    );

    this.texture = nextTexture;
    this.uniforms.uTexture.value = nextTexture;
    this.uniforms.uTextureSize.value.set(image.naturalWidth, image.naturalHeight);
    this.uniforms.uTextureBleed.value.set(textureBleed.x, textureBleed.y);
    this.uniforms.uTextureViewportSize.value.set(
      Math.max(1, image.naturalWidth - textureBleed.x * 2),
      Math.max(1, image.naturalHeight - textureBleed.y * 2),
    );
    previousTexture.dispose();
    this.render();
  }

  resize(
    width = window.innerWidth,
    height = window.innerHeight,
    pixelRatio = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio),
  ): void {
    this.assertActive();
    assertFiniteNumber(width, 'width');
    assertFiniteNumber(height, 'height');
    assertFiniteNumber(pixelRatio, 'pixelRatio');
    if (width <= 0 || height <= 0 || pixelRatio <= 0) {
      throw new RangeError('width, height, and pixelRatio must be greater than zero.');
    }

    this.renderer.setPixelRatio(Math.min(pixelRatio, this.maxPixelRatio));
    this.renderer.setSize(Math.round(width), Math.round(height), false);
    this.uniforms.uViewportSize.value.set(width, height);
    this.renderer.getDrawingBufferSize(this.uniforms.uDrawingBufferSize.value);
    this.render();
  }

  play(options: CardTransitionPlaybackOptions = {}): Promise<void> {
    this.assertActive();
    const fromProgress = options.fromProgress ?? this.linearProgress;
    assertUnitInterval(fromProgress, 'fromProgress');
    if (options.signal?.aborted) {
      return Promise.reject(createAbortError('Playback was aborted before it started.'));
    }

    this.cancelPlayback(createAbortError('Playback was replaced by a newer playback.'));
    this.applyProgress(fromProgress);

    if (fromProgress === 1) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const startedAt = performance.now() - fromProgress * this.duration;
      const activePlayback: ActivePlayback = { reject, signal: options.signal };

      if (options.signal) {
        activePlayback.abortHandler = () => {
          this.cancelPlayback(createAbortError('Playback was aborted.'));
        };
        options.signal.addEventListener('abort', activePlayback.abortHandler, { once: true });
      }

      this.activePlayback = activePlayback;

      const tick = (now: number) => {
        if (this.disposed || this.activePlayback !== activePlayback) return;

        const progress = Math.min(1, Math.max(0, (now - startedAt) / this.duration));
        this.applyProgress(progress);

        if (progress >= 1) {
          this.animationFrameId = undefined;
          this.clearActivePlayback();
          resolve();
          return;
        }

        this.animationFrameId = window.requestAnimationFrame(tick);
      };

      this.animationFrameId = window.requestAnimationFrame(tick);
    });
  }

  stop(): void {
    this.assertActive();
    this.cancelPlayback(createAbortError('Playback was stopped.'));
  }

  render(): void {
    this.assertActive();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) return;

    this.cancelPlayback(createAbortError('Renderer was disposed during playback.'));
    this.disposed = true;
    this.textureLoadSequence += 1;
    window.removeEventListener('resize', this.resizeHandler);
    window.visualViewport?.removeEventListener('resize', this.resizeHandler);
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.renderer.dispose();
    if (this.forceContextLossOnDispose) this.renderer.forceContextLoss();
    this.restoreCanvasAttributes();
  }

  private applyProgress(progress: number, faceMix?: number): void {
    const easedProgress = this.easing(progress);
    assertFiniteNumber(easedProgress, 'easing result');
    this.updateProgress(progress, easedProgress, faceMix);
  }

  private updateProgress(
    linearProgress: number,
    easedProgress: number,
    faceMix?: number,
  ): void {
    if (faceMix !== undefined) {
      assertUnitInterval(faceMix, 'faceMix');
      this.automaticFaceMix = false;
      this.uniforms.uFaceMix.value = faceMix;
    }

    this.linearProgress = linearProgress;
    this.easedProgress = easedProgress;
    const stateProgress = this.direction === 'open'
      ? easedProgress
      : 1 - easedProgress;
    this.uniforms.uStateProgress.value = stateProgress;
    if (this.automaticFaceMix) {
      this.uniforms.uFaceMix.value = THREE.MathUtils.clamp(stateProgress, 0, 1);
    }
    this.render();
  }

  private setBorderRadiiUniforms(
    source: CardTransitionBorderRadii,
    target: CardTransitionBorderRadii,
  ): void {
    const sourceX = this.uniforms.uSourceBorderRadiusX.value;
    const sourceY = this.uniforms.uSourceBorderRadiusY.value;
    const targetX = this.uniforms.uTargetBorderRadiusX.value;
    const targetY = this.uniforms.uTargetBorderRadiusY.value;

    sourceX.set(source.topLeft.x, source.topRight.x, source.bottomRight.x, source.bottomLeft.x);
    sourceY.set(source.topLeft.y, source.topRight.y, source.bottomRight.y, source.bottomLeft.y);
    targetX.set(target.topLeft.x, target.topRight.x, target.bottomRight.x, target.bottomLeft.x);
    targetY.set(target.topLeft.y, target.topRight.y, target.bottomRight.y, target.bottomLeft.y);
  }

  private resolveTextureBleed(
    textureWidth: number,
    textureHeight: number,
    viewportWidth: number,
    viewportHeight: number,
  ): CardTransitionTextureBleed {
    if (this.explicitTextureBleed) return { ...this.explicitTextureBleed };

    return {
      x: Math.max(0, (textureWidth - viewportWidth) * 0.5),
      y: Math.max(0, (textureHeight - viewportHeight) * 0.5),
    };
  }

  private cancelPlayback(reason: Error): void {
    if (this.animationFrameId !== undefined) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    const activePlayback = this.activePlayback;
    if (!activePlayback) return;
    this.clearActivePlayback();
    activePlayback.reject(reason);
  }

  private clearActivePlayback(): void {
    const activePlayback = this.activePlayback;
    if (activePlayback?.signal && activePlayback.abortHandler) {
      activePlayback.signal.removeEventListener('abort', activePlayback.abortHandler);
    }
    this.activePlayback = undefined;
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('CardTransitionMicaRenderer has already been disposed.');
    }
  }

  private restoreCanvasAttributes(): void {
    this.canvas.style.position = this.originalCanvasStyle.position;
    this.canvas.style.inset = this.originalCanvasStyle.inset;
    this.canvas.style.width = this.originalCanvasStyle.width;
    this.canvas.style.height = this.originalCanvasStyle.height;
    this.canvas.style.display = this.originalCanvasStyle.display;
    this.canvas.style.pointerEvents = this.originalCanvasStyle.pointerEvents;

    if (this.originalAriaHidden === null) {
      this.canvas.removeAttribute('aria-hidden');
    } else {
      this.canvas.setAttribute('aria-hidden', this.originalAriaHidden);
    }
  }
}
