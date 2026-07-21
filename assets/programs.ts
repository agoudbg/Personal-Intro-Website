import type { WebsiteCardProps } from '~/components/website-card.vue';

import nmTeamDarkIcon from '@dark-icons/nmteam-logo-dark.png';
import anboIcon from '~/assets/icons/anbo-favicon.ico';
import nmTeamIcon from '~/assets/icons/nmteam-logo.png';

const linkActionText = '访问';

export const programs: WebsiteCardProps[] = [
  {
    iconUrl: anboIcon,
    name: '安播空间',
    description: '电视爱好者聚集地。',
    host: 'anbo.space',
    linkActionText,
    link: 'https://anbo.space',
  },
  {
    iconUrl: nmTeamIcon,
    darkIconUrl: nmTeamDarkIcon,
    name: 'nmTeam',
    description: '我再说一遍，nm 是柠檬，绝对没有别的意思！',
    host: 'nmteam.xyz',
    linkActionText,
    link: 'https://nmteam.xyz',
  },
];
