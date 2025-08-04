const { React } = window;

const BlogCard = ({ post, onReadMore }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm hover-shadow-lg transition-all">
        {post.featuredImage && (
          <img
            src={post.featuredImage}
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
              {formatDate(post.createdAt)}
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

window.BlogCard = BlogCard;