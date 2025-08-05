import React, { useState, useEffect } from 'react';

const AdminComments = ({ user }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved

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
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/comments', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoading(false);
  };

  const updateCommentStatus = async (commentId, status) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        const updatedComment = await response.json();
        setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      }
    } catch (error) {
      console.error('Error updating comment status:', error);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        alert('Comment deleted successfully');
      } else {
        alert('Failed to delete comment');
      }
    } catch (error) {
      alert('Error deleting comment');
    }
  };

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return comment.status === 'pending';
    if (filter === 'approved') return comment.status === 'approved';
    return true;
  });

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
        <h1 className="display-4 fw-bold text-primary">Manage Comments</h1>
        <div className="btn-group">
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('all')}
          >
            All ({comments.length})
          </button>
          <button 
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({comments.filter(c => c.status === 'pending').length})
          </button>
          <button 
            className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({comments.filter(c => c.status === 'approved').length})
          </button>
        </div>
      </div>

      <div className="row">
        {filteredComments.map(comment => (
          <div key={comment.id} className="col-12 mb-3">
            <div className={`card ${comment.status === 'pending' ? 'border-warning' : 'border-success'}`}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <strong>{comment.authorName}</strong>
                  <small className="text-muted ms-2">
                    on "{comment.postTitle}" - {new Date(comment.createdAt).toLocaleString()}
                  </small>
                </div>
                <span className={`badge ${comment.status === 'approved' ? 'bg-success' : 'bg-warning'}`}>
                  {comment.status}
                </span>
              </div>
              <div className="card-body">
                <p className="mb-0">{comment.content}</p>
                {comment.parentId && (
                  <small className="text-muted">This is a reply to another comment</small>
                )}
              </div>
              <div className="card-footer">
                <div className="btn-group btn-group-sm">
                  {comment.status === 'pending' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => updateCommentStatus(comment.id, 'approved')}
                    >
                      Approve
                    </button>
                  )}
                  {comment.status === 'approved' && (
                    <button 
                      className="btn btn-warning"
                      onClick={() => updateCommentStatus(comment.id, 'pending')}
                    >
                      Unapprove
                    </button>
                  )}
                  <button 
                    className="btn btn-danger"
                    onClick={() => deleteComment(comment.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredComments.length === 0 && (
        <div className="text-center py-5">
          <h4>No comments found</h4>
          <p>
            {filter === 'all' 
              ? 'No comments have been posted yet.'
              : `No ${filter} comments found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminComments;