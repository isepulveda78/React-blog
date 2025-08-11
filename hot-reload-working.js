// Super simple hot reload that definitely works
(function() {
  console.log('🔥 Starting reliable hot reload system...');
  
  // Show immediate visual feedback
  const indicator = document.createElement('div');
  indicator.innerHTML = '🔥 HOT RELOAD ACTIVE';
  indicator.style.cssText = `
    position: fixed; top: 10px; right: 10px; 
    background: #28a745; color: white; 
    padding: 8px 12px; border-radius: 4px; 
    font-size: 12px; z-index: 9999;
    font-family: Arial, sans-serif;
  `;
  document.body.appendChild(indicator);
  
  let lastModified = null;
  let checkCount = 0;
  
  function checkChanges() {
    checkCount++;
    console.log(`Hot reload check #${checkCount}`);
    
    fetch('/src/main.jsx?' + Date.now(), { method: 'HEAD' })
      .then(response => {
        const modified = response.headers.get('last-modified');
        console.log('File modified:', modified);
        
        if (lastModified && modified !== lastModified) {
          console.log('🔄 CHANGE DETECTED! Reloading...');
          indicator.innerHTML = '🔄 RELOADING...';
          indicator.style.background = '#007bff';
          setTimeout(() => location.reload(), 300);
        }
        
        lastModified = modified;
      })
      .catch(err => console.log('Check failed:', err));
  }
  
  // Check every 2 seconds
  setInterval(checkChanges, 2000);
  checkChanges(); // Initial check
  
  console.log('✅ Hot reload system is running');
})();