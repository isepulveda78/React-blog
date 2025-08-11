import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './custom.css'

console.log('🚀 BlogCraft starting...')
console.log('📦 React version:', React.version)

// Simple working React component first
function WorkingApp() {
  console.log('✅ WorkingApp component rendering')
  return React.createElement('div', {
    style: {
      padding: '40px',
      background: '#007bff',
      color: 'white',
      textAlign: 'center',
      fontSize: '28px',
      fontFamily: 'Arial',
      margin: '20px',
      borderRadius: '10px'
    }
  }, [
    React.createElement('h1', { key: 'title' }, '🎉 BlogCraft React Working!'),
    React.createElement('p', { key: 'desc', style: { fontSize: '18px', marginTop: '15px' } }, 
      'React is successfully mounting. Full app loading next...'
    )
  ])
}

const rootElement = document.getElementById('root')
console.log('📦 Root element:', rootElement)

if (rootElement) {
  console.log('✅ Creating React root...')
  const reactRoot = ReactDOM.createRoot(rootElement)
  console.log('✅ Rendering WorkingApp...')
  reactRoot.render(React.createElement(WorkingApp))
  console.log('✅ WorkingApp rendered')
} else {
  console.error('❌ Root element not found')
}