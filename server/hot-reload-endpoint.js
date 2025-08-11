// Hot reload endpoint to provide file change information
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let lastMainJsxStats = null;
let changeCount = 0;

export function setupHotReload(app) {
  // Endpoint to check for file changes
  app.get('/api/hot-reload/check', (req, res) => {
    try {
      const mainJsxPath = path.join(__dirname, '../client/src/main.jsx');
      const stats = fs.statSync(mainJsxPath);
      const currentModified = stats.mtime.getTime();
      
      // Initialize on first check
      if (!lastMainJsxStats) {
        lastMainJsxStats = currentModified;
        return res.json({ 
          changed: false, 
          timestamp: currentModified,
          initialized: true
        });
      }
      
      // Check if file changed
      const hasChanged = currentModified > lastMainJsxStats;
      
      if (hasChanged) {
        changeCount++;
        console.log(`🔄 Hot reload: Change #${changeCount} detected in main.jsx`);
        lastMainJsxStats = currentModified;
      }
      
      res.json({
        changed: hasChanged,
        timestamp: currentModified,
        changeCount: changeCount
      });
      
    } catch (error) {
      console.error('Hot reload check error:', error);
      res.json({ changed: false, error: error.message });
    }
  });
}