import React from 'react'

// Ultra minimal React component to test basic functionality
function MinimalApp() {
  console.log('✅ MinimalApp component rendering...')
  
  return (
    <div style={{
      padding: '50px',
      background: '#4CAF50',
      color: 'white',
      textAlign: 'center',
      fontSize: '32px',
      fontFamily: 'Arial',
      margin: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    }}>
      🎉 REACT IS WORKING!
      <div style={{ fontSize: '18px', marginTop: '20px' }}>
        BlogCraft will load next...
      </div>
    </div>
  )
}

console.log('📦 MinimalApp component defined')
export default MinimalApp