const { React, useState, useEffect } = window;
const Hero = window.Hero;
const BlogCard = window.BlogCard;

const Home = ({ user }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check for URL messages
    const urlParams = new URLSearchParams(window.location.search);
    const urlMessage = urlParams.get('message');
    if (urlMessage === 'login-required') {
      setMessage('Please sign in to access that page.');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/');
    } else if (urlMessage === 'admin-required') {
      setMessage('Admin access required for that page.');
      // Clear the URL parameter  
      window.history.replaceState({}, '', '/');
    }

    // Fetch recent posts for the homepage
    fetch('/api/posts/public')
      .then(res => res.json())
      .then(data => {
        setPosts(Array.isArray(data) ? data.slice(0, 6) : []); // Show latest 6 posts
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading posts:', err);
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const handleReadMore = (post) => {
    if (!user) {
      window.location.href = '/api/auth/google';
      return;
    }
    
    if (!user.approved) {
      alert('Your account is pending approval. Please wait for admin approval to access posts.');
      return;
    }
    
    // Navigate to blog post
    window.history.pushState({}, '', `/blog/${post.slug}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div>
      {message && (
        <div className="container py-3">
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            {message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setMessage('')}
            ></button>
          </div>
        </div>
      )}
      <Hero user={user} />
      
      <section className="py-5">
        <div className="container">
          <div className="row mb-4">
            <div className="col-12 text-center">
              <h2 className="display-5 fw-bold text-primary mb-3">Latest Posts</h2>
              <p className="lead text-muted">
                Discover our most recent content and insights
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : posts.length > 0 ? (
            <div className="row">
              {posts.map(post => (
                <div className="col-md-6 col-lg-4 mb-4" key={post._id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">{post.title}</h5>
                      <p className="card-text">{post.excerpt || post.content?.substring(0, 100) + '...'}</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleReadMore(post)}
                      >
                        Read More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="alert alert-info">
                <h4>No posts available yet</h4>
                <p>Check back soon for new content!</p>
              </div>
            </div>
          )}
          
          {posts.length > 0 && (
            <div className="text-center mt-4">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  window.history.pushState({}, '', '/blog');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              >
                View All Posts
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

window.Home = Home;