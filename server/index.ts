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
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes first
registerRoutes(app);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve React modules with proper MIME types
app.get('*.jsx', (req, res, next) => {
  res.type('text/javascript');
  next();
});

app.get('*.js', (req, res, next) => {
  res.type('text/javascript');
  next();
});

// Handle client-side routing - send index.html for non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[express] serving on port ${PORT}`);
});