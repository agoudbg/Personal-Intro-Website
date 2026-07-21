<script lang="ts" setup>
interface Props {
  pageId: string;
  pageTitle: string;
  iconName: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const link = computed(() => `/${props.pageId}`);
const previewCardDesignSize = `${PREVIEW_CARD_DESIGN_SIZE}px`;
const previewCardDesignOffset = `${PREVIEW_CARD_DESIGN_SIZE / -2}px`;

</script>

<template>
  <NuxtLink
    class="card"
    :to="link"
    :data-preview-card-id="pageId"
    :aria-busy="props.loading || undefined"
  >
    <MicaBackground />
    <div class="card-content">
      <div class="title">
        <Icon class="title-icon" :name="iconName" />
        <div class="title-text">
          <h2>{{ pageTitle }}</h2>
        </div>
      </div>
      <div class="slot">
        <slot />
      </div>
      <div v-if="props.loading" class="card-loading-indicator" role="status" aria-live="polite"
        aria-label="正在加载详情">
        <Icon class="card-loading-indicator-icon" name="material-symbols:progress-activity" aria-hidden="true" />
      </div>
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
.card {
  width: v-bind(cardSize);
  height: v-bind(cardSize);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  border-radius: 7.5%;
  box-shadow: var(--preview-card-box-shadow);
  transition: transform 0.3s ease;
  overflow: hidden;

  &:hover,
  &:focus-visible {
    transform: scale(1) translate(0, calc(-1 * v-bind(cardSize) / 80));
    cursor: pointer;
  }

  .card-content {
    position: absolute;
    top: 0;
    left: 50%;
    width: v-bind(previewCardDesignSize);
    height: v-bind(previewCardDesignSize);
    margin-left: v-bind(previewCardDesignOffset);
    font-size: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 10px;
    text-align: center;
    transform: scale(v-bind(cardScale));
    transform-origin: top center;

    .title {
      display: flex;
      align-items: center;
      margin: 10px;
      flex-grow: 0;

      .title-icon {
        font-size: 1.6em;
        flex-shrink: 0;
      }

      .title-text {
        margin-left: 10px;
      }
    }

    .slot {
      width: 100%;
      min-height: 0;
      flex: 1;
    }
  }

  .card-loading-indicator {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    color: var(--color-accent);
    background-color: var(--color-surface-active);
    border: 1px solid var(--color-border-subtle);
    border-radius: 50%;
    box-shadow: 0 4px 12px rgb(0 0 0 / 16%);
    pointer-events: none;

    .card-loading-indicator-icon {
      font-size: 20px;
      animation: card-loading-indicator-spin 0.9s linear infinite;
    }
  }
}

@keyframes card-loading-indicator-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card .card-loading-indicator-icon {
    animation: none;
  }
}
</style>
