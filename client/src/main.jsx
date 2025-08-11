// Direct JavaScript test without imports first
console.log('✅ JavaScript is loading!')

// Test if we can find the root element
const rootElement = document.getElementById('root')
console.log('📦 Root element:', rootElement)

if (rootElement) {
  rootElement.innerHTML = `
    <div style="padding: 20px; background: lightgreen; text-align: center; font-size: 24px; margin: 20px;">
      ✅ Basic JavaScript Working!<br>
      Root element found and content inserted.
    </div>
  `
  console.log('✅ Content inserted into root')
} else {
  console.error('❌ Root element not found!')
}