// Auto calculate the card root em

export const slideMode = ref(2);

export const cardSize = ref('100px');
export const cardRem = ref('1rem');

function getCardRem() {
  const { clientWidth, clientHeight } = document.documentElement;

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
  cardRem.value = `${cardWidth / 400}rem`;
}

getCardRem();

window.addEventListener('resize', getCardRem);
