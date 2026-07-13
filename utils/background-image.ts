import { computed } from 'vue';
import backgroundDarkImage from '~/assets/background_dark.png';
import backgroundLightImage from '~/assets/background_light.png';

export const backgroundImage = computed(() => {
    return theme.value === 'light'
        ? backgroundLightImage
        : backgroundDarkImage;
});
