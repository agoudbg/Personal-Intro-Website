import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateDarkIcons } from './build/generate-dark-icons';

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const darkIconsDirectory = resolve(rootDirectory, '.nuxt/dark-icons');
const siteUrl = 'https://agou.im';
const siteTitle = '关于 agou';
const searchTitle = '关于 agou | 阿狗的主页 | 阿狗个人网站 | agoudbg';
const siteDescription = 'agou（阿狗 / agoudbg）的个人网站，介绍、博客、项目网站与社交链接。';
const personStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  name: searchTitle,
  url: `${siteUrl}/`,
  mainEntity: {
    '@type': 'Person',
    name: 'agou',
    alternateName: ['阿狗', 'agoudbg'],
    url: `${siteUrl}/`,
    image: `${siteUrl}/avatar.png`,
    sameAs: [
      'https://github.com/agoudbg',
      'https://t.me/agoudbg',
      'https://twitter.com/agoudbg',
    ],
  },
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  app: {
    head: {
      title: siteTitle,
      meta: [
        { name: 'description', content: siteDescription },
        { name: 'author', content: 'agou' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:type', content: 'profile' },
        { property: 'og:url', content: `${siteUrl}/` },
        { property: 'og:title', content: searchTitle },
        { property: 'og:description', content: siteDescription },
        { property: 'og:site_name', content: 'agou.im' },
        { property: 'og:image', content: `${siteUrl}/avatar.png` },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: searchTitle },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: `${siteUrl}/avatar.png` },
      ],
      link: [
        { rel: 'canonical', href: `${siteUrl}/` },
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(personStructuredData),
        },
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
