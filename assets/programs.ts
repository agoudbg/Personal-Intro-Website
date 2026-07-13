import type { WebsiteCardProps } from "~/components/website-card.vue";

import anboIcon from '~/assets/icons/anbo-favicon.ico';
import nmTeamIcon from '~/assets/icons/nmteam-logo.png';

const linkActionText = '访问';

export const programs: WebsiteCardProps[] = [
  {
    iconUrl: nmTeamIcon,
    name: "nmTeam",
    description: 'nmTeam 凭借非凡创意，为世界创造无与伦比的 nm 产品。',
    host: 'nmteam.xyz',
    linkActionText,
    link: 'https://nmteam.xyz',
  },
  {
    iconUrl: anboIcon,
    autoDark: false,
    name: "安播空间",
    description: '电视爱好者聚集地。',
    host: 'anbo.space',
    linkActionText,
    link: 'https://anbo.space',
  },
];
