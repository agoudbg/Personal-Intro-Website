// Make background blurred and save as a new image 

import { createCanvas, loadImage } from 'canvas';

export const blurred = ref(new Image());

function updateBlurredImage() {
    // if (isSafari.value) return;

    const canvas = createCanvas(window.innerWidth, window.innerHeight);
    const ctx = canvas.getContext('2d');

    loadImage(backgroundImage.value).then((image) => {
        // apply blur
        (ctx as any).filter = 'blur(30px)';

        // draw image as background-size: cover
        const { width, height } = image;
        const aspectRatio = width / height;
        const { clientWidth, clientHeight } = document.documentElement;

        let newWidth = clientWidth;
        let newHeight = clientHeight;
        if (clientWidth / clientHeight > aspectRatio) {
            newHeight = clientWidth / aspectRatio;
        } else {
            newWidth = clientHeight * aspectRatio;
        }

        // image corners
        ctx.drawImage(image, 0, 0, width, height, (clientWidth - newWidth) / 2, (clientHeight - newHeight) / 2, newWidth, newHeight);
        ctx.drawImage(image, 0, 0, width, height, (clientWidth - newWidth) / 2, (clientHeight - newHeight) / 2, newWidth, newHeight);
        ctx.drawImage(image, 0, 0, width, height, (clientWidth - newWidth) / 2, (clientHeight - newHeight) / 2, newWidth, newHeight);
        ctx.drawImage(image, 0, 0, width, height, (clientWidth - newWidth) / 2, (clientHeight - newHeight) / 2, newWidth, newHeight);
        ctx.drawImage(image, 0, 0, width, height, (clientWidth - newWidth) / 2, (clientHeight - newHeight) / 2, newWidth, newHeight);

        // save blurred image
        blurred.value.src = canvas.toDataURL();
        console.log('Blurred image loaded');
    });
}

updateBlurredImage();

// Re-draw blurred image on resize
window.addEventListener('resize', () => {
    updateBlurredImage();
});

// Re-draw blurred image on theme change
watch(theme, () => {
    updateBlurredImage();
});
