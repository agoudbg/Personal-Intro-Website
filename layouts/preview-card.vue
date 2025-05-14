<script lang="ts" setup>
const props = defineProps({
  pageId: {
    type: String,
    required: true,
  },
  pageTitle: {
    type: String,
    required: true,
  },
  iconName: {
    type: String,
    required: true,
  },
});

const { pageId } = toRefs(props);

const link = computed(() => {
  return `/${pageId.value}`;
});

</script>

<template>
  <NuxtLink class="card" :to="link">
    <MicaBackground />
    <div class="card-content">
      <div class="title">
        <Icon :name="iconName" />
        <div class="title-text">
          <h2>{{ pageTitle }}</h2>
        </div>
      </div>
      <slot />
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
.card {
  width: v-bind(cardSize);
  height: v-bind(cardSize);
  font-size: v-bind(cardRem);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  border-radius: 10px;
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
    width: v-bind(cardSize);
    height: v-bind(cardSize);
    font-size: v-bind(cardRem);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 10px;
    text-align: center;

    .title {
      display: flex;
      align-items: center;
      margin-bottom: 10px;

      .title-text {
        margin-left: 10px;
        font-size: v-bind(cardRem);
      }
    }
  }
}
</style>
