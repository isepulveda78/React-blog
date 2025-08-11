import React from 'react'
import ReactDOM from 'react-dom/client'
import MinimalApp from './minimal-app.jsx'

console.log('🚀 Starting minimal React app...')
console.log('📦 React imported:', typeof React)
console.log('📦 ReactDOM imported:', typeof ReactDOM)

const root = document.getElementById('root')
console.log('📦 Root element found:', !!root)

if (root) {
  console.log('✅ Creating React root...')
  const reactRoot = ReactDOM.createRoot(root)
  console.log('✅ Rendering MinimalApp...')
  
  reactRoot.render(React.createElement(MinimalApp))
  console.log('✅ MinimalApp rendered successfully')
} else {
  console.error('❌ Root element not found!')
}