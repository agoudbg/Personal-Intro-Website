<script lang="ts" setup>
import { aboutContent } from '~/assets/about';
</script>

<template>
  <NuxtLayout name="preview-card" :page-id="'me'" page-title="关于" :icon-name="'user'">
    <div class="intro-preview">
      <p>{{ aboutContent.greeting }}</p>
      <p>{{ aboutContent.introduction }}</p>
      <p>
        {{ aboutContent.channelLead }}
        <span class="channel-handle">{{ aboutContent.channelHandle }}</span>{{ aboutContent.channelTail }}
      </p>
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.intro-preview {
  max-height: 100%;
  padding: 0 0.5em 0.5em;
  overflow: hidden;
  font-size: 1.03em;
  line-height: 1.6;
  text-align: left;

  .channel-handle {
    color: #0080ff;
  }
}
</style>
