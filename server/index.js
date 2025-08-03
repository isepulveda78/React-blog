import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { createViteMiddleware } from "./vite.js";
import { registerRoutes } from "./routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

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

// Create Vite middleware for development
createViteMiddleware(app);

// Register API routes
registerRoutes(app);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[express] serving on port ${PORT}`);
});