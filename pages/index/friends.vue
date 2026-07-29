<template>
  <NuxtLayout name="detail" page-title="友链">
    <div class="content">
      <div class="friends-list">
        <WebsiteCard v-for="friend in friends" :key="friend.link" class="item" :icon-url="friend.iconUrl"
          :dark-icon-url="friend.darkIconUrl" :name="friend.name" :description="friend.description" :host="friend.host"
          :link-action-text="friend.linkActionText" :link="friend.link" />
      </div>
      <p class="exchange-note">
        若要交换友链，请发送邮件到 <a href="mailto:i@agou.im">i@agou.im</a>。
      </p>
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
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 16px;
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

  .exchange-note {
    padding: 0 10px;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.6;

    a {
      color: var(--color-accent);
    }
  }
}
</style>
