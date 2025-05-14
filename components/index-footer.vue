<script lang="ts" setup>
import { cardSize } from '#imports';
</script>

<template>
  <div class="footer">
    <div class="text">
      <p>&copy; 2021-2025 agou.im.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  width: 100%;
  min-height: max(200px, calc((100vh - (v-bind(cardSize) * 0.75)) / 2));
  display: flex;
  justify-content: center;
  align-items: center;

  .text {
    font-size: 14px;
    color: #333; // todo
    text-align: center;
    line-height: 50px;
  }

}
</style>
