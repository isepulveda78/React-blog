const { React, useState, useEffect } = window;

const BlogPost = ({ slug, user }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/posts/slug/${slug}`, {
      credentials: 'include'
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Post not found');
      }
      return res.json();
    })
    .then(data => {
      setPost(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <button
          className="btn btn-primary"
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Post not found</div>
        <button
          className="btn btn-primary"
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <article className="row justify-content-center">
        <div className="col-lg-8">
          {/* Post Header */}
          <header className="mb-4">
            <h1 className="display-4 fw-bold text-primary mb-3">{post.title}</h1>
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-primary me-3">{post.category || 'General'}</span>
              <small className="text-muted">
                Published {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </small>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-4">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="img-fluid rounded-3 shadow"
              />
            </div>
          )}

          {/* Post Content */}
          <div className="post-content">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Navigation */}
          <div className="mt-5 pt-4 border-top">
            <div className="d-flex justify-content-between">
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  window.history.pushState({}, '', '/blog');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              >
                ← Back to All Posts
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              >
                Home →
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

window.BlogPost = BlogPost;