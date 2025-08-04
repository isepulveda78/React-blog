// Simple hot reload for development
if (window.location.hostname.includes('replit') || window.location.hostname === 'localhost') {
  let lastModified = '';
  
  function checkForChanges() {
    fetch('/src/main.jsx', { method: 'HEAD' })
      .then(response => {
        const modified = response.headers.get('last-modified');
        if (lastModified && lastModified !== modified) {
          console.log('File changed, reloading...');
          window.location.reload();
        }
        lastModified = modified;
      })
      .catch(() => {
        // Ignore errors, continue checking
      });
  }
  
  // Check every 500ms for changes
  setInterval(checkForChanges, 500);
  console.log('Hot reload enabled - changes will auto-refresh the page');
}