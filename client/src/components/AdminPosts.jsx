import React, { useState, useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Image from '@editorjs/image';
import LinkTool from '@editorjs/link';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Table from '@editorjs/table';
import Delimiter from '@editorjs/delimiter';
import Marker from '@editorjs/marker';
import InlineCode from '@editorjs/inline-code';


const { toast } = window;

const AdminPosts = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('draft');
  const [featuredImage, setFeaturedImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState([]);
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);




  
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

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '');
      setContent(editingPost.content || '');
      setExcerpt(editingPost.excerpt || '');
      setCategoryId(editingPost.categoryId || '');
      setStatus(editingPost.status || 'draft');
      setFeaturedImage(editingPost.featuredImage || '');
    } else {
      setTitle('');
      setContent('');
      setExcerpt('');
      setCategoryId('');
      setStatus('draft');
      setFeaturedImage('');
    }
  }, [editingPost]);

  // Initialize Editor.js
  useEffect(() => {
    if ((showCreateForm || editingPost) && editorRef.current && !editorInstanceRef.current) {
      const initializeEditor = async () => {
        try {
          const editor = new EditorJS({
            holder: editorRef.current,
            placeholder: 'Start writing your post content...',
            tools: {
              header: {
                class: Header,
                config: {
                  placeholder: 'Enter a header',
                  levels: [2, 3, 4],
                  defaultLevel: 2
                }
              },
              list: {
                class: List,
                inlineToolbar: true,
                config: {
                  defaultStyle: 'unordered'
                }
              },
              quote: {
                class: Quote,
                inlineToolbar: true,
                config: {
                  quotePlaceholder: 'Enter a quote',
                  captionPlaceholder: 'Quote\'s author',
                }
              },
              code: {
                class: Code
              },
              table: {
                class: Table,
                inlineToolbar: true,
                config: {
                  rows: 2,
                  cols: 3,
                }
              },
              delimiter: Delimiter,
              marker: {
                class: Marker
              },
              inlineCode: {
                class: InlineCode
              },
              linkTool: {
                class: LinkTool,
                config: {
                  endpoint: '/api/link-preview'
                }
              },
              image: {
                class: Image,
                config: {
                  endpoints: {
                    byFile: '/api/upload-image',
                  }
                }
              }
            },
            data: content ? JSON.parse(content) : undefined,
            onChange: async () => {
              const outputData = await editor.save();
              setContent(JSON.stringify(outputData));
            }
          });

          await editor.isReady;
          editorInstanceRef.current = editor;
        } catch (error) {
          console.error('Editor.js initialization failed:', error);
        }
      };

      initializeEditor();
    }

    return () => {
      if (editorInstanceRef.current && editorInstanceRef.current.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [showCreateForm, editingPost, content]);

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
    }
    setLoading(false);
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

  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();

        setFeaturedImage(data.url);
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
          variant: "default"
        });
      } else {
        const errorData = await response.text();
        console.error('Upload failed:', response.status, errorData);
        toast({
          title: "Error",
          description: `Failed to upload image: ${response.status} - ${errorData}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Error uploading image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
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
      toast({
        title: "Validation Error",
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
          title,
          content,
          excerpt,
          categoryId,
          status,
          featuredImage,
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
        
        // Trigger refresh event for BlogListing
        window.dispatchEvent(new CustomEvent('blogDataUpdated', { detail: { action: 'saved', post: savedPost } }));
        
        toast({
          title: "Success",
          description: "Post saved successfully!",
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: 'Error saving post: ' + (error.message || 'Unknown error'),
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
      const response = await fetch(`/api/posts/${postId}`, {
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
            <div 
              ref={editorRef}
              id="editorjs-admin"
              style={{ 
                minHeight: '250px', 
                border: '1px solid #ced4da', 
                borderRadius: '0.375rem',
                padding: '1rem'
              }}
            ></div>
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
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select Category (Optional)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Featured Image</label>
            
            {/* Show current image if exists */}
            {featuredImage && (
              <div className="mb-2">
                <div className="position-relative d-inline-block">
                  <img 
                    src={featuredImage} 
                    alt="Current featured image" 
                    style={{ maxWidth: '200px', height: 'auto' }}
                    className="img-thumbnail"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                    onClick={() => setFeaturedImage('')}
                    title="Remove image"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <p className="small text-muted mt-1">Current featured image</p>
              </div>
            )}
            
            {/* Image upload controls */}
            <div className="input-group">
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                disabled={uploadingImage}
                key={featuredImage} // Reset file input when image changes
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : (featuredImage ? 'Change' : 'Upload')}
              </button>
            </div>
            <small className="text-muted">
              {featuredImage ? 
                'Upload a new file only if you want to change the current image' : 
                'Upload an image file for the featured image'
              }
            </small>
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