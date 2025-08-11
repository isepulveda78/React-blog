import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// Working Hot Reload System
console.log('🔥 Hot reload system initializing...')

let lastReloadCheck = Date.now()

// Wait for page to load before starting hot reload
setTimeout(() => {
  console.log('🔥 Starting hot reload checks')
  
  setInterval(() => {
    fetch('/api/dev/check?t=' + Date.now(), { 
      cache: 'no-cache',
      method: 'GET'
    })
    .then(res => {
      if (!res.ok) throw new Error('Response not ok')
      return res.json()
    })
    .then(data => {
      console.log('Hot reload check:', data.lastModified, 'vs', lastReloadCheck)
      if (data.lastModified > lastReloadCheck) {
        console.log('🔄 RELOADING: Files changed! Server time:', new Date(data.lastModified))
        alert('HOT RELOAD TRIGGERED! Page will refresh now.')
        lastReloadCheck = Date.now()
        window.location.reload()
      }
    })
    .catch(err => {
      console.log('Hot reload check failed:', err.message)
    })
  }, 1000) // Check every second
}, 2000) // Wait 2 seconds before starting

// 🔥 HOT RELOAD TEST CHANGE - If you see this comment change, it's working!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)