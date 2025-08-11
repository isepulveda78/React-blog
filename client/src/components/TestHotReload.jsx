import React, { useState, useEffect } from 'react';

const TestHotReload = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Create visual indicator for hot reload
    const indicator = document.createElement('div');
    indicator.innerHTML = '🔥 HOT RELOAD ACTIVE - TEST COMPONENT';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-weight: bold;
      z-index: 9999;
      font-size: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(indicator);
    
    return () => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    };
  }, []);

  return (
    <div className="alert alert-warning mt-3">
      <h5>🔥 Hot Reload Test Component</h5>
      <p>Click the button, then edit this file. Your count should stay the same!</p>
      <button 
        className="btn btn-danger" 
        onClick={() => setCount(count + 1)}
      >
        Test Count: {count}
      </button>
      <p className="mt-2 mb-0">
        <small>Change the button color from "btn-danger" to "btn-success" to test hot reload!</small>
      </p>
    </div>
  );
};

export default TestHotReload;