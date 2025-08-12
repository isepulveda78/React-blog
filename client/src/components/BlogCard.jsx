import React from 'react';

// Utility function to decode HTML entities recursively
const decodeHTMLEntities = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Keep decoding until no more entities are found
  let decoded = text;
  let previousDecoded = '';
  
  while (decoded !== previousDecoded) {
    previousDecoded = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x2F;/g, '/')
      .replace(/&#x27;/g, "'");
  }
  
  return decoded;
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
            {(post.categoryName || post.category) && (
              <span className="badge bg-primary me-2">
                {post.categoryName || post.category}
              </span>
            )}
            <small className="text-muted">
              {formatDate(post.publishedAt || post.createdAt)}
            </small>
          </div>
          <h5 className="card-title">
            {decodeHTMLEntities(post.title)}
            {process.env.NODE_ENV === 'development' && (
              <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>
                ID: {post.id}
              </small>
            )}
          </h5>
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