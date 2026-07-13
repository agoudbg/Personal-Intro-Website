import type { WebsiteCardProps } from "~/components/website-card.vue";

import calandIcon from '~/assets/icons/caland-favicon.png';
import cold04Icon from '~/assets/icons/cold04-avatar.png';
import hatsBlogIcon from '~/assets/icons/hats-blog.webp';
import revincxIcon from '~/assets/icons/revincx-avatar.jpg';
import shiinaIcon from '~/assets/icons/shiina-avatar.jpg';
import zhicccIcon from '~/assets/icons/zhiccc-favicon.ico';

const linkActionText = '访问';

export const friends: WebsiteCardProps[] = [
  {
    iconUrl: zhicccIcon,
    autoDark: false,
    name: "Air's home",
    description: '一个奇奇怪怪，啥都有的网站',
    host: 'zhiccc.net',
    linkActionText,
    link: 'https://zhiccc.net',
  },
  {
    iconUrl: revincxIcon,
    autoDark: false,
    name: 'Revincx',
    description: '可爱就是正义~',
    host: 'revincx.icu',
    linkActionText,
    link: 'https://blog.revincx.icu',
  },
  {
    iconUrl: shiinaIcon,
    autoDark: false,
    name: "SHIINA'S HOME",
    description: '这里是 Shiina 的小网站',
    host: 'shiinafan.top',
    linkActionText,
    link: 'https://shiinafan.top/',
  },
  {
    iconUrl: calandIcon,
    name: 'CALand',
    description: '一个基于 VitePress 的博客',
    host: 'land.cody.ee',
    linkActionText,
    link: 'https://land.cody.ee/',
  },
  {
    iconUrl: hatsBlogIcon,
    autoDark: false,
    name: "Hat's Blog 帽之岛",
    description: '欢迎来到帽之岛，这是一座充满了个人思考和创意想法的小岛。',
    host: 'www.hats-land.com',
    linkActionText,
    link: 'https://www.hats-land.com/',
  },
  {
    iconUrl: cold04Icon,
    autoDark: false,
    name: '酷丁的主页',
    description: '一个笨蛋的主页',
    host: 'cold04.com',
    linkActionText,
    link: 'https://cold04.com',
  },
  {
    iconUrl: '',
    name: '1212967',
    description: '一个屑个人博客',
    host: '1212967.xyz',
    linkActionText,
    link: 'https://1212967.xyz',
  },
];

// Random friends list
export const randomFriends = Array.from(friends).sort(() => Math.random() - 0.5);
