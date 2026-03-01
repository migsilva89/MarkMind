import { useCallback } from 'react';
import { ExternalLinkIcon } from '../../icons/Icons';
import { type BlogPost } from '../../../types/discover';
import './BlogCard.css';

interface BlogCardProps {
  post: BlogPost;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const BlogCard = ({ post }: BlogCardProps) => {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      chrome.tabs.create({ url: post.url });
    },
    [post.url]
  );

  const primaryTag = post.tags[0] ?? 'Article';

  return (
    <a
      href={post.url}
      className="blog-card"
      onClick={handleClick}
      title={`Read: ${post.title}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="blog-card-image">
        <img src={post.image} alt={post.title} />
      </div>
      <div className="blog-card-content">
        <div className="blog-card-meta">
          <span className="blog-card-badge">{primaryTag}</span>
          <span className="blog-card-reading-time">{post.readingTime}</span>
          <ExternalLinkIcon width={10} height={10} />
        </div>
        <h3 className="blog-card-title">{post.title}</h3>
        <p className="blog-card-excerpt">{post.excerpt}</p>
        <span className="blog-card-date">{formatDate(post.datePublished)}</span>
      </div>
    </a>
  );
};

export default BlogCard;
