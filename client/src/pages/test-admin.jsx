import React from 'react';

export default function TestAdmin() {
  console.log('TestAdmin component rendered successfully!');
  
  return (
    <div style={{ padding: '50px', backgroundColor: '#ff6b6b', color: 'white', minHeight: '100vh' }}>
      <h1>TEST ADMIN PAGE</h1>
      <p>If you can see this, the routing is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <p>This is a minimal test component to verify routing works.</p>
    </div>
  );
}