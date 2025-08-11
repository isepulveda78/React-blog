import express from "express";
import session from "express-session";
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
      frameSrc: ["'none'"],
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

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth attempts per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Use memory store instead of requiring PostgreSQL
const MemStore = MemoryStore(session);

// Session configuration - ensure consistency between dev and production
app.use(session({
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || (() => {
    console.warn('[SECURITY WARNING] Using fallback session secret. Set SESSION_SECRET environment variable in production!');
    return 'dev-fallback-secret-' + Date.now();
  })(),
  resave: false,
  saveUninitialized: false,
  name: 'blogcraft.sid', // Explicit session name
  cookie: {
    secure: false, // Keep false for both dev and production (Replit handles HTTPS)
    httpOnly: false, // Allow JavaScript access for authentication
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

// In development, serve from client folder, not dist
if (process.env.NODE_ENV === 'development') {
  console.log('[server] DEVELOPMENT MODE: serving static files from client/public');
  app.use(express.static(path.join(__dirname, '../client/public')));
} else {
  console.log('[server] serving static files from dist/public');
  app.use(express.static(path.join(__dirname, '../dist/public')));
}

// In development, let Vite handle JSX transformation via proxy
if (process.env.NODE_ENV === 'development') {
  console.log('[server] development mode - JSX handled by Vite');
  // Import and setup Vite development server
  const { setupVite } = await import('./vite.js');
  await setupVite(app);
}

// Use the HTTP server from routes for WebSocket support (MUST come before dev reload)
const httpServer = await registerRoutes(app);

// Setup development reload system with WebSocket
if (process.env.NODE_ENV === 'development') {
  const { setupDevReload } = await import('./dev-reload.js');
  setupDevReload(app, httpServer);
}

// Handle client-side routing - serve from built files (MUST come after API routes)
if (process.env.NODE_ENV !== 'development') {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Skip WebSocket upgrade requests
    if (req.path === '/ws') {
      return res.status(404).send('WebSocket endpoint');
    }
    
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