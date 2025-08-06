import React from 'react';

const TestAdminPosts = ({ user }) => {
  console.log('TestAdminPosts rendering with user:', user);
  
  if (!user || !user.isAdmin) {
    return React.createElement('div', { className: 'container py-5' },
      React.createElement('div', { className: 'alert alert-danger' },
        'Access denied. Admin privileges required.'
      )
    );
  }

  return React.createElement('div', { className: 'container py-5' },
    React.createElement('h1', { className: 'display-4 fw-bold text-success' },
      'TEST: Admin Posts Working!'
    ),
    React.createElement('div', { className: 'alert alert-info' },
      'This is a basic test component to verify admin routing works. User: ' + user.name
    ),
    React.createElement('p', null,
      'If you can see this message, the routing is working and the issue was with the complex component structure.'
    )
  );
};

export default TestAdminPosts;