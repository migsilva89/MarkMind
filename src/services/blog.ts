import { type BlogPost } from '../types/discover';

const CONTENTFUL_SPACE_ID = 'tgx6mb7o35jr';
const CONTENTFUL_ACCESS_TOKEN = '8JT2A7uy2EjuM8E6gCjYLOZrsPLyhNq1wkP0vJxKqAk';
const CONTENTFUL_CDN_URL = `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE_ID}/entries`;
const CONTENT_TYPE = 'blogPost';

const CACHE_KEY = 'blogPostsCache';
const CACHE_TTL_MS = 60 * 60 * 1000;

const BLOG_BASE_URL = 'https://markmind.xyz/blog';

interface BlogCache {
  posts: BlogPost[];
  fetchedAt: number;
}

interface ContentfulAsset {
  sys: { id: string };
  fields: { file: { url: string } };
}

interface ContentfulEntry {
  fields: {
    title: string;
    slug: string;
    excerpt: string;
    tags: string[];
    datePublished: string;
    readingTime: string;
    author: string;
    image?: { sys: { id: string } };
  };
}

interface ContentfulResponse {
  items: ContentfulEntry[];
  includes?: { Asset?: ContentfulAsset[] };
}

const resolveImageUrl = (
  imageLink: { sys: { id: string } } | undefined,
  assets: ContentfulAsset[]
): string => {
  if (!imageLink) return '';
  const asset = assets.find((assetItem) => assetItem.sys.id === imageLink.sys.id);
  const url = asset?.fields?.file?.url;
  if (!url) return '';
  return url.startsWith('//') ? `https:${url}` : url;
};

const mapEntryToBlogPost = (entry: ContentfulEntry, assets: ContentfulAsset[]): BlogPost => ({
  title: entry.fields.title,
  slug: entry.fields.slug,
  url: `${BLOG_BASE_URL}/${entry.fields.slug}`,
  excerpt: entry.fields.excerpt,
  image: resolveImageUrl(entry.fields.image, assets),
  tags: entry.fields.tags ?? [],
  datePublished: entry.fields.datePublished,
  readingTime: entry.fields.readingTime,
  author: entry.fields.author,
});

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
    const params = new URLSearchParams({
      access_token: CONTENTFUL_ACCESS_TOKEN,
      content_type: CONTENT_TYPE,
      order: '-fields.datePublished',
      limit: '100',
      include: '1',
    });

    const response = await fetch(`${CONTENTFUL_CDN_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Contentful API returned ${response.status}`);
    }

    const data: ContentfulResponse = await response.json();
    const assets = data.includes?.Asset ?? [];
    const posts = data.items.map((entry) => mapEntryToBlogPost(entry, assets));

    await setCachedPosts(posts);

    return posts;
  } catch (error) {
    console.error('Failed to fetch blog posts from Contentful:', error);

    if (cachedBlogData?.posts) return cachedBlogData.posts;

    return [];
  }
};
