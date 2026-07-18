<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue';
import {
  MICA_TEXTURE_BLEED_PX,
  getCardTransitionDuration,
  getCardTransitionEasing,
  pauseMicaTracking,
} from '#imports';
import { CardTransitionMicaRenderer } from '~/utils/card-transition-mica-renderer';
import type {
  CardTransitionBorderRadii,
  CardTransitionCornerRadius,
} from '~/utils/card-transition-mica-renderer';
import type {
  CardTransitionDirection,
  CardTransitionHandoffOutcome,
  CardTransitionOutcome,
  CardTransitionOverlayApi,
  CardTransitionRect,
  CardTransitionRequest,
  CardTransitionRun,
} from '~/utils/card-transition';

interface PreparedEvent {
  id: number;
  direction: CardTransitionDirection;
}

interface TransitionErrorEvent extends PreparedEvent {
  error: unknown;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

interface VisuallyHiddenElement {
  element: HTMLElement;
  opacity: string;
}

interface PendingStart {
  generation: number;
  request: CardTransitionRequest;
  abortController: AbortController;
  done: Deferred<undefined>;
}

interface FaceOpacities {
  preview: number;
  detail: number;
  detailMix: number;
}

interface TransitionFrame {
  geometryProgress: number;
  rect: CardTransitionRect;
  previewScale: number;
  previewTranslateY: number;
  detailScale: number;
}

interface InternalRun {
  generation: number;
  request: CardTransitionRequest;
  duration: number;
  easing: (progress: number) => number;
  handoff: Deferred<CardTransitionHandoffOutcome>;
  finished: Deferred<CardTransitionOutcome>;
  renderer: CardTransitionMicaRenderer;
  resumeMica?: () => void;
  hiddenElements: VisuallyHiddenElement[];
  previewContentElement: HTMLElement;
  detailLayoutElement: HTMLElement;
  frameBorderRadii: CardTransitionBorderRadii;
  startFrame: TransitionFrame;
  currentFrame: TransitionFrame;
  animationFrameId?: number;
  handoffResolved: boolean;
  settled: boolean;
  discardRenderer: boolean;
  settlePromise?: Promise<void>;
}

const emit = defineEmits<{
  prepared: [event: PreparedEvent];
  error: [event: TransitionErrorEvent];
}>();

const overlay = useTemplateRef<HTMLElement>('overlay');
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
const shell = useTemplateRef<HTMLElement>('shell');
const shadow = useTemplateRef<HTMLElement>('shadow');
const frontFace = useTemplateRef<HTMLElement>('front-face');
const backFace = useTemplateRef<HTMLElement>('back-face');
const frontMount = useTemplateRef<HTMLElement>('front-mount');
const backMount = useTemplateRef<HTMLElement>('back-mount');

const isActive = shallowRef(false);
let activeRun: InternalRun | undefined;
let pendingStart: PendingStart | undefined;
let pooledRenderer: CardTransitionMicaRenderer | undefined;
let pooledTextureUrl: string | undefined;
let operationGeneration = 0;
let isMounted = false;
let isRendererContextLost = false;

const createDeferred = <T,>(): Deferred<T> => {
  let resolvePromise: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: (value: T) => resolvePromise?.(value),
  };
};

const createCancelledError = () => new DOMException('Card transition start was cancelled.', 'AbortError');
const isCancelledError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

const mixRect = (
  source: CardTransitionRect,
  target: CardTransitionRect,
  progress: number,
): CardTransitionRect => ({
  left: lerp(source.left, target.left, progress),
  top: lerp(source.top, target.top, progress),
  width: lerp(source.width, target.width, progress),
  height: lerp(source.height, target.height, progress),
});

const createCornerRadius = (x = 0, y = 0): CardTransitionCornerRadius => ({ x, y });

const createBorderRadii = (
  topLeft = createCornerRadius(),
  topRight = createCornerRadius(),
  bottomRight = createCornerRadius(),
  bottomLeft = createCornerRadius(),
): CardTransitionBorderRadii => ({ topLeft, topRight, bottomRight, bottomLeft });

const createPreviewBorderRadii = (rect: CardTransitionRect) => createBorderRadii(
  createCornerRadius(rect.width * 0.075, rect.height * 0.075),
  createCornerRadius(rect.width * 0.075, rect.height * 0.075),
  createCornerRadius(rect.width * 0.075, rect.height * 0.075),
  createCornerRadius(rect.width * 0.075, rect.height * 0.075),
);

const createDetailBorderRadii = (slideMode: CardTransitionRequest['slideMode']) => {
  const bottomRadius = slideMode === 2 ? 20 : 0;
  return createBorderRadii(
    createCornerRadius(20, 20),
    createCornerRadius(20, 20),
    createCornerRadius(bottomRadius, bottomRadius),
    createCornerRadius(bottomRadius, bottomRadius),
  );
};

const smoothstep = (edgeStart: number, edgeEnd: number, value: number) => {
  const progress = clampUnit((value - edgeStart) / (edgeEnd - edgeStart));
  return progress * progress * (3 - 2 * progress);
};

const getFaceOpacities = (
  geometryProgress: number,
  sourceOpacity: number,
): FaceOpacities => {
  const detailMix = smoothstep(0.49, 0.51, geometryProgress);
  const previewSurfaceOpacity = lerp(
    clampUnit(sourceOpacity),
    1,
    smoothstep(0, 0.08, geometryProgress),
  );

  return {
    preview: previewSurfaceOpacity * (1 - detailMix),
    detail: detailMix,
    detailMix,
  };
};

const createEndpointFrame = (
  request: CardTransitionRequest,
  geometryProgress: 0 | 1,
): TransitionFrame => {
  const naturalWidth = Math.max(1, request.previewNaturalWidth);
  const previewScale = geometryProgress === 0
    ? request.previewRect.width / naturalWidth
    : request.detailRect.width / naturalWidth;
  const previewTranslateY = geometryProgress === 0
    ? 0
    : (request.detailRect.height - request.previewRect.height) / 4;
  const detailScale = geometryProgress === 0
    ? request.previewRect.width / request.detailRect.width
    : 1;

  return {
    geometryProgress,
    rect: geometryProgress === 0 ? { ...request.previewRect } : { ...request.detailRect },
    previewScale,
    previewTranslateY,
    detailScale,
  };
};

const mixFrame = (
  source: TransitionFrame,
  target: TransitionFrame,
  progress: number,
): TransitionFrame => ({
  geometryProgress: lerp(source.geometryProgress, target.geometryProgress, progress),
  rect: mixRect(source.rect, target.rect, progress),
  previewScale: lerp(source.previewScale, target.previewScale, progress),
  previewTranslateY: lerp(source.previewTranslateY, target.previewTranslateY, progress),
  detailScale: lerp(source.detailScale, target.detailScale, progress),
});

const updateClosePreviewTarget = (run: InternalRun) => {
  if (run.request.direction !== 'close' || !run.request.previewElement.isConnected) return;

  const rect = run.request.previewElement.getBoundingClientRect();
  if (
    !Number.isFinite(rect.left)
    || !Number.isFinite(rect.top)
    || !Number.isFinite(rect.width)
    || !Number.isFinite(rect.height)
    || rect.width <= 0
    || rect.height <= 0
  ) return;

  run.request.previewRect = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
};

const updateFrameBorderRadii = (
  radii: CardTransitionBorderRadii,
  previewRect: CardTransitionRect,
  geometryProgress: number,
  slideMode: CardTransitionRequest['slideMode'],
) => {
  const previewRadiusX = previewRect.width * 0.075;
  const previewRadiusY = previewRect.height * 0.075;
  const bottomDetailRadius = slideMode === 2 ? 20 : 0;

  radii.topLeft.x = lerp(previewRadiusX, 20, geometryProgress);
  radii.topLeft.y = lerp(previewRadiusY, 20, geometryProgress);
  radii.topRight.x = lerp(previewRadiusX, 20, geometryProgress);
  radii.topRight.y = lerp(previewRadiusY, 20, geometryProgress);
  radii.bottomRight.x = lerp(previewRadiusX, bottomDetailRadius, geometryProgress);
  radii.bottomRight.y = lerp(previewRadiusY, bottomDetailRadius, geometryProgress);
  radii.bottomLeft.x = lerp(previewRadiusX, bottomDetailRadius, geometryProgress);
  radii.bottomLeft.y = lerp(previewRadiusY, bottomDetailRadius, geometryProgress);
};

const toCssBorderRadius = (
  radii: CardTransitionBorderRadii,
  horizontalScale = 1,
) => {
  const horizontal = [
    radii.topLeft.x,
    radii.topRight.x,
    radii.bottomRight.x,
    radii.bottomLeft.x,
  ].map((value) => `${value * horizontalScale}px`).join(' ');
  const vertical = [
    radii.topLeft.y,
    radii.topRight.y,
    radii.bottomRight.y,
    radii.bottomLeft.y,
  ].map((value) => `${value}px`).join(' ');
  return `${horizontal} / ${vertical}`;
};

const removePrimaryMica = (clone: HTMLElement) => {
  Array.from(clone.children).forEach((child) => {
    if (child instanceof HTMLElement && child.classList.contains('mica-background')) child.remove();
  });
};

const sanitizeClone = (source: HTMLElement): HTMLElement => {
  const clone = source.cloneNode(true);
  if (!(clone instanceof HTMLElement)) throw new Error('Failed to clone transition content.');

  clone.removeAttribute('id');
  clone.querySelectorAll<HTMLElement>('[id]').forEach((element) => element.removeAttribute('id'));
  clone.querySelectorAll<HTMLElement>('.card-loading-indicator').forEach((element) => element.remove());
  removePrimaryMica(clone);
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  clone.style.pointerEvents = 'none';
  clone.style.transition = 'none';
  clone.style.animation = 'none';
  return clone;
};

const copyDetailScrollTop = (source: HTMLElement, clone: HTMLElement) => {
  const sourceContent = source.matches('[data-card-animation-content]')
    ? source
    : source.querySelector<HTMLElement>('[data-card-animation-content]');
  const cloneContent = clone.matches('[data-card-animation-content]')
    ? clone
    : clone.querySelector<HTMLElement>('[data-card-animation-content]');
  if (sourceContent && cloneContent) cloneContent.scrollTop = sourceContent.scrollTop;
};

const configureDetailLayout = (
  element: HTMLElement,
  request: CardTransitionRequest,
) => {
  element.style.inset = 'auto';
  element.style.top = '0';
  element.style.left = '50%';
  element.style.width = `${request.detailRect.width}px`;
  element.style.height = `${request.detailRect.height}px`;
  element.style.transformOrigin = 'top center';
};

const isSamePreviewActor = (
  run: InternalRun,
  request: CardTransitionRequest,
) => {
  if (run.request.previewElement === request.previewElement) return true;
  const previousId = run.request.previewElement.dataset.previewCardId;
  const nextId = request.previewElement.dataset.previewCardId;
  return Boolean(previousId && previousId === nextId);
};

const mountTransitionClones = (request: CardTransitionRequest) => {
  const frontMountElement = frontMount.value;
  const backMountElement = backMount.value;
  if (!frontMountElement || !backMountElement) {
    throw new Error('Card transition clone mounts are not available.');
  }

  const previewClone = sanitizeClone(request.previewElement);
  const detailClone = sanitizeClone(request.detailElement);
  previewClone.style.width = '100%';
  previewClone.style.height = '100%';
  previewClone.style.margin = '0';
  previewClone.style.boxShadow = 'none';
  detailClone.style.width = '100%';
  detailClone.style.height = '100%';
  detailClone.style.margin = '0';

  const previewContentElement = previewClone.querySelector<HTMLElement>('.card-content');
  const detailContentElement = detailClone.matches('[data-card-animation-content]')
    ? detailClone
    : detailClone.querySelector<HTMLElement>('[data-card-animation-content]');
  if (!previewContentElement || !detailContentElement) {
    throw new Error('Card transition content targets were not found in the cloned DOM.');
  }

  previewContentElement.style.transformOrigin = 'top center';
  configureDetailLayout(backMountElement, request);
  frontMountElement.replaceChildren(previewClone);
  backMountElement.replaceChildren(detailClone);
  copyDetailScrollTop(request.detailElement, detailClone);

  return { previewContentElement, detailLayoutElement: backMountElement, detailClone };
};

const setVisuallyHidden = (element: HTMLElement): VisuallyHiddenElement => {
  const hidden = { element, opacity: element.style.opacity };
  element.style.opacity = '0';
  return hidden;
};

const restoreVisuallyHiddenElements = (elements: readonly VisuallyHiddenElement[]) => {
  elements.forEach(({ element, opacity }) => {
    element.style.opacity = opacity;
  });
};

const nextAnimationFrame = () => new Promise<undefined>((resolve) => {
  window.requestAnimationFrame(() => resolve(undefined));
});

const resetInlineStyles = () => {
  if (overlay.value) {
    overlay.value.style.width = '';
    overlay.value.style.height = '';
  }
  if (shell.value) {
    shell.value.style.left = '';
    shell.value.style.top = '';
    shell.value.style.width = '';
    shell.value.style.height = '';
    shell.value.style.transform = '';
  }
  if (shadow.value) {
    shadow.value.style.opacity = '';
    shadow.value.style.transform = '';
    shadow.value.style.borderRadius = '';
    shadow.value.style.boxShadow = '';
  }
  if (frontFace.value) {
    frontFace.value.style.opacity = '';
    frontFace.value.style.transform = '';
  }
  if (backFace.value) {
    backFace.value.style.opacity = '';
    backFace.value.style.borderRadius = '';
    backFace.value.style.clipPath = '';
    backFace.value.style.removeProperty('-webkit-clip-path');
  }
  if (backMount.value) {
    backMount.value.style.inset = '';
    backMount.value.style.top = '';
    backMount.value.style.left = '';
    backMount.value.style.width = '';
    backMount.value.style.height = '';
    backMount.value.style.transform = '';
    backMount.value.style.transformOrigin = '';
  }
};

const clearOverlayDom = () => {
  frontMount.value?.replaceChildren();
  backMount.value?.replaceChildren();
  isActive.value = false;
  resetInlineStyles();
};

const disposeRenderer = (renderer: CardTransitionMicaRenderer) => {
  if (pooledRenderer === renderer) {
    pooledRenderer = undefined;
    pooledTextureUrl = undefined;
  }
  renderer.dispose();
};

const releaseRunMicaPause = (run: InternalRun) => {
  run.resumeMica?.();
  run.resumeMica = undefined;
};

const ensureRunMicaPaused = (run: InternalRun) => {
  if (!run.resumeMica) run.resumeMica = pauseMicaTracking();
};

const prepareRenderer = async (
  request: CardTransitionRequest,
  canvasElement: HTMLCanvasElement,
  surfaceColor: string,
  signal: AbortSignal,
) => {
  if (isRendererContextLost) throw createCancelledError();
  canvasElement.style.width = `${request.viewport.width}px`;
  canvasElement.style.height = `${request.viewport.height}px`;

  if (!pooledRenderer || pooledRenderer.isDisposed) {
    const renderer = await CardTransitionMicaRenderer.create({
      canvas: canvasElement,
      textureUrl: request.textureUrl,
      sourceRect: request.previewRect,
      targetRect: request.detailRect,
      duration: getCardTransitionDuration(request.direction),
      direction: request.direction,
      easing: (progress) => progress,
      sourceBorderRadius: createPreviewBorderRadii(request.previewRect),
      targetBorderRadius: createDetailBorderRadii(request.slideMode),
      perspective: null,
      textureBleed: MICA_TEXTURE_BLEED_PX,
      textureOpacity: 0.2,
      surfaceColor,
      surfaceOpacity: 1,
      maxPixelRatio: 1,
      antialias: false,
      autoResize: false,
      forceContextLossOnDispose: false,
      crossOrigin: null,
      viewport: request.viewport,
      signal,
    });
    if (isRendererContextLost) {
      renderer.dispose();
      throw createCancelledError();
    }
    pooledRenderer = renderer;
    pooledTextureUrl = request.textureUrl;
    return renderer;
  }

  const renderer = pooledRenderer;
  try {
    renderer.resize(
      request.viewport.width,
      request.viewport.height,
      request.viewport.pixelRatio,
    );
    if (pooledTextureUrl !== request.textureUrl) {
      await renderer.setTextureUrl(request.textureUrl, null, signal);
      pooledTextureUrl = request.textureUrl;
    }
    renderer.setSurface(surfaceColor, 1, 0.2);
  } catch (error: unknown) {
    disposeRenderer(renderer);
    throw error;
  }
  return renderer;
};

const applyDomFrame = (
  run: InternalRun,
  frame: TransitionFrame,
  opacities: FaceOpacities,
) => {
  const shellElement = shell.value;
  const shadowElement = shadow.value;
  const frontFaceElement = frontFace.value;
  const backFaceElement = backFace.value;
  if (
    !shellElement
    || !shadowElement
    || !frontFaceElement
    || !backFaceElement
  ) return;

  shellElement.style.left = `${frame.rect.left}px`;
  shellElement.style.top = `${frame.rect.top}px`;
  shellElement.style.width = `${frame.rect.width}px`;
  shellElement.style.height = `${frame.rect.height}px`;
  shellElement.style.transform = 'none';
  const projectionScale = Math.abs(Math.cos(frame.geometryProgress * Math.PI));
  const projection = `scaleX(${projectionScale})`;
  const minimumProjectedWidth = 1 / Math.max(1, run.request.viewport.pixelRatio);
  const domProjectionScale = Math.max(
    projectionScale,
    minimumProjectedWidth / frame.rect.width,
  );
  const projectedWidth = frame.rect.width * domProjectionScale;
  const horizontalClipInset = Math.max(0, (frame.rect.width - projectedWidth) / 2);
  const borderRadius = toCssBorderRadius(run.frameBorderRadii);
  const projectedBorderRadius = toCssBorderRadius(run.frameBorderRadii, domProjectionScale);
  shadowElement.style.transform = projection;
  shadowElement.style.opacity = `${clampUnit(run.request.sourceOpacity) * (1 - smoothstep(0.15, 0.75, frame.geometryProgress))}`;
  shadowElement.style.borderRadius = borderRadius;
  shadowElement.style.boxShadow = run.request.sourceBoxShadow;
  frontFaceElement.style.transform = projection;
  frontFaceElement.style.opacity = `${opacities.preview}`;
  backFaceElement.style.opacity = `${opacities.detail}`;
  backFaceElement.style.borderRadius = borderRadius;
  const detailClipPath = `inset(0 ${horizontalClipInset}px 0 ${horizontalClipInset}px round ${projectedBorderRadius})`;
  backFaceElement.style.clipPath = detailClipPath;
  backFaceElement.style.setProperty('-webkit-clip-path', detailClipPath);

  run.previewContentElement.style.transform = `scale(${frame.previewScale}) translateY(${frame.previewTranslateY}px)`;
  run.detailLayoutElement.style.transform = `translateX(-50%) scale(${frame.detailScale}) scaleX(${domProjectionScale})`;
};

const applyFrame = (run: InternalRun, rawProgress: number) => {
  updateClosePreviewTarget(run);
  const easedProgress = rawProgress >= 1 ? 1 : run.easing(rawProgress);
  const targetFrame = createEndpointFrame(
    run.request,
    run.request.direction === 'open' ? 1 : 0,
  );
  const frame = mixFrame(run.startFrame, targetFrame, easedProgress);
  const opacities = getFaceOpacities(
    frame.geometryProgress,
    run.request.sourceOpacity,
  );

  run.currentFrame = frame;

  updateFrameBorderRadii(
    run.frameBorderRadii,
    run.request.previewRect,
    frame.geometryProgress,
    run.request.slideMode,
  );
  run.renderer.renderFrame(frame.rect, frame.geometryProgress, run.frameBorderRadii);
  applyDomFrame(run, frame, opacities);
};

const resolveHandoff = (
  run: InternalRun,
  status: CardTransitionHandoffOutcome['status'],
) => {
  if (run.handoffResolved) return;
  run.handoffResolved = true;
  run.handoff.resolve({ id: run.request.id, direction: run.request.direction, status });
};

const settleRun = (
  run: InternalRun,
  status: CardTransitionOutcome['status'],
): Promise<void> => {
  if (run.settlePromise) return run.settlePromise;

  run.settled = true;
  run.settlePromise = (async () => {
    if (run.animationFrameId !== undefined) window.cancelAnimationFrame(run.animationFrameId);
    resolveHandoff(run, status === 'finished' ? 'reached' : 'cancelled');

    if (status === 'finished') {
      await nextTick();
      await nextAnimationFrame();
    }

    restoreVisuallyHiddenElements(run.hiddenElements);
    releaseRunMicaPause(run);
    try {
      if (run.discardRenderer) {
        disposeRenderer(run.renderer);
      } else if (pooledRenderer === run.renderer) {
        run.renderer.resize(1, 1, 1);
      }
    } catch (error: unknown) {
      emit('error', { id: run.request.id, direction: run.request.direction, error });
    } finally {
      run.finished.resolve({ id: run.request.id, direction: run.request.direction, status });

      if (activeRun === run) {
        activeRun = undefined;
        clearOverlayDom();
      }
    }
  })();

  return run.settlePromise;
};

const settleIntentForTakeover = (run: InternalRun) => {
  if (run.animationFrameId !== undefined) {
    window.cancelAnimationFrame(run.animationFrameId);
    run.animationFrameId = undefined;
  }
  resolveHandoff(run, 'cancelled');
  run.finished.resolve({
    id: run.request.id,
    direction: run.request.direction,
    status: 'cancelled',
  });
};

const resolveFrameHandoff = (run: InternalRun) => {
  const reached = run.request.direction === 'open'
    ? run.currentFrame.geometryProgress >= 0.5
    : run.currentFrame.geometryProgress <= 0.5;
  if (reached) {
    if (run.request.direction === 'close') releaseRunMicaPause(run);
    resolveHandoff(run, 'reached');
  }
};

const createPublicRun = (
  run: InternalRun,
  generation: number,
  handoff: Promise<CardTransitionHandoffOutcome>,
  finished: Promise<CardTransitionOutcome>,
): CardTransitionRun => ({
  id: run.request.id,
  handoff,
  finished,
  cancel: () => {
    if (activeRun === run && run.generation === generation && !run.settled) {
      operationGeneration += 1;
      void settleRun(run, 'cancelled');
    }
  },
});

const beginPlayback = (run: InternalRun): CardTransitionRun => {
  const generation = run.generation;
  const handoff = run.handoff.promise;
  const finished = run.finished.promise;
  const startedAt = performance.now();

  applyFrame(run, 0);
  resolveFrameHandoff(run);
  emit('prepared', { id: run.request.id, direction: run.request.direction });

  const tick = (now: number) => {
    if (run.settled || activeRun !== run || run.generation !== generation) return;

    let rawProgress: number;
    try {
      rawProgress = clampUnit((now - startedAt) / run.duration);
      applyFrame(run, rawProgress);
      resolveFrameHandoff(run);
    } catch (error: unknown) {
      emit('error', { id: run.request.id, direction: run.request.direction, error });
      run.discardRenderer = true;
      void settleRun(run, 'cancelled');
      return;
    }

    if (rawProgress >= 1) {
      void settleRun(run, 'finished');
      return;
    }

    run.animationFrameId = window.requestAnimationFrame(tick);
  };
  run.animationFrameId = window.requestAnimationFrame(tick);

  return createPublicRun(run, generation, handoff, finished);
};

const getRedirectedDuration = (
  request: CardTransitionRequest,
  geometryProgress: number,
) => {
  const target = request.direction === 'open' ? 1 : 0;
  const remainingDistance = Math.abs(target - clampUnit(geometryProgress));
  return Math.max(1, getCardTransitionDuration(request.direction) * remainingDistance);
};

const assertCurrentOperation = (generation: number) => {
  if (!isMounted || generation !== operationGeneration) throw createCancelledError();
};

const cancel = () => {
  operationGeneration += 1;
  pendingStart?.abortController.abort();
  const run = activeRun;
  if (run) {
    void settleRun(run, 'cancelled');
    return;
  }
  clearOverlayDom();
};

const start = async (request: CardTransitionRequest): Promise<CardTransitionRun> => {
  const generation = ++operationGeneration;
  const previousPending = pendingStart;
  if (previousPending) {
    previousPending.abortController.abort();
    await previousPending.done.promise;
  }
  assertCurrentOperation(generation);

  const overlayElement = overlay.value;
  const canvasElement = canvas.value;
  if (!overlayElement || !canvasElement || !frontMount.value || !backMount.value) {
    throw new Error('Card transition overlay is not mounted.');
  }

  const done = createDeferred<undefined>();
  const abortController = new AbortController();
  const pending: PendingStart = { generation, request, abortController, done };
  pendingStart = pending;
  let renderer: CardTransitionMicaRenderer | undefined;
  let resumeMica: (() => void) | undefined;
  const hiddenElements: VisuallyHiddenElement[] = [];
  let initializedRun: InternalRun | undefined;

  try {
    const reusableRun = activeRun;
    if (reusableRun && !reusableRun.settled) {
      settleIntentForTakeover(reusableRun);
      initializedRun = reusableRun;
      if (request.direction === 'open') ensureRunMicaPaused(reusableRun);
      restoreVisuallyHiddenElements(reusableRun.hiddenElements);
      const reuseMountedClones = isSamePreviewActor(reusableRun, request);
      const mountedClones = reuseMountedClones ? undefined : mountTransitionClones(request);
      if (reuseMountedClones) {
        request.sourceOpacity = reusableRun.request.sourceOpacity;
        request.sourceBoxShadow = reusableRun.request.sourceBoxShadow;
        configureDetailLayout(reusableRun.detailLayoutElement, request);
      }
      reusableRun.hiddenElements = [
        setVisuallyHidden(request.previewElement),
        setVisuallyHidden(request.detailElement),
      ];

      await nextTick();
      assertCurrentOperation(generation);
      if (activeRun !== reusableRun || reusableRun.settled) throw createCancelledError();
      if (mountedClones) copyDetailScrollTop(request.detailElement, mountedClones.detailClone);

      const startFrame: TransitionFrame = {
        ...reusableRun.currentFrame,
        rect: { ...reusableRun.currentFrame.rect },
      };
      reusableRun.generation = generation;
      reusableRun.request = request;
      reusableRun.duration = getRedirectedDuration(request, startFrame.geometryProgress);
      reusableRun.easing = getCardTransitionEasing(request.direction);
      reusableRun.handoff = createDeferred<CardTransitionHandoffOutcome>();
      reusableRun.finished = createDeferred<CardTransitionOutcome>();
      if (mountedClones) {
        reusableRun.previewContentElement = mountedClones.previewContentElement;
        reusableRun.detailLayoutElement = mountedClones.detailLayoutElement;
      }
      reusableRun.startFrame = startFrame;
      reusableRun.currentFrame = startFrame;
      reusableRun.handoffResolved = false;
      reusableRun.animationFrameId = undefined;
      pendingStart = undefined;

      return beginPlayback(reusableRun);
    }

    if (reusableRun) await settleRun(reusableRun, 'cancelled');
    assertCurrentOperation(generation);
    clearOverlayDom();
    overlayElement.style.width = `${request.viewport.width}px`;
    overlayElement.style.height = `${request.viewport.height}px`;
    resumeMica = pauseMicaTracking();
    const mountedClones = mountTransitionClones(request);

    await nextTick();
    assertCurrentOperation(generation);
    copyDetailScrollTop(request.detailElement, mountedClones.detailClone);

    const surfaceColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-surface-mica')
      .trim() || '#000000';
    renderer = await prepareRenderer(
      request,
      canvasElement,
      surfaceColor,
      abortController.signal,
    );
    assertCurrentOperation(generation);

    const handoff = createDeferred<CardTransitionHandoffOutcome>();
    const finished = createDeferred<CardTransitionOutcome>();
    const duration = getCardTransitionDuration(request.direction);
    hiddenElements.push(
      setVisuallyHidden(request.previewElement),
      setVisuallyHidden(request.detailElement),
    );
    const initialFrame = createEndpointFrame(request, request.direction === 'open' ? 0 : 1);

    const run: InternalRun = {
      generation,
      request,
      duration,
      easing: getCardTransitionEasing(request.direction),
      handoff,
      finished,
      renderer,
      resumeMica,
      hiddenElements,
      previewContentElement: mountedClones.previewContentElement,
      detailLayoutElement: mountedClones.detailLayoutElement,
      frameBorderRadii: createBorderRadii(),
      startFrame: initialFrame,
      currentFrame: initialFrame,
      handoffResolved: false,
      settled: false,
      discardRenderer: false,
    };
    initializedRun = run;
    activeRun = run;
    pendingStart = undefined;

    isActive.value = true;
    await nextTick();
    assertCurrentOperation(generation);
    if (activeRun !== run || run.settled) throw createCancelledError();

    return beginPlayback(run);
  } catch (error: unknown) {
    if (initializedRun) {
      if (!isCancelledError(error)) initializedRun.discardRenderer = true;
      await settleRun(initializedRun, 'cancelled');
    } else {
      resumeMica?.();
      restoreVisuallyHiddenElements(hiddenElements);
      if (renderer && (!isCancelledError(error) || !isMounted)) disposeRenderer(renderer);
      if (generation === operationGeneration) clearOverlayDom();
    }

    if (!isCancelledError(error)) {
      emit('error', { id: request.id, direction: request.direction, error });
    }
    throw error;
  } finally {
    if (pendingStart === pending) pendingStart = undefined;
    done.resolve(undefined);
  }
};

const handleContextLost = (event: Event) => {
  event.preventDefault();
  isRendererContextLost = true;
  const request = activeRun?.request ?? pendingStart?.request;
  if (request) {
    emit('error', {
      id: request.id,
      direction: request.direction,
      error: new Error('The WebGL context was lost during the card transition.'),
    });
  }
  cancel();
  if (pooledRenderer) disposeRenderer(pooledRenderer);
};

const handleContextRestored = () => {
  isRendererContextLost = false;
};

onMounted(() => {
  isMounted = true;
  canvas.value?.addEventListener('webglcontextlost', handleContextLost);
  canvas.value?.addEventListener('webglcontextrestored', handleContextRestored);
});

onBeforeUnmount(() => {
  isMounted = false;
  canvas.value?.removeEventListener('webglcontextlost', handleContextLost);
  canvas.value?.removeEventListener('webglcontextrestored', handleContextRestored);
  cancel();
  if (pooledRenderer) disposeRenderer(pooledRenderer);
});

defineExpose<CardTransitionOverlayApi>({ start, cancel });
</script>

<template>
  <Teleport to="body">
    <div v-show="isActive" ref="overlay" class="card-transition-overlay" aria-hidden="true" inert>
      <canvas ref="canvas" class="mica-canvas" />
      <div ref="shell" class="transition-shell">
        <div ref="shadow" class="transition-shadow" />
        <div class="transition-rotator">
          <div ref="front-face" class="transition-face front-face">
            <div class="front-positioner">
              <div ref="front-mount" class="frozen-mount front-mount" />
            </div>
          </div>
          <div ref="back-face" class="transition-face back-face">
            <div class="back-clip">
              <div ref="back-mount" class="frozen-mount back-mount" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.card-transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: hidden;
  pointer-events: none;
}

.mica-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.transition-shell {
  position: fixed;
  z-index: 1;
  transform-origin: top left;
  will-change: left, top, width, height;
}

.transition-rotator,
.transition-face,
.transition-shadow,
.back-clip {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.transition-rotator {
  z-index: 1;
}

.transition-shadow {
  z-index: 0;
  transform-origin: center;
  pointer-events: none;
  will-change: transform, opacity;
}

.transition-face {
  opacity: 0;
  pointer-events: none;
  transform-origin: center;
  will-change: opacity;
}

.front-face {
  overflow: visible;
  will-change: opacity, transform;
}

.back-face {
  overflow: hidden;
  will-change: opacity, clip-path;
  -webkit-mask-image: linear-gradient(#fff, #fff);
  mask-image: linear-gradient(#fff, #fff);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

.back-clip {
  overflow: visible;
}

.front-positioner {
  position: absolute;
  top: 0;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translateX(-50%);
}

.front-mount {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.back-mount {
  position: absolute;
}

.frozen-mount {
  pointer-events: none;

  :deep(*),
  :deep(*)::before,
  :deep(*)::after {
    transition: none !important;
    animation-play-state: paused !important;
    pointer-events: none !important;
  }
}
</style>
