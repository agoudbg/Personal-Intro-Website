export interface BlogArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt?: string;
}

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const readPlainText = (element: Element | null): string => {
  const value = element?.textContent?.trim() ?? '';
  if (!value) return '';

  const document = new DOMParser().parseFromString(value, 'text/html');
  return normalizeText(document.body.textContent ?? '');
};

const readHttpUrl = (value: string): string | undefined => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
};

const getArticleLink = (item: Element): string | undefined => {
  const linkElement = item.querySelector('link');
  const rawLink = linkElement?.getAttribute('href') || linkElement?.textContent || '';
  return readHttpUrl(rawLink.trim());
};

export const parseBlogFeed = (feed: string): BlogArticle[] => {
  const document = new DOMParser().parseFromString(feed, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('博客 Feed XML 解析失败。');
  }

  const items = Array.from(document.querySelectorAll('item, entry'));
  const articles = items.flatMap((item, index) => {
    const title = readPlainText(item.querySelector('title'));
    const link = getArticleLink(item);
    if (!title || !link) return [];

    const description = readPlainText(
      item.querySelector('description, summary, content'),
    );
    const guid = readPlainText(item.querySelector('guid, id'));
    const publishedAt = readPlainText(item.querySelector('pubDate, published, updated')) || undefined;

    return [{
      id: guid || link,
      title,
      description,
      link,
      publishedAt,
      originalIndex: index,
    }];
  });

  return articles
    .sort((left, right) => {
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : Number.NaN;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : Number.NaN;
      if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
        return left.originalIndex - right.originalIndex;
      }
      return rightTime - leftTime;
    })
    .map(({ originalIndex: _originalIndex, ...article }) => article);
};
