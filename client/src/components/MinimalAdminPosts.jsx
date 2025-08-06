import React from 'react';

const MinimalAdminPosts = ({ user }) => {
  console.log('MinimalAdminPosts - rendering with user:', user?.name);
  
  if (!user?.isAdmin) {
    return React.createElement('div', { className: 'container py-5' },
      React.createElement('div', { className: 'alert alert-danger' },
        'Access denied. Admin privileges required.'
      )
    );
  }

  return React.createElement('div', { className: 'container py-5' },
    React.createElement('h1', { className: 'display-4 fw-bold text-primary' },
      'Manage Posts - Working!'
    ),
    React.createElement('div', { className: 'alert alert-success' },
      'This minimal version is working. The issue was with the complex component structure.'
    ),
    React.createElement('p', null, 
      `Logged in as: ${user.name} (Admin: ${user.isAdmin})`
    )
  );
};

export default MinimalAdminPosts;