import React, { useState, useEffect } from 'react';
import BlogCard from './BlogCard.jsx';

// Helper function to format dates nicely
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

const BlogListing = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchData = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    
    try {
      const timestamp = Date.now();
      console.log('BlogListing: Fetching latest data at:', new Date(timestamp).toLocaleTimeString());
      
      const [postsRes, categoriesRes] = await Promise.all([
        fetch(`/api/posts/public?t=${timestamp}`, { 
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/categories?t=${timestamp}`, { 
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      ]);

      console.log('BlogListing: API response status:', postsRes.status, categoriesRes.status);

      const [postsData, categoriesData] = await Promise.all([
        postsRes.json(),
        categoriesRes.json()
      ]);

      console.log('BlogListing: Posts loaded:', postsData.length);
      console.log('BlogListing: First post title:', postsData[0]?.title);
      console.log('BlogListing: First post ID:', postsData[0]?.id);
      
      setPosts(Array.isArray(postsData) ? postsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setLastRefresh(timestamp);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setPosts([]);
      setCategories([]);
    } finally {
      setLoading(false);
      if (showRefreshLoader) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    console.log('BlogListing: Manual refresh clicked');
    // Force a hard refresh by clearing posts first
    setPosts([]);
    setLoading(true);
    fetchData(true);
  };

  const handleForceRefresh = () => {
    console.log('BlogListing: Force refresh - clearing all cache');
    // Clear all state and force reload
    setPosts([]);
    setCategories([]);
    setLoading(true);
    setLastRefresh(0);
    
    // Add a small delay to ensure state is cleared
    setTimeout(() => {
      fetchData(true);
    }, 100);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds when user is on the page
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('BlogListing: Auto-refreshing data...');
        fetchData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listen for custom refresh events (triggered from admin)
  useEffect(() => {
    const handleCustomRefresh = (event) => {
      console.log('BlogListing: Custom refresh triggered by:', event.detail);
      fetchData(true);
    };

    const handleFocus = () => {
      console.log('BlogListing: Window focused, refreshing data');
      fetchData();
    };

    window.addEventListener('blogDataUpdated', handleCustomRefresh);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blogDataUpdated', handleCustomRefresh);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleReadMore = (post) => {
    // Posts are now publicly accessible - no authentication required
    // Use slug if available, otherwise use ID
    const identifier = post.slug || post.id;
    console.log('Post navigation:', { title: post.title, slug: post.slug, id: post.id, identifier });
    window.history.pushState({}, '', `/blog/${identifier}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Filter posts based on search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container py-5">
      <div className="row mb-5">
        <div className="col-12 text-center">
          <h1 className="display-4 fw-bold text-primary mb-3">All Blog Posts</h1>
          <p className="lead text-muted">
            Explore our complete collection of articles and insights
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select form-select-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <div className="btn-group w-100" role="group">
            <button
              className="btn btn-outline-primary btn-lg"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ flex: '2' }}
            >
              {refreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Loading...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </>
              )}
            </button>
            <button
              className="btn btn-outline-danger btn-lg"
              onClick={handleForceRefresh}
              disabled={refreshing}
              style={{ flex: '1' }}
              title="Force refresh (clear cache)"
            >
              <i className="bi bi-lightning"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Last refresh indicator and debug info */}
      <div className="row mb-2">
        <div className="col-md-6">
          <small className="text-muted">
            Last updated: {new Date(lastRefresh).toLocaleTimeString()}
          </small>
        </div>
        <div className="col-md-6 text-end">
          <small className="text-muted">
            Total posts: {posts.length} | 
            {refreshing && <span className="text-primary"> Refreshing...</span>}
            {!refreshing && <span className="text-success"> Ready</span>}
          </small>
        </div>
      </div>

      {/* Debug panel for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="row mb-2">
          <div className="col-12">
            <div className="alert alert-info py-2">
              <small>
                <strong>Debug:</strong> Posts loaded: {posts.length} | 
                First post: {posts[0]?.title || 'None'} | 
                Last refresh: {lastRefresh ? new Date(lastRefresh).toLocaleString() : 'Never'}
              </small>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredPosts.length > 0 ? (
        <>
          <div className="mb-3">
            <small className="text-muted">
              Showing {filteredPosts.length} of {posts.length} posts
            </small>
          </div>
          <div className="row">
            {filteredPosts.map(post => (
              <BlogCard
                key={post.id}
                post={post}
                onReadMore={handleReadMore}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-5">
          <div className="alert alert-info">
            <h4>No posts found</h4>
            <p>
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria.'
                : 'Check back soon for new content!'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogListing;