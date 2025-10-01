<script setup lang="ts">
const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    opacity: {
        type: Number,
        default: 0.2,
    },
});
</script>

<template>
    <div :class="`header-blur-background ${props.show ? 'show' : ''}`">
        <MicaBackground class="background" :opacity="props.opacity" />
        <div class="aria aria0" />
        <div class="aria aria1" />
        <div class="aria aria2" />
    </div>
</template>

<style lang="scss" scoped>
.header-blur-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    z-index: -1;
    pointer-events: none;

    .background {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        mask: linear-gradient(to bottom, var(--header-liquid-background-color-0) 0%, var(--header-liquid-background-color-1) 100%);
        z-index: 1;
        transition: opacity 0.2s;
    }

    .aria0,
    .aria1,
    .aria2 {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        transition: opacity 0.8s;
    }

    .aria0 {
        height: 100%;
        backdrop-filter: blur(0.8px);
        -webkit-backdrop-filter: blur(0.8px);
        mask: linear-gradient(to bottom, #000000 0%, #000000 70%, #000000d2 90%, #00000000 100%);
    }

    .aria1 {
        height: 90%;
        backdrop-filter: blur(1.5px);
        -webkit-backdrop-filter: blur(1.5px);
        mask: linear-gradient(to bottom, #000000 0%, #00000083 80%, #00000000 100%);
    }

    .aria2 {
        height: 90%;
        backdrop-filter: blur(2.5px);
        -webkit-backdrop-filter: blur(2.5px);
        mask: linear-gradient(to bottom, #000000 50%, #0000009c 70%, #00000000 90%);
    }

    &:not(.show) {
        .background {
            opacity: 0;
        }

        .aria0,
        .aria1,
        .aria2 {
            opacity: 0;
        }
    }
}
</style>
