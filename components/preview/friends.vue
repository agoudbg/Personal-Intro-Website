<script lang="ts" setup>
import { randomFriends } from '~/assets/friends';

const props = withDefaults(defineProps<{ loading?: boolean }>(), {
  loading: false,
});

// Select 4 random friends for preview
const friendsList = randomFriends.slice(0, 4);
</script>

<template>
  <NuxtLayout name="preview-card" :page-id="'friends'" page-title="友链" :icon-name="'friends'"
    :loading="props.loading">
    <div class="content">
      <div class="friends-list">
        <WebsiteCard v-for="friend in friendsList" :key="friend.link" class="item" :icon-url="friend.iconUrl"
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

  .friends-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0rem;

    .item {
      width: 100%;
      padding-block: 0.58em;
    }
  }
}
</style>
