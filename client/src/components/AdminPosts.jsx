import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

const { toast } = window;

const AdminPosts = ({ user }) => {
  const [location, navigate] = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>Admin privileges required to access this page.</p>
          <p>Current user: {user ? user.name : 'Not authenticated'}</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts', { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        console.error('AdminPosts: Failed to fetch posts:', response.status);
      }
    } catch (error) {
      console.error('AdminPosts: Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateNew = () => {
    // Navigate to the dedicated post editor using client-side routing
    navigate('/admin/posts/new');
  };

  const handleEdit = (post) => {
    // Navigate to the dedicated post editor using client-side routing
    navigate(`/admin/posts/edit/${post.id}`);
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        
        // Trigger refresh event for BlogListing
        window.dispatchEvent(new CustomEvent('blogDataUpdated', { detail: { action: 'deleted', postId } }));
        
        toast({
          title: "Success",
          description: "Post deleted successfully",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Error deleting post",
        variant: "destructive"
      });
    }
  };

  const toggleStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const response = await fetch(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, status: newStatus } : p));
        
        // Trigger refresh event for BlogListing
        window.dispatchEvent(new CustomEvent('blogDataUpdated', { detail: { action: 'statusChanged', postId, newStatus } }));
      } else {
        console.error('Failed to update post status');
      }
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-4 fw-bold text-primary">Blog Posts</h1>
        <button 
          className="btn btn-primary btn-lg"
          onClick={handleCreateNew}
        >
          <i className="fas fa-plus me-2"></i>
          Create New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-5">
          <h4>No posts found</h4>
          <p>Create your first post to get started.</p>
        </div>
      ) : (
        <div className="row">
          {posts.map(post => (
            <div key={post.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{post.title}</h5>
                  <p className="card-text flex-grow-1">
                    {(post.excerpt || post.content || '').substring(0, 100)}
                    {(post.excerpt || post.content || '').length > 100 && '...'}
                  </p>
                  <div className="mb-3">
                    <span className={`badge ${post.status === 'published' ? 'bg-success' : 'bg-secondary'}`}>
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <small className="text-muted ms-2">
                      by {post.authorName}
                    </small>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => handleEdit(post)}
                    >
                      Edit
                    </button>
                    <button 
                      className={`btn ${post.status === 'published' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => toggleStatus(post.id, post.status)}
                    >
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => deletePost(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPosts;