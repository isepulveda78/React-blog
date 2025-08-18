import React from 'react';
import { useLocation } from 'wouter';

const AdminDashboard = ({ user }) => {
  const [location, navigate] = useLocation();
  
  console.log('[AdminDashboard] User:', user);
  console.log('[AdminDashboard] User.isAdmin:', user?.isAdmin);
  
  if (!user || !user.isAdmin) {
    console.log('[AdminDashboard] Access denied - no user or not admin');
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  console.log('[AdminDashboard] Rendering dashboard for admin user');

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
                onClick={() => navigate('/admin/posts')}
              >
                Go to Posts
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🏷️</div>
              <h5 className="card-title">Manage Categories</h5>
              <p className="card-text">Create and organize blog post categories.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/categories')}
              >
                Go to Categories
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
                onClick={() => navigate('/admin/users')}
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
                onClick={() => navigate('/admin/comments')}
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
                onClick={() => navigate('/admin/seo')}
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
                onClick={() => navigate('/sound-demo')}
              >
                Sound Demo
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">💬</div>
              <h5 className="card-title">Manage Chatrooms</h5>
              <p className="card-text">Create and manage private chatrooms for users.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/chatrooms')}
              >
                Go to Chatrooms
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🎧</div>
              <h5 className="card-title">Audio Quiz Grades</h5>
              <p className="card-text">View student audio quiz scores and listening performance.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/quiz-grades-dashboard')}
              >
                View Audio Grades
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm hover-shadow">
            <div className="card-body text-center">
              <div className="display-6 text-success mb-3">📝</div>
              <h5 className="card-title">Text Quiz Grades</h5>
              <p className="card-text">View student text quiz scores and reading comprehension.</p>
              <button
                className="btn btn-success"
                onClick={() => navigate('/admin/text-quiz-grades-dashboard')}
              >
                View Text Grades
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;