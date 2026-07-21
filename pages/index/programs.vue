<template>
  <NuxtLayout name="detail" page-title="网站">
    <div class="content">
      <div class="programs-list">
        <WebsiteCard v-for="program in programs" :key="program.link" class="item" :icon-url="program.iconUrl"
          :dark-icon-url="program.darkIconUrl" :name="program.name" :description="program.description" :host="program.host"
          :link-action-text="program.linkActionText" :link="program.link" />
      </div>
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { programs } from '~/assets/programs';
</script>

<style lang="scss" scoped>
.content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 10px 50px;

  .programs-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 10px;

    .item {
      width: 100%;
    }
  }
}
</style>
