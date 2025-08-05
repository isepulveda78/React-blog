import React, { useState, useRef } from 'react';

const AdminPostEditor = ({ user, postId }) => {
  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="display-4 fw-bold text-primary mb-4">
        {postId ? 'Edit Post' : 'Create New Post'}
      </h1>
      <div className="alert alert-info">
        <h4>Post Editor</h4>
        <p>This section is under development. Full post editing features coming soon!</p>
      </div>
    </div>
  );
};

export default AdminPostEditor;