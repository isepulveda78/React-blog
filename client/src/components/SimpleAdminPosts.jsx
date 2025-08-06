import React from 'react';

function SimpleAdminPosts({ user }) {
  console.log('SimpleAdminPosts rendering with user:', user?.name);

  if (!user?.isAdmin) {
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-4 fw-bold text-primary">Blog Posts Management</h1>
        <button className="btn btn-primary btn-lg">
          Create New Post
        </button>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Post Management System</h5>
              <p className="card-text">
                This is the simplified admin posts component working without React errors.
              </p>
              <div className="d-flex gap-2">
                <button className="btn btn-success">Create Post</button>
                <button className="btn btn-info">View All Posts</button>
                <button className="btn btn-warning">Draft Posts</button>
                <button className="btn btn-secondary">Settings</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="alert alert-success">
          <strong>Success!</strong> The admin posts component is loading without React error #130.
        </div>
      </div>
    </div>
  );
}

export default SimpleAdminPosts;