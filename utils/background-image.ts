import backgroundLightImage from './assets/background_light.png';
import backgroundDarkImage from './assets/background_dark.png';

// If is light mode, set background image to light mode, otherwise dark mode

export const backgroundImage = computed(() => {
    return theme.value === 'light'
        ? backgroundLightImage
        : backgroundDarkImage;
});
