import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import all components to ensure they're included in the production bundle
// and available on the window object
import './pages/city-builder-working.jsx'
import './pages/educational-tools.jsx'
import './pages/bingo-generator.jsx'
import './pages/sound-demo.jsx'
import './pages/mp3-guide.jsx'
import './pages/spanish-alphabet.jsx'
import './pages/word-sorter.jsx'
import './pages/user-profile.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)