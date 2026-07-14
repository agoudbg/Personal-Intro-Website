<script lang="ts" setup>
import { blurred, isSafari as isSafariRef } from '#imports';

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

const isSafari = computed(() => {
  return isSafariRef.value /* && !props.forceMicaMode */;
});

const VIEWPORT_OVERSCAN_PX = 2;
const MIN_VISIBLE_SCALE = 0.01;

let animationFrameId: number | undefined;
let resizeObserver: ResizeObserver | undefined;
let lastGeometry = '';

const updatePosition = () => {
  if (isSafari.value) return;

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
  const left = (-rect.left - VIEWPORT_OVERSCAN_PX) * inverseScaleX;
  const top = (-rect.top - VIEWPORT_OVERSCAN_PX) * inverseScaleY;
  const width = window.innerWidth + VIEWPORT_OVERSCAN_PX * 2;
  const height = window.innerHeight + VIEWPORT_OVERSCAN_PX * 2;
  const geometry = [left, top, inverseScaleX, inverseScaleY, width, height]
    .map((value) => value.toFixed(3))
    .join(':');

  if (geometry === lastGeometry) return;

  lastGeometry = geometry;
  image.style.width = `${width}px`;
  image.style.height = `${height}px`;
  image.style.transform = `matrix(${inverseScaleX}, 0, 0, ${inverseScaleY}, ${left}, ${top})`;
};

const trackPosition = () => {
  updatePosition();
  animationFrameId = window.requestAnimationFrame(trackPosition);
};

const handleViewportResize = () => {
  lastGeometry = '';
  updatePosition();
};

onMounted(() => {
  if (isSafari.value) return;

  const element = micaElement.value;
  if (!element) return;

  resizeObserver = new ResizeObserver(handleViewportResize);
  resizeObserver.observe(element);
  window.addEventListener('resize', handleViewportResize);
  animationFrameId = window.requestAnimationFrame(trackPosition);
});

onBeforeUnmount(() => {
  if (animationFrameId !== undefined) {
    window.cancelAnimationFrame(animationFrameId);
  }

  resizeObserver?.disconnect();
  window.removeEventListener('resize', handleViewportResize);
});

// Safari uses the active theme's surface color behind the backdrop filter.
const safariBackgroundOpacity = computed(() => {
  if (!isSafari.value) return 0;
  return Math.min(1, Math.max(0, 1 - props.opacity));
});

const imgSrc = shallowRef(blurred.value.src);

watch(blurredUpdateDate, () => {
  imgSrc.value = blurred.value.src;
  lastGeometry = '';
  updatePosition();
});

</script>

<template>
  <div ref="mica" class="mica-background" :class="{ safari: isSafari }">
    <img
      v-if="!isSafari"
      ref="background-image"
      class="background-image"
      :src="imgSrc"
      alt=""
      aria-hidden="true"
      @load="handleViewportResize"
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

  &.safari {
    background-color: rgb(var(--color-surface-mica-rgb) / v-bind(safariBackgroundOpacity));
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
  }

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
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
