<script lang="ts" setup>

</script>

<template>
  <div class="header">
    <div class="icon" />
    <div class="name">agou</div>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: center;
  align-items: center;

  .icon {
    width: 40px;
    height: 40px;
    background-color: var(--index-header-icon-background-color);
    border-radius: 50%;
    margin-right: 10px;
  }

  .name {
    font-size: 24px;
    font-weight: bold;
    color: var(--index-header-text-color);
  }
}
</style>
