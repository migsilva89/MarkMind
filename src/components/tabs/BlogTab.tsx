import { useState, useEffect, useCallback } from 'react';
import { SpinnerIcon, ExternalLinkIcon } from '../icons/Icons';
import Button from '../Button/Button';
import BlogCard from './blog/BlogCard';
import { fetchBlogPosts } from '../../services/blog';
import { type BlogPost } from '../../types/discover';
import './BlogTab.css';

const MARKMIND_BLOG_URL = 'https://markmind.xyz/blog';

const BlogTab = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

      <div className="blog-tab-list">
        {blogPosts.map((post) => (
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
