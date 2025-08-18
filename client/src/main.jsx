import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// Add global error handlers for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Filter out Vite hot reload connection errors - these are normal during development
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('Failed to fetch') || event.reason.message.includes('NetworkError')) &&
      event.reason.stack && event.reason.stack.includes('@vite/client')) {
    console.log('[Vite] Hot reload connection error (this is normal during development restarts)')
    event.preventDefault()
    return
  }
  
  console.error('=== UNHANDLED PROMISE REJECTION ===')
  console.error('Reason:', event.reason)
  console.error('Promise:', event.promise)
  if (event.reason && event.reason.stack) {
    console.error('Stack:', event.reason.stack)
  }
  console.error('Current URL:', window.location.href)
  console.error('=================================')
  event.preventDefault() // Prevent the default browser behavior
})

window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error)
})

console.log('🚀 BlogCraft starting...')
console.log('📦 React version:', React.version)

const rootElement = document.getElementById('root')
console.log('📦 Root element:', rootElement)

if (rootElement) {
  console.log('✅ Creating React root...')
  const reactRoot = ReactDOM.createRoot(rootElement)
  console.log('✅ Rendering full BlogCraft App...')
  reactRoot.render(<App />)
  console.log('✅ BlogCraft App rendered')
} else {
  console.error('❌ Root element not found')
}