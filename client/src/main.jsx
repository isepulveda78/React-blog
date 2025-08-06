import React from 'react'
import ReactDOM from 'react-dom/client'
// FORCE LOADING MINIMAL APP TO FIX REACT ERROR #130
import App from './App-minimal.jsx'
import './index.css'
import './custom.css'

console.log('MAIN.JSX: Loading App-minimal.jsx to fix React error')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)