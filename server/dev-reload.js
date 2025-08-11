import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let lastModified = Date.now();
let wsClients = new Set();

// Watch for file changes in client/src
function watchFiles() {
  const srcDir = path.join(__dirname, '../client/src');
  
  // Get last modified time of all files in src
  function getLastModified() {
    let latestTime = 0;
    
    function checkDir(dir) {
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            checkDir(filePath);
          } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
            latestTime = Math.max(latestTime, stat.mtime.getTime());
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }
    
    checkDir(srcDir);
    return latestTime;
  }
  
  // Update last modified time and notify clients
  setInterval(() => {
    const current = getLastModified();
    if (current > lastModified) {
      lastModified = current;
      console.log('🔥 File change detected:', new Date(current).toISOString());
      
      // Notify all WebSocket clients
      wsClients.forEach(ws => {
        if (ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify({ type: 'reload', timestamp: current }));
        }
      });
    }
  }, 500);
}

export function setupDevReload(app, httpServer) {
  watchFiles();
  
  // WebSocket server for hot reload
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/hot-reload' 
  });
  
  wss.on('connection', (ws) => {
    console.log('🔌 Hot reload WebSocket client connected');
    wsClients.add(ws);
    
    ws.on('close', () => {
      wsClients.delete(ws);
    });
    
    ws.on('error', (err) => {
      console.error('Hot reload WebSocket error:', err);
      wsClients.delete(ws);
    });
  });
  
  app.get('/api/dev/check', (req, res) => {
    res.json({ lastModified });
  });
  
  console.log('🔥 Development file watcher and WebSocket started');
}

export { lastModified };