<script lang="ts" setup>
import { cardSize } from '#imports';
</script>

<template>
  <div class="footer">
    <div class="text">
      <p>&copy; 2021-2025 agou.im.</p>
      <p>
        <a
          class="filing-link"
          href="https://icp.gov.moe/?keyword=20225229"
          target="_blank"
          rel="noopener noreferrer"
        >萌ICP备20225229号</a>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  width: 100%;
  min-height: max(200px, calc((var(--app-viewport-height) - (v-bind(cardSize) * 0.75)) / 2));
  display: flex;
  justify-content: center;
  align-items: center;

  .text {
    font-size: 14px;
    color: var(--color-text-secondary);
    text-align: center;
    line-height: 24px;
  }

  .filing-link {
    color: inherit;
  }

}
</style>
