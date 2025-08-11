import React, { useState } from 'react';

const HotReloadDemo = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="card mt-3">
      <div className="card-header bg-warning">
        <h5 className="mb-0">🔥 Hot Reload Demo - Edit this component!</h5>
      </div>
      <div className="card-body">
        <p className="text-muted">
          This component demonstrates fast refresh. When you edit this file, 
          only this component will update without losing the count state!
        </p>
        <div className="d-flex align-items-center gap-3">
          <button 
            className="btn btn-success" 
            onClick={() => setCount(count + 1)}
          >
            Clicks: {count}
          </button>
          <span className="badge bg-warning">
            Test: Change this component and watch state stay!
          </span>
        </div>
        <div className="mt-2">
          <small className="text-info">
            💡 Try changing the button text or colors in the file - the count will stay the same!
          </small>
        </div>
      </div>
    </div>
  );
};

export default HotReloadDemo;