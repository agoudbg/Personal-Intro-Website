<script lang="ts" setup>

import { ScrollSlide } from 'scroll-slides';
import 'scroll-slides/dist/scroll-slides.css';

import Me from '~/components/preview/me.vue';
import type { RouteLocationNormalizedGeneric, RouteLocationNormalizedLoadedGeneric } from 'vue-router';
import Friends from '~/components/preview/friends.vue';
import Blog from '~/components/preview/blog.vue';
import Programs from '~/components/preview/programs.vue';

useHead({
  title: '关于 agou',
});

// Calculate Spacer Header
const spacerHeaderScalePercent = ref(1);
const spacerHeaderTopOffset = ref('0px');
const showSpacerHeader = ref(false);
const showHeaderBackdrop = ref(false);

const currentCardAnimationEndAt = ref(0);
const duringCardAnimation = computed(() => {
  return currentCardAnimationEndAt.value > Date.now();
});
const animationObserverTransform = ref('');

// Calculate via scroll slide scroll, make the header move to the same position of .header
const calculateSpacerHeader = () => {
  // Calculate the scroll percentage
  const scrollTop = document.querySelector('.slider-box .slide')?.scrollTop || 0;
  const scrollPercentRaw = scrollTop / ((document.querySelector('.slider-box .spacer')?.scrollHeight || 1) - 10) * 2;
  const scrollPercent = Math.min(Math.max(scrollPercentRaw, 0), 1);

  showSpacerHeader.value = scrollPercent < 1;
  showHeaderBackdrop.value = (document.querySelector('.slide-item .card')?.getBoundingClientRect().top || 0) < 50;

  // Calculate the scale and offset based on the scroll percentage
  const maxScalePercent = Math.min(2.14, (document.querySelector('.slider-box .spacer')?.scrollHeight || 1) / 70, (document.querySelector('.slider-box .spacer')?.clientWidth || 1) / 200);
  const minScalePercent = 1;

  spacerHeaderScalePercent.value = maxScalePercent - (scrollPercent * (maxScalePercent - minScalePercent));
  spacerHeaderTopOffset.value = scrollPercentRaw > 1 ?
    `-${(1 - scrollPercentRaw) * 50}px`
    : `${(1 - scrollPercent) * Math.min(10, Number(cardSize.value.replace('px', '')) / 150)}px`;
};

onMounted(() => {
  document.querySelector('.slider-box .slide')?.addEventListener('scroll', () => {
    calculateSpacerHeader();
  });

  window.addEventListener('resize', () => {
    calculateSpacerHeader();
  });

  calculateSpacerHeader();
});

// card animation

const animationCard = ref<Component | undefined>(undefined);

// on nuxt router change
const router = useRouter();

router.beforeEach(async (to, from) => {
  await routerChange('b', to, from);
});

router.afterEach(async (to, from) => {
  await routerChange('a', to, from);
});

const routerChange = async function (e: 'b' | 'a', to: RouteLocationNormalizedGeneric, from: RouteLocationNormalizedLoadedGeneric) {
  console.log('router change', to, from);

  if (from.name !== 'index' && to.name !== 'index') {
    animationCard.value = undefined;

    return;
  }

  // if already in animation
  if (duringCardAnimation.value) {
    // await the animation after the current one
    await new Promise((resolve) => {
      setTimeout(resolve, currentCardAnimationEndAt.value - Date.now());
    });
  }

  const isClose = to.name === 'index';

  console.log('rdata', Date.now() % 100000, e, isClose ? 'close' : 'open', to.name, from.name);

  if (
    !(!isClose && e === 'a')
    && !(isClose && e === 'b')
  ) return;

  const animationTime = isClose ? 1500 : 1500;

  const cardName = isClose ? from.name : to.name;
  switch (cardName) {
    case 'index-me':
      animationCard.value = Me;
      break;
    case 'index-friends':
      animationCard.value = Friends;
      break;
    case 'index-blog':
      animationCard.value = Blog;
      break;
    case 'index-programs':
      animationCard.value = Programs;
      break;
    default:
      animationCard.value = undefined;
  }

  const originalPreviewCard: HTMLElement | null = document.body.querySelector(`.slide-item .card[href*="${isClose ? from.path : to.path}"]`);
  if (!originalPreviewCard) return;
  const originalPreviewCardRect = originalPreviewCard.getBoundingClientRect();

  // if has animation card, calculate from/to status for animation card, detail container and original preview card
  await nextTick(() => {
    const fixOriginalPreviewCardRect = (originalPreviewCardRect: DOMRect) => {
      // get scale percent
      const indexElement = document.querySelector('.index');
      const transform = window.getComputedStyle(indexElement!).transform;
      const scaleRaw = transform.match(/scale\(([^)]+)\)/);
      const scalePercent = scaleRaw ? Number(scaleRaw[1]) : 1;
      if (isNaN(scalePercent)) {
        console.error('scalePercent is NaN');
        return originalPreviewCardRect;
      }

      if ([0, 1].includes(slideMode.value) && isClose) {
        const width = originalPreviewCardRect.width / 0.96;
        const height = originalPreviewCardRect.height / 0.96;

        const { innerWidth, innerHeight } = window;

        // calculate the scale factor by the item's distance to the center of the screen
        const scaleFactorX = (originalPreviewCardRect.left + originalPreviewCardRect.width / 2 - innerWidth / 2) / (innerWidth / 2);
        const scaleFactorY = (originalPreviewCardRect.top + originalPreviewCardRect.height / 2 - innerHeight / 2) / (innerHeight / 2);

        console.log('scaleFactorX', scaleFactorX, 'scaleFactorY', scaleFactorY);

        // calculate the offset top and left by the item's distance to the center of the screen
        const top = (originalPreviewCardRect.top - (innerHeight / 2)) / 0.96 + (innerHeight / 2);
        const left = (originalPreviewCardRect.left - (innerWidth / 2)) / 0.96 + (innerWidth / 2);

        // fix the offset top and left
        return {
          ...originalPreviewCardRect,
          width,
          height,
          top,
          left,
        };
      }

      return originalPreviewCardRect;
    };

    if (animationCard.value) {
      const animationCardElement: HTMLElement | null = document.body.querySelector('.animation-card-container .card');
      const detailContainer: HTMLElement | null = document.body.querySelector('.detail-container');
      console.log(animationCardElement, detailContainer, originalPreviewCard);

      if (!animationCardElement || !detailContainer || !originalPreviewCard) return;
      const detailContainerRect = detailContainer.getBoundingClientRect();
      const originalPreviewCardRectFixed = fixOriginalPreviewCardRect(originalPreviewCardRect);

      // if is slide mode 0/1 on closing, there is a 96% scale from the whole screen
      // 111

      const px = (n: number) => `${n}px`;

      // animation card from: the same as original preview card
      const animationCardFrom = {
        position: 'fixed',
        top: px(originalPreviewCardRectFixed.top),
        left: px(originalPreviewCardRectFixed.left),
        width: px(originalPreviewCardRectFixed.width),
        height: px(originalPreviewCardRectFixed.height),
        backgroundColor: 'var(--preview-card-background-color)',
        opacity: 1,
        // borderRadius: originalPreviewCard.style.borderRadius,
      };

      const animationCardMiddle = {
        opacity: 1,
      };

      const animationCardMiddle2 = {
        opacity: 0,
      };

      // animation card to: the same as detail container
      const animationCardTo = {
        position: 'fixed',
        top: px(detailContainerRect.top),
        left: px(detailContainerRect.left),
        width: px(detailContainerRect.width),
        height: px(detailContainerRect.height),
        transform: 'rotate3d(0, 1, 0, 180deg)',
        backgroundColor: 'var(--preview-card-background-color)',
        opacity: 0,
        // borderRadius: detailContainer.style.borderRadius,
      };

      // scale card content to keep the same size as detail container
      const animationCardContentFrom = {
        transform: `scale(1)`,
      };

      const animationCardContentTo = {
        transform: `scale(${detailContainerRect.width / originalPreviewCardRectFixed.width})`,
      };

      // original preview card from: opacity = 0
      const originalPreviewCardFrom = {
        opacity: 0,
        visibility: 'hidden',
      };

      // original preview card to
      const originalPreviewCardTo = {
        opacity: 0,
        visibility: 'hidden',
      };

      // detail container from: the same as original preview card
      const detailContainerFrom = {
        position: 'fixed',
        top: px(originalPreviewCardRectFixed.top),
        left: px(originalPreviewCardRectFixed.left),
        width: px(originalPreviewCardRectFixed.width),
        height: px(originalPreviewCardRectFixed.height),
        transform: 'rotate3d(0, 1, 0, 180deg)',
        opacity: 0,
      };

      const detailContainerMiddle = {
        opacity: 0,
      }

      const detailContainerMiddle2 = {
        opacity: 1,
      }

      // detail container to: the same as detail container
      const detailContainerTo = {
        position: 'fixed',
        top: px(detailContainerRect.top),
        left: px(detailContainerRect.left),
        width: px(detailContainerRect.width),
        height: px(detailContainerRect.height),
        transform: 'rotate3d(0, 1, 0, 0deg)',
        opacity: 1,
      };

      // scale detail content to keep the same size as original preview card
      const detailContainerContentFrom = {
        transform: `scale(${originalPreviewCardRectFixed.width / detailContainerRect.width})`,
      };

      const detailContainerContentTo = {
        transform: `scale(1)`,
      };

      // sort animation from/to
      const animationCardAnimation = [
        [isClose ? 1 : 0, animationCardFrom],
        [isClose ? 0.49 : 0.51, animationCardMiddle2],
        [isClose ? 0.51 : 0.49, animationCardMiddle],
        [isClose ? 0 : 1, animationCardTo],
      ];

      const animationCardContentAnimation = [
        [isClose ? 1 : 0, animationCardContentFrom],
        [isClose ? 0 : 1, animationCardContentTo],
      ];

      const originalPreviewCardAnimation = [
        [isClose ? 1 : 0, originalPreviewCardFrom],
        [isClose ? 0 : 1, originalPreviewCardTo],
      ];

      const detailContainerAnimation = [
        [isClose ? 1 : 0, detailContainerFrom],
        [isClose ? 0.49 : 0.51, detailContainerMiddle2],
        [isClose ? 0.51 : 0.49, detailContainerMiddle],
        [isClose ? 0 : 1, detailContainerTo],
      ];

      const detailContainerContentAnimation = [
        [isClose ? 1 : 0, detailContainerContentFrom],
        [isClose ? 0 : 1, detailContainerContentTo],
      ];

      // animation
      currentCardAnimationEndAt.value = Date.now() + animationTime;

      const styleElement = document.createElement('style');
      styleElement.innerHTML = `
      @keyframes animationCard {
        ${animationCardAnimation.map((item) => {
        return `${Number(item[0]) * 100}% { 
            ${Object.entries(item[1]).map(([key, value]) => {
          return `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`;
        }).join(' ')}
          }`;
      }).join('')}
      }

      @keyframes animationCardContent {
        ${animationCardContentAnimation.map((item) => {
        return `${Number(item[0]) * 100}% { 
            ${Object.entries(item[1]).map(([key, value]) => {
          return `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`;
        }).join(' ')}
          }`;
      }).join('')}
      }

      @keyframes originalPreviewCard {
        ${originalPreviewCardAnimation.map((item) => {
        return `${Number(item[0]) * 100}% { 
            ${Object.entries(item[1]).map(([key, value]) => {
          return `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`;
        }).join(' ')}
          }`;
      }).join('')}
      }

      @keyframes detailContainer {
        ${detailContainerAnimation.map((item) => {
        return `${Number(item[0]) * 100}% { 
            ${Object.entries(item[1]).map(([key, value]) => {
          return `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`;
        }).join(' ')}
          }`;
      }).join('')}
      }

      @keyframes detailContainerContent {
        ${detailContainerContentAnimation.map((item) => {
        return `${Number(item[0]) * 100}% { 
            ${Object.entries(item[1]).map(([key, value]) => {
          return `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`;
        }).join(' ')}
          }`;
      }).join('')}
      }

      .animation-card-container .card {
        animation: animationCard ${animationTime}ms ease-in-out forwards;
      }

      .animation-card-container .card .card-content {
        animation: animationCardContent ${animationTime}ms ease-in-out forwards;
      }

      .detail-container {
        animation: detailContainer ${animationTime}ms ease-in-out forwards;
      }

      .detail-container .detail-nuxt-page .content {
        animation: detailContainerContent ${animationTime}ms ease-in-out forwards;
      }

      .slide-item .card[href*="${isClose ? from.path : to.path}"] {
        animation: originalPreviewCard ${animationTime}ms ease-in-out forwards;
      }`;


      console.log(styleElement.innerHTML);

      document.head.appendChild(styleElement);

      // if slide scrolled/resized, use animationObserverTransform to move the animation card to the right place
      if (isClose) {
        let hasTriggeredObserver = false;

        const updateAnimationObserverTransform = (fromInterval = false) => {
          if (hasTriggeredObserver && !fromInterval) return;
          hasTriggeredObserver = true;

          // the element itself may change due to viewport change, so re-get
          const originalPreviewCardNew: HTMLElement | null = document.body.querySelector(`.slide-item .card[href*="${isClose ? from.path : to.path}"]`);
          if (!originalPreviewCardNew) {
            console.error('originalPreviewCardNew not found');
            return;
          }

          // re-get originalPreviewCardRect
          const originalPreviewCardRectNew = originalPreviewCardNew.getBoundingClientRect();

          // compare the originalPreviewCardRectNew and originalPreviewCardRect
          const diffTop = originalPreviewCardRectNew.top - originalPreviewCardRectFixed.top;
          const diffLeft = originalPreviewCardRectNew.left - originalPreviewCardRectFixed.left;

          const scalePercent = originalPreviewCardRectNew.width / originalPreviewCardRectFixed.width;

          animationObserverTransform.value = `translate(${diffLeft}px, ${diffTop}px) scale(${scalePercent})`;

          console.log('animationObserverTransform', animationObserverTransform.value);

          // if observer triggered, we have to run an interval to keep the animation card in the right place
          if (!fromInterval) {
            const inv = setInterval(() => {
              if (currentCardAnimationEndAt.value < Date.now()) {
                slide?.removeEventListener('scroll', () => { updateAnimationObserverTransform(); });
                window.removeEventListener('resize', () => { updateAnimationObserverTransform(); });

                animationObserverTransform.value = `translate(0px, 0px) scale(1)`;

                clearInterval(inv);

                return;
              }

              updateAnimationObserverTransform(true);

            }, 10);
          }
        };

        const slide = document.querySelector('.slider-box .slide');
        slide?.addEventListener('scroll', () => { updateAnimationObserverTransform(); });
        window.addEventListener('resize', () => { updateAnimationObserverTransform(); });

      }

      setTimeout(() => {
        animationCard.value = undefined;

        // remove style element
        document.head.removeChild(styleElement);
      }, animationTime + 5);
    }
  });

  // if is before router change, wait
  if (e === 'b') {
    await new Promise((resolve => setTimeout(resolve, animationTime / 2 + 10)));
  }
};

</script>

<template>
  <div :data-theme="theme">
    <div :class="`index m-${slideMode} ${router.currentRoute.value.name !== 'index' ? 'hide' : ''}`">
      <div class="background-image" :style="{ backgroundImage: `url(${backgroundImage})` }" />
      <div :class="`index-header-box ${showSpacerHeader ? '' : 'show'} ${slideMode}`">
        <div :class="`backdrop ${showHeaderBackdrop ? 'show' : ''}`" />
        <IndexHeader class="index-header" />
      </div>
      <div class="slider-box">
        <ScrollSlide :class="`slide m-${slideMode} ${router.currentRoute.value.name !== 'index' ? 'hide' : ''}`"
          :direction="'vertical'" :item-count="slideMode === 2 ? 3 : slideMode === 1 ? 4 : 6"
          :scale-start-percent="0.8">
          <template #item-0>
            <div :class="`spacer ${showSpacerHeader ? 'show' : ''}`">
              <IndexHeader class="spacer-header" />
            </div>
          </template>

          <template #item-1>
            <div v-if="slideMode === 0" class="slide-item">
              <PreviewMe />
            </div>
            <div v-else-if="slideMode === 1" class="slide-items">
              <div class="slide-item">
                <PreviewMe />
              </div>
              <div class="slide-item">
                <PreviewPrograms />
              </div>
            </div>
            <div v-else class="slide-items">
              <div class="slide-item">
                <PreviewMe />
              </div>
              <div class="slide-item">
                <PreviewPrograms />
              </div>
              <div class="slide-item">
                <PreviewBlog />
              </div>
              <div class="slide-item">
                <PreviewFriends />
              </div>
            </div>
          </template>

          <template #item-2>
            <div v-if="slideMode === 0" class="slide-item">
              <PreviewPrograms />
            </div>
            <div v-else-if="slideMode === 1" class="slide-items">
              <div class="slide-item">
                <PreviewBlog />
              </div>
              <div class="slide-item">
                <PreviewFriends />
              </div>
            </div>
            <div v-else>
              <IndexFooter />
            </div>
          </template>

          <template #item-3>
            <div v-if="slideMode === 0" class="slide-item">
              <PreviewBlog />
            </div>
            <div v-else>
              <IndexFooter />
            </div>
          </template>

          <template #item-4>
            <div class="slide-item">
              <PreviewFriends />
            </div>
          </template>

          <template #item-5>
            <IndexFooter />
          </template>
        </ScrollSlide>
      </div>
    </div>
    <div class="animations-container">
      <div :class="`detail-container m-${slideMode} ${router.currentRoute.value.name !== 'index' ? '' : 'hide'}`">
        <NuxtPage class="detail-nuxt-page" />
      </div>
      <div class="animation-card-container">
        <Component :is="animationCard" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.index {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  transition: border-radius 0.4s, transform 0.4s;

  &.m-0.hide,
  &.m-1.hide {
    border-radius: 7px;
    transform: scale(0.96);
  }

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--index-background-color);
    background-size: cover;
    background-position: center;
    z-index: -1;
  }

  .index-header-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    padding: 5px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    opacity: 0;

    &.show {
      opacity: 1;
    }

    .backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(10px) brightness(0.96);
      -webkit-backdrop-filter: blur(10px) brightness(0.96);
      opacity: 0;
      transition: opacity 0.3s;
      z-index: -1;

      &.show {
        opacity: 1;
      }
    }
  }

  .slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    &::-webkit-scrollbar {
      display: none;
    }

    .slide-item {
      width: v-bind(cardSize);
      height: v-bind(cardSize);
      margin: calc(v-bind(cardSize) / 20) auto;
      transition: opacity 0.2s, visibility 0s;

      &.hide {
        pointer-events: none;
      }
    }

    .slide-items {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;

      .slide-item {
        width: v-bind(cardSize);
        height: v-bind(cardSize);
        margin: 0 calc(v-bind(cardSize) / 20) calc(v-bind(cardSize) / 20);

        &+.slide-item {
          margin-left: 0;
        }
      }
    }

    &.hide {
      // transform: scale(calc(1 / 0.96));

      .slide-item {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0s 0.2s;
      }
    }

    .spacer {
      position: relative;
      width: 100%;
      height: max(200px, calc(100vh - (v-bind(cardSize) * 1) - 40px));
      opacity: 0;

      &.show {
        opacity: 1;
      }

      .spacer-header {
        position: relative;
        top: calc(50%);
        transform: scale(v-bind(spacerHeaderScalePercent));
      }
    }

    &.m-2 .spacer {
      height: max(200px, calc((100vh - (v-bind(cardSize) * 1.25)) / 2 - 20px));
    }
  }
}

.animations-container {
  position: absolute;
  top: 0;
  left: 0;
  transform: v-bind(animationObserverTransform);
  width: 100vw;
  height: 100vh;
  z-index: 102;
  pointer-events: none;
  // transition: transform 0.08s;

  .detail-container {
    position: absolute;
    left: 50%;
    top: calc(50% + 2vh);
    transform: translate(-50%, -50%);
    width: 100vw;
    height: calc(96vh);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0;
    z-index: 99;
    overflow: hidden;
    border-radius: 10px 10px 0 0;
    transition: all 0.4s;
    pointer-events: all;

    &.hide {
      display: none;
      top: calc(152vh);
      pointer-events: none;
    }

    &.m-2 {
      top: 50%;
      width: 700px;
      height: min(800px, calc(100vh - 100px));
      border-radius: 10px;
    }

    .detail-nuxt-page {
      width: 100vw;
      height: 96vh;
    }

    &.m-2 .detail-nuxt-page {
      width: 700px;
      height: min(800px, calc(100vh - 100px));
    }
  }

  .animation-card-container {
    // opacity: 0;
  }
}
</style>
