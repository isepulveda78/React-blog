import React, { useState, useEffect } from 'react';

const AdminPosts = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  console.log('AdminPosts rendering - user:', user);

  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        alert('Post deleted successfully');
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      alert('Error deleting post');
    }
  };

  const togglePostStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(p => p.id === postId ? updatedPost : p));
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

  if (showEditor) {
    return (
      <div className="container py-5">
        <div className="card">
          <div className="card-header">
            <h5>Simple Post Editor (Debug Mode)</h5>
          </div>
          <div className="card-body">
            <p>This is a debug version to test if the editor works.</p>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowEditor(false)}
            >
              Back to Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-4 fw-bold text-primary">Manage Posts</h1>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setShowEditor(true)}
        >
          Create New Post
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-dark">
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Category</th>
              <th>Author</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id}>
                <td>
                  <strong>{post.title}</strong>
                  <br />
                  <small className="text-muted">{post.excerpt?.substring(0, 100)}...</small>
                </td>
                <td>
                  <span className={`badge ${post.status === 'published' ? 'bg-success' : 'bg-warning'}`}>
                    {post.status}
                  </span>
                </td>
                <td>{post.categoryName || 'Uncategorized'}</td>
                <td>{post.authorName}</td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => {
                        setEditingPost(post);
                        setShowEditor(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className={`btn ${post.status === 'published' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => togglePostStatus(post.id, post.status)}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-5">
          <h4>No posts found</h4>
          <p>Create your first post to get started.</p>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;