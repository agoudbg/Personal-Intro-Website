import type { WebsiteCardProps } from "~/components/website-card.vue";

const linkActionText = '访问';

export const programs: WebsiteCardProps[] = [
  {
    iconUrl: 'https://websiteres.nmteam.xyz/producticon/nmTeam/logo@64.png',
    name: "nmTeam",
    description: 'nmTeam 凭借非凡创意，为世界创造无与伦比的 nm 产品。',
    host: 'nmteam.xyz',
    linkActionText,
    link: 'https://nmteam.xyz',
  },
  {
    iconUrl: 'https://anbo.space/favicon.ico',
    autoDark: false,
    name: "安播空间",
    description: '电视爱好者聚集地。',
    host: 'anbo.space',
    linkActionText,
    link: 'https://anbo.space',
  },
];
