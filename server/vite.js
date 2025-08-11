import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let viteServer;

export async function setupVite(app) {
  try {
    // Create Vite server in middleware mode
    viteServer = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 3001,
          host: 'localhost'
        },
        host: true,
        cors: {
          origin: true,
          credentials: true
        }
      },
      appType: 'spa',
      root: path.resolve(__dirname, '../client'),
      build: {
        outDir: '../dist/public',
      },
    });

    // Use vite's connect instance as middleware for all requests
    app.use(viteServer.middlewares);
    
    console.log('[vite] Development server middleware enabled');
  } catch (error) {
    console.error('[vite] Failed to start development server:', error);
  }
}

export function closeVite() {
  if (viteServer) {
    viteServer.close();
  }
}