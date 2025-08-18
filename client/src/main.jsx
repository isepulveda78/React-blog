import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

// Add global error handlers for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection caught:', event.reason)
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