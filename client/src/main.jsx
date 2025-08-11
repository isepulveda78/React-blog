import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// Import hot reload utilities
import './utils/hot-reload-utils.js'

// Enable Hot Module Replacement in development
if (import.meta.hot) {
  import.meta.hot.accept()
  console.log('🔥 Vite HMR enabled for instant updates')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)