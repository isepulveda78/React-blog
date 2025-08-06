import React, { useState, useEffect } from 'react';

const WorkingAdminPosts = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);

  console.log('WorkingAdminPosts rendering - user:', user?.name);

  if (!user?.isAdmin) {
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

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '');
      setContent(editingPost.content || '');
      setExcerpt(editingPost.excerpt || '');
      setStatus(editingPost.status || 'draft');
    } else {
      setTitle('');
      setContent('');
      setExcerpt('');
      setStatus('draft');
    }
  }, [editingPost]);

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

  const handleCreateNew = () => {
    setEditingPost(null);
    setShowCreateForm(true);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingPost(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSaving(true);
    
    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : '/api/posts';
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          content,
          excerpt,
          status,
          authorId: user.id,
          authorName: user.name || user.username
        })
      });

      if (response.ok) {
        const savedPost = await response.json();
        if (editingPost) {
          setPosts(posts.map(p => p.id === savedPost.id ? savedPost : p));
        } else {
          setPosts([savedPost, ...posts]);
        }
        setShowCreateForm(false);
        setEditingPost(null);
        alert('Post saved successfully!');
      } else {
        const error = await response.json();
        alert('Error saving post: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post');
    }
    
    setSaving(false);
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

  const toggleStatus = async (postId, currentStatus) => {
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

  if (showCreateForm) {
    return (
      <div className="container py-5">
        <h2 className="mb-4">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="mb-3">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Content *</label>
            <textarea
              className="form-control"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content here..."
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Excerpt</label>
            <textarea
              className="form-control"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the post..."
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          
          <div className="d-flex gap-2">
            <button 
              type="submit"
              className="btn btn-success"
              disabled={saving}
            >
              {saving ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
            </button>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
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
                    <span className={`badge ${post.status === 'published' ? 'bg-success' : 'bg-warning'}`}>
                      {post.status}
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

export default WorkingAdminPosts;