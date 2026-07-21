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
    background-color: var(--color-surface-avatar);
    background-image: url('/avatar.png');
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: 50%;
    margin-right: 10px;
  }

  .name {
    font-size: 24px;
    font-weight: bold;
    color: var(--color-text-primary);
  }
}
</style>
