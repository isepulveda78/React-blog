import React, { useState, useEffect } from 'react';

const { toast } = window;

const SimplePostEditor = ({ user, post, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'draft'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        categoryId: post.categoryId || '',
        status: post.status || 'draft'
      });
    }
  }, [post]);

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const url = post ? `/api/posts/${post.id}` : '/api/posts';
      const method = post ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          authorId: user.id,
          authorName: user.name || user.username
        })
      });

      if (response.ok) {
        const savedPost = await response.json();
        onSave(savedPost);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: `Error saving post: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Error saving post",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="display-5 fw-bold text-primary">
              {post ? 'Edit Post' : 'Create New Post'}
            </h1>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Post Details</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter post title"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Content *</label>
                <textarea
                  className="form-control"
                  rows="10"
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Write your post content here..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Excerpt</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Brief description of the post..."
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) => handleChange('categoryId', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 d-flex gap-2">
                <button 
                  className="btn btn-success btn-lg"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (post ? 'Update Post' : 'Create Post')}
                </button>
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePostEditor;