<script lang="ts" setup>
import { slideMode } from '#imports';

defineProps({
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
      <HeaderBlurBackground :class="`backdrop`" :show="showBackdrop" />
      <div class="title">
        {{ pageTitle }}
      </div>
      <div v-if="$slots['header-actions']" class="header-actions">
        <slot name="header-actions" />
      </div>
      <NuxtLink class="close-button" :to="'/'" aria-label="关闭">
        <Icon name="material-symbols:close-rounded" />
      </NuxtLink>
    </div>
    <div :id="contentElementId" class="content" data-card-animation-content>
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
    height: 60px;
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
      color: var(--color-text-primary);
      pointer-events: none;
    }

    .header-actions {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
      margin: 0 10px 0 12px;
      font-size: 24px;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: var(--color-text-tertiary);
      }
    }

    .backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }

  .content {
    z-index: 98;
    width: 100%;
    height: 100%;
    padding: 70px 0px 0px 0px;
    overflow: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
