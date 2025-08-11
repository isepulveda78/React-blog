import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './custom.css'

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