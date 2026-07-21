import { preloadRouteComponents } from '#app';
import { nextTick, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue';
import type {
  RouteLocationNormalizedGeneric,
  RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';
import { blurred } from '~/utils/background-blurred';
import { slideMode } from '~/utils/card-rem';
import { toCardTransitionRect } from '~/utils/card-transition';
import type {
  CardTransitionDirection,
  CardTransitionOverlayApi,
  CardTransitionPhase,
  CardTransitionRect,
  CardTransitionRun,
  CardTransitionViewport,
} from '~/utils/card-transition';

export const CARD_SHADER_TRANSITION_OVERLAY_REF = 'card-shader-transition-overlay';

export type CardTransitionPageId = 'me' | 'programs' | 'blog' | 'friends';

export interface CardShaderTransitionMatch {
  direction: CardTransitionDirection;
  pageId: CardTransitionPageId;
}

export type CardShaderTransitionStage =
  | 'before-open'
  | 'after-open'
  | 'before-close'
  | 'after-close'
  | 'overlay';

export type CardShaderTransitionFailureReason =
  | 'not-transition'
  | 'not-prepared'
  | 'preview-unavailable'
  | 'detail-unavailable'
  | 'geometry-unavailable'
  | 'texture-unavailable'
  | 'viewport-changed'
  | 'overlay-unavailable'
  | 'start-failed'
  | 'cancelled';

export interface CardShaderTransitionFailure {
  direction?: CardTransitionDirection;
  stage: CardShaderTransitionStage;
  reason: CardShaderTransitionFailureReason;
  error?: unknown;
}

export type CardShaderTransitionHandlingResult =
  | {
      handled: true;
      direction: CardTransitionDirection;
    }
  | {
      handled: false;
      direction?: CardTransitionDirection;
      failure: CardShaderTransitionFailure;
    };

export interface CardShaderTransitionOverlayEvent {
  id: number;
  direction: CardTransitionDirection;
}

export interface CardShaderTransitionOverlayErrorEvent extends CardShaderTransitionOverlayEvent {
  error: unknown;
}

type ViewportSnapshot = CardTransitionViewport;

interface FrozenPreviewSnapshot {
  pageId: CardTransitionPageId;
  element: HTMLElement;
  rect: CardTransitionRect;
  naturalWidth: number;
  sourceOpacity: number;
  sourceBoxShadow: string;
  slideMode: 0 | 1 | 2;
  textureUrl: string;
  viewport: ViewportSnapshot;
}

interface PendingOpenTransition extends FrozenPreviewSnapshot {
  id: number;
  lifecycleId: number;
  navigationKey: string;
}

interface ClaimedCloseNavigation {
  id: number;
  lifecycleId: number;
  navigationKey: string;
}

interface TrackedRun {
  requestId: number;
  lifecycleId: number;
  direction: CardTransitionDirection;
  run: CardTransitionRun;
}

interface NavigationIntent {
  lifecycleId: number;
  direction: CardTransitionDirection;
  navigationKey: string;
}

const DETAIL_SELECTOR = '.detail-container .detail';
const ELEMENT_WAIT_TIMEOUT_MS = 10_000;
const OVERLAY_WAIT_TIMEOUT_MS = 3_000;

const ROUTE_PAGE_IDS = new Map<RouteLocationNormalizedGeneric['name'], CardTransitionPageId>([
  ['index-me', 'me'],
  ['index-programs', 'programs'],
  ['index-blog', 'blog'],
  ['index-friends', 'friends'],
]);

const getPreviewSelector = (pageId: CardTransitionPageId) => (
  `[data-preview-card-id="${pageId}"]`
);

const isUsableRect = (rect: CardTransitionRect) => (
  Number.isFinite(rect.left)
  && Number.isFinite(rect.top)
  && Number.isFinite(rect.width)
  && Number.isFinite(rect.height)
  && rect.width > 0
  && rect.height > 0
);

const getViewportSnapshot = (): ViewportSnapshot => ({
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio,
});

const isSameViewport = (left: ViewportSnapshot, right: ViewportSnapshot) => (
  Math.abs(left.width - right.width) <= 1
  && Math.abs(left.height - right.height) <= 1
  && Math.abs(left.pixelRatio - right.pixelRatio) <= 0.01
);

const getSlideMode = (): 0 | 1 | 2 => {
  const value = slideMode.value;
  return value === 0 || value === 1 ? value : 2;
};

const getSourceOpacity = (element: HTMLElement): number => {
  let opacityElement: HTMLElement | null = element;

  while (opacityElement && opacityElement !== document.body) {
    if (opacityElement.classList.contains('slider-slot')) break;
    opacityElement = opacityElement.parentElement;
  }

  const opacity = Number.parseFloat(getComputedStyle(opacityElement ?? element).opacity);
  return Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 1;
};

const getNavigationKey = (
  to: RouteLocationNormalizedGeneric,
  from: RouteLocationNormalizedLoadedGeneric,
) => `${from.fullPath}->${to.fullPath}`;

const waitForElement = async (selector: string): Promise<HTMLElement | null> => {
  const timeoutAt = performance.now() + ELEMENT_WAIT_TIMEOUT_MS;

  while (performance.now() < timeoutAt) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element?.isConnected) return element;
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  return null;
};

export const getCardShaderTransition = (
  to: RouteLocationNormalizedGeneric,
  from: RouteLocationNormalizedLoadedGeneric,
): CardShaderTransitionMatch | undefined => {
  if (from.name === 'index') {
    const pageId = ROUTE_PAGE_IDS.get(to.name);
    if (pageId) return { direction: 'open', pageId };
  }

  if (to.name === 'index') {
    const pageId = ROUTE_PAGE_IDS.get(from.name);
    if (pageId) return { direction: 'close', pageId };
  }

  return undefined;
};

export const useCardShaderTransition = () => {
  const overlay = useTemplateRef<CardTransitionOverlayApi>(CARD_SHADER_TRANSITION_OVERLAY_REF);
  const phase = shallowRef<CardTransitionPhase>('idle');
  const lastFailure = shallowRef<CardShaderTransitionFailure>();
  const lastPreparedEvent = shallowRef<CardShaderTransitionOverlayEvent>();

  let nextRequestId = 0;
  let activeRequestId: number | undefined;
  let pendingOpen: PendingOpenTransition | undefined;
  let cachedPreview: FrozenPreviewSnapshot | undefined;
  let trackedRun: TrackedRun | undefined;
  let claimedCloseNavigation: ClaimedCloseNavigation | undefined;
  let activeNavigationIntent: NavigationIntent | undefined;
  let lifecycleId = 0;

  const createFailure = (
    stage: CardShaderTransitionStage,
    reason: CardShaderTransitionFailureReason,
    direction?: CardTransitionDirection,
    error?: unknown,
  ): CardShaderTransitionHandlingResult => {
    const failure: CardShaderTransitionFailure = { stage, reason, direction, error };
    lastFailure.value = failure;
    return { handled: false, direction, failure };
  };

  const createNotTransitionResult = (
    stage: 'before-open' | 'after-open',
  ): CardShaderTransitionHandlingResult => ({
    handled: false,
    failure: { stage, reason: 'not-transition' },
  });

  const waitForOverlay = async (): Promise<CardTransitionOverlayApi | null> => {
    const timeoutAt = performance.now() + OVERLAY_WAIT_TIMEOUT_MS;
    await nextTick();

    while (performance.now() < timeoutAt) {
      if (overlay.value) return overlay.value;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 16));
    }

    return null;
  };

  const clearRuntimeState = (clearCachedPreview: boolean) => {
    lifecycleId += 1;
    trackedRun?.run.cancel();
    overlay.value?.cancel();
    trackedRun = undefined;
    pendingOpen = undefined;
    claimedCloseNavigation = undefined;
    activeNavigationIntent = undefined;
    activeRequestId = undefined;
    phase.value = 'idle';
    if (clearCachedPreview) cachedPreview = undefined;
  };

  const beginNavigationIntent = (
    nextPhase: CardTransitionPhase,
    direction: CardTransitionDirection,
    navigationKey: string,
  ) => {
    lifecycleId += 1;
    trackedRun = undefined;
    pendingOpen = undefined;
    claimedCloseNavigation = undefined;
    activeNavigationIntent = { lifecycleId, direction, navigationKey };
    activeRequestId = undefined;
    phase.value = nextPhase;
    lastFailure.value = undefined;
    return lifecycleId;
  };

  const isCurrentIntent = (intentLifecycleId: number) => (
    intentLifecycleId === lifecycleId
  );

  const createSupersededResult = (
    direction: CardTransitionDirection,
  ): CardShaderTransitionHandlingResult => ({ handled: true, direction });

  const isSupersededNavigationCallback = (
    direction: CardTransitionDirection,
    navigationKey: string,
  ) => Boolean(
    activeNavigationIntent
    && (
      activeNavigationIntent.direction !== direction
      || activeNavigationIntent.navigationKey !== navigationKey
    ),
  );

  const failCurrentIntent = (
    intentLifecycleId: number,
    stage: CardShaderTransitionStage,
    reason: CardShaderTransitionFailureReason,
    direction: CardTransitionDirection,
    error?: unknown,
  ): CardShaderTransitionHandlingResult => {
    if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);
    clearRuntimeState(true);
    return createFailure(stage, reason, direction, error);
  };

  const trackRun = (
    run: CardTransitionRun,
    direction: CardTransitionDirection,
    intentLifecycleId: number,
  ) => {
    const tracked: TrackedRun = {
      requestId: run.id,
      lifecycleId: intentLifecycleId,
      direction,
      run,
    };
    trackedRun = tracked;

    void run.finished.then((outcome) => {
      if (!isCurrentIntent(intentLifecycleId) || trackedRun !== tracked) return;

      trackedRun = undefined;
      activeRequestId = undefined;
      phase.value = 'idle';
      if (activeNavigationIntent?.lifecycleId === intentLifecycleId) {
        activeNavigationIntent = undefined;
      }

      if (outcome.status === 'cancelled') {
        cachedPreview = undefined;
        lastFailure.value = {
          direction,
          stage: 'overlay',
          reason: 'cancelled',
        };
      } else if (direction === 'close') {
        cachedPreview = undefined;
      }
    });
  };

  const capturePreview = (
    pageId: CardTransitionPageId,
    element: HTMLElement,
  ): FrozenPreviewSnapshot | null => {
    const rect = toCardTransitionRect(element.getBoundingClientRect());
    const naturalWidth = element.querySelector<HTMLElement>('.card-content')?.offsetWidth
      ?? element.offsetWidth;
    const textureUrl = blurred.value.src;

    if (!isUsableRect(rect) || !Number.isFinite(naturalWidth) || naturalWidth <= 0) return null;
    if (!textureUrl) return null;

    return {
      pageId,
      element,
      rect,
      naturalWidth,
      sourceOpacity: getSourceOpacity(element),
      sourceBoxShadow: getComputedStyle(element).boxShadow,
      slideMode: getSlideMode(),
      textureUrl,
      viewport: getViewportSnapshot(),
    };
  };

  const handleBeforeOpen = async (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
    pageId: CardTransitionPageId,
  ): Promise<CardShaderTransitionHandlingResult> => {
    const direction = 'open';
    const stage = 'before-open';
    const canReuseActor = cachedPreview?.pageId === pageId;
    const navigationKey = getNavigationKey(to, from);
    const intentLifecycleId = beginNavigationIntent(
      'opening-await-detail',
      direction,
      navigationKey,
    );
    if (!canReuseActor) {
      overlay.value?.cancel();
      cachedPreview = undefined;
    }

    try {
      await preloadRouteComponents(to);
    } catch (error: unknown) {
      return failCurrentIntent(intentLifecycleId, stage, 'not-prepared', direction, error);
    }
    if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);

    const previewElement = document.querySelector<HTMLElement>(getPreviewSelector(pageId));
    if (!previewElement?.isConnected) {
      return failCurrentIntent(intentLifecycleId, stage, 'preview-unavailable', direction);
    }

    const snapshot = capturePreview(pageId, previewElement);
    if (!snapshot) {
      const reason = blurred.value.src ? 'geometry-unavailable' : 'texture-unavailable';
      return failCurrentIntent(intentLifecycleId, stage, reason, direction);
    }

    const id = ++nextRequestId;
    activeRequestId = id;
    cachedPreview = snapshot;
    pendingOpen = {
      ...snapshot,
      id,
      lifecycleId: intentLifecycleId,
      navigationKey,
    };
    await nextTick();
    if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);

    return { handled: true, direction };
  };

  const handleAfterOpen = async (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
  ): Promise<CardShaderTransitionHandlingResult> => {
    const direction = 'open';
    const stage = 'after-open';
    const pending = pendingOpen;
    const navigationKey = getNavigationKey(to, from);

    if (!pending || pending.navigationKey !== navigationKey) {
      if (isSupersededNavigationCallback(direction, navigationKey)) {
        return createSupersededResult(direction);
      }
      clearRuntimeState(true);
      return createFailure(stage, 'not-prepared', direction);
    }
    const intentLifecycleId = pending.lifecycleId;
    if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);

    if (!pending.element.isConnected) {
      return failCurrentIntent(intentLifecycleId, stage, 'preview-unavailable', direction);
    }

    if (!isSameViewport(pending.viewport, getViewportSnapshot())) {
      return failCurrentIntent(intentLifecycleId, stage, 'viewport-changed', direction);
    }

    const detailElement = await waitForElement(DETAIL_SELECTOR);
    if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);
    if (!detailElement) {
      return failCurrentIntent(intentLifecycleId, stage, 'detail-unavailable', direction);
    }

    const detailRect = toCardTransitionRect(detailElement.getBoundingClientRect());
    if (!isUsableRect(detailRect)) {
      return failCurrentIntent(intentLifecycleId, stage, 'geometry-unavailable', direction);
    }

    const overlayApi = await waitForOverlay();
    if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);
    if (!overlayApi) {
      return failCurrentIntent(intentLifecycleId, stage, 'overlay-unavailable', direction);
    }

    try {
      const run = await overlayApi.start({
        id: pending.id,
        direction,
        previewElement: pending.element,
        detailElement,
        previewRect: pending.rect,
        detailRect,
        previewNaturalWidth: pending.naturalWidth,
        sourceOpacity: pending.sourceOpacity,
        sourceBoxShadow: pending.sourceBoxShadow,
        slideMode: pending.slideMode,
        textureUrl: pending.textureUrl,
        viewport: pending.viewport,
      });
      if (!isCurrentIntent(intentLifecycleId)) {
        run.cancel();
        return createSupersededResult(direction);
      }

      pendingOpen = undefined;
      trackRun(run, direction, intentLifecycleId);
      return { handled: true, direction };
    } catch (error: unknown) {
      return failCurrentIntent(intentLifecycleId, stage, 'start-failed', direction, error);
    }
  };

  const handleBeforeClose = async (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
    pageId: CardTransitionPageId,
  ): Promise<CardShaderTransitionHandlingResult> => {
    const direction = 'close';
    const stage = 'before-close';
    const navigationKey = getNavigationKey(to, from);
    const intentLifecycleId = beginNavigationIntent(
      'closing-running',
      direction,
      navigationKey,
    );

    const snapshot = cachedPreview;
    if (!snapshot || snapshot.pageId !== pageId) {
      return failCurrentIntent(intentLifecycleId, stage, 'not-prepared', direction);
    }
    if (!isSameViewport(snapshot.viewport, getViewportSnapshot())) {
      return failCurrentIntent(intentLifecycleId, stage, 'viewport-changed', direction);
    }

    const previewElement = document.querySelector<HTMLElement>(getPreviewSelector(pageId));
    const detailElement = document.querySelector<HTMLElement>(DETAIL_SELECTOR);
    if (!previewElement?.isConnected) {
      return failCurrentIntent(intentLifecycleId, stage, 'preview-unavailable', direction);
    }
    if (!detailElement?.isConnected) {
      return failCurrentIntent(intentLifecycleId, stage, 'detail-unavailable', direction);
    }

    const previewRect = toCardTransitionRect(previewElement.getBoundingClientRect());
    const detailRect = toCardTransitionRect(detailElement.getBoundingClientRect());
    if (!isUsableRect(previewRect) || !isUsableRect(detailRect)) {
      return failCurrentIntent(intentLifecycleId, stage, 'geometry-unavailable', direction);
    }

    const textureUrl = blurred.value.src;
    if (!textureUrl) {
      return failCurrentIntent(intentLifecycleId, stage, 'texture-unavailable', direction);
    }

    const id = ++nextRequestId;
    activeRequestId = id;
    cachedPreview = {
      ...snapshot,
      element: previewElement,
      rect: previewRect,
      sourceOpacity: getSourceOpacity(previewElement),
      sourceBoxShadow: getComputedStyle(previewElement).boxShadow,
      slideMode: getSlideMode(),
      textureUrl,
    };

    const overlayApi = await waitForOverlay();
    if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);
    if (!overlayApi) {
      return failCurrentIntent(intentLifecycleId, stage, 'overlay-unavailable', direction);
    }

    try {
      const run = await overlayApi.start({
        id,
        direction,
        previewElement,
        detailElement,
        previewRect,
        detailRect,
        previewNaturalWidth: snapshot.naturalWidth,
        sourceOpacity: getSourceOpacity(previewElement),
        sourceBoxShadow: getComputedStyle(previewElement).boxShadow,
        slideMode: getSlideMode(),
        textureUrl,
        viewport: snapshot.viewport,
      });
      if (!isCurrentIntent(intentLifecycleId)) {
        run.cancel();
        return createSupersededResult(direction);
      }

      trackRun(run, direction, intentLifecycleId);
      const handoff = await run.handoff;
      await Promise.resolve();

      if (!isCurrentIntent(intentLifecycleId)) return createSupersededResult(direction);
      if (handoff.status !== 'reached' || trackedRun?.requestId !== id) {
        return failCurrentIntent(intentLifecycleId, stage, 'cancelled', direction);
      }

      claimedCloseNavigation = {
        id,
        lifecycleId: intentLifecycleId,
        navigationKey,
      };
      return { handled: true, direction };
    } catch (error: unknown) {
      return failCurrentIntent(intentLifecycleId, stage, 'start-failed', direction, error);
    }
  };

  const handleAfterClose = (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
  ): CardShaderTransitionHandlingResult => {
    const direction = 'close';
    const navigationKey = getNavigationKey(to, from);
    const claim = claimedCloseNavigation;

    if (!claim || claim.navigationKey !== navigationKey) {
      if (isSupersededNavigationCallback(direction, navigationKey)) {
        return createSupersededResult(direction);
      }
      return createFailure('after-close', 'not-prepared', direction);
    }
    if (!isCurrentIntent(claim.lifecycleId)) return createSupersededResult(direction);

    claimedCloseNavigation = undefined;
    return { handled: true, direction };
  };

  const handleBeforeNavigation = async (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
  ): Promise<CardShaderTransitionHandlingResult> => {
    const match = getCardShaderTransition(to, from);
    if (match?.direction === 'open') return handleBeforeOpen(to, from, match.pageId);
    if (match?.direction === 'close') return handleBeforeClose(to, from, match.pageId);

    return createNotTransitionResult('before-open');
  };

  const handleAfterNavigation = async (
    to: RouteLocationNormalizedGeneric,
    from: RouteLocationNormalizedLoadedGeneric,
  ): Promise<CardShaderTransitionHandlingResult> => {
    const match = getCardShaderTransition(to, from);
    if (match?.direction === 'open') return handleAfterOpen(to, from);
    if (match?.direction === 'close') return handleAfterClose(to, from);

    return createNotTransitionResult('after-open');
  };

  const handleOverlayPrepared = (event: CardShaderTransitionOverlayEvent) => {
    if (event.id !== activeRequestId) return;

    lastPreparedEvent.value = event;
    phase.value = event.direction === 'open' ? 'opening-running' : 'closing-running';
  };

  const handleOverlayError = (event: CardShaderTransitionOverlayErrorEvent) => {
    if (event.id !== activeRequestId) return;

    lastFailure.value = {
      direction: event.direction,
      stage: 'overlay',
      reason: 'start-failed',
      error: event.error,
    };
  };

  const cancel = () => clearRuntimeState(true);

  onBeforeUnmount(cancel);

  return {
    phase,
    lastFailure,
    lastPreparedEvent,
    handleBeforeNavigation,
    handleAfterNavigation,
    handleOverlayPrepared,
    handleOverlayError,
    cancel,
  };
};
