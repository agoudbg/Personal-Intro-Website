<script lang="ts" setup>
import {
  blurred,
  blurredRenderStatus,
  isMicaTrackingPaused,
  isSafari as isSafariRef,
  micaRefreshToken,
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

let animationFrameId: number | undefined;
let scrollAnimationFrameId: number | undefined;
let resizeObserver: ResizeObserver | undefined;
let lastGeometry = '';
let isMounted = false;
let scrollUpdateQueued = false;
const scrollParents: HTMLElement[] = [];

const updatePosition = () => {
  if (isSafariFallback.value) return;

  const element = micaElement.value;
  const image = backgroundImageElement.value;

  if (!element || !image) return;

  const rect = element.getBoundingClientRect();
  const localWidth = element.offsetWidth;
  const localHeight = element.offsetHeight;

  if (localWidth <= 0 || localHeight <= 0) return;

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
  const width = window.innerWidth + MICA_TEXTURE_BLEED_PX * 2;
  const height = window.innerHeight + MICA_TEXTURE_BLEED_PX * 2;
  const geometry = [left, top, inverseScaleX, inverseScaleY, width, height]
    .map((value) => value.toFixed(3))
    .join(':');

  if (geometry === lastGeometry) return;

  lastGeometry = geometry;
  image.style.width = `${width}px`;
  image.style.height = `${height}px`;
  image.style.transform = `matrix(${inverseScaleX}, 0, 0, ${inverseScaleY}, ${left}, ${top})`;
};

const stopPositionTracking = () => {
  if (animationFrameId !== undefined) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = undefined;
  }
  if (scrollAnimationFrameId !== undefined) {
    window.cancelAnimationFrame(scrollAnimationFrameId);
    scrollAnimationFrameId = undefined;
  }
  scrollUpdateQueued = false;
};

const trackPosition = () => {
  animationFrameId = undefined;
  if (!isMounted || isMicaTrackingPaused.value) return;

  updatePosition();
  animationFrameId = window.requestAnimationFrame(trackPosition);
};

const startPositionTracking = () => {
  if (
    !isMounted
    || isSafariFallback.value
    || isMicaTrackingPaused.value
    || animationFrameId !== undefined
  ) return;

  updatePosition();
  animationFrameId = window.requestAnimationFrame(trackPosition);
};

const handleViewportResize = () => {
  lastGeometry = '';
  if (!isMicaTrackingPaused.value) updatePosition();
};

const handleScroll = () => {
  if (isMicaTrackingPaused.value || scrollUpdateQueued) return;
  scrollUpdateQueued = true;

  // ScrollSlide schedules its transform from the same scroll event. Deferring
  // registration until the event finishes makes this rAF run after its update.
  queueMicrotask(() => {
    if (!isMounted) {
      scrollUpdateQueued = false;
      return;
    }

    scrollAnimationFrameId = window.requestAnimationFrame(() => {
      scrollAnimationFrameId = undefined;
      scrollUpdateQueued = false;
      updatePosition();
    });
  });
};

onMounted(() => {
  const element = micaElement.value;
  if (!element) return;

  isMounted = true;
  resizeObserver = new ResizeObserver(handleViewportResize);
  resizeObserver.observe(element);
  window.addEventListener('resize', handleViewportResize);

  let parent = element.parentElement;
  while (parent) {
    parent.addEventListener('scroll', handleScroll, { passive: true });
    scrollParents.push(parent);
    parent = parent.parentElement;
  }

  startPositionTracking();
});

onBeforeUnmount(() => {
  isMounted = false;

  stopPositionTracking();

  resizeObserver?.disconnect();
  window.removeEventListener('resize', handleViewportResize);
  scrollParents.forEach((parent) => {
    parent.removeEventListener('scroll', handleScroll);
  });
  scrollParents.length = 0;
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
    transform-origin: top left;
    will-change: transform;
    z-index: 0;
  }
}
</style>
