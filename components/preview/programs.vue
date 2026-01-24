<script lang="ts" setup>
import { programs } from '~/assets/programs';
</script>

<template>
  <NuxtLayout name="preview-card" :page-id="'programs'" page-title="好友" :icon-name="'friends'">
    <div class="content">
      <div class="programs-list">
        <WebsiteCard class="item" v-for="(program, index) in programs" :key="index" :icon-url="program.iconUrl"
          :auto-dark="program.autoDark" :name="program.name" :description="program.description" :host="program.host"
          :link-action-text="program.linkActionText" :link="program.link" :variant="'preview'" />
      </div>
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0 0.5rem 0;

  .programs-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0rem;

    .item {
      width: 100%;
    }
  }
}
</style>
