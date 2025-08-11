import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// FORCE CACHE CLEAR
console.log('🚀 MAIN.JSX LOADED - TIME:', new Date().toLocaleTimeString())

// Force immediate cache clear
if (typeof window !== 'undefined' && 'caches' in window) {
  window.caches.keys().then(names => {
    names.forEach(name => window.caches.delete(name))
    console.log('🧹 Cleared', names.length, 'caches')
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)