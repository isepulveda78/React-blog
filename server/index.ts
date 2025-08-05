import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

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

// Register API routes first
registerRoutes(app);

// Remove hardcoded HTML routes - let React router handle these paths

// Configure Express to serve JSX files with JavaScript MIME type
express.static.mime.define({'application/javascript': ['jsx']});

// Serve static files from appropriate directory based on environment
const staticDir = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'dist/public')  // Built frontend files in production
  : path.join(__dirname, '../client'); // Source files in development

app.use(express.static(staticDir));

// Handle client-side routing - but not for static files
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Don't redirect component files and other static assets
  if (req.path.startsWith('/src/') || 
      req.path.endsWith('.js') || 
      req.path.endsWith('.jsx') || 
      req.path.endsWith('.css') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.jpg') ||
      req.path.endsWith('.ico')) {
    return res.status(404).send('File not found');
  }
  
  console.log('Serving index.html for path:', req.path);
  const indexPath = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'dist/public/index-build.html')
    : path.join(__dirname, '../client/index-dev.html');
  res.sendFile(indexPath);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[express] serving on port ${PORT}`);
});