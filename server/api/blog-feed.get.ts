const MAX_FEED_SIZE_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 20_000;

const getFeedUrl = (value: unknown): URL => {
  if (typeof value !== 'string') {
    throw new Error('Blog feed URL is not configured.');
  }

  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error('Blog feed URL must use HTTPS.');
  }

  return url;
};

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    const feedUrl = getFeedUrl(config.blogFeedUrl);
    const response = await $fetch.raw<string>(feedUrl.toString(), {
      responseType: 'text',
      retry: 1,
      timeout: REQUEST_TIMEOUT_MS,
    });
    const feed = response._data;

    if (typeof feed !== 'string' || !/<(?:rss|feed)\b/i.test(feed)) {
      throw new Error('Upstream response is not a valid RSS or Atom feed.');
    }

    const feedSize = new TextEncoder().encode(feed).byteLength;
    if (feedSize > MAX_FEED_SIZE_BYTES) {
      throw new Error(`Blog feed exceeds the ${MAX_FEED_SIZE_BYTES}-byte limit.`);
    }

    setResponseHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8');
    setResponseHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return feed;
  } catch (error: unknown) {
    console.error('Failed to proxy the blog feed.', { error });
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to load the blog feed.',
    });
  }
});
