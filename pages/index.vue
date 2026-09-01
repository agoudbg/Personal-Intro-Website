<script lang="ts" setup>

import { ScrollSlide } from 'scroll-slides';
import 'scroll-slides/dist/scroll-slides.css';

import Me from '~/components/preview/me.vue';
import {
  isNavigationFailure,
  NavigationFailureType,
  type RouteLocationNormalizedGeneric,
  type RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';
import {
  getCardShaderTransition,
  useCardShaderTransition,
  type CardShaderTransitionOverlayErrorEvent,
  type CardShaderTransitionOverlayEvent,
} from '~/composables/use-card-shader-transition';
import Friends from '~/components/preview/friends.vue';
import Blog from '~/components/preview/blog.vue';
import Programs from '~/components/preview/programs.vue';
import { DETAIL_CARD_BORDER_RADIUS_PX } from '~/utils/card-transition';

const siteDescription = 'agou（阿狗 / agoudbg）的个人网站，介绍、博客、项目网站与社交链接。';

useSeoMeta({
  title: 'agou | 阿狗的个人网站',
  description: siteDescription,
  ogType: 'profile',
  ogUrl: 'https://agou.im/',
  ogTitle: 'agou | 阿狗的个人网站',
  ogDescription: siteDescription,
  ogImage: 'https://agou.im/avatar.png',
  twitterCard: 'summary',
  twitterTitle: 'agou | 阿狗的个人网站',
  twitterDescription: siteDescription,
  twitterImage: 'https://agou.im/avatar.png',
});

const detailContainerStyle = {
  '--detail-card-border-radius': `${DETAIL_CARD_BORDER_RADIUS_PX}px`,
};

const { isRefreshing: isBlogArticlesRefreshing } = useBlogArticles();

// Calculate Spacer Header
const spacerHeaderScalePercent = ref(1);
const spacerHeaderTop = ref('0px');
const spacerHeaderScale = ref('1');
const showSpacerHeader = ref(false);
const showHeaderBackdrop = ref(false);

const animationCard = shallowRef<Component | undefined>(undefined);
const currentCardAnimationEndAt = ref(0);
const animationObserverTransform = ref('');
const isDetailAnimationPreparing = shallowRef(false);
type PreviewCardId = 'me' | 'programs' | 'blog' | 'friends';
const cardLoadingIndicatorId = shallowRef<PreviewCardId>();
let activeCardAnimationCleanup: (() => void) | undefined;
let cardAnimationSetupId = 0;
let animationCardOwnerSetupId: number | undefined;
let skippedCardAnimationPath: string | undefined;
let cardLoadingIndicatorTimerId: number | undefined;
let cardLoadingIndicatorRequestId = 0;

const detailAnimationTargetSelector = '[data-card-animation-content]';
const detailAnimationTargetTimeout = 10_000;
const cardLoadingIndicatorDelay = 500;
// Bound preparation time even while the delayed indicator provides feedback.
const cardDataReadyTimeout = 10_000;

const waitForAnimationFrame = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => resolve());
});

const stopCardLoadingIndicator = () => {
  cardLoadingIndicatorRequestId += 1;
  if (cardLoadingIndicatorTimerId !== undefined) window.clearTimeout(cardLoadingIndicatorTimerId);
  cardLoadingIndicatorTimerId = undefined;
  cardLoadingIndicatorId.value = undefined;
};

const startCardLoadingIndicator = (cardId: PreviewCardId) => {
  stopCardLoadingIndicator();
  const requestId = cardLoadingIndicatorRequestId;

  cardLoadingIndicatorTimerId = window.setTimeout(() => {
    cardLoadingIndicatorTimerId = undefined;
    if (requestId === cardLoadingIndicatorRequestId) cardLoadingIndicatorId.value = cardId;
  }, cardLoadingIndicatorDelay);
};

const getPreviewCardId = (routeName: RouteLocationNormalizedGeneric['name']): PreviewCardId | undefined => {
  switch (routeName) {
    case 'index-me':
      return 'me';
    case 'index-programs':
      return 'programs';
    case 'index-blog':
      return 'blog';
    case 'index-friends':
      return 'friends';
    default:
      return undefined;
  }
};

const waitForCardDataReady = async (
  cardName: RouteLocationNormalizedGeneric['name'],
  setupId: number,
): Promise<boolean> => {
  if (cardName !== 'index-blog') return true;

  const timeoutAt = performance.now() + cardDataReadyTimeout;
  while (isBlogArticlesRefreshing.value && setupId === cardAnimationSetupId && performance.now() < timeoutAt) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 50);
    });
  }

  return !isBlogArticlesRefreshing.value;
};

const waitForDetailAnimationTarget = async (
  detailContainer: HTMLElement,
  setupId: number,
): Promise<HTMLElement | null> => {
  const timeoutAt = performance.now() + detailAnimationTargetTimeout;

  while (setupId === cardAnimationSetupId && performance.now() < timeoutAt) {
    const target = detailContainer.querySelector<HTMLElement>(detailAnimationTargetSelector);
    if (target?.isConnected) return target;
    await waitForAnimationFrame();
  }

  return null;
};

const cleanupActiveCardAnimation = () => {
  const cleanup = activeCardAnimationCleanup;
  activeCardAnimationCleanup = undefined;
  cleanup?.();
};

const clearAnimationCard = () => {
  animationCard.value = undefined;
};

const resetAnimationArtifacts = () => {
  cardAnimationSetupId += 1;
  cleanupActiveCardAnimation();
  animationCardOwnerSetupId = undefined;
  clearAnimationCard();
  isDetailAnimationPreparing.value = false;
  stopCardLoadingIndicator();
  animationObserverTransform.value = 'translate(0px, 0px) scale(1)';
  currentCardAnimationEndAt.value = 0;
};

// rAF-based throttle helper to avoid scroll/resize thrash
const throttleRAF = <Args extends unknown[]>(fn: (...args: Args) => void) => {
  let scheduled = false;
  return (...args: Args) => {
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
  const spacerElement = document.querySelector('.slider-box .spacer');
  const spacerHeight = spacerElement?.scrollHeight || 1;
  const scrollPercentRaw = scrollTop / (spacerHeight - 10) * 2;
  const scrollPercent = Math.min(Math.max(scrollPercentRaw, 0), 1);

  showSpacerHeader.value = scrollPercent < 1;
  showHeaderBackdrop.value = (document.querySelector('.slide-item .card')?.getBoundingClientRect().top || 0) < 50;

  // Calculate the scale and offset based on the scroll percentage
  const maxScalePercent = Math.min(2.14, spacerHeight / 70, (spacerElement?.clientWidth || 1) / 200);
  const minScalePercent = 1;

  spacerHeaderScalePercent.value = maxScalePercent - (scrollPercent * (maxScalePercent - minScalePercent));

  // Drive the merged fixed header to reproduce the original in-flow
  // spacer-header: its top edge sits at the spacer midpoint and scrolls with
  // the container, scaled about its top-center origin. Derive it from the
  // first card's live position so constant layout offsets cancel exactly.
  const scale = spacerHeaderScalePercent.value;
  const cardTop = document.querySelector('.slide-item .card')?.getBoundingClientRect().top ?? 0;
  const cardMargin = Number.parseFloat(cardSize.value) / 20;
  spacerHeaderTop.value = `${cardTop - spacerHeight / 2 - cardMargin + 20 - 20 * scale}px`;
  spacerHeaderScale.value = `${scale}`;
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
    stopCardLoadingIndicator();
  });
});

// card animation

// on nuxt router change
const router = useRouter();
const {
  phase: shaderTransitionPhase,
  handleBeforeNavigation: handleShaderBeforeNavigation,
  handleAfterNavigation: handleShaderAfterNavigation,
  handleOverlayPrepared,
  handleOverlayError,
  cancel: cancelShaderTransition,
} = useCardShaderTransition();

const handleShaderTransitionPrepared = (event: CardShaderTransitionOverlayEvent) => {
  handleOverlayPrepared(event);

  if (event.direction === 'open' && shaderTransitionPhase.value === 'opening-running') {
    stopCardLoadingIndicator();
    isDetailAnimationPreparing.value = false;
  }
};

const handleShaderTransitionError = (event: CardShaderTransitionOverlayErrorEvent) => {
  handleOverlayError(event);
  console.warn('Shader card transition failed; falling back to the legacy transition.', {
    direction: event.direction,
    error: event.error,
  });
};

const removeBeforeGuard = router.beforeEach(async (to, from) => {
  console.log('#routers');

  const shaderTransition = getCardShaderTransition(to, from);
  if (shaderTransition) {
    resetAnimationArtifacts();
    if (shaderTransition.direction === 'open') {
      startCardLoadingIndicator(shaderTransition.pageId);
      const preparationId = cardAnimationSetupId;
      const isCardDataReady = await waitForCardDataReady(to.name, preparationId);
      if (preparationId !== cardAnimationSetupId) return;
      if (!isCardDataReady) {
        console.warn('Shader card transition skipped because its data is still refreshing.', {
          pageId: shaderTransition.pageId,
        });
        await routerChange('b', to, from);
        return;
      }
    }

    const result = await handleShaderBeforeNavigation(to, from);
    if (result.handled) {
      if (shaderTransition.direction === 'open') isDetailAnimationPreparing.value = true;
      return;
    }

    console.warn('Shader card transition preparation failed; using the legacy transition.', result.failure);
  } else if (shaderTransitionPhase.value !== 'idle') {
    cancelShaderTransition();
    resetAnimationArtifacts();
  }

  await routerChange('b', to, from);
});

const removeAfterGuard = router.afterEach(async (to, from, failure) => {
  if (failure) {
    // A newer navigation owns the shared animation state after cancelling this one.
    if (!isNavigationFailure(failure, NavigationFailureType.cancelled)) {
      cancelShaderTransition();
      resetAnimationArtifacts();
    }
    return;
  }

  const shaderTransition = getCardShaderTransition(to, from);
  if (shaderTransition) {
    const result = await handleShaderAfterNavigation(to, from);
    if (result.handled) return;

    cancelShaderTransition();
    console.warn('Shader card transition start failed; using the legacy transition.', result.failure);
  }

  await routerChange('a', to, from);
});

onBeforeUnmount(() => {
  removeBeforeGuard();
  removeAfterGuard();
  cancelShaderTransition();
});

const routerChange = async function (e: 'b' | 'a', to: RouteLocationNormalizedGeneric, from: RouteLocationNormalizedLoadedGeneric) {
  const setupId = ++cardAnimationSetupId;
  console.log('router change', to, from);

  if (e === 'b') skippedCardAnimationPath = undefined;
  if (e === 'a' && skippedCardAnimationPath === to.fullPath) {
    skippedCardAnimationPath = undefined;
    resetAnimationArtifacts();
    return;
  }

  if (e === 'b' && from.name === 'index' && to.name !== 'index') {
    const targetCardId = getPreviewCardId(to.name);
    if (targetCardId) startCardLoadingIndicator(targetCardId);
  }

  if (e === 'b' && (from.name === 'index' || to.name === 'index')) {
    const cardName = to.name === 'index' ? from.name : to.name;
    const isCardDataReady = await waitForCardDataReady(cardName, setupId);
    if (setupId !== cardAnimationSetupId) return;
    if (!isCardDataReady) {
      skippedCardAnimationPath = to.fullPath;
      console.warn('Skipping card animation because its data is still refreshing.', { cardName });
      resetAnimationArtifacts();
      return;
    }
  }

  if (from.name !== 'index' && to.name !== 'index') {
    resetAnimationArtifacts();
    return;
  }

  const remainingAnimationTime = currentCardAnimationEndAt.value - Date.now();
  if (remainingAnimationTime > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, remainingAnimationTime + 200);
    });
    if (setupId !== cardAnimationSetupId) return;
  }
  cleanupActiveCardAnimation();

  const isClose = to.name === 'index';

  if (isClose && e === 'b' && isDetailAnimationPreparing.value) {
    skippedCardAnimationPath = to.fullPath;
    return;
  }

  if (!isClose && e === 'b') {
    isDetailAnimationPreparing.value = true;
  }

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
  let nextAnimationCard: Component | undefined;
  switch (cardName) {
    case 'index-me':
      nextAnimationCard = Me;
      break;
    case 'index-friends':
      nextAnimationCard = Friends;
      break;
    case 'index-blog':
      nextAnimationCard = Blog;
      break;
    case 'index-programs':
      nextAnimationCard = Programs;
      break;
    default:
      nextAnimationCard = undefined;
  }

  const originalPreviewCard: HTMLElement | null = document.body.querySelector(`.slide-item .card[href*="${isClose ? from.path : to.path}"]`);
  const detailContainer: HTMLElement | null = document.body.querySelector('.detail-container');
  if (!nextAnimationCard || !originalPreviewCard || !detailContainer) {
    resetAnimationArtifacts();
    return;
  }

  const detailAnimationTarget = await waitForDetailAnimationTarget(detailContainer, setupId);
  if (setupId !== cardAnimationSetupId) return;
  if (!detailAnimationTarget) {
    resetAnimationArtifacts();
    return;
  }

  if (!originalPreviewCard.isConnected) {
    resetAnimationArtifacts();
    return;
  }
  const originalPreviewCardRect = originalPreviewCard.getBoundingClientRect();

  animationCardOwnerSetupId = setupId;
  animationCard.value = nextAnimationCard;

  // if has animation card, calculate from/to status for animation card, detail container and original preview card
  await nextTick(() => {
    if (setupId !== cardAnimationSetupId) {
      if (animationCardOwnerSetupId === setupId) {
        animationCardOwnerSetupId = undefined;
        clearAnimationCard();
      }
      return;
    }

    const mountedAnimationCard = animationCard.value;
    if (mountedAnimationCard) {
      const animationCardElement: HTMLElement | null = document.body.querySelector('.animation-card-container .card');
      console.log(animationCardElement, detailContainer, originalPreviewCard);

      if (!animationCardElement || !detailContainer || !originalPreviewCard) {
        resetAnimationArtifacts();
        return;
      }

      const detailContainerRect = detailContainer.getBoundingClientRect();
      const sourcePreviewCardRect = originalPreviewCardRect;
      const animationCardNaturalWidth = animationCardElement.querySelector<HTMLElement>('.card-content')?.offsetWidth
        ?? animationCardElement.offsetWidth;
      const isRectUsable = (rect: { width: number; height: number }) => Number.isFinite(rect.width) && Number.isFinite(rect.height) && rect.width > 0 && rect.height > 0;
      if (!isRectUsable(detailContainerRect) || !isRectUsable(sourcePreviewCardRect) || animationCardNaturalWidth <= 0) {
        resetAnimationArtifacts();
        return;
      }

      // get the original card's opacity
      const originalCardOpacity = getElementOpacity(originalPreviewCard);
      const originalPreviewCardBorderRadius = getComputedStyle(originalPreviewCard).borderRadius;
      const detailContainerBorderRadius = getComputedStyle(detailContainer).borderRadius;

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
        borderRadius: originalPreviewCardBorderRadius,
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
        borderRadius: detailContainerBorderRadius,
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
        borderRadius: originalPreviewCardBorderRadius,
      };

      const detailContainerMiddle = {
        opacity: 0,
      };

      const detailContainerMiddle2 = {
        opacity: 1,
      };

      // detail container to: the same as detail container
      const detailContainerTo = {
        position: 'fixed',
        top: px(detailContainerRect.top),
        left: px(detailContainerRect.left),
        width: px(detailContainerRect.width),
        height: px(detailContainerRect.height),
        transform: 'rotate3d(0, 1, 0, 0deg)',
        opacity: 1,
        borderRadius: detailContainerBorderRadius,
      };

      // scale detail content to keep the same size as original preview card
      const detailContainerContentScaleRaw = sourcePreviewCardRect.width / detailContainerRect.width;
      const detailContainerContentScale = Number.isFinite(detailContainerContentScaleRaw) ? detailContainerContentScaleRaw : 1;
      const detailContainerContentFrom = {
        transform: `scale(${detailContainerContentScale})`,
      };

      const detailContainerContentTo = {
        transform: 'scale(1)',
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

      .detail-container ${detailAnimationTargetSelector} {
        animation: detailContainerContent ${animationTime}ms ${animationTimingFunction} forwards;
        transform-origin: top center;
      }

      .slide-item .card[href*="${isClose ? from.path : to.path}"] {
        animation: originalPreviewCard ${animationTime}ms ${animationTimingFunction} forwards;
      }`;


      console.log(styleElement.innerHTML);

      currentCardAnimationEndAt.value = Date.now() + animationTime;
      document.head.appendChild(styleElement);
      stopCardLoadingIndicator();
      if (!isClose) isDetailAnimationPreparing.value = false;

      let animationObserverRafId: number | undefined;
      let hasCleanedUp = false;

      const cleanupAnimation = () => {
        if (hasCleanedUp) return;
        hasCleanedUp = true;

        if (animationObserverRafId !== undefined) cancelAnimationFrame(animationObserverRafId);
        window.clearTimeout(cleanupTimerId);
        if (styleElement.isConnected) styleElement.remove();

        if (activeCardAnimationCleanup === cleanupAnimation) activeCardAnimationCleanup = undefined;
        if (animationCardOwnerSetupId === setupId) {
          animationCardOwnerSetupId = undefined;
          clearAnimationCard();
          animationObserverTransform.value = 'translate(0px, 0px) scale(1)';
          currentCardAnimationEndAt.value = 0;
        }
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

      const cleanupTimerId = window.setTimeout(cleanupAnimation, animationTime + 5);
    }
  });

  if (setupId !== cardAnimationSetupId) return;

  // if is before router change, wait
  if (e === 'b') {
    await new Promise((resolve) => setTimeout(resolve, animationHalfTime + 10));
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
    <div
      :class="`index m-${slideMode} ${router.currentRoute.value.name !== 'index' && !isDetailAnimationPreparing ? 'hide' : ''}`">
      <div class="background-image" />
      <div :class="`index-header-box ${showSpacerHeader ? 'big' : 'show'} ${slideMode}`">
        <HeaderBlurBackground :class="`backdrop`" :show="showHeaderBackdrop && !showSpacerHeader" :opacity="1" />
        <IndexHeader class="index-header" />
      </div>
      <div class="slider-box">
        <ScrollSlide
          :class="`slide m-${slideMode} ${router.currentRoute.value.name !== 'index' && !isDetailAnimationPreparing ? 'hide' : ''}`"
          :direction="'vertical'" :item-count="slideMode === 2 ? 3 : slideMode === 1 ? 4 : 6"
          :scale-start-percent="0.8">
          <template #item-0>
            <div class="spacer" />
          </template>

          <template #item-1>
            <div v-if="slideMode === 0" class="slide-item">
              <PreviewMe :loading="cardLoadingIndicatorId === 'me'" />
            </div>
            <div v-else-if="slideMode === 1" class="slide-items">
              <div class="slide-item">
                <PreviewMe :loading="cardLoadingIndicatorId === 'me'" />
              </div>
              <div class="slide-item">
                <PreviewPrograms :loading="cardLoadingIndicatorId === 'programs'" />
              </div>
            </div>
            <div v-else class="slide-items">
              <div class="slide-item">
                <PreviewMe :loading="cardLoadingIndicatorId === 'me'" />
              </div>
              <div class="slide-item">
                <PreviewPrograms :loading="cardLoadingIndicatorId === 'programs'" />
              </div>
              <div class="slide-item">
                <PreviewBlog :loading="cardLoadingIndicatorId === 'blog'" />
              </div>
              <div class="slide-item">
                <PreviewFriends :loading="cardLoadingIndicatorId === 'friends'" />
              </div>
            </div>
          </template>

          <template #item-2>
            <div v-if="slideMode === 0" class="slide-item">
              <PreviewPrograms :loading="cardLoadingIndicatorId === 'programs'" />
            </div>
            <div v-else-if="slideMode === 1" class="slide-items">
              <div class="slide-item">
                <PreviewBlog :loading="cardLoadingIndicatorId === 'blog'" />
              </div>
              <div class="slide-item">
                <PreviewFriends :loading="cardLoadingIndicatorId === 'friends'" />
              </div>
            </div>
            <div v-else>
              <IndexFooter class="slide-footer" />
            </div>
          </template>

          <template #item-3>
            <div v-if="slideMode === 0" class="slide-item">
              <PreviewBlog :loading="cardLoadingIndicatorId === 'blog'" />
            </div>
            <div v-else>
              <IndexFooter class="slide-footer" />
            </div>
          </template>

          <template #item-4>
            <div class="slide-item">
              <PreviewFriends :loading="cardLoadingIndicatorId === 'friends'" />
            </div>
          </template>

          <template #item-5>
            <IndexFooter class="slide-footer" />
          </template>
        </ScrollSlide>
      </div>
    </div>
    <div class="animations-container">
      <div
        :style="detailContainerStyle"
        :class="`detail-container m-${slideMode} ${router.currentRoute.value.name !== 'index' ? '' : 'hide'} ${isDetailAnimationPreparing ? 'preparing' : ''}`">
        <NuxtPage class="detail-nuxt-page" />
      </div>
      <div :class="`animation-card-container ${isDetailAnimationPreparing ? 'preparing' : ''}`">
        <Component :is="animationCard" />
      </div>
    </div>
    <LazyCardTransitionOverlay
      ref="card-shader-transition-overlay"
      @prepared="handleShaderTransitionPrepared"
      @error="handleShaderTransitionError"
    />
  </div>
</template>

<style lang="scss" scoped>
.index {
  --background-transition-duration: 0.6s;

  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: var(--app-viewport-height);
  overflow: hidden;

  &.hide {
    --background-transition-duration: 1.5s;
  }

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100%;
    background-color: var(--color-background-canvas);
    background-image: var(--index-background-image);
    background-size: cover;
    background-position: center;
    transform-origin: center;
    filter: blur(0px);
    transition: border-radius var(--background-transition-duration) ease, transform var(--background-transition-duration) ease, filter var(--background-transition-duration) ease;
    will-change: transform, filter;
    z-index: -1;
  }

  &.hide .background-image {
    filter: blur(16px);
    transform: scale(1.1);
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
    transition: opacity 0.4s, visibility 0s;

    &.show {
      opacity: 1;
    }

    &.big {
      opacity: 1;

      .index-header {
        transform: translateY(v-bind(spacerHeaderTop)) scale(v-bind(spacerHeaderScale));
        transform-origin: top center;
      }
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

  &.hide .index-header-box {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.4s, visibility 0s 0.4s;
  }

  .slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100%;

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

    .slide-footer {
      transition: opacity 0.4s, visibility 0s, filter 0.4s;
    }

    &.hide {
      // transform: scale(calc(0.96));

      .slide-item,
      .slide-footer {
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
      height: max(200px, calc(var(--app-viewport-height) - (v-bind(cardSize) * 1) - 40px));
    }

    &.m-2 .spacer {
      height: max(200px, calc((var(--app-viewport-height) - (v-bind(cardSize) * 1.25)) / 2 - 20px));
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
  height: var(--app-viewport-height);
  z-index: 102;
  pointer-events: none;
  // transition: transform 0.08s;

  .detail-container {
    position: absolute;
    left: 50%;
    top: 52%;
    transform: translate(-50%, -50%);
    width: 100vw;
    height: 96%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0;
    z-index: 99;
    overflow: hidden;
    border-radius: var(--detail-card-border-radius) var(--detail-card-border-radius) 0 0;
    transition: all 0.4s;
    pointer-events: all;

    &.hide {
      display: none;
      top: 152%;
      pointer-events: none;
    }

    &.preparing {
      visibility: hidden;
      pointer-events: none;
    }

    &.m-2 {
      top: 50%;
      width: 700px;
      height: min(800px, calc(var(--app-viewport-height) - 100px));
      border-radius: var(--detail-card-border-radius);
    }

    .detail-nuxt-page {
      width: 100vw;
      height: 100%;
    }

    &.m-2 .detail-nuxt-page {
      width: 700px;
      height: 100%;
    }
  }

  .animation-card-container {
    &.preparing {
      visibility: hidden;
    }
  }
}

@media (hover: none) and (pointer: coarse) {
  .index .slide :deep(.slider-item .slider-slot) {
    transition: none;
  }
}
</style>
