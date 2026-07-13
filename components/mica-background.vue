<script lang="ts" setup>
import { blurred, isSafari as isSafariRef } from '#imports';

const props = defineProps({
  opacity: {
    type: Number,
    default: 0.2,
  },
  forceMicaMode: {
    type: Boolean,
    default: false,
  },
});

const id = ref(Math.random().toString(36).substring(2, 15));

const isSafari = computed(() => {
  return isSafariRef.value /* && !props.forceMicaMode */;
});

const top = ref('0px');
const left = ref('0px');

const updatePosition = () => {
  if (isSafari.value) return;

  const element = document.getElementById(id.value);

  if (!element) return;

  const { top: elementTop, left: elementLeft } = element.getBoundingClientRect();

  top.value = `-${elementTop}px`;
  left.value = `-${elementLeft}px`;

  console.log('updatePosition', { top: top.value, left: left.value });
};

updatePosition();

// watch element resize
const observer = new ResizeObserver(() => {
  updatePosition();
});


// watch window resize
window.addEventListener('resize', () => {
  updatePosition();
});

// watch element position change
onMounted(() => {
  if (isSafari.value) return;

  const element = document.getElementById(id.value);

  if (element) {
    observer.observe(element);
  }

  // watch all parents' scroll event
  let parent = document.getElementById(id.value)?.parentElement;

  while (parent) {
    parent.addEventListener('scroll', updatePosition);
    parent = parent.parentElement;
  }
});

onBeforeUnmount(() => {
  if (isSafari.value) return;

  const element = document.getElementById(id.value);

  if (element) {
    observer.unobserve(element);
  }

  // watch window resize
  window.removeEventListener('resize', () => {
    updatePosition();
  });

  // watch all parents' scroll event
  let parent = document.getElementById(id.value)?.parentElement;

  while (parent) {
    parent.addEventListener('scroll', updatePosition);
    parent = parent.parentElement;
  }
});

// Safari uses the active theme's surface color behind the backdrop filter.
const safariBackgroundOpacity = computed(() => {
  if (!isSafari.value) return 0;
  return Math.min(1, Math.max(0, 1 - props.opacity));
});

const imgSrc = ref(blurred.value.src);

watch(blurredUpdateDate, () => {
  console.log('watch blurredUpdateDate', blurredUpdateDate.value);
  imgSrc.value = blurred.value.src;
  updatePosition();
});

</script>

<template>
  <div :id="id" :class="`micaBackground ${isSafari ? 'safari' : ''}`">
    <img v-if="!isSafari" :class="`backgroundImage`" :src="imgSrc">
  </div>
</template>

<style lang="scss" scoped>
.micaBackground {
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

  .backgroundImage {
    position: absolute;
    top: min(max(v-bind(top), -100vh), 100vh);
    left: min(max(v-bind(left), -100vw), 100vw);
    width: 100vw;
    height: 100vh;
    opacity: v-bind(opacity);
    z-index: 0;
  }
}
</style>
