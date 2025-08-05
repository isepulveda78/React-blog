// Hot reload COMPLETELY DISABLED for drag/resize debugging
if (false) {
  let lastCheck = Date.now();
  let checkCount = 0;
  
  function checkForChanges() {
    checkCount++;
    const timestamp = Date.now();
    
    // Check main.jsx file with cache-busting
    fetch(`/src/main.jsx?t=${timestamp}`, { 
      method: 'HEAD',
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(response => {
        const modified = response.headers.get('last-modified');
        const etag = response.headers.get('etag');
        
        // Store initial values
        if (!window.hotReloadState) {
          window.hotReloadState = { 
            lastModified: modified, 
            lastEtag: etag,
            initialized: true
          };
          return;
        }
        
        // Check if file changed
        const hasChanged = (
          (modified && modified !== window.hotReloadState.lastModified) ||
          (etag && etag !== window.hotReloadState.lastEtag)
        );
        
        if (hasChanged && window.hotReloadState.initialized) {
          console.log('File changed, reloading...', { 
            check: checkCount, 
            modified, 
            etag 
          });
          
          // Clear cache and reload
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              registrations.forEach(registration => registration.unregister());
            });
          }
          
          // Force reload with cache bypass
          window.location.reload(true);
        }
        
        // Update state
        window.hotReloadState.lastModified = modified;
        window.hotReloadState.lastEtag = etag;
      })
      .catch(error => {
        console.log('Hot reload check failed:', error.message);
      });
  }
  
  // DISABLED during drag/resize debugging - was every 300ms
  // const reloadInterval = setInterval(checkForChanges, 300);
  console.log('Hot reload DISABLED for CityBuilder drag/resize debugging');
  
  // Also check when window gains focus
  window.addEventListener('focus', checkForChanges);
  
  // Add keyboard shortcut for manual reload
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      console.log('Manual reload triggered');
      clearInterval(reloadInterval);
      window.location.reload(true);
    }
  });
  
  console.log('Enhanced hot reload enabled - changes will auto-refresh every 300ms');
  console.log('Manual reload: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
}