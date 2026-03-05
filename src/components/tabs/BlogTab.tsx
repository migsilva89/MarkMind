import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SpinnerIcon, ExternalLinkIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons/Icons';
import Button from '../Button/Button';
import BlogCard from './blog/BlogCard';
import { fetchBlogPosts } from '../../services/blog';
import { type BlogPost } from '../../types/discover';
import './BlogTab.css';

const MARKMIND_BLOG_URL = 'https://markmind.xyz/blog';
const ALL_FILTER = 'All';
const SCROLL_AMOUNT = 120;

const BlogTab = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTag, setActiveTag] = useState(ALL_FILTER);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const loadBlogPosts = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const posts = await fetchBlogPosts();
      setBlogPosts(posts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogPosts();
  }, [loadBlogPosts]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    blogPosts.forEach((post) => {
      const primaryTag = post.tags[0];
      if (primaryTag) categorySet.add(primaryTag);
    });
    return [ALL_FILTER, ...Array.from(categorySet).sort()];
  }, [blogPosts]);

  const filteredPosts = useMemo(() => {
    if (activeTag === ALL_FILTER) return blogPosts;
    return blogPosts.filter((post) => post.tags[0] === activeTag);
  }, [blogPosts, activeTag]);

  const updateScrollArrows = useCallback(() => {
    const container = filtersRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollArrows();
  }, [categories, updateScrollArrows]);

  const handleScrollLeft = useCallback(() => {
    filtersRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  }, []);

  const handleScrollRight = useCallback(() => {
    filtersRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  }, []);

  const handleTagSelect = useCallback((tag: string) => {
    setActiveTag(tag);
  }, []);

  const handleVisitBlog = useCallback(() => {
    chrome.tabs.create({ url: MARKMIND_BLOG_URL });
  }, []);

  if (isLoading) {
    return (
      <div className="blog-tab-loading">
        <SpinnerIcon width={18} height={18} />
        <p className="blog-tab-loading-text">Loading articles...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="blog-tab-empty">
        <p className="blog-tab-empty-text">Could not load articles right now.</p>
        <Button variant="ghost" onClick={loadBlogPosts}>
          Try again
        </Button>
      </div>
    );
  }

  if (blogPosts.length === 0) {
    return (
      <div className="blog-tab-empty">
        <p className="blog-tab-empty-text">No articles yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="blog-tab">
      <p className="blog-tab-description">
        Stories, tips, and deep dives into organizing your digital life.
      </p>

      {categories.length > 2 && (
        <div className="blog-tab-filters-row">
          {canScrollLeft && (
            <Button variant="icon" className="blog-tab-filters-arrow left" onClick={handleScrollLeft} title="Scroll left">
              <ChevronLeftIcon width={12} height={12} />
            </Button>
          )}
          <div className="blog-tab-filters" ref={filtersRef} onScroll={updateScrollArrows}>
            {categories.map((tag) => (
              <Button
                key={tag}
                variant="unstyled"
                className={`blog-tab-filter-pill${activeTag === tag ? ' active' : ''}`}
                onClick={() => handleTagSelect(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
          {canScrollRight && (
            <Button variant="icon" className="blog-tab-filters-arrow right" onClick={handleScrollRight} title="Scroll right">
              <ChevronRightIcon width={12} height={12} />
            </Button>
          )}
        </div>
      )}

      <div className="blog-tab-list">
        {filteredPosts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      <Button variant="ghost" onClick={handleVisitBlog} className="blog-tab-visit-button">
        Visit our blog
        <ExternalLinkIcon width={10} height={10} />
      </Button>
    </div>
  );
};

export default BlogTab;
