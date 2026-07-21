export const isSafari = ref(false);
if (typeof window !== 'undefined') {
    isSafari.value = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    console.log(`isSafari: ${isSafari.value}`);
}
