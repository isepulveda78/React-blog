import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// Enhanced Hot Reload System
import './hot-reload-enhanced.js'

// Enable Vite's Hot Module Replacement
if (import.meta.hot) {
  import.meta.hot.accept()
  
  // Accept updates to this module and its dependencies
  import.meta.hot.accept('./App.jsx', () => {
    console.log('🔄 App component updated via HMR')
  })
  
  console.log('⚡ Vite HMR + Fast Refresh enabled')
}

// ⚡ REACT HOT RELOAD TEST - Look for orange "FAST REFRESH" indicator and demo component!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)