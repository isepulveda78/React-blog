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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Register API routes first
registerRoutes(app);

// Remove hardcoded HTML routes - let React router handle these paths

// Configure Express to serve JSX files with JavaScript MIME type
express.static.mime.define({'application/javascript': ['jsx']});

// Serve static files from built assets
if (process.env.NODE_ENV === 'production') {
  console.log('[server] serving static files from dist/public');
  app.use(express.static(path.join(__dirname, './public')));
} else {
  console.log('[server] serving static files from dist/public (development)');
  app.use(express.static(path.join(__dirname, '../dist/public')));
}

// Handle client-side routing - serve from built files
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  console.log('Serving index.html for path:', req.path);
  
  // In development, use built files from dist/public
  if (process.env.NODE_ENV !== 'production') {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  } else {
    res.sendFile(path.join(__dirname, './public/index.html'));
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[express] serving on port ${PORT}`);
  console.log(`[express] environment: ${process.env.NODE_ENV}`);
  console.log(`[express] binding to: 0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`[express] production server ready for external connections`);
  }
});