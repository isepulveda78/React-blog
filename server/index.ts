import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Handle deployment port configuration
// Replit deployment forwards internal port to external port 80
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

console.log(`[server] starting with PORT=${PORT} (from env: ${process.env.PORT})`);

// Use memory store instead of requiring PostgreSQL
const MemStore = MemoryStore(session);

// Session configuration
app.use(session({
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: false, // Allow JavaScript access for debugging
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add cache-busting headers for development
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Health check endpoint for deployment
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Note: Routes will be registered in the main server startup

// Remove hardcoded HTML routes - let React router handle these paths

// Configure Express to serve JSX files with JavaScript MIME type
express.static.mime.define({'application/javascript': ['jsx']});

// Serve static files from built assets (using production build for stability)
console.log('[server] serving static files from dist/public');
app.use(express.static(path.join(__dirname, '../dist/public')));

// Handle client-side routing - serve from built files
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Skip WebSocket upgrade requests
  if (req.path === '/ws') {
    return res.status(404).send('WebSocket endpoint');
  }
  
  console.log('Serving index.html for path:', req.path);
  
  // Always serve built index.html for React routing stability
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Use the HTTP server from routes for WebSocket support
const httpServer = await registerRoutes(app);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[express] serving on port ${PORT}`);
  console.log(`[express] environment: ${process.env.NODE_ENV}`);
  console.log(`[express] binding to: 0.0.0.0:${PORT}`);
  console.log(`[websocket] WebSocket server ready on /ws`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`[express] production server ready for external connections`);
  }
});