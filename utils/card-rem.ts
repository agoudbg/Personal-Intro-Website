// Keep preview content on one design canvas and scale the canvas with the card.

export const PREVIEW_CARD_DESIGN_SIZE = 400;

export const slideMode = shallowRef(2);

export const cardSize = shallowRef('100px');
export const cardScale = shallowRef(100 / PREVIEW_CARD_DESIGN_SIZE);

function updateCardMetrics() {
  const { clientWidth } = document.documentElement;

  let cardWidth = clientWidth - 40;

  if (clientWidth > 1100) {
    slideMode.value = 2;
    cardWidth = (clientWidth / 4) / (1 + (1 / 20) * 3);
    if (cardWidth > 350) cardWidth = 350;
  } else if (clientWidth > 600) {
    slideMode.value = 1;
    cardWidth = (clientWidth / 2) / (1 + (1 / 20) * 3);
    if (cardWidth > 350) cardWidth = 350;
  } else {
    slideMode.value = 0;
    cardWidth = clientWidth / (1 + (1 / 20) * 2);
    if (cardWidth > 350) cardWidth = 350;
  }

  cardSize.value = `${cardWidth}px`;
  cardScale.value = cardWidth / PREVIEW_CARD_DESIGN_SIZE;
}

updateCardMetrics();

window.addEventListener('resize', updateCardMetrics);
