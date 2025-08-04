import React from 'react';
import { useAuth } from '../hooks/use-auth';

export default function TestAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  
  console.log('TestAdmin component rendered successfully!');
  console.log('TestAdmin auth state:', { user: user?.email, isAdmin, isLoading });
  
  return (
    <div style={{ padding: '50px', backgroundColor: '#ff6b6b', color: 'white', minHeight: '100vh' }}>
      <h1>TEST ADMIN PAGE</h1>
      <p>If you can see this, the routing is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <p>This is a minimal test component to verify routing works.</p>
      <hr />
      <h3>Auth Debug Info:</h3>
      <p>User Email: {user?.email || 'No user'}</p>
      <p>Is Admin: {isAdmin ? 'YES' : 'NO'}</p>
      <p>Is Loading: {isLoading ? 'YES' : 'NO'}</p>
      <p>User Object: {JSON.stringify(user, null, 2)}</p>
    </div>
  );
}