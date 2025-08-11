// Simple and effective hot reload system
console.log('🔥 Hot reload system starting...');

// Track file changes
let isReloading = false;
let checkInterval;

function showNotification(message, color = '#28a745') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${color};
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Simple file watcher
function checkForChanges() {
  if (isReloading) return;
  
  const timestamp = new Date().getTime();
  
  // Check multiple files for changes
  const filesToCheck = [
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/components/Home.jsx'
  ];
  
  Promise.all(
    filesToCheck.map(file => 
      fetch(`${file}?t=${timestamp}`, { method: 'HEAD' })
        .then(response => ({
          file,
          lastModified: response.headers.get('last-modified'),
          etag: response.headers.get('etag')
        }))
        .catch(() => null)
    )
  ).then(results => {
    results.forEach(result => {
      if (!result) return;
      
      const storageKey = `hotreload_${result.file}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored && stored !== result.lastModified && !isReloading) {
        isReloading = true;
        showNotification('🔄 Changes detected, reloading...', '#007bff');
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return;
      }
      
      if (result.lastModified) {
        localStorage.setItem(storageKey, result.lastModified);
      }
    });
  }).catch(error => {
    console.log('Hot reload check failed:', error);
  });
}

// Start checking for changes
function startHotReload() {
  // Clear any existing interval
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Check every second
  checkInterval = setInterval(checkForChanges, 1000);
  
  // Show initial notification
  showNotification('🔥 Hot reload active');
  
  console.log('✅ Hot reload system enabled - checking for changes every second');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startHotReload);
} else {
  startHotReload();
}

// Manual reload shortcut
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    showNotification('🔄 Manual reload triggered', '#dc3545');
    setTimeout(() => window.location.reload(), 300);
  }
});

// Export for manual use
window.hotReload = {
  start: startHotReload,
  stop: () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
      showNotification('🔴 Hot reload stopped', '#dc3545');
    }
  },
  reload: () => {
    showNotification('🔄 Reloading now...', '#007bff');
    setTimeout(() => window.location.reload(), 300);
  }
};