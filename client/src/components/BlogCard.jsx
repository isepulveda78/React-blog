import React from 'react';

// Utility function to decode HTML entities
const decodeHTMLEntities = (text) => {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const BlogCard = ({ post, onReadMore }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Show relative dates for recent posts
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    // Show full date for older posts
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    const decodedContent = decodeHTMLEntities(content);
    const text = decodedContent.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm hover-shadow-lg transition-all">
        {post.featuredImage && (
          <img
            src={decodeHTMLEntities(post.featuredImage)}
            className="card-img-top"
            alt={post.title}
            style={{ height: "200px", objectFit: "cover" }}
          />
        )}
        <div className="card-body d-flex flex-column">
          <div className="mb-2">
            <span className="badge bg-primary me-2">
              {post.category || "General"}
            </span>
            <small className="text-muted">
              {formatDate(post.publishedAt || post.createdAt)}
            </small>
          </div>
          <h5 className="card-title">{post.title}</h5>
          <p className="card-text flex-grow-1">
            {getExcerpt(post.content)}
          </p>
          <div className="mt-auto">
            <button
              className="btn btn-outline-primary"
              onClick={() => onReadMore && onReadMore(post)}
            >
              Read More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;