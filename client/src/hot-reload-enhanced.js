// Enhanced Hot Reload System for React Components
// This provides fast refresh capabilities without full page reload

let isHotReloadActive = false;

// Enhanced hot reload with component-level updates
export function initializeHotReload() {
  if (isHotReloadActive) return;
  
  console.log('🔥 Initializing enhanced hot reload system...');
  
  // Create visual indicator
  const indicator = document.createElement('div');
  indicator.id = 'hot-reload-indicator';
  indicator.innerHTML = '⚡ FAST REFRESH ACTIVE';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
    z-index: 10000;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 2px solid rgba(255,255,255,0.3);
    animation: hotReloadPulse 2s infinite;
  `;
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes hotReloadPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    @keyframes hotReloadUpdate {
      0% { background: #28a745; transform: scale(1); }
      50% { background: #007bff; transform: scale(1.1); }
      100% { background: #28a745; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(indicator);
  
  // Update page title
  document.title = '⚡ FAST REFRESH - ' + document.title;
  
  let lastCheck = 0;
  let updateCount = 0;
  
  // Fast component update checking
  function checkComponentUpdates() {
    const now = Date.now();
    if (now - lastCheck < 800) return; // Throttle checks
    
    lastCheck = now;
    updateCount++;
    
    // Check multiple files for changes
    const filesToCheck = ['/src/main.jsx', '/src/App.jsx'];
    
    Promise.all(
      filesToCheck.map(file => 
        fetch(`${file}?t=${now}`, { method: 'HEAD', cache: 'no-cache' })
          .then(response => ({
            file,
            lastModified: response.headers.get('last-modified'),
            etag: response.headers.get('etag')
          }))
          .catch(() => ({ file, error: true }))
      )
    ).then(results => {
      const storageKey = 'hotreload_files';
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      let hasChanges = false;
      const newStored = {};
      
      results.forEach(({ file, lastModified, etag, error }) => {
        if (error) return;
        
        const fileKey = file.replace('/src/', '');
        const current = `${lastModified}:${etag}`;
        newStored[fileKey] = current;
        
        if (stored[fileKey] && stored[fileKey] !== current) {
          hasChanges = true;
          console.log(`🔄 Component update detected in ${fileKey}`);
        }
      });
      
      if (hasChanges && Object.keys(stored).length > 0) {
        // Animate indicator
        indicator.style.animation = 'hotReloadUpdate 1s ease-in-out';
        indicator.innerHTML = '🔄 UPDATING...';
        
        // Use Vite's HMR if available, otherwise fall back to reload
        if (import.meta.hot) {
          console.log('🚀 Using Vite Fast Refresh');
          // Vite will handle the update automatically
          setTimeout(() => {
            indicator.innerHTML = '⚡ FAST REFRESH ACTIVE';
            indicator.style.animation = 'hotReloadPulse 2s infinite';
          }, 1500);
        } else {
          console.log('🔄 Falling back to page reload');
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      }
      
      localStorage.setItem(storageKey, JSON.stringify(newStored));
    });
  }
  
  // Start checking
  const interval = setInterval(checkComponentUpdates, 1000);
  checkComponentUpdates(); // Initial check
  
  // Keyboard shortcut for manual refresh
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      console.log('🔥 Manual hot reload triggered');
      indicator.innerHTML = '🔄 MANUAL REFRESH';
      indicator.style.background = '#dc3545';
      clearInterval(interval);
      setTimeout(() => window.location.reload(), 500);
    }
  });
  
  isHotReloadActive = true;
  console.log('✅ Enhanced hot reload system ready');
  console.log('⌨️  Manual refresh: Ctrl+Shift+H (or Cmd+Shift+H on Mac)');
}

// Auto-initialize if in development
if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHotReload);
  } else {
    initializeHotReload();
  }
}

export default { initializeHotReload };