import React, { useState, useEffect } from 'react';

const { toast } = window;

const MinimalAdminPosts = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft'
  });
  const [saving, setSaving] = useState(false);

  console.log('MinimalAdminPosts - rendering with user:', user?.name);
  
  if (!user?.isAdmin) {
    return React.createElement('div', { className: 'container py-5' },
      React.createElement('div', { className: 'alert alert-danger' },
        'Access denied. Admin privileges required.'
      )
    );
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (editingPost) {
      setFormData({
        title: editingPost.title || '',
        content: editingPost.content || '',
        excerpt: editingPost.excerpt || '',
        status: editingPost.status || 'draft'
      });
    } else {
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft'
      });
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive"
      });
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
          ...formData,
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
        setShowEditor(false);
        setEditingPost(null);
        toast({
          title: "Success",
          description: "Post saved successfully!",
          variant: "default"
        });
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
      toast({
        title: "Error",
        description: "Error deleting post",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'container py-5' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'spinner-border', role: 'status' },
          React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
        )
      )
    );
  }

  if (showEditor) {
    return React.createElement('div', { className: 'container py-5' },
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('h5', { className: 'mb-0' },
            editingPost ? 'Edit Post' : 'Create New Post'
          )
        ),
        React.createElement('div', { className: 'card-body' },
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Title *'),
            React.createElement('input', {
              type: 'text',
              className: 'form-control',
              value: formData.title,
              onChange: (e) => setFormData({...formData, title: e.target.value}),
              placeholder: 'Enter post title'
            })
          ),
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Content *'),
            React.createElement('textarea', {
              className: 'form-control',
              rows: 10,
              value: formData.content,
              onChange: (e) => setFormData({...formData, content: e.target.value}),
              placeholder: 'Write your post content here...'
            })
          ),
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Excerpt'),
            React.createElement('textarea', {
              className: 'form-control',
              rows: 3,
              value: formData.excerpt,
              onChange: (e) => setFormData({...formData, excerpt: e.target.value}),
              placeholder: 'Brief description of the post...'
            })
          ),
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Status'),
            React.createElement('select', {
              className: 'form-select',
              value: formData.status,
              onChange: (e) => setFormData({...formData, status: e.target.value})
            },
              React.createElement('option', { value: 'draft' }, 'Draft'),
              React.createElement('option', { value: 'published' }, 'Published')
            )
          ),
          React.createElement('div', { className: 'mt-4 d-flex gap-2' },
            React.createElement('button', {
              className: 'btn btn-success btn-lg',
              onClick: handleSave,
              disabled: saving
            }, saving ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')),
            React.createElement('button', {
              className: 'btn btn-secondary btn-lg',
              onClick: () => {
                setShowEditor(false);
                setEditingPost(null);
              },
              disabled: saving
            }, 'Cancel')
          )
        )
      )
    );
  }

  return React.createElement('div', { className: 'container py-5' },
    React.createElement('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
      React.createElement('h1', { className: 'display-4 fw-bold text-primary' },
        'Manage Posts'
      ),
      React.createElement('button', {
        className: 'btn btn-primary btn-lg',
        onClick: () => setShowEditor(true)
      }, 'Create New Post')
    ),
    React.createElement('div', { className: 'table-responsive' },
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', { className: 'table-dark' },
          React.createElement('tr', null,
            React.createElement('th', null, 'Title'),
            React.createElement('th', null, 'Status'),
            React.createElement('th', null, 'Author'),
            React.createElement('th', null, 'Created'),
            React.createElement('th', null, 'Actions')
          )
        ),
        React.createElement('tbody', null,
          posts.map(post =>
            React.createElement('tr', { key: post.id },
              React.createElement('td', null,
                React.createElement('strong', null, post.title),
                React.createElement('br'),
                React.createElement('small', { className: 'text-muted' },
                  (post.excerpt || '').substring(0, 100) + '...'
                )
              ),
              React.createElement('td', null,
                React.createElement('span', {
                  className: `badge ${post.status === 'published' ? 'bg-success' : 'bg-warning'}`
                }, post.status)
              ),
              React.createElement('td', null, post.authorName),
              React.createElement('td', null,
                new Date(post.createdAt).toLocaleDateString()
              ),
              React.createElement('td', null,
                React.createElement('div', { className: 'btn-group btn-group-sm' },
                  React.createElement('button', {
                    className: 'btn btn-outline-primary',
                    onClick: () => {
                      setEditingPost(post);
                      setShowEditor(true);
                    }
                  }, 'Edit'),
                  React.createElement('button', {
                    className: 'btn btn-outline-danger',
                    onClick: () => deletePost(post.id)
                  }, 'Delete')
                )
              )
            )
          )
        )
      )
    ),
    posts.length === 0 && React.createElement('div', { className: 'text-center py-5' },
      React.createElement('h4', null, 'No posts found'),
      React.createElement('p', null, 'Create your first post to get started.')
    )
  );
};

export default MinimalAdminPosts;