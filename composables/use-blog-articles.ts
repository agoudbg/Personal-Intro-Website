import type { BlogArticle } from '~/utils/blog-feed';
import { parseBlogFeed } from '~/utils/blog-feed';

const BLOG_ARTICLES_CACHE_KEY = 'blog-articles:v1';

type BlogArticlesStatus = 'idle' | 'loading' | 'success' | 'error';

interface BlogArticlesCache {
  version: 1;
  articles: BlogArticle[];
}

let activeRequest: Promise<void> | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isBlogArticle = (value: unknown): value is BlogArticle => {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.title === 'string'
    && value.title.length > 0
    && typeof value.description === 'string'
    && typeof value.link === 'string'
    && isHttpUrl(value.link)
    && (value.publishedAt === undefined || typeof value.publishedAt === 'string');
};

const readCache = (): BlogArticle[] => {
  if (!import.meta.client) return [];

  try {
    const rawCache = localStorage.getItem(BLOG_ARTICLES_CACHE_KEY);
    if (!rawCache) return [];

    const cache: unknown = JSON.parse(rawCache);
    if (!isRecord(cache) || cache.version !== 1 || !Array.isArray(cache.articles)) {
      localStorage.removeItem(BLOG_ARTICLES_CACHE_KEY);
      return [];
    }

    const articles = cache.articles.filter(isBlogArticle);
    if (articles.length !== cache.articles.length) {
      localStorage.removeItem(BLOG_ARTICLES_CACHE_KEY);
      return [];
    }

    return articles;
  } catch (error: unknown) {
    console.warn('Failed to read the blog articles cache.', { error });
    return [];
  }
};

const writeCache = (articles: BlogArticle[]): void => {
  if (!import.meta.client) return;

  try {
    const cache: BlogArticlesCache = {
      version: 1,
      articles,
    };
    localStorage.setItem(BLOG_ARTICLES_CACHE_KEY, JSON.stringify(cache));
  } catch (error: unknown) {
    console.warn('Failed to write the blog articles cache.', { error });
  }
};

export const useBlogArticles = () => {
  const articles = useState<BlogArticle[]>('blog-articles', () => []);
  const status = useState<BlogArticlesStatus>('blog-articles-status', () => 'idle');
  const errorMessage = useState<string>('blog-articles-error', () => '');
  const hasInitialized = useState<boolean>('blog-articles-initialized', () => false);

  const refresh = (): Promise<void> => {
    if (activeRequest) return activeRequest;

    activeRequest = (async () => {
      status.value = 'loading';
      errorMessage.value = '';

      try {
        const feed = await $fetch<string>('/api/blog-feed', {
          responseType: 'text',
        });
        const freshArticles = parseBlogFeed(feed);
        articles.value = freshArticles;
        writeCache(freshArticles);
        status.value = 'success';
      } catch (error: unknown) {
        const cachedArticles = articles.value.length > 0 ? articles.value : readCache();
        if (cachedArticles.length > 0) {
          articles.value = cachedArticles;
          status.value = 'success';
          console.warn('Failed to refresh blog articles; using cached data.', { error });
          return;
        }

        status.value = 'error';
        errorMessage.value = error instanceof Error ? error.message : 'Failed to load blog articles.';
      } finally {
        activeRequest = undefined;
      }
    })();

    return activeRequest;
  };

  if (import.meta.client && !hasInitialized.value) {
    articles.value = readCache();
    hasInitialized.value = true;
    void refresh();
  }

  const isLoading = computed(() => status.value === 'loading' && articles.value.length === 0);

  return {
    articles: readonly(articles),
    errorMessage: readonly(errorMessage),
    isLoading,
    refresh,
  };
};
