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

const animationCard = shallowRef<Component | undefined>(undefined);
const currentCardAnimationEndAt = ref(0);
const animationObserverTransform = ref('');
let activeCardAnimationCleanup: (() => void) | undefined;

const cleanupActiveCardAnimation = () => {
  const cleanup = activeCardAnimationCleanup;
  activeCardAnimationCleanup = undefined;
  cleanup?.();
};

const resetAnimationArtifacts = () => {
  cleanupActiveCardAnimation();
  animationCard.value = undefined;
  animationObserverTransform.value = 'translate(0px, 0px) scale(1)';
  currentCardAnimationEndAt.value = 0;
};

// rAF-based throttle helper to avoid scroll/resize thrash
const throttleRAF = (fn: (...args: any[]) => void) => {
  let scheduled = false;
  return (...args: any[]) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      try { fn(...args); } finally { scheduled = false; }
    });
  };
};

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
    : `${(1 - scrollPercent) * Math.min(16, Number(cardSize.value.replace('px', '')) / 150)}px`;
};

onMounted(() => {
  // attach throttled scroll/resize handlers and ensure cleanup
  const slideEl = document.querySelector('.slider-box .slide') as HTMLElement | null;

  const slideScrollHandler = throttleRAF(() => { calculateSpacerHeader(); });
  const windowResizeHandler = throttleRAF(() => { calculateSpacerHeader(); });

  slideEl?.addEventListener('scroll', slideScrollHandler);
  window.addEventListener('resize', windowResizeHandler);

  calculateSpacerHeader();

  onUnmounted(() => {
    slideEl?.removeEventListener('scroll', slideScrollHandler);
    window.removeEventListener('resize', windowResizeHandler);
  });
});

// card animation

// on nuxt router change
const router = useRouter();

router.beforeEach(async (to, from) => {
  console.log('#routers');
  await routerChange('b', to, from);
});

router.afterEach(async (to, from) => {
  await routerChange('a', to, from);
});

const routerChange = async function (e: 'b' | 'a', to: RouteLocationNormalizedGeneric, from: RouteLocationNormalizedLoadedGeneric) {
  console.log('router change', to, from);

  if (from.name !== 'index' && to.name !== 'index') {
    resetAnimationArtifacts();
    return;
  }

  const remainingAnimationTime = currentCardAnimationEndAt.value - Date.now();
  if (remainingAnimationTime > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, remainingAnimationTime + 200);
    });
  }
  cleanupActiveCardAnimation();

  const isClose = to.name === 'index';

  console.log('rdata', Date.now() % 100000, e, isClose ? 'close' : 'open', to.name, from.name);

  if (
    !(!isClose && e === 'a')
    && !(isClose && e === 'b')
  ) return;

  const animationTime = isClose ? 1200 : 800;
  const animationHalfPercent = isClose ? 0.1 : 0.5;
  const animationOpacityHandoffPercent = 0.95;
  const animationHalfTime = animationTime * animationHalfPercent;
  const animationTimingFunction = isClose
    ? 'linear(0 0%, 0.0071 0.9284%, 0.0286 1.9894%, 0.1103 4.244%, 0.6276 13.7931%, 0.8453 18.9655%, 0.9266 21.7507%, 0.9867 24.6684%, 1.0261 27.7188%, 1.0398 29.443%, 1.0485 31.1671%, 1.0521 32.3607%, 1.0541 33.687%, 1.0543 35.2785%, 1.0527 36.87%, 1.0449 40.3183%, 1.0187 49.0716%, 1.0091 53.3156%, 1.0043 56.2334%, 1.0009 59.1512%, 0.9986 62.3342%, 0.9974 65.7825%, 0.9971 71.3528%, 0.9995 87.7984%, 1.0001 100%)'
    : 'cubic-bezier(0.77, 0, 0.175, 1)';

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
  if (!originalPreviewCard) {
    resetAnimationArtifacts();
    return;
  }
  const originalPreviewCardRect = originalPreviewCard.getBoundingClientRect();

  // if has animation card, calculate from/to status for animation card, detail container and original preview card
  await nextTick(() => {
    if (animationCard.value) {
      const animationCardElement: HTMLElement | null = document.body.querySelector('.animation-card-container .card');
      const detailContainer: HTMLElement | null = document.body.querySelector('.detail-container');
      console.log(animationCardElement, detailContainer, originalPreviewCard);

      if (!animationCardElement || !detailContainer || !originalPreviewCard) {
        resetAnimationArtifacts();
        return;
      }
      const detailContainerRect = detailContainer.getBoundingClientRect();
      const sourcePreviewCardRect = originalPreviewCardRect;
      const animationCardNaturalWidth = animationCardElement.offsetWidth;
      const isRectUsable = (rect: { width: number; height: number }) => Number.isFinite(rect.width) && Number.isFinite(rect.height) && rect.width > 0 && rect.height > 0;
      if (!isRectUsable(detailContainerRect) || !isRectUsable(sourcePreviewCardRect) || animationCardNaturalWidth <= 0) {
        resetAnimationArtifacts();
        return;
      }

      // get the original card's opacity
      const originalCardOpacity = getElementOpacity(originalPreviewCard);

      const px = (n: number) => `${n}px`;

      // animation card from: the same as original preview card
      const animationCardFrom = {
        position: 'fixed',
        top: px(sourcePreviewCardRect.top),
        left: px(sourcePreviewCardRect.left),
        width: px(sourcePreviewCardRect.width),
        height: px(sourcePreviewCardRect.height),
        backgroundColor: 'var(--preview-card-background-color)',
        opacity: originalCardOpacity,
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
      const animationCardContentSourceScale = sourcePreviewCardRect.width / animationCardNaturalWidth;
      const animationCardContentFrom = {
        transform: `scale(${animationCardContentSourceScale})`,
      };

      const animationCardContentScalePercentRaw = detailContainerRect.width / animationCardNaturalWidth;
      const animationCardContentScalePercent = Number.isFinite(animationCardContentScalePercentRaw) ? animationCardContentScalePercentRaw : 1;
      // Calculate transformY value
      const animationCardContentTransformYRaw = (detailContainerRect.height - sourcePreviewCardRect.height) / 4;
      const animationCardContentTransformY = Number.isFinite(animationCardContentTransformYRaw) ? animationCardContentTransformYRaw : 0;

      const animationCardContentTo = {
        transform: `scale(${animationCardContentScalePercent}) translateY(${px(animationCardContentTransformY)})`,
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
        top: px(sourcePreviewCardRect.top),
        left: px(sourcePreviewCardRect.left),
        width: px(sourcePreviewCardRect.width),
        height: px(sourcePreviewCardRect.height),
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
      const detailContainerContentScaleRaw = sourcePreviewCardRect.width / detailContainerRect.width;
      const detailContainerContentScale = Number.isFinite(detailContainerContentScaleRaw) ? detailContainerContentScaleRaw : 1;
      const detailContainerContentFrom = {
        transform: `scale(${detailContainerContentScale})`,
      };

      const detailContainerContentTo = {
        transform: `scale(1)`,
      };

      // sort animation from/to
      const animationCardAnimation = [
        [isClose ? 1 : 0, animationCardFrom],
        [isClose ? animationHalfPercent - 0.01 : animationHalfPercent + 0.01, animationCardMiddle2],
        [isClose ? animationHalfPercent + 0.01 : animationHalfPercent - 0.01, animationCardMiddle],
        // Keep the close clone opaque until it is ready to hand off to the faded list card.
        ...(isClose ? [[animationOpacityHandoffPercent, animationCardMiddle]] : []),
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
        [isClose ? animationHalfPercent - 0.01 : animationHalfPercent + 0.01, detailContainerMiddle2],
        [isClose ? animationHalfPercent + 0.01 : animationHalfPercent - 0.01, detailContainerMiddle],
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
        animation: animationCard ${animationTime}ms ${animationTimingFunction} forwards;
      }

      .animation-card-container .card .card-content {
        animation: animationCardContent ${animationTime}ms ${animationTimingFunction} forwards;
        transform-origin: top center;
      }

      .detail-container {
        animation: detailContainer ${animationTime}ms ${animationTimingFunction} forwards;
      }

      .detail-container .detail-nuxt-page .content {
        animation: detailContainerContent ${animationTime}ms ${animationTimingFunction} forwards;
      }

      .slide-item .card[href*="${isClose ? from.path : to.path}"] {
        animation: originalPreviewCard ${animationTime}ms ${animationTimingFunction} forwards;
      }`;


      console.log(styleElement.innerHTML);

      document.head.appendChild(styleElement);

      let animationObserverRafId: number | undefined;
      let cleanupTimerId: number | undefined;
      let hasCleanedUp = false;

      const cleanupAnimation = () => {
        if (hasCleanedUp) return;
        hasCleanedUp = true;

        if (animationObserverRafId !== undefined) cancelAnimationFrame(animationObserverRafId);
        if (cleanupTimerId !== undefined) window.clearTimeout(cleanupTimerId);
        if (styleElement.isConnected) styleElement.remove();

        if (activeCardAnimationCleanup === cleanupAnimation) activeCardAnimationCleanup = undefined;
        animationCard.value = undefined;
        animationObserverTransform.value = 'translate(0px, 0px) scale(1)';
        currentCardAnimationEndAt.value = 0;
      };

      activeCardAnimationCleanup = cleanupAnimation;

      // Track the source card while the index view restores its scale during close.
      if (isClose) {
        const updateAnimationObserverTransform = () => {
          if (currentCardAnimationEndAt.value <= Date.now()) return;

          const originalPreviewCardNew: HTMLElement | null = document.body.querySelector(`.slide-item .card[href*="${isClose ? from.path : to.path}"]`);
          if (!originalPreviewCardNew) {
            console.error('originalPreviewCardNew not found');
            animationObserverRafId = requestAnimationFrame(updateAnimationObserverTransform);
            return;
          }

          const originalPreviewCardRectNew = originalPreviewCardNew.getBoundingClientRect();
          const scalePercent = originalPreviewCardRectNew.width / sourcePreviewCardRect.width;

          if (Number.isFinite(scalePercent) && scalePercent > 0) {
            const diffLeft = originalPreviewCardRectNew.left - sourcePreviewCardRect.left * scalePercent;
            const diffTop = originalPreviewCardRectNew.top - sourcePreviewCardRect.top * scalePercent;
            animationObserverTransform.value = `translate(${diffLeft}px, ${diffTop}px) scale(${scalePercent})`;
          }

          animationObserverRafId = requestAnimationFrame(updateAnimationObserverTransform);
        };

        animationObserverRafId = requestAnimationFrame(updateAnimationObserverTransform);
      }

      cleanupTimerId = window.setTimeout(cleanupAnimation, animationTime + 5);
    }
  });

  // if is before router change, wait
  if (e === 'b') {
    await new Promise((resolve => setTimeout(resolve, animationHalfTime + 10)));
  }
};

// Utility function to get the element that has opacity applied to it
const getOpacityAppliedElement = (element: HTMLElement | null): HTMLElement | null => {
  let opacityAppliedElement: HTMLElement | null = element;
  while (opacityAppliedElement && opacityAppliedElement !== document.body) {
    if (opacityAppliedElement.classList.contains('slider-slot')) break;
    opacityAppliedElement = opacityAppliedElement.parentElement;
  }
  return opacityAppliedElement;
};

// Utility function to get the opacity value of an element
const getElementOpacity = (element: HTMLElement | null): number => {
  const opacityAppliedElement = getOpacityAppliedElement(element);
  return opacityAppliedElement ? Number(getComputedStyle(opacityAppliedElement).opacity) : 1;
};

</script>

<template>
  <div>
    <div :class="`index m-${slideMode} ${router.currentRoute.value.name !== 'index' ? 'hide' : ''}`">
      <div class="background-image" />
      <div :class="`index-header-box ${showSpacerHeader ? '' : 'show'} ${slideMode}`">
        <HeaderBlurBackground :class="`backdrop`" :show="showHeaderBackdrop" :opacity="1" />
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
  transition: border-radius 0.3s, transform 0.3s;

  &.m-0.hide,
  &.m-1.hide {
    border-radius: 14px;
    transform: scale(0.96);
  }

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--color-background-canvas);
    background-image: var(--index-background-image);
    background-size: cover;
    background-position: center;
    z-index: -1;
  }

  .index-header-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    padding: 8px 0;
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
      z-index: -1;
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
      transition: opacity 0.4s, visibility 0s;

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
      // transform: scale(calc(0.96));

      .slide-item {
        opacity: 0;
        visibility: hidden;
        filter: blur(12px);
        pointer-events: none;
        transition: opacity 0.4s, visibility 0s 0.4s, filter 0.4s;
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
  transform-origin: top left;
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
    border-radius: 20px 20px 0 0;
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
      border-radius: 20px;
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
