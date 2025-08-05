import React from 'react';

const NotFound = () => {
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 text-center">
          <div className="display-1 text-primary mb-4">404</div>
          <h1 className="display-4 fw-bold mb-3">Page Not Found</h1>
          <p className="lead text-muted mb-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigateTo('/')}
            >
              Go Home
            </button>
            <button
              className="btn btn-outline-primary btn-lg"
              onClick={() => navigateTo('/blog')}
            >
              Browse Posts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;