import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// Development Hot Reload
if (import.meta.env.DEV) {
  console.log('🔥 Development mode - Hot reload enabled')
  
  // Simple hot reload check
  let lastModified = localStorage.getItem('lastReload') || Date.now()
  
  setInterval(() => {
    fetch('/api/dev/check', { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => {
        if (data.lastModified && data.lastModified > lastModified) {
          console.log('🔄 Files changed - reloading...')
          localStorage.setItem('lastReload', data.lastModified)
          window.location.reload()
        }
      })
      .catch(() => {}) // Ignore errors
  }, 1000)
}

// 🔥 HOT RELOAD TEST CHANGE - If you see this comment change, it's working!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)