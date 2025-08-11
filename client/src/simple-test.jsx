import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple React component to test if Vite + React is working
function SimpleTest() {
  return (
    <div style={{ 
      padding: '40px', 
      background: '#e3f2fd', 
      textAlign: 'center',
      fontSize: '24px',
      fontFamily: 'Arial',
      margin: '20px',
      borderRadius: '8px',
      border: '2px solid #2196f3'
    }}>
      🎉 React + Vite Working!
      <br />
      <small style={{ fontSize: '16px', color: '#666' }}>
        BlogCraft will load next...
      </small>
    </div>
  )
}

console.log('🚀 Simple React test starting...')

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(<SimpleTest />)
  console.log('✅ Simple React component rendered')
} else {
  console.error('❌ Root element not found')
}