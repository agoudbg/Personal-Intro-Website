import type { WebsiteCardProps } from '~/components/website-card.vue';

import calandDarkIcon from '@dark-icons/caland-favicon-dark.png';
import calandIcon from '~/assets/icons/caland-favicon.png';
import cosixIcon from '~/assets/icons/cosix-avatar.jpg';
import cold04Icon from '~/assets/icons/cold04-avatar.png';
import gelithIcon from '~/assets/icons/gelith-logo.jpg';
import hatsBlogIcon from '~/assets/icons/hats-blog.webp';
import oneTwoOneIcon from '~/assets/icons/1212967-avatar.jpg';
import revincxIcon from '~/assets/icons/revincx-avatar.jpg';
import shiinaIcon from '~/assets/icons/shiina-avatar.jpg';
import zhicccIcon from '~/assets/icons/zhiccc-favicon.ico';

const linkActionText = '访问';

export const friends: WebsiteCardProps[] = [
  {
    iconUrl: zhicccIcon,
    name: "Air's home",
    description: '一个奇奇怪怪，啥都有的网站',
    host: 'zhiccc.net',
    linkActionText,
    link: 'https://zhiccc.net',
  },
  {
    iconUrl: revincxIcon,
    name: 'Revincx',
    description: '可爱就是正义~',
    host: 'revincx.icu',
    linkActionText,
    link: 'https://blog.revincx.icu',
  },
  {
    iconUrl: shiinaIcon,
    name: "SHIINA'S HOME",
    description: '这里是 Shiina 的小网站',
    host: 'shiinafan.top',
    linkActionText,
    link: 'https://shiinafan.top/',
  },
  {
    iconUrl: calandIcon,
    darkIconUrl: calandDarkIcon,
    name: 'CALand',
    description: '一个基于 VitePress 的博客',
    host: 'land.cody.ee',
    linkActionText,
    link: 'https://land.cody.ee/',
  },
  {
    iconUrl: hatsBlogIcon,
    name: "Hat's Blog 帽之岛",
    description: '欢迎来到帽之岛，这是一座充满了个人思考和创意想法的小岛。',
    host: 'www.hats-land.com',
    linkActionText,
    link: 'https://www.hats-land.com/',
  },
  {
    iconUrl: cold04Icon,
    name: '酷丁的主页',
    description: '一个笨蛋的主页',
    host: 'cold04.com',
    linkActionText,
    link: 'https://cold04.com',
  },
  {
    iconUrl: oneTwoOneIcon,
    name: '1212967',
    description: '一个屑个人博客',
    host: '1212967.xyz',
    linkActionText,
    link: 'https://1212967.xyz',
  },
  {
    iconUrl: gelithIcon,
    name: 'gelith的个人主页',
    description: '一个热爱计算机的青年',
    host: 'www.gelith.top',
    linkActionText,
    link: 'https://www.gelith.top',
  },
  {
    iconUrl: cosixIcon,
    name: '东方众的不知名小站',
    description: '呐呐呐，你也喜欢二次元？',
    host: 'cosix.xyz',
    linkActionText,
    link: 'https://cosix.xyz',
  },
];

// Random friends list
export const randomFriends = Array.from(friends).sort(() => Math.random() - 0.5);
