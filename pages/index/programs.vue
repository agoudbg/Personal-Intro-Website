<template>
  <NuxtLayout name="detail" page-title="项目">
    <div class="content">
      <div class="programs-list">
        <WebsiteCard class="item" v-for="(program, index) in programs" :key="index" :icon-url="program.iconUrl"
          :auto-dark="program.autoDark" :name="program.name" :description="program.description" :host="program.host"
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
