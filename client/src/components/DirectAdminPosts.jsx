import React from 'react';

const DirectAdminPosts = ({ user }) => {
  console.log('DirectAdminPosts - rendering with user:', user?.name);
  
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
      <h1 className="display-4 fw-bold text-success">
        ✅ Admin Posts - Direct ES6 Component Working!
      </h1>
      <div className="alert alert-info">
        <strong>Success!</strong> This component is working with proper ES6 imports.
        <br />
        Logged in as: {user.name} (Admin: {user.isAdmin ? 'Yes' : 'No'})
      </div>
      <div className="card mt-4">
        <div className="card-header">
          <h5>Next Steps</h5>
        </div>
        <div className="card-body">
          <p>Now that basic rendering works, we can add post management functionality.</p>
          <button className="btn btn-primary">Ready to add features</button>
        </div>
      </div>
    </div>
  );
};

export default DirectAdminPosts;