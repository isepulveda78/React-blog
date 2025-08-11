// Hot reload utilities for development
export function setupHotReload() {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Enhanced hot reload with visual feedback
  const showReloadNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 10px 15px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  // Setup hot reload monitoring
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      showReloadNotification('🔥 Hot reload: Changes detected');
    });
    
    import.meta.hot.on('vite:beforeUpdate', () => {
      showReloadNotification('⚡ Updating components...');
    });
    
    import.meta.hot.on('vite:afterUpdate', () => {
      showReloadNotification('✅ Components updated');
    });
  }
  
  // Setup file watching for custom hot reload
  let lastModified = null;
  const checkForUpdates = async () => {
    try {
      const response = await fetch('/src/main.jsx', { method: 'HEAD' });
      const modified = response.headers.get('last-modified');
      
      if (lastModified && modified !== lastModified) {
        showReloadNotification('🔄 Reloading page...');
        setTimeout(() => window.location.reload(), 500);
      }
      
      lastModified = modified;
    } catch (error) {
      // Silently handle errors
    }
  };
  
  // Check every 1 second for changes
  setInterval(checkForUpdates, 1000);
  
  console.log('🔥 Hot reload system initialized');
}

// Auto-setup when imported
setupHotReload();