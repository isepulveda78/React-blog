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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch all posts and categories
    Promise.all([
      fetch('/api/posts/public'),
      fetch('/api/categories')
    ])
    .then(([postsRes, categoriesRes]) => 
      Promise.all([postsRes.json(), categoriesRes.json()])
    )
    .then(([postsData, categoriesData]) => {
      setPosts(Array.isArray(postsData) ? postsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error loading data:', err);
      setPosts([]);
      setCategories([]);
      setLoading(false);
    });
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
        <div className="col-md-8">
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
      </div>

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