<script lang="ts" setup>
import { blurred, isSafari } from '#imports';

const id = ref(Math.random().toString(36).substring(2, 15));

const transition = ref(false);

const top = ref('0px');
const left = ref('0px');

console.log('isSa', isSafari.value);

const updatePosition = () => {
  if (isSafari.value) return;

  const element = document.getElementById(id.value);

  if (!element) return;

  const { top: elementTop, left: elementLeft } = element.getBoundingClientRect();

  top.value = `-${elementTop}px`;
  left.value = `-${elementLeft}px`;
};

updatePosition();

// watch element resize
const observer = new ResizeObserver(() => {
  updatePosition();
});


// watch element position change
onMounted(() => {
  if (isSafari.value) return;

  const element = document.getElementById(id.value);

  if (element) {
    observer.observe(element);
  }

  setTimeout(() => {
    transition.value = true;
  }, 100);

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

  // watch all parents' scroll event
  let parent = document.getElementById(id.value)?.parentElement;

  while (parent) {
    parent.addEventListener('scroll', updatePosition);
    parent = parent.parentElement;
  }
});

watch(blurred.value, () => {
  updatePosition();
});

</script>

<template>
  <div :class="`micaBackground ${isSafari ? 'safari' : ''}`" :id="id">
    <img v-if="!isSafari" :class="`backgroundImage ${transition ? 'transition' : ''}`" :src="blurred.src" />
  </div>
</template>

<style lang="scss" scoped>
.micaBackground {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--mica-background-color);
  z-index: 0;

  &.safari {
    background-color: var(--mica-safari-background-color);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
  }

  .backgroundImage {
    position: absolute;
    top: v-bind(top);
    left: v-bind(left);
    opacity: 0.2;
    z-index: 0;

    &.transition {
      transition: all 0.1s;
    }
  }
}
</style>
