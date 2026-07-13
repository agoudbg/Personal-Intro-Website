<template>
  <NuxtLayout name="detail" page-title="友链">
    <div class="content">
      <div class="friends-list">
        <WebsiteCard v-for="friend in friends" :key="friend.link" class="item" :icon-url="friend.iconUrl"
          :auto-dark="friend.autoDark" :name="friend.name" :description="friend.description" :host="friend.host"
          :link-action-text="friend.linkActionText" :link="friend.link" />
      </div>
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { friends } from '~/assets/friends';

</script>

<style lang="scss" scoped>
.content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 10px 50px;

  .friends-list {
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
