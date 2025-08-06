import React from 'react';

function BasicAdminPosts({ user }) {
  console.log('BasicAdminPosts component rendering - user:', user?.name);

  if (!user?.isAdmin) {
    console.log('User not admin, showing access denied');
    return React.createElement('div', {className: 'container py-5'}, 
      React.createElement('div', {className: 'alert alert-danger'}, 
        'Access denied. Admin privileges required.'
      )
    );
  }

  console.log('Admin user confirmed, showing content');
  return React.createElement('div', {className: 'container py-5'},
    React.createElement('h1', {className: 'display-4 fw-bold text-success'}, 
      '✅ BasicAdminPosts Working!'
    ),
    React.createElement('div', {className: 'alert alert-info'}, 
      'Component loaded successfully with user: ', user.name
    ),
    React.createElement('button', {
      className: 'btn btn-primary btn-lg',
      onClick: function() { 
        console.log('Button clicked - this should work');
        alert('Button works! No React errors.');
      }
    }, 'Test Button')
  );
}

export default BasicAdminPosts;