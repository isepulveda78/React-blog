import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './compat.js'; // Load compatibility layer
import './index.css';

// Load main app based on environment
const container = document.getElementById('root');
const root = createRoot(container);

// In development, wait for components to load from window
// In production, this will be handled differently
const initApp = () => {
  if (window.App) {
    // Development mode - use existing CDN-based app
    root.render(
      React.createElement(StrictMode, null,
        React.createElement(window.App)
      )
    );
  } else {
    // Fallback loading message
    root.render(
      React.createElement('div', { 
        className: 'container text-center mt-5' 
      }, 
        React.createElement('div', { className: 'spinner-border' }, ''),
        React.createElement('p', { className: 'mt-3' }, 'Loading application...')
      )
    );
    
    // Try again after a short delay
    setTimeout(initApp, 100);
  }
};

// Start the app
initApp();