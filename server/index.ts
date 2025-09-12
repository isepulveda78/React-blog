import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import MemoryStore from "memorystore";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
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

// Configure trust proxy for Replit deployment
app.set('trust proxy', 1);

// Add CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Security middleware - implement first for all requests
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
      fontSrc: ["'self'", "data:", "https:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'", "https://docs.google.com", "https://drive.google.com", "https://www.google.com", "https://youtube.com", "https://www.youtube.com", "https://youtu.be", "https://player.vimeo.com", "https://codepen.io"],
      frameAncestors: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for authentication endpoints - increased for classroom use
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth attempts per windowMs (allows for classroom use)
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Use MongoDB store for robust session management
// Fallback to in-memory if MongoDB is not available
let sessionStore;
if (process.env.MONGODB_URI) {
  console.log('[session] Using MongoDB for session storage');
  sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // lazy session update - only update if session changes
    ttl: 24 * 60 * 60, // 24 hours session expiry
    collectionName: 'sessions',
    stringify: false // Don't stringify session data
  });
} else {
  console.log('[session] MongoDB not available, falling back to in-memory sessions');
  const MemStore = MemoryStore(session);
  sessionStore = new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
}
const sessionSecret = process.env.SESSION_SECRET || (() => {
  console.warn('[SECURITY WARNING] Using fallback session secret. Set SESSION_SECRET environment variable in production!');
  return 'blogcraft-secret-key-12345';
})();

// Store session config for WebSocket validation
app.set('sessionStore', sessionStore);
app.set('sessionSecret', sessionSecret);

// Session configuration - ensure consistency between dev and production
app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  resave: true, // Changed to true to ensure sessions are saved
  saveUninitialized: true, // Changed to true to save new sessions
  name: 'connect.sid', // Use standard session name
  cookie: {
    secure: false, // Keep false for development
    httpOnly: true, // Keep true for security
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/' // Explicit path
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply input sanitization middleware to all requests
import { sanitizeRequestBody } from './security.js';
app.use(sanitizeRequestBody);



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

// Static file serving handled by Vite in development
if (process.env.NODE_ENV !== 'development') {
  console.log('[server] serving static files from dist/public');
  app.use(express.static(path.join(__dirname, '../dist/public')));
  // In production, images should be in dist/img
  app.use('/img', express.static(path.join(__dirname, '../dist/img')));
}

// Add debug route BEFORE API routes
app.get('/debug', (req, res) => {
  console.log('[debug] Debug route accessed');
  res.sendFile(path.join(__dirname, '../client/debug.html'));
});

// Use the HTTP server from routes for WebSocket support (MUST come before Vite)
const httpServer = await registerRoutes(app);

// In development, setup Vite for React with JSX transformation (AFTER API routes)
if (process.env.NODE_ENV === 'development') {
  console.log('[server] development mode - setting up Vite for React');
  // Import and setup Vite development server
  const { setupVite } = await import('./vite.js');
  await setupVite(app);
}

// Setup development reload system with WebSocket
if (process.env.NODE_ENV === 'development') {
  // const { setupDevReload } = await import('./dev-reload.js');
  // setupDevReload(app, httpServer);
}

// Add cache-busting headers in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
  });
}

// Handle client-side routing fallback ONLY for production
// In development, Vite middleware handles SPA fallback
if (process.env.NODE_ENV !== 'development') {
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Skip WebSocket upgrade requests
    if (req.path === '/ws') {
      return res.status(404).send('WebSocket endpoint');
    }
    
    // Skip debug route
    if (req.path === '/debug') {
      return; // Already handled above
    }
    
    console.log('[root] Serving React app from index.html for path:', req.path);
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  });
}

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[express] serving on port ${PORT}`);
  console.log(`[express] environment: ${process.env.NODE_ENV}`);
  console.log(`[express] binding to: 0.0.0.0:${PORT}`);
  console.log(`[websocket] WebSocket server ready on /ws`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`[express] production server ready for external connections`);
  }
});