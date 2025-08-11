import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './custom.css'

// Simple test to see if React is loading
console.log('🚀 React main.jsx loading...')

// Test simple component first
function TestApp() {
  return React.createElement('div', { 
    style: { 
      padding: '20px', 
      background: 'lightblue', 
      textAlign: 'center',
      fontSize: '24px'
    }
  }, '🎉 React is working! BlogCraft loading...')
}

const rootElement = document.getElementById('root')
console.log('📦 Root element found:', rootElement)

ReactDOM.createRoot(rootElement).render(
  React.createElement(React.StrictMode, null, 
    React.createElement(TestApp)
  )
)