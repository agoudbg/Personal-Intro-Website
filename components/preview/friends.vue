<script lang="ts" setup>
import { randomFriends } from '~/assets/friends';

// Select 4 random friends for preview
const friendsList = randomFriends.slice(0, 4);
</script>

<template>
  <NuxtLayout name="preview-card" :page-id="'friends'" page-title="项目" :icon-name="'user'">
    <div class="content">
      <div class="friends-list">
        <WebsiteCard class="item" v-for="(friend, index) in friendsList" :key="index" :icon-url="friend.iconUrl"
          :auto-dark="friend.autoDark" :name="friend.name" :description="friend.description" :host="friend.host"
          :link-action-text="friend.linkActionText" :link="friend.link" :variant="'preview'" />
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

  .friends-list {
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
