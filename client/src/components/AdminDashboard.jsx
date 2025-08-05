import React from 'react';

const AdminDashboard = ({ user }) => {
  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-primary mb-4">Admin Dashboard</h1>
          <p className="lead text-muted mb-5">
            Manage your blog content and users from here.
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">📝</div>
              <h5 className="card-title">Manage Posts</h5>
              <p className="card-text">Create, edit, and publish blog posts.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/admin/posts')}
              >
                Go to Posts
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">👥</div>
              <h5 className="card-title">Manage Users</h5>
              <p className="card-text">Approve users and manage permissions.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/admin/users')}
              >
                Go to Users
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">💬</div>
              <h5 className="card-title">Manage Comments</h5>
              <p className="card-text">Moderate and approve user comments.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/admin/comments')}
              >
                Go to Comments
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🔍</div>
              <h5 className="card-title">SEO Management</h5>
              <p className="card-text">Optimize SEO settings and analytics.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/seo-management')}
              >
                SEO Tools
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🔊</div>
              <h5 className="card-title">Sound System</h5>
              <p className="card-text">Test sound effects and audio integration.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/sound-demo')}
              >
                Sound Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;