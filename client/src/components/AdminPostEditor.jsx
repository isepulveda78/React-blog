import React, { useState, useEffect } from 'react';
import PostEditor from './PostEditor.jsx';

const { toast } = window;

const AdminPostEditor = ({ user, postId }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(!!postId);
  const [error, setError] = useState('');

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
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPost(data);
      } else {
        setError('Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Error loading post');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (postData) => {
    try {
      const url = postId ? `/api/posts/${postId}` : '/api/posts';
      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        // Redirect to admin posts list
        window.location.href = '/admin/posts';
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || 'Failed to save post',
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
  };

  const handleCancel = () => {
    window.location.href = '/admin/posts';
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <PostEditor
      user={user}
      post={post}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default AdminPostEditor;