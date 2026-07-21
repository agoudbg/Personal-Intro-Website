<script lang="ts" setup>
import {
  blurred,
  blurredRenderStatus,
  isMicaTrackingPaused,
  isSafari as isSafariRef,
  micaRefreshToken,
  registerMicaTracker,
} from '#imports';

interface Props {
  opacity?: number;
  forceMicaMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  opacity: 0.2,
  forceMicaMode: false,
});

const micaElement = useTemplateRef<HTMLElement>('mica');
const backgroundImageElement = useTemplateRef<HTMLImageElement>('background-image');

const hasBackgroundImageError = shallowRef(false);
const canUseSafariFallback = computed(() => isSafariRef.value && !props.forceMicaMode);
const isSafariFallback = computed(() => (
  canUseSafariFallback.value
  && (blurredRenderStatus.value === 'error' || hasBackgroundImageError.value)
));

const MIN_VISIBLE_SCALE = 0.01;

let resizeObserver: ResizeObserver | undefined;
let unregisterTracker: (() => void) | undefined;
let lastGeometry = '';
let localWidth = 0;
let localHeight = 0;
let textureWidth = 0;
let textureHeight = 0;
let isMounted = false;

const updateLocalSize = () => {
  const element = micaElement.value;
  if (!element) return;

  localWidth = element.offsetWidth;
  localHeight = element.offsetHeight;
};

const updatePosition = () => {
  if (isSafariFallback.value) return;

  const element = micaElement.value;
  const image = backgroundImageElement.value;

  if (!element || !image) return;

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (localWidth <= 0 || localHeight <= 0) return;

  // Far-offscreen cards keep their last matrix. The texture bleed doubles as a
  // prewarm margin so an approaching card refreshes before it becomes visible.
  if (
    rect.right <= -MICA_TEXTURE_BLEED_PX
    || rect.bottom <= -MICA_TEXTURE_BLEED_PX
    || rect.left >= viewportWidth + MICA_TEXTURE_BLEED_PX
    || rect.top >= viewportHeight + MICA_TEXTURE_BLEED_PX
  ) return;

  const scaleX = rect.width / localWidth;
  const scaleY = rect.height / localHeight;

  // A card is edge-on halfway through its flip animation. Retain the last valid
  // geometry instead of producing extremely large dimensions near scale zero.
  if (
    !Number.isFinite(scaleX)
    || !Number.isFinite(scaleY)
    || scaleX < MIN_VISIBLE_SCALE
    || scaleY < MIN_VISIBLE_SCALE
  ) return;

  const inverseScaleX = 1 / scaleX;
  const inverseScaleY = 1 / scaleY;
  const left = (-rect.left - MICA_TEXTURE_BLEED_PX) * inverseScaleX;
  const top = (-rect.top - MICA_TEXTURE_BLEED_PX) * inverseScaleY;
  const width = viewportWidth + MICA_TEXTURE_BLEED_PX * 2;
  const height = viewportHeight + MICA_TEXTURE_BLEED_PX * 2;
  const geometry = [left, top, inverseScaleX, inverseScaleY, width, height]
    .map((value) => value.toFixed(3))
    .join(':');

  if (geometry === lastGeometry) return;

  lastGeometry = geometry;
  if (width !== textureWidth || height !== textureHeight) {
    textureWidth = width;
    textureHeight = height;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
  }
  image.style.transform = `matrix(${inverseScaleX}, 0, 0, ${inverseScaleY}, ${left}, ${top})`;
};

const startPositionTracking = () => {
  if (
    !isMounted
    || isSafariFallback.value
    || isMicaTrackingPaused.value
    || unregisterTracker
  ) return;
  unregisterTracker = registerMicaTracker(updatePosition);
};

const stopPositionTracking = () => {
  unregisterTracker?.();
  unregisterTracker = undefined;
};

const handleViewportResize = () => {
  updateLocalSize();
  lastGeometry = '';
  if (!isMicaTrackingPaused.value) updatePosition();
};

onMounted(() => {
  const element = micaElement.value;
  if (!element) return;

  isMounted = true;
  updateLocalSize();
  resizeObserver = new ResizeObserver(handleViewportResize);
  resizeObserver.observe(element);
  window.addEventListener('resize', handleViewportResize);

  startPositionTracking();
});

onBeforeUnmount(() => {
  isMounted = false;

  stopPositionTracking();

  resizeObserver?.disconnect();
  window.removeEventListener('resize', handleViewportResize);
});

// The Safari fallback uses the active theme's surface color behind the backdrop filter.
const safariFallbackBackgroundOpacity = computed(() => {
  if (!isSafariFallback.value) return 0;
  return Math.min(1, Math.max(0, 1 - props.opacity));
});

const imgSrc = shallowRef(blurred.value.src);

const handleBackgroundImageError = () => {
  console.error('Failed to load the rendered Mica background image.', {
    safariFallbackAvailable: canUseSafariFallback.value,
  });

  if (canUseSafariFallback.value) hasBackgroundImageError.value = true;
};

watch(blurredUpdateDate, () => {
  hasBackgroundImageError.value = false;
  imgSrc.value = blurred.value.src;
  lastGeometry = '';
  if (!isMicaTrackingPaused.value) updatePosition();
});

watch(isSafariFallback, async (useFallback) => {
  if (useFallback) {
    stopPositionTracking();
    return;
  }

  lastGeometry = '';
  await nextTick();
  startPositionTracking();
});

watch(isMicaTrackingPaused, (paused) => {
  if (paused) {
    stopPositionTracking();
    return;
  }

  lastGeometry = '';
  startPositionTracking();
});

watch(micaRefreshToken, () => {
  lastGeometry = '';
  if (!isMicaTrackingPaused.value) updatePosition();
});

</script>

<template>
  <div ref="mica" class="mica-background" :class="{ 'safari-fallback': isSafariFallback }">
    <img
      v-if="!isSafariFallback && imgSrc"
      ref="background-image"
      class="background-image"
      :src="imgSrc"
      alt=""
      aria-hidden="true"
      @load="handleViewportResize"
      @error="handleBackgroundImageError"
    >
  </div>
</template>

<style lang="scss" scoped>
.mica-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--color-surface-mica);
  backface-visibility: hidden;
  contain: paint;
  z-index: 0;

  &.safari-fallback {
    background-color: rgb(var(--color-surface-mica-rgb) / v-bind(safariFallbackBackgroundOpacity));
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
  }

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: var(--app-viewport-height);
    display: block;
    max-width: none;
    opacity: v-bind('props.opacity');
    pointer-events: none;
    backface-visibility: hidden;
    transform-origin: top left;
    will-change: transform;
    z-index: 0;
  }
}
</style>
