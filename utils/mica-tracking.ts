import { computed, shallowRef } from 'vue';

const pauseDepth = shallowRef(0);
const trackers = new Set<() => void>();

const SCROLL_SETTLE_TRACKING_MS = 96;
const TRANSFORM_TRANSITION_TRACKING_MS = 500;

let animationFrameId: number | undefined;
let trackingDeadline = 0;
let scrollMicrotaskQueued = false;
let areDocumentListenersAttached = false;

export const micaRefreshToken = shallowRef(0);

export const isMicaTrackingPaused = computed(() => pauseDepth.value > 0);

const cancelTrackingFrame = () => {
  if (animationFrameId === undefined || typeof window === 'undefined') return;
  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = undefined;
};

const runTrackingFrame = (timestamp: number) => {
  animationFrameId = undefined;
  if (pauseDepth.value > 0 || trackers.size === 0) return;

  trackers.forEach((tracker) => tracker());

  if (timestamp < trackingDeadline) {
    animationFrameId = window.requestAnimationFrame(runTrackingFrame);
  }
};

export const requestMicaTracking = (duration = 0) => {
  if (typeof window === 'undefined' || pauseDepth.value > 0 || trackers.size === 0) return;

  trackingDeadline = Math.max(trackingDeadline, performance.now() + duration);
  if (animationFrameId === undefined) {
    animationFrameId = window.requestAnimationFrame(runTrackingFrame);
  }
};

const handleDocumentScroll = () => {
  if (scrollMicrotaskQueued || pauseDepth.value > 0) return;
  scrollMicrotaskQueued = true;

  // Vue applies ScrollSlide's reactive transform after the scroll event.
  queueMicrotask(() => {
    scrollMicrotaskQueued = false;
    requestMicaTracking(SCROLL_SETTLE_TRACKING_MS);
  });
};

const handleDocumentTransitionRun = (event: TransitionEvent) => {
  if (event.propertyName !== 'transform') return;
  requestMicaTracking(TRANSFORM_TRANSITION_TRACKING_MS);
};

const attachDocumentListeners = () => {
  if (areDocumentListenersAttached || typeof document === 'undefined') return;

  document.addEventListener('scroll', handleDocumentScroll, { capture: true, passive: true });
  document.addEventListener('transitionrun', handleDocumentTransitionRun, true);
  areDocumentListenersAttached = true;
};

const detachDocumentListeners = () => {
  if (!areDocumentListenersAttached || typeof document === 'undefined') return;

  document.removeEventListener('scroll', handleDocumentScroll, true);
  document.removeEventListener('transitionrun', handleDocumentTransitionRun, true);
  areDocumentListenersAttached = false;
};

export const registerMicaTracker = (tracker: () => void): (() => void) => {
  trackers.add(tracker);
  attachDocumentListeners();
  requestMicaTracking();

  return () => {
    trackers.delete(tracker);
    if (trackers.size > 0) return;

    trackingDeadline = 0;
    scrollMicrotaskQueued = false;
    cancelTrackingFrame();
    detachDocumentListeners();
  };
};

export const pauseMicaTracking = (): (() => void) => {
  pauseDepth.value += 1;
  if (pauseDepth.value === 1) cancelTrackingFrame();
  let resumed = false;

  return () => {
    if (resumed) return;
    resumed = true;
    pauseDepth.value = Math.max(0, pauseDepth.value - 1);

    if (pauseDepth.value === 0) {
      micaRefreshToken.value += 1;
      requestMicaTracking();
    }
  };
};

export const requestMicaRefresh = () => {
  micaRefreshToken.value += 1;
};
