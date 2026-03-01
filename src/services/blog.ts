import { type BlogPost } from '../types/discover';

const BLOG_API_URL = 'https://markmind.xyz/api/blog';
const CACHE_KEY = 'blogPostsCache';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface BlogCache {
  posts: BlogPost[];
  fetchedAt: number;
}

const getCachedBlogData = async (): Promise<BlogCache | null> => {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    return (result[CACHE_KEY] as BlogCache | undefined) ?? null;
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
  const cachedBlogData = await getCachedBlogData();

  const isFresh = cachedBlogData && Date.now() - cachedBlogData.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cachedBlogData.posts;

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

    if (cachedBlogData?.posts) return cachedBlogData.posts;

    return [];
  }
};
