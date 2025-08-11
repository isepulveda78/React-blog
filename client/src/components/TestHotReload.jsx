import React, { useState, useEffect } from 'react';

const TestHotReload = () => {
  const [count, setCount] = useState(0);

  console.log('🔥 TestHotReload component is rendering!');

  useEffect(() => {
    console.log('🔥 TestHotReload useEffect running - creating indicator');
    
    // Create visual indicator
    const indicator = document.createElement('div');
    indicator.innerHTML = '🔥 HOT RELOAD ACTIVE';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      border: 2px solid white;
    `;
    
    // Ensure it gets added
    setTimeout(() => {
      document.body.appendChild(indicator);
      console.log('🔥 Hot reload indicator added to DOM');
    }, 100);
    
    return () => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
        console.log('🔥 Hot reload indicator removed from DOM');
      }
    };
  }, []);

  return (
    <div 
      className="alert alert-danger mt-4 border-3" 
      style={{ 
        backgroundColor: '#ffebee', 
        borderColor: '#f44336',
        boxShadow: '0 4px 8px rgba(244, 67, 54, 0.2)'
      }}
    >
      <h4 className="alert-heading text-danger">🔥 HOT RELOAD TEST ACTIVE</h4>
      <p className="mb-3">
        <strong>This component tests hot reload functionality!</strong><br/>
        Click the button below, then edit this file to test state preservation.
      </p>
      <button 
        className="btn btn-danger btn-lg me-3" 
        onClick={() => {
          setCount(count + 1);
          console.log('🔥 Count updated to:', count + 1);
        }}
      >
        HOT RELOAD COUNT: {count}
      </button>
      <div className="mt-3 p-3 bg-light rounded">
        <small className="text-muted">
          <strong>Test Instructions:</strong><br/>
          1. Click the button above a few times<br/>
          2. Edit this file: change "btn-danger" to "btn-success"<br/>
          3. Save - button should turn green but count stays the same!
        </small>
      </div>
    </div>
  );
};

export default TestHotReload;