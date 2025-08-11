import React, { useState, useEffect, useRef } from 'react';

const CodeEvolutionVisualization = () => {
  const [codeStates, setCodeStates] = useState([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Sample code evolution states
  const sampleEvolution = [
    {
      id: 1,
      code: `function greet(name) {
  console.log("Hello");
}`,
      timestamp: Date.now() - 5000,
      changes: ['Added function declaration'],
      linesAdded: 3,
      linesRemoved: 0
    },
    {
      id: 2,
      code: `function greet(name) {
  console.log("Hello " + name);
}`,
      timestamp: Date.now() - 4000,
      changes: ['Added name parameter usage'],
      linesAdded: 0,
      linesRemoved: 1
    },
    {
      id: 3,
      code: `function greet(name) {
  console.log(\`Hello \${name}!\`);
}

greet("World");`,
      timestamp: Date.now() - 3000,
      changes: ['Updated to template literals', 'Added function call'],
      linesAdded: 2,
      linesRemoved: 1
    },
    {
      id: 4,
      code: `function greet(name = "Friend") {
  console.log(\`Hello \${name}!\`);
}

greet("World");
greet();`,
      timestamp: Date.now() - 2000,
      changes: ['Added default parameter', 'Added second function call'],
      linesAdded: 1,
      linesRemoved: 0
    },
    {
      id: 5,
      code: `const greet = (name = "Friend") => {
  console.log(\`Hello \${name}!\`);
};

greet("World");
greet();

// Arrow function for modern JS`,
      timestamp: Date.now() - 1000,
      changes: ['Converted to arrow function', 'Added comment'],
      linesAdded: 2,
      linesRemoved: 3
    }
  ];

  useEffect(() => {
    setCodeStates(sampleEvolution);
  }, []);

  useEffect(() => {
    if (isPlaying && codeStates.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStateIndex(prev => {
          if (prev >= codeStates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, codeStates.length]);

  const startEvolution = () => {
    setCurrentStateIndex(0);
    setIsPlaying(true);
  };

  const pauseEvolution = () => {
    setIsPlaying(false);
  };

  const resetEvolution = () => {
    setIsPlaying(false);
    setCurrentStateIndex(0);
  };

  const addCustomCodeState = () => {
    if (!customCode.trim()) return;

    const newState = {
      id: codeStates.length + 1,
      code: customCode,
      timestamp: Date.now(),
      changes: ['Custom code added'],
      linesAdded: customCode.split('\n').length,
      linesRemoved: 0
    };

    setCodeStates(prev => [...prev, newState]);
    setCustomCode('');
  };

  const getCurrentCode = () => {
    return codeStates[currentStateIndex] || { code: '', changes: [], linesAdded: 0, linesRemoved: 0 };
  };

  const renderCodeWithHighlight = (code, previousCode = '') => {
    const lines = code.split('\n');
    const prevLines = previousCode.split('\n');
    
    return lines.map((line, index) => {
      const isNewLine = index >= prevLines.length || line !== prevLines[index];
      return (
        <div
          key={index}
          className={`code-line ${isNewLine ? 'code-line-new' : ''}`}
          style={{
            padding: '2px 8px',
            borderLeft: isNewLine ? '3px solid #28a745' : '3px solid transparent',
            backgroundColor: isNewLine ? 'rgba(40, 167, 69, 0.1)' : 'transparent',
            animation: isNewLine ? 'fadeInHighlight 0.8s ease-in-out' : 'none'
          }}
        >
          <span className="line-number" style={{ color: '#6c757d', marginRight: '12px', fontSize: '12px' }}>
            {index + 1}
          </span>
          <span style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}>
            {line || ' '}
          </span>
        </div>
      );
    });
  };

  const currentState = getCurrentCode();
  const previousState = currentStateIndex > 0 ? codeStates[currentStateIndex - 1] : { code: '' };

  return (
    <div className="container-fluid py-4">
      <style jsx>{`
        @keyframes fadeInHighlight {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideIn {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .evolution-card {
          transition: all 0.3s ease;
          animation: slideIn 0.5s ease-out;
        }
        
        .evolution-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .code-container {
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          min-height: 300px;
          position: relative;
          overflow: hidden;
        }
        
        .progress-bar-animated {
          animation: progress-wave 2s infinite;
        }
        
        @keyframes progress-wave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .change-badge {
          animation: bounceIn 0.6s ease-out;
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="row">
        <div className="col-12">
          <div className="evolution-card card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-code me-2"></i>
                Real-Time Code Evolution Visualization
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5>Code Evolution Timeline</h5>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={startEvolution}
                          disabled={isPlaying}
                        >
                          <i className="fas fa-play me-1"></i>
                          Play
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={pauseEvolution}
                          disabled={!isPlaying}
                        >
                          <i className="fas fa-pause me-1"></i>
                          Pause
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={resetEvolution}
                        >
                          <i className="fas fa-stop me-1"></i>
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    <div className="progress mb-3" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar bg-info ${isPlaying ? 'progress-bar-animated' : ''}`}
                        style={{
                          width: `${((currentStateIndex + 1) / codeStates.length) * 100}%`,
                          background: isPlaying ? 'linear-gradient(45deg, #007bff 25%, #0056b3 25%, #0056b3 50%, #007bff 50%, #007bff 75%, #0056b3 75%, #0056b3)' : '#007bff'
                        }}
                      ></div>
                    </div>
                    
                    <div className="code-container p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-info">
                          State {currentStateIndex + 1} of {codeStates.length}
                        </span>
                        <small className="text-muted">
                          {currentState.timestamp && new Date(currentState.timestamp).toLocaleTimeString()}
                        </small>
                      </div>
                      
                      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                        {renderCodeWithHighlight(currentState.code, previousState.code)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Evolution Stats</h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>Current Changes:</strong>
                        <div className="mt-2">
                          {currentState.changes && currentState.changes.map((change, index) => (
                            <span key={index} className="badge bg-success me-1 mb-1 change-badge">
                              {change}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="row text-center">
                        <div className="col-6">
                          <div className="card bg-light">
                            <div className="card-body py-2">
                              <i className="fas fa-plus-circle text-success"></i>
                              <div className="fw-bold">{currentState.linesAdded || 0}</div>
                              <small>Lines Added</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="card bg-light">
                            <div className="card-body py-2">
                              <i className="fas fa-minus-circle text-danger"></i>
                              <div className="fw-bold">{currentState.linesRemoved || 0}</div>
                              <small>Lines Removed</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <strong>Total Evolution:</strong>
                        <div className="progress mt-2" style={{ height: '20px' }}>
                          <div className="progress-bar bg-gradient" style={{ width: '75%' }}>
                            Complexity Growth
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card mt-3">
                    <div className="card-header">
                      <h6 className="mb-0">Add Custom Code</h6>
                    </div>
                    <div className="card-body">
                      <textarea
                        className="form-control mb-2"
                        rows="4"
                        placeholder="Enter your code here..."
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace', fontSize: '12px' }}
                      />
                      <button
                        className="btn btn-primary btn-sm w-100"
                        onClick={addCustomCodeState}
                        disabled={!customCode.trim()}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Add to Evolution
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline visualization */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-timeline me-2"></i>
                Evolution Timeline
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex overflow-auto pb-2" style={{ gap: '12px' }}>
                {codeStates.map((state, index) => (
                  <div
                    key={state.id}
                    className={`card ${index === currentStateIndex ? 'border-primary' : 'border-light'}`}
                    style={{
                      minWidth: '200px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      transform: index === currentStateIndex ? 'scale(1.05)' : 'scale(1)'
                    }}
                    onClick={() => setCurrentStateIndex(index)}
                  >
                    <div className="card-body p-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="fw-bold">State {index + 1}</small>
                        {index === currentStateIndex && (
                          <i className="fas fa-play-circle text-primary"></i>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace', overflow: 'hidden' }}>
                        {state.code.split('\n').slice(0, 3).map((line, i) => (
                          <div key={i} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            {line}
                          </div>
                        ))}
                        {state.code.split('\n').length > 3 && <div>...</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEvolutionVisualization;