import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// Working Hot Reload System
console.log('🔥 Hot reload system active')

let lastReloadCheck = Date.now()

// Fast hot reload with immediate feedback
setInterval(() => {
  fetch('/api/dev/check?t=' + Date.now(), { 
    cache: 'no-cache',
    method: 'GET'
  })
  .then(res => res.json())
  .then(data => {
    if (data.lastModified > lastReloadCheck) {
      console.log('🔄 Hot reload: Files changed, reloading page...')
      lastReloadCheck = Date.now()
      window.location.reload()
    }
  })
  .catch(() => {}) // Ignore network errors
}, 500) // Check every 500ms for immediate response

// 🔥 HOT RELOAD TEST CHANGE - If you see this comment change, it's working!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)