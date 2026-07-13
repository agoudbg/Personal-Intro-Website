import { createCanvas, loadImage } from 'canvas';
import { shallowRef, watch } from 'vue';

export const blurred = shallowRef(new Image());
export const blurredUpdateDate = shallowRef(0);

let renderSequence = 0;

async function updateBlurredImage() {
  const currentRender = ++renderSequence;

  try {
    const canvas = createCanvas(window.innerWidth, window.innerHeight);
    const context = canvas.getContext('2d');
    const image = await loadImage(backgroundImage.value);

    if (currentRender !== renderSequence) return;

    // node-canvas supports the filter property even though its public type omits it.
    (context as unknown as { filter: string }).filter = 'blur(30px)';

    // Draw the source with the same cover geometry as the page background.
    const { width, height } = image;
    const aspectRatio = width / height;
    const { clientWidth, clientHeight } = document.documentElement;

    let renderedWidth = clientWidth;
    let renderedHeight = clientHeight;
    if (clientWidth / clientHeight > aspectRatio) {
      renderedHeight = clientWidth / aspectRatio;
    } else {
      renderedWidth = clientHeight * aspectRatio;
    }

    const offsetX = (clientWidth - renderedWidth) / 2;
    const offsetY = (clientHeight - renderedHeight) / 2;

    // Repeated draws strengthen the blur while keeping the existing material effect.
    for (let pass = 0; pass < 5; pass += 1) {
      context.drawImage(
        image,
        0,
        0,
        width,
        height,
        offsetX,
        offsetY,
        renderedWidth,
        renderedHeight,
      );
    }

    blurred.value.src = canvas.toDataURL();
    blurredUpdateDate.value = Date.now();
  } catch (error: unknown) {
    console.error('Failed to render the blurred theme background.', {
      backgroundImage: backgroundImage.value,
      error,
    });
  }
}

void updateBlurredImage();

window.addEventListener('resize', updateBlurredImage);

watch(theme, () => {
  void updateBlurredImage();
});
