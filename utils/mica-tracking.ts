import { computed, shallowRef } from 'vue';

const pauseDepth = shallowRef(0);

export const micaRefreshToken = shallowRef(0);

export const isMicaTrackingPaused = computed(() => pauseDepth.value > 0);

export const pauseMicaTracking = (): (() => void) => {
  pauseDepth.value += 1;
  let resumed = false;

  return () => {
    if (resumed) return;
    resumed = true;
    pauseDepth.value = Math.max(0, pauseDepth.value - 1);

    if (pauseDepth.value === 0) micaRefreshToken.value += 1;
  };
};

export const requestMicaRefresh = () => {
  micaRefreshToken.value += 1;
};
