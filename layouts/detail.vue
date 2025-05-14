<script lang="ts" setup>
import { slideMode } from '#imports';

const props = defineProps({
  pageTitle: {
    type: String,
    required: true,
  },
});

const contentElementId = ref(Math.random().toString(36).substring(2, 15));

const showBackdrop = ref(false);

const updateBackdrop = () => {
  const content = document.getElementById(contentElementId.value);
  if (!content) return;
  const { scrollTop } = content;

  if (scrollTop > 0) {
    showBackdrop.value = true;
  } else {
    showBackdrop.value = false;
  }
};

onMounted(() => {
  const content = document.getElementById(contentElementId.value);
  if (content) {
    content.addEventListener('scroll', updateBackdrop);
  }
});

onBeforeUnmount(() => {
  const content = document.getElementById(contentElementId.value);
  if (content) {
    content.removeEventListener('scroll', updateBackdrop);
  }
});

</script>

<template>
  <div :class="`detail m-${slideMode}`">
    <MicaBackground />
    <div :class="`header`">
      <div :class="`backdrop ${showBackdrop ? 'show' : ''}`" />
      <div class="title">
        {{ pageTitle }}
      </div>
      <NuxtLink class="icon" :to="'/'">
        <Icon name="material-symbols:close-rounded" />
      </NuxtLink>
    </div>
    <div :id="contentElementId" class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;

  .header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    z-index: 99;

    .title {
      position: absolute;
      width: calc(100% - 100px);
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #000;
    }

    .icon {
      margin: 0 10px;
      font-size: 24px;
      color: #000;
      cursor: pointer;

      &:hover {
        color: #ccc;
      }
    }

    .backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      background: #ffffffe4;
      box-shadow: 0 2px 5px #00000016;
      transition: opacity 0.1s;
    }

    .backdrop.show {
      opacity: 1;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
  }

  .content {
    z-index: 98;
    width: 100%;
    height: 100%;
    overflow: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
