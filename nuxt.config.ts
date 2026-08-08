import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateDarkIcons } from './build/generate-dark-icons';

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const darkIconsDirectory = resolve(rootDirectory, '.nuxt/dark-icons');

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  app: {
    head: {
      script: [
        {
          src: 'https://a.nmteam.top/script.js',
          defer: true,
          'data-website-id': '3108a173-77d4-4fe9-97e2-13d5cadef798',
        },
      ],
    },
  },

  runtimeConfig: {
    blogFeedUrl: process.env.NUXT_BLOG_FEED_URL || (
      process.env.NODE_ENV === 'production'
        ? 'https://blog.agou.im/feed/'
        : 'https://bakablog-astro.pages.dev/feed/'
    ),
  },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
  ],
  alias: {
    '@dark-icons': darkIconsDirectory,
  },
  build: {
    transpile: [
      'scroll-slides',
    ],
  },
  hooks: {
    'build:before': () => generateDarkIcons(rootDirectory, darkIconsDirectory),
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
        'material-symbols:progress-activity',
      ],
    },
  },

  css: ['./assets/theme.scss', './assets/basis.scss'],

  ssr: false,
});
