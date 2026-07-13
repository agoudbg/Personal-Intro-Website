import { shallowRef } from 'vue';

export type Theme = 'light' | 'dark';

export const theme = shallowRef<Theme>('light');

if (import.meta.client) {
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const syncTheme = (matches: boolean) => {
    theme.value = matches ? 'dark' : 'light';
  };
  const handleColorSchemeChange = (event: MediaQueryListEvent) => {
    syncTheme(event.matches);
  };

  syncTheme(colorSchemeQuery.matches);
  colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
    });
  }
}
