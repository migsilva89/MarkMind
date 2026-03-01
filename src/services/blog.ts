import { type BlogPost } from '../types/discover';

const BLOG_API_URL = 'https://markmind.xyz/api/blog';
const CACHE_KEY = 'blogPostsCache';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface BlogCache {
  posts: BlogPost[];
  fetchedAt: number;
}

const getCachedPosts = async (): Promise<BlogPost[] | null> => {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cache = result[CACHE_KEY] as BlogCache | undefined;

    if (!cache) return null;

    const isExpired = Date.now() - cache.fetchedAt > CACHE_TTL_MS;
    if (isExpired) return null;

    return cache.posts;
  } catch (error) {
    console.error('Failed to read blog cache:', error);
    return null;
  }
};

const setCachedPosts = async (posts: BlogPost[]): Promise<void> => {
  try {
    const cache: BlogCache = { posts, fetchedAt: Date.now() };
    await chrome.storage.local.set({ [CACHE_KEY]: cache });
  } catch (error) {
    console.error('Failed to write blog cache:', error);
  }
};

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  const cached = await getCachedPosts();
  if (cached) return cached;

  try {
    const response = await fetch(BLOG_API_URL);

    if (!response.ok) {
      throw new Error(`Blog API returned ${response.status}`);
    }

    const data = await response.json();
    const posts: BlogPost[] = data.posts ?? [];

    await setCachedPosts(posts);

    return posts;
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);

    // Fall back to expired cache if available
    try {
      const result = await chrome.storage.local.get(CACHE_KEY);
      const staleCache = result[CACHE_KEY] as BlogCache | undefined;
      if (staleCache?.posts) return staleCache.posts;
    } catch (cacheError) {
      console.error('Failed to read stale blog cache:', cacheError);
    }

    return [];
  }
};
