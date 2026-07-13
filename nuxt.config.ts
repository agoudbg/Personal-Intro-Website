// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts'
  ],
  build: {
    transpile: [
      'scroll-slides',
      'dark-icon-generator/browser',
    ],
  },

  icon: {
    // All used icons are in the client bundle, so no server collection is needed.
    serverBundle: false,
    provider: 'server',
    fallbackToApi: false,
    aliases: {
      blog: 'material-symbols:article-rounded',
      friends: 'material-symbols:group-rounded',
      user: 'material-symbols:person-rounded',
    },
    clientBundle: {
      icons: [
        'material-symbols:arrow-outward-rounded',
        'material-symbols:article-rounded',
        'material-symbols:close-rounded',
        'material-symbols:globe',
        'material-symbols:group-rounded',
        'material-symbols:person-rounded',
      ],
    },
  },

  css: ['./assets/theme.scss', './assets/basis.scss'],

  ssr: false,
});
