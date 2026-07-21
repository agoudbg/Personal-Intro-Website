import githubIcon from '~/assets/icons/github.png';
import telegramIcon from '~/assets/icons/telegram.png';
import twitterIcon from '~/assets/icons/twitter.png';

export interface ContactLink {
  iconUrl: string;
  label: string;
  link: string;
}

export const aboutContent = {
  greeting: 'Hi，我是 agou。',
  introduction: '因为觉得在这里写什么都害羞羞，所以都删掉了。',
  channelLead: '欢迎来订阅我的 Telegram 频道',
  channelHandle: '@bakadog',
  channelLink: 'https://t.me/bakadog',
  channelTail: '，听我说骚话。',
} as const;

export const contactLinks: ContactLink[] = [
  {
    iconUrl: githubIcon,
    label: 'GitHub @agoudbg',
    link: 'https://github.com/agoudbg',
  },
  {
    iconUrl: telegramIcon,
    label: 'Telegram @agoudbg',
    link: 'https://t.me/agoudbg',
  },
  {
    iconUrl: twitterIcon,
    label: 'Twitter @agoudbg',
    link: 'https://twitter.com/agoudbg',
  },
];
