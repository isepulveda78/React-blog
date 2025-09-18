import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import crypto from 'crypto';
import url from 'url';
import signature from 'cookie-signature';
import { 
  validateEmail, 
  validateUsername, 
  validatePostTitle, 
  validatePostContent,
  validateCategoryName,
  validateCommentContent,
  validateChatroomName,
  validatePassword,
  validateURL,
  logSecurityEvent,
  sanitizeInput
} from "./security.js";

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('[upload] File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log('[upload] File rejected - invalid type:', file.mimetype);
      cb(new Error(`Only image files are allowed! Received: ${file.mimetype}`), false);
    }
  }
});

// Configure Google OAuth Strategy with environment-based callback URL
const getCallbackURL = () => {
  // Use environment variable if set, otherwise use the custom domain
  return process.env.GOOGLE_CALLBACK_URL || "https://mr-s-teaches.com/api/auth/google/callback";
};

console.log('[google-oauth] Callback URL:', getCallbackURL());
console.log('[google-oauth] Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
console.log('[google-oauth] Client ID starts with:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20));
console.log('[google-oauth] Client ID ends with:', process.env.GOOGLE_CLIENT_ID?.substring(-20));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID?.trim(),
  clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
  callbackURL: getCallbackURL()
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('[google-auth] Processing Google login for:', profile.emails[0].value);
    
    // Check if user exists with this Google ID
    let user = await storage.getUserByGoogleId(profile.id);
    
    if (user) {
      console.log('[google-auth] Found existing user with Google ID');
      return done(null, user);
    }

    // Check if user exists with this email
    user = await storage.getUserByEmail(profile.emails[0].value);
    
    if (user) {
      console.log('[google-auth] Linking Google account to existing user');
      // Link Google account to existing user
      await storage.linkGoogleAccount(user.id, profile.id);
      return done(null, user);
    }

    console.log('[google-auth] Creating new user from Google profile');
    // Create new user with Google account
    const newUser = await storage.createUser({
      email: profile.emails[0].value,
      username: profile.emails[0].value.split('@')[0] + '_google',
      name: profile.displayName,
      googleId: profile.id,
      isAdmin: false,
      approved: true   // New users can read posts immediately
    });

    return done(null, newUser);
  } catch (error) {
    console.error('[google-auth] Error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Session validation function for WebSocket connections
function validateWebSocketSession(req, sessionStore, secret, callback) {
  try {
    const cookies = req.headers.cookie;
    
    if (!cookies) {
      return callback(new Error('No cookies provided'));
    }

    // Extract session ID from cookies
    const sessionCookieMatch = cookies.match(/connect\.sid=([^;]+)/);
    if (!sessionCookieMatch) {
      return callback(new Error('No session cookie found'));
    }

    let sessionId = sessionCookieMatch[1];
    
    // URL decode the session ID
    sessionId = decodeURIComponent(sessionId);
    
    // Handle signed cookies using the same library as express-session
    if (sessionId.startsWith('s:')) {
      try {
        // Use cookie-signature library to unsign the cookie
        const unsigned = signature.unsign(sessionId.slice(2), secret);
        
        if (unsigned === false) {
          return callback(new Error('Session signature invalid'));
        }
        sessionId = unsigned;
      } catch (signatureError) {
        console.log('[websocket] Signature verification failed:', signatureError.message);
        return callback(new Error('Session signature verification failed'));
      }
    }

    // Get session from store
    sessionStore.get(sessionId, (err, session) => {
      if (err) {
        return callback(new Error('Session store error: ' + err.message));
      }
      
      if (!session) {
        return callback(new Error('Session not found'));
      }
      
      if (!session.user) {
        return callback(new Error('No user in session'));
      }
      
      // Session is valid
      callback(null, session);
    });
  } catch (error) {
    callback(new Error('Session validation error: ' + error.message));
  }
}

export function registerRoutes(app) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Get session store and secret for WebSocket validation
  const sessionStore = app.get('sessionStore');
  const sessionSecret = app.get('sessionSecret');

  // Audio proxy to handle CORS and hotlinking restrictions from cloud storage
  app.get('/api/audio-proxy', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    try {
      console.log('[Audio Proxy] Fetching:', url);
      
      // Convert Google Drive sharing URL to direct download URL
      let fetchUrl = url;
      if (url.includes('drive.google.com/file/d/')) {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          fetchUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
          console.log('[Audio Proxy] Converted Google Drive URL to:', fetchUrl);
        }
      }
      
      // Fetch the audio file with proper headers to bypass restrictions
      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'audio/*,*/*;q=0.9',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        redirect: 'follow'
      });
      
      if (!response.ok) {
        console.error('[Audio Proxy] Failed to fetch:', response.status, response.statusText);
        return res.status(response.status).json({ 
          error: `Failed to fetch audio: ${response.status} ${response.statusText}` 
        });
      }
      
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const contentLength = response.headers.get('content-length');
      
      console.log('[Audio Proxy] Success - Content-Type:', contentType, 'Size:', contentLength);
      
      // Check if we got HTML instead of audio (common with Google Drive)
      if (contentType.includes('text/html')) {
        console.error('[Audio Proxy] Received HTML instead of audio - file may not be publicly accessible');
        return res.status(400).json({ 
          error: 'Received HTML instead of audio file. Make sure your Google Drive file is publicly shared and accessible.' 
        });
      }
      
      // Set appropriate headers for audio streaming
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
      
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      
      // Handle range requests for audio seeking
      const range = req.headers.range;
      if (range && contentLength) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength) - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
        res.setHeader('Content-Length', chunksize);
      }
      
      // Convert response to readable stream and pipe to response
      const reader = response.body.getReader();
      
      const stream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (error) {
          console.error('[Audio Proxy] Streaming error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Streaming failed' });
          }
        }
      };
      
      stream();
      
    } catch (error) {
      console.error('[Audio Proxy] Error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to proxy audio file',
          details: error.message 
        });
      }
    }
  });

  // Google OAuth routes with error handling
  app.get('/api/auth/google', (req, res, next) => {
    console.log('[google-auth] Starting Google OAuth flow');
    console.log('[google-auth] Request host:', req.get('host'));
    console.log('[google-auth] Request protocol:', req.protocol);
    console.log('[google-auth] X-Forwarded-Proto:', req.get('x-forwarded-proto'));
    console.log('[google-auth] Callback URL:', getCallbackURL());
    
    try {
      passport.authenticate('google', { 
        scope: ['profile', 'email'],
        failureMessage: true 
      })(req, res, next);
    } catch (error) {
      console.error('[google-auth] Error during authentication:', error);
      res.redirect('/?error=google-setup-error');
    }
  });

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/?error=google-auth-failed',
      failureMessage: true 
    }),
    async (req, res) => {
      try {
        console.log('[google-callback] User authenticated:', req.user?.email);
        
        // All new users are now automatically approved for reading posts
        console.log('[google-callback] User approved, setting session');
        
        console.log('[google-callback] Setting user session');
        // Set session for approved users
        req.session.user = req.user;
        
        // Explicitly save session
        req.session.save((err) => {
          if (err) {
            console.error('[google-callback] Session save error:', err);
            res.redirect('/?error=session-error');
          } else {
            console.log('[google-callback] Session saved successfully');
            console.log('[auth] Session set for user:', req.user.email);
            console.log('[auth] Session ID:', req.sessionID);
            res.redirect('/');
          }
        });
      } catch (error) {
        console.error('[google-callback] Error:', error);
        res.redirect('/?error=callback-error');
      }
    }
  );

  // Authentication status endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      console.log('[auth/me] Session user:', req.session?.user?.email || 'undefined');
      console.log('[auth/me] Session ID:', req.sessionID);
      console.log('[auth/me] User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
      
      if (req.session?.user) {
        // Return user from session
        res.json(req.session.user);
      } else {
        res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quick login endpoint for testing
  app.post("/api/auth/quick-login", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email || "admin@example.com");
      
      if (user) {
        console.log('[quick-login] Setting session for user:', user.email);
        console.log('[quick-login] Session ID:', req.sessionID);
        console.log('[quick-login] User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
        req.session.user = user;
        
        // Explicitly save session
        req.session.save((err) => {
          if (err) {
            console.error('[quick-login] Session save error:', err);
            res.status(500).json({ message: "Session save error" });
          } else {
            console.log('[quick-login] Session saved successfully');
            res.json(user);
          }
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Quick login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    console.log('[auth] Session check - user exists:', !!req.session.user);
    console.log('[auth] Full session ID:', req.sessionID);
    console.log('[auth] Session details:', req.session);
    
    if (req.session.user) {
      console.log('[auth] User session found:', req.session.user.email, 'isAdmin:', req.session.user.isAdmin);
      res.json(req.session.user);
    } else {
      console.log('[auth] No user session found');
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Get teachers list for registration
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      // Return only necessary information for the dropdown
      const teacherList = teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        username: teacher.username
      }));
      res.json(teacherList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  // Get students for a specific teacher
  app.get("/api/teacher/students", async (req, res) => {
    try {
      // Check if user is teacher or admin
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (req.session.user.role !== 'teacher' && !req.session.user.isAdmin) {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { teacherId } = req.query;
      
      // If teacherId is not provided, use current user's ID (for teachers viewing their own students)
      const targetTeacherId = teacherId || req.session.user.id;
      
      // If the requesting user is not an admin, they can only view their own students
      if (!req.session.user.isAdmin && targetTeacherId !== req.session.user.id) {
        return res.status(403).json({ message: "You can only view your own students" });
      }

      console.log(`[teacher/students] Fetching students for teacher: ${targetTeacherId}`);
      
      const students = await storage.getStudentsByTeacher(targetTeacherId);
      
      // Return safe student data
      const safeStudents = students.map(student => ({
        id: student.id,
        email: student.email,
        name: student.name,
        username: student.username,
        approved: student.approved,
        createdAt: student.createdAt
      }));
      
      res.json(safeStudents);
    } catch (error) {
      console.error("Error fetching students for teacher:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, name, password, teacherId } = req.body;

      // Input validation
      if (!validateEmail(email)) {
        logSecurityEvent('INVALID_EMAIL_REGISTRATION', { email: sanitizeInput(email), ip: req.ip });
        return res.status(400).json({ message: "Please provide a valid email address" });
      }

      if (!validateUsername(username)) {
        logSecurityEvent('INVALID_USERNAME_REGISTRATION', { username: sanitizeInput(username), ip: req.ip });
        return res.status(400).json({ message: "Username must be 3-30 characters, alphanumeric with hyphens/underscores only" });
      }

      if (!name || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({ message: "Name must be between 2-100 characters" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        logSecurityEvent('WEAK_PASSWORD_ATTEMPT', { username: sanitizeInput(username), ip: req.ip });
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        logSecurityEvent('DUPLICATE_EMAIL_REGISTRATION', { email: sanitizeInput(email), ip: req.ip });
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        logSecurityEvent('DUPLICATE_USERNAME_REGISTRATION', { username: sanitizeInput(username), ip: req.ip });
        return res.status(400).json({ message: "Username is already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Validate teacher selection (all new users are students by default)
      if (teacherId) {
        // Verify the selected teacher exists and is approved
        const selectedTeacher = await storage.getUserById(teacherId);
        if (!selectedTeacher) {
          return res.status(400).json({ message: "Selected teacher not found" });
        }
        if (selectedTeacher.role !== 'teacher') {
          return res.status(400).json({ message: "Selected user is not a teacher" });
        }
        if (!selectedTeacher.approved) {
          return res.status(400).json({ message: "Selected teacher is not approved" });
        }
      } else {
        // Require teacher selection for new student registrations
        return res.status(400).json({ message: "Please select a teacher" });
      }

      // Create user (all new users are students by default)
      const userData = {
        email: email.toLowerCase().trim(), // Normalize email
        username: username.trim(),
        name: name.trim(),
        password: hashedPassword,
        teacherId: teacherId, // Always include teacher for new students
        isAdmin: false,
        approved: true   // New users can read posts immediately
      };

      const user = await storage.createUser(userData);

      logSecurityEvent('USER_REGISTERED', { 
        email: sanitizeInput(email), 
        username: sanitizeInput(username), 
        role: 'student', // All new users are students
        teacherId: teacherId ? sanitizeInput(teacherId) : null,
        ip: req.ip 
      });

      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      // Set session for new user (automatically approved for reading)
      req.session.userId = user.id;
      req.session.user = userResponse;
      
      res.json({ 
        ...userResponse, 
        message: "Registration successful! You can now read blog posts and use educational tools." 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!validateEmail(email)) {
        logSecurityEvent('INVALID_EMAIL_LOGIN', { email: sanitizeInput(email), ip: req.ip });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!password || typeof password !== 'string') {
        logSecurityEvent('EMPTY_PASSWORD_LOGIN', { email: sanitizeInput(email), ip: req.ip });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        logSecurityEvent('NONEXISTENT_USER_LOGIN', { email: sanitizeInput(email), ip: req.ip });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        logSecurityEvent('FAILED_PASSWORD_LOGIN', { email: sanitizeInput(email), ip: req.ip });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // All users are now automatically approved for reading posts
      // (Admin privileges still require separate approval)

      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      // Set session
      req.session.userId = user.id;
      req.session.user = userResponse;
      
      console.log('[auth] Session set for user:', userResponse.email);
      console.log('[auth] Session ID:', req.sessionID);

      res.json(userResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
  });

  // Simple in-memory rate limiting for password reset requests
  const passwordResetLimits = new Map();
  const RESET_RATE_LIMIT = 5; // Max 5 requests per hour per IP/email
  const RESET_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

  const isPasswordResetRateLimited = (key) => {
    const now = Date.now();
    const requests = passwordResetLimits.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < RESET_RATE_WINDOW);
    
    if (recentRequests.length >= RESET_RATE_LIMIT) {
      return true;
    }
    
    // Add current request
    recentRequests.push(now);
    passwordResetLimits.set(key, recentRequests);
    
    return false;
  };

  // Password Reset - Request Token
  app.post("/api/auth/password-reset/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Validate email format
      if (!validateEmail(email)) {
        logSecurityEvent('INVALID_EMAIL_RESET_REQUEST', { email: sanitizeInput(email), ip: req.ip });
        // Always return success to prevent user enumeration
        return res.json({ message: "If an account exists with that email, a password reset link will be sent." });
      }

      // Rate limiting by IP and email
      const ipKey = `ip:${req.ip}`;
      const emailKey = `email:${email.toLowerCase()}`;
      
      if (isPasswordResetRateLimited(ipKey) || isPasswordResetRateLimited(emailKey)) {
        logSecurityEvent('PASSWORD_RESET_RATE_LIMIT', { email: sanitizeInput(email), ip: req.ip });
        return res.status(429).json({ message: "Too many password reset requests. Please try again later." });
      }

      // Check if user exists (but always return success)
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      if (user) {
        // Generate secure token (32 bytes = 64 hex characters)
        const token = crypto.randomBytes(32).toString('hex');
        
        // Hash the token for storage (using SHA-256 for deterministic hashing)
        const tokenDigest = crypto.createHash('sha256').update(token).digest('hex');
        
        // Token expires in 30 minutes
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        
        // Store the reset token
        await storage.createPasswordReset(user.id, tokenDigest, expiresAt, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        // In development, log the token to console for easy testing
        if (process.env.NODE_ENV !== 'production') {
          const resetLink = `${req.protocol}://${req.get('host')}/reset?token=${token}`;
          console.log(`[PASSWORD_RESET] Password reset requested for: ${email}`);
          console.log(`[PASSWORD_RESET] Reset link: ${resetLink}`);
          console.log(`[PASSWORD_RESET] Token: ${token}`);
        }
        
        logSecurityEvent('PASSWORD_RESET_REQUESTED', { email: sanitizeInput(email), ip: req.ip });
      }
      
      // Always return success (prevents user enumeration)
      res.json({ message: "If an account exists with that email, a password reset link will be sent." });
      
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Password Reset - Verify Token
  app.post("/api/auth/password-reset/verify", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token || typeof token !== 'string' || token.length !== 64) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Generate token digest for lookup
      const tokenDigest = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find password reset by token digest
      let foundReset = null;
      try {
        foundReset = await storage.findValidPasswordResetByDigest(tokenDigest);
      } catch (err) {
        // Token lookup failed
        console.error('Password reset verify error:', err);
      }
      
      if (!foundReset) {
        logSecurityEvent('INVALID_PASSWORD_RESET_TOKEN', { token: token.substring(0, 8) + '...', ip: req.ip });
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      res.json({ message: "Token is valid" });
      
    } catch (error) {
      console.error("Password reset verify error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Password Reset - Confirm with New Password
  app.post("/api/auth/password-reset/confirm", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || typeof token !== 'string' || token.length !== 64) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Generate token digest for lookup
      const tokenDigest = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find valid reset token
      let foundReset = null;
      try {
        foundReset = await storage.findValidPasswordResetByDigest(tokenDigest);
      } catch (err) {
        console.error('Password reset confirm error:', err);
      }

      if (!foundReset) {
        logSecurityEvent('INVALID_PASSWORD_RESET_CONFIRMATION', { token: token.substring(0, 8) + '...', ip: req.ip });
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Get the user
      const user = await storage.getUserById(foundReset.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Mark reset token as used
      await storage.markPasswordResetUsed(foundReset.id);
      
      // Invalidate all other reset tokens for this user
      await storage.invalidateResetsForUser(user.id);
      
      // Optional: Destroy all user sessions to force re-login
      // This would require session store access which we don't have here
      
      logSecurityEvent('PASSWORD_RESET_COMPLETED', { email: sanitizeInput(user.email), ip: req.ip });
      
      res.json({ message: "Password has been reset successfully. Please log in with your new password." });
      
    } catch (error) {
      console.error("Password reset confirm error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Authentication middleware
  const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  };

  // User profile management
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, username, email } = req.body;
      const userId = req.session.userId;

      // Check if username or email is already taken by another user
      if (username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername && existingUsername.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
          return res.status(400).json({ message: "Email is already taken" });
        }
      }

      const updatedUser = await storage.updateUserProfile(userId, { name, username, email });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update session
      const { password: _, ...userResponse } = updatedUser;
      req.session.user = userResponse;

      res.json(userResponse);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.userId;

      // Get current user
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUserPassword(userId, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin password reset
  app.put("/api/admin/users/:userId/password", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUserById(req.session.userId);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUserPassword(userId, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Admin password update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Development route to reset data (only in development)
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/reset-data", async (req, res) => {
      try {
        await storage.clearAll();
        console.log('[reset] All data cleared and reinitialized');
        res.json({ message: "Data reset successfully" });
      } catch (error) {
        console.error('[reset] Error:', error);
        res.status(500).json({ message: "Reset failed" });
      }
    });
  }

  // Public posts route - shows post previews to everyone (no content access)
  app.get("/api/posts/public", async (req, res) => {
    try {
      // Add aggressive cache-busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}"`,
        'Vary': '*'
      });

      const posts = await storage.getPosts();
      console.log(`[posts/public] Returning ${posts.length} posts at ${new Date().toISOString()}`);
      console.log(`[posts/public] First post: "${posts[0]?.title}" (ID: ${posts[0]?.id})`);
      
      // Function to decode HTML entities recursively
      const decodeHTMLEntities = (text) => {
        if (!text || typeof text !== 'string') return text;
        
        let decoded = text;
        let previousDecoded = '';
        
        while (decoded !== previousDecoded) {
          previousDecoded = decoded;
          decoded = decoded
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x2F;/g, '/')
            .replace(/&#x27;/g, "'");
        }
        
        return decoded;
      };

      // Return posts with decoded HTML entities
      const publicPosts = posts.map(post => ({
        id: post.id,
        title: decodeHTMLEntities(post.title),
        excerpt: decodeHTMLEntities(post.excerpt),
        authorName: post.authorName,
        publishedAt: post.publishedAt,
        categoryName: post.categoryName,
        categoryId: post.categoryId,
        featuredImage: decodeHTMLEntities(post.featuredImage),
        slug: post.slug,
        // Include content for excerpt generation but limit it
        content: post.content ? decodeHTMLEntities(post.content).substring(0, 200) : ''
      }));
      
      res.json(publicPosts);
    } catch (error) {
      console.error("Error fetching public posts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Posts routes (authenticated users only)
  app.get("/api/posts", async (req, res) => {
    try {
      // Check if user is authenticated (approval no longer required)
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required to view blog posts" });
      }

      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public individual post route (no authentication required)
  app.get("/api/posts/public/:slugOrId", async (req, res) => {
    try {
      const { slugOrId } = req.params;
      
      // Try to find by slug first, then by ID
      let post = await storage.getPostBySlug(slugOrId);
      if (!post) {
        post = await storage.getPostById(slugOrId);
      }

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Only return published posts for public access
      if (post.status !== 'published') {
        return res.status(404).json({ message: "Post not found" });
      }

      // Function to decode HTML entities recursively
      const decodeHTMLEntities = (text) => {
        if (!text || typeof text !== 'string') return text;
        
        let decoded = text;
        let previousDecoded = '';
        
        while (decoded !== previousDecoded) {
          previousDecoded = decoded;
          decoded = decoded
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x2F;/g, '/')
            .replace(/&#x27;/g, "'");
        }
        
        return decoded;
      };

      // Decode HTML entities before sending
      const decodedPost = {
        ...post,
        title: decodeHTMLEntities(post.title),
        content: decodeHTMLEntities(post.content),
        excerpt: decodeHTMLEntities(post.excerpt),
        featuredImage: decodeHTMLEntities(post.featuredImage)
      };

      res.json(decodedPost);
    } catch (error) {
      console.error("Error fetching public post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/:slugOrId", async (req, res) => {
    try {
      // Check if user is authenticated (approval no longer required)
      if (!req.session.user) {
        console.log("[GET /api/posts/:slugOrId] No user in session for:", req.params.slugOrId);
        console.log("[GET /api/posts/:slugOrId] Session ID:", req.session.id || 'undefined');
        console.log("[GET /api/posts/:slugOrId] Session user:", req.session.user || 'undefined');
        return res.status(401).json({ message: "Authentication required to view blog posts" });
      }

      const { slugOrId } = req.params;
      console.log("[GET /api/posts/:slugOrId] Fetching post for user:", req.session.user.email, "Post ID:", slugOrId);
      
      // Try to find by slug first, then by ID
      let post = await storage.getPostBySlug(slugOrId);
      if (!post) {
        post = await storage.getPostById(slugOrId);
      }

      if (!post) {
        console.log("[GET /api/posts/:slugOrId] Post not found:", slugOrId);
        return res.status(404).json({ message: "Post not found" });
      }

      console.log("[GET /api/posts/:slugOrId] Successfully found post:", post.title);
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Simple route to serve blog posts directly
  app.get("/posts/:slug", (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });

  app.get("/api/posts/slug/:slug", async (req, res) => {
    try {
      // Check if user is authenticated and approved
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required to view blog posts" });
      }
      if (!req.session.user.approved) {
        return res.status(403).json({ message: "Your account must be approved to view blog posts" });
      }

      const { slug } = req.params;
      const post = await storage.getPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error("Error fetching post by slug:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const postData = req.body;
      console.log('[server] POST /api/posts - Received data:', JSON.stringify(postData, null, 2));
      console.log('[server] Featured image in create:', postData.featuredImage);
      
      // Decode HTML entities in featuredImage URL
      if (postData.featuredImage) {
        postData.featuredImage = postData.featuredImage
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x2F;/g, '/')
          .replace(/&#x27;/g, "'");
        console.log('[server] Decoded image URL:', postData.featuredImage);
      }
      
      // Input validation for post creation
      if (!validatePostTitle(postData.title)) {
        logSecurityEvent('INVALID_POST_TITLE', { title: sanitizeInput(postData.title), user: req.session.user.email });
        return res.status(400).json({ message: "Title must be between 3-200 characters" });
      }

      if (!validatePostContent(postData.content)) {
        logSecurityEvent('INVALID_POST_CONTENT', { contentLength: postData.content?.length, user: req.session.user.email });
        return res.status(400).json({ message: "Content must be between 10-50000 characters" });
      }

      if (postData.metaDescription && postData.metaDescription.length > 160) {
        return res.status(400).json({ message: "Meta description must be 160 characters or less" });
      }

      if (postData.canonicalUrl && !validateURL(postData.canonicalUrl)) {
        return res.status(400).json({ message: "Invalid canonical URL format" });
      }

      if (postData.ogImage && !validateURL(postData.ogImage)) {
        return res.status(400).json({ message: "Invalid OG image URL format" });
      }
      
      // Add category name if categoryId is provided
      if (postData.categoryId) {
        const category = await storage.getCategoryById(postData.categoryId);
        if (category) {
          postData.categoryName = category.name;
        }
      }

      const post = await storage.createPost(postData);
      logSecurityEvent('POST_CREATED', { postId: post.id, title: post.title, user: req.session.user.email });
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    try {
      // Debug session information
      console.log('[PUT /api/posts/:id] Session user:', req.session.user);
      console.log('[PUT /api/posts/:id] Session ID:', req.sessionID);
      console.log('[PUT /api/posts/:id] User-Agent:', req.headers['user-agent']?.substring(0, 50));
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[PUT /api/posts/:id] Access denied - user:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const postData = req.body;
      
      console.log('[server] PUT /api/posts/:id - Received data:', JSON.stringify(postData, null, 2));
      console.log('[server] Featured image in update:', postData.featuredImage);
      
      // Get existing post to preserve image if not provided
      const existingPost = await storage.getPostById(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Function to decode HTML entities recursively
      const decodeHTMLEntities = (text) => {
        if (!text || typeof text !== 'string') return text;
        
        // Keep decoding until no more entities are found
        let decoded = text;
        let previousDecoded = '';
        
        while (decoded !== previousDecoded) {
          previousDecoded = decoded;
          decoded = decoded
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x2F;/g, '/')
            .replace(/&#x27;/g, "'");
        }
        
        return decoded;
      };

      // Decode HTML entities in all text fields and basic XSS protection
      if (postData.content) {
        const originalLength = postData.content.length;
        postData.content = decodeHTMLEntities(postData.content);
        
        // Basic XSS protection - remove dangerous script tags and event handlers
        postData.content = postData.content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
          .replace(/on\w+\s*=\s*'[^']*'/gi, '')
          .replace(/javascript:/gi, '');
        
        console.log('[server] Decoded content:', originalLength, '->', postData.content.length, 'characters');
        console.log('[server] XSS protection applied');
      }
      
      if (postData.title) {
        postData.title = decodeHTMLEntities(postData.title);
      }
      
      if (postData.excerpt) {
        postData.excerpt = decodeHTMLEntities(postData.excerpt);
      }
      
      if (postData.featuredImage) {
        postData.featuredImage = decodeHTMLEntities(postData.featuredImage);
        console.log('[server] Decoded image URL:', postData.featuredImage);
      }
      
      // If no featuredImage provided, preserve the existing one
      if (!postData.featuredImage && existingPost.featuredImage) {
        postData.featuredImage = existingPost.featuredImage;
        console.log('[server] Preserving existing image:', existingPost.featuredImage);
      }
      
      // Regenerate slug if title changed
      if (postData.title && postData.title !== existingPost.title) {
        postData.slug = generateSlug(postData.title);
        console.log('[server] Regenerated slug for updated title:', postData.slug);
      }
      
      // Add category name if categoryId is provided
      if (postData.categoryId) {
        const category = await storage.getCategoryById(postData.categoryId);
        if (category) {
          postData.categoryName = category.name;
        }
      }

      const post = await storage.updatePost(id, postData);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      console.log('[server] Updated post with featuredImage:', post.featuredImage);
      
      // Enhanced security logging for inline edits
      logSecurityEvent('POST_UPDATED_INLINE', { 
        postId: id, 
        title: post.title, 
        user: req.session.user.email,
        editMethod: 'wysiwyg_inline_editor',
        fieldsUpdated: Object.keys(postData),
        contentLength: postData.content ? postData.content.length : 0
      });

      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const postData = req.body;
      
      // Get existing post for slug comparison
      const existingPost = await storage.getPostById(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Regenerate slug if title changed
      if (postData.title && postData.title !== existingPost.title) {
        postData.slug = generateSlug(postData.title);
        console.log('[server] PATCH - Regenerated slug for updated title:', postData.slug);
      }
      
      // Add category name if categoryId is provided
      if (postData.categoryId) {
        const category = await storage.getCategoryById(postData.categoryId);
        if (category) {
          postData.categoryName = category.name;
        }
      }

      const post = await storage.updatePost(id, postData);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deletePost(id);
      
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Image upload endpoint
  app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
      // Check if user is authenticated (removed admin requirement for image uploads)
      if (!req.session.user) {
        return res.status(403).json({ message: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'blogcraft-images',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      console.log('[upload] Cloudinary upload successful:', result.secure_url);
      res.json({
        url: result.secure_url,
        publicId: result.public_id
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ 
        message: 'Image upload failed',
        error: error.message 
      });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management endpoints (admin only)
  app.get('/api/users', async (req, res) => {
    try {
      console.log('[users] Session user:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      console.log('[users] Full session:', req.session);
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[users] Access denied - not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getUsers();
      // Remove sensitive data like passwords
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
        approved: user.approved,
        role: user.role || 'student',
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.patch('/api/users/:userId/role', async (req, res) => {
    try {
      console.log('[user-role] Request from:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      console.log('[user-role] Target userId:', req.params.userId);
      console.log('[user-role] Request body:', req.body);
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[user-role] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !['student', 'teacher'].includes(role)) {
        console.log('[user-role] Invalid role value:', role);
        return res.status(400).json({ message: 'Role must be either "student" or "teacher"' });
      }

      console.log('[user-role] Calling storage.updateUserRole...');
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        console.log('[user-role] User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('[user-role] User role updated successfully:', updatedUser.email, 'role:', updatedUser.role);

      // Update session if this is the current user
      if (req.session.user && req.session.user.id === userId) {
        req.session.user.role = role;
        console.log('[user-role] Updated session user role to:', role);
      }

      // Return safe user data
      const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
        approved: updatedUser.approved,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      };

      res.json(safeUser);
    } catch (error) {
      console.error('[user-role] Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Allow admin users to update their own role to teacher (temporary fix)
  app.patch('/api/auth/update-my-role', async (req, res) => {
    try {
      console.log('[update-my-role] Request from:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      
      if (!req.session.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!req.session.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { role } = req.body;

      if (!role || !['student', 'teacher'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either "student" or "teacher"' });
      }

      console.log('[update-my-role] Updating own role to:', role);
      const updatedUser = await storage.updateUserRole(req.session.user.id, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update session
      req.session.user.role = role;
      console.log('[update-my-role] Updated session role to:', role);

      res.json({ 
        message: 'Role updated successfully',
        role: updatedUser.role 
      });
    } catch (error) {
      console.error('[update-my-role] Error:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  app.patch('/api/users/:userId/admin', async (req, res) => {
    try {
      console.log('[admin-role] Request from:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      console.log('[admin-role] Target userId:', req.params.userId);
      console.log('[admin-role] Request body:', req.body);
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[admin-role] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { isAdmin } = req.body;

      if (typeof isAdmin !== 'boolean') {
        console.log('[admin-role] Invalid isAdmin value:', typeof isAdmin, isAdmin);
        return res.status(400).json({ message: 'isAdmin must be a boolean' });
      }

      console.log('[admin-role] Calling storage.updateUserAdminStatus...');
      const updatedUser = await storage.updateUserAdminStatus(userId, isAdmin);
      
      if (!updatedUser) {
        console.log('[admin-role] User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('[admin-role] User admin status updated successfully:', updatedUser.email, 'isAdmin:', updatedUser.isAdmin);

      // Return safe user data
      const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
        approved: updatedUser.approved,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      };

      res.json(safeUser);
    } catch (error) {
      console.error('[admin-role] Error updating user admin status:', error);
      res.status(500).json({ message: 'Failed to update user admin status' });
    }
  });

  // Update student teacher assignment
  app.patch('/api/users/:userId/teacher', async (req, res) => {
    try {
      console.log('[student-teacher] Request from:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      console.log('[student-teacher] Target userId:', req.params.userId);
      console.log('[student-teacher] Request body:', req.body);
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[student-teacher] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { teacherId } = req.body;

      // Validate userId is provided
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // teacherId can be null to remove assignment
      if (teacherId !== null && (typeof teacherId !== 'string' || teacherId.trim() === '')) {
        console.log('[student-teacher] Invalid teacherId value:', typeof teacherId, teacherId);
        return res.status(400).json({ message: 'teacherId must be a non-empty string or null' });
      }

      // First verify the target user exists and is a student
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        console.log('[student-teacher] Target user not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      if (targetUser.role !== 'student') {
        console.log('[student-teacher] Target user is not a student:', targetUser.email, 'role:', targetUser.role);
        return res.status(400).json({ message: 'Only students can be assigned to teachers' });
      }

      // If teacherId is provided, verify it's a valid approved teacher
      if (teacherId) {
        const teacher = await storage.getUserById(teacherId);
        if (!teacher) {
          console.log('[student-teacher] Teacher not found:', teacherId);
          return res.status(400).json({ message: 'Teacher not found' });
        }
        if (teacher.role !== 'teacher') {
          console.log('[student-teacher] User is not a teacher:', teacher.email, 'role:', teacher.role);
          return res.status(400).json({ message: 'Selected user is not a teacher' });
        }
        if (!teacher.approved) {
          console.log('[student-teacher] Teacher is not approved:', teacher.email);
          return res.status(400).json({ message: 'Teacher is not approved' });
        }
      }

      console.log('[student-teacher] Admin', req.session.user.email, 'updating student', targetUser.email, 'teacherId to:', teacherId);
      const updatedUser = await storage.updateStudentTeacher(userId, teacherId);
      
      if (!updatedUser) {
        console.log('[student-teacher] Failed to update student teacher assignment:', userId);
        return res.status(500).json({ message: 'Failed to update teacher assignment' });
      }

      console.log('[student-teacher] Student teacher assignment updated successfully:', updatedUser.email, 'teacherId:', updatedUser.teacherId);

      // Return safe user data including teacherId
      const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
        approved: updatedUser.approved,
        role: updatedUser.role,
        teacherId: updatedUser.teacherId,
        createdAt: updatedUser.createdAt
      };

      res.json(safeUser);
    } catch (error) {
      console.error('[student-teacher] Error updating student teacher assignment:', error);
      res.status(500).json({ message: 'Failed to update teacher assignment' });
    }
  });

  // Update user role (student/teacher)
  app.patch('/api/users/:userId/role', async (req, res) => {
    try {
      console.log('[user-role] Request from:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      console.log('[user-role] Target userId:', req.params.userId);
      console.log('[user-role] Request body:', req.body);
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[user-role] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !['student', 'teacher'].includes(role)) {
        console.log('[user-role] Invalid role value:', role);
        return res.status(400).json({ message: 'Role must be "student" or "teacher"' });
      }

      console.log('[user-role] Calling storage.updateUserRole...');
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        console.log('[user-role] User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('[user-role] User role updated successfully:', updatedUser.email, 'role:', updatedUser.role);

      // If the updated user is currently logged in, update their session
      if (req.session.user && req.session.user.id === userId) {
        console.log('[user-role] Updating current user session with new role');
        req.session.user = { ...req.session.user, role: updatedUser.role };
      }

      // Return safe user data
      const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
        approved: updatedUser.approved,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      };

      res.json(safeUser);
    } catch (error) {
      console.error('[user-role] Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  app.patch('/api/users/:userId/approval', async (req, res) => {
    try {
      console.log('[approval] Request from:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      console.log('[approval] Target userId:', req.params.userId);
      console.log('[approval] Request body:', req.body);
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[approval] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { approved } = req.body;

      if (typeof approved !== 'boolean') {
        console.log('[approval] Invalid approved value:', typeof approved, approved);
        return res.status(400).json({ message: 'approved must be a boolean' });
      }

      console.log('[approval] Calling storage.updateUserApproval...');
      const updatedUser = await storage.updateUserApproval(userId, approved);
      
      if (!updatedUser) {
        console.log('[approval] User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('[approval] User updated successfully:', updatedUser.email, 'approved:', updatedUser.approved);

      // Return safe user data
      const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
        approved: updatedUser.approved,
        createdAt: updatedUser.createdAt
      };

      res.json(safeUser);
    } catch (error) {
      console.error('[approval] Error updating user approval:', error);
      res.status(500).json({ message: 'Failed to update user approval' });
    }
  });

  // Admin password reset
  app.put("/api/admin/users/:id/password", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the user's password
      const updated = await storage.updateUserPassword(userId, hashedPassword);
      
      if (updated) {
        res.json({ message: "Password reset successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Admin password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.delete('/api/users/:userId', async (req, res) => {
    try {
      console.log('[delete-user] Request from:', req.session.user?.email, 'isAdmin:', req.session.user?.isAdmin);
      console.log('[delete-user] Target userId:', req.params.userId);
      
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        console.log('[delete-user] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;

      // Prevent admin from deleting themselves
      if (userId === req.session.user.id) {
        console.log('[delete-user] Admin trying to delete themselves');
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      console.log('[delete-user] Calling storage.deleteUser...');
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        console.log('[delete-user] User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('[delete-user] User deleted successfully');
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('[delete-user] Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // SEO Settings API
  app.post('/api/seo/settings', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const seoSettings = req.body;
      // For now, we'll store in memory/MongoDB. In production, you'd want persistent storage
      console.log('[seo] SEO settings updated:', seoSettings);
      
      res.json({ message: 'SEO settings saved successfully', settings: seoSettings });
    } catch (error) {
      console.error('[seo] Error saving SEO settings:', error);
      res.status(500).json({ message: 'Failed to save SEO settings' });
    }
  });

  app.get('/api/seo/settings', async (req, res) => {
    try {
      // Return default SEO settings
      const defaultSettings = {
        siteName: 'BlogCraft',
        siteDescription: 'A modern blog platform featuring advanced content management, user authentication, and SEO optimization tools.',
        defaultOgImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630',
        googleAnalyticsId: '',
        googleSearchConsoleId: '',
        robotsTxt: 'User-agent: *\nAllow: /',
        sitemapEnabled: true
      };
      
      res.json(defaultSettings);
    } catch (error) {
      console.error('[seo] Error getting SEO settings:', error);
      res.status(500).json({ message: 'Failed to get SEO settings' });
    }
  });

  // Sitemap generation
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const posts = await storage.getPosts();
      const publishedPosts = posts.filter(post => post.status === 'published');
      
      const baseUrl = `https://${req.get('host')}`;
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

      publishedPosts.forEach(post => {
        sitemap += `
  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${post.updatedAt || post.publishedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      sitemap += '\n</urlset>';
      
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('[seo] Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt
  app.get('/robots.txt', async (req, res) => {
    try {
      const baseUrl = `https://${req.get('host')}`;
      const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
      
      res.set('Content-Type', 'text/plain');
      res.send(robotsTxt);
    } catch (error) {
      console.error('[seo] Error generating robots.txt:', error);
      res.status(500).send('Error generating robots.txt');
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { name, slug, description } = req.body;

      // Validate category name
      if (!validateCategoryName(name)) {
        return res.status(400).json({ 
          message: "Category name must be between 1-100 characters and contain only letters, numbers, spaces, and basic punctuation" 
        });
      }

      // Check if category name already exists
      const existingCategory = await storage.getCategoryBySlug(slug || generateSlug(name));
      if (existingCategory) {
        return res.status(400).json({ message: "Category with this name/slug already exists" });
      }

      const categoryData = {
        name: sanitizeInput(name),
        slug: slug || generateSlug(name),
        description: description ? sanitizeInput(description) : ''
      };

      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { name, slug, description } = req.body;

      // Validate category name if provided
      if (name && !validateCategoryName(name)) {
        return res.status(400).json({ 
          message: "Category name must be between 1-100 characters and contain only letters, numbers, spaces, and basic punctuation" 
        });
      }

      // Check if another category with the same slug exists (exclude current category)
      if (slug) {
        const existingCategory = await storage.getCategoryBySlug(slug);
        if (existingCategory && existingCategory.id !== id) {
          return res.status(400).json({ message: "Category with this slug already exists" });
        }
      }

      const updateData = {};
      if (name) updateData.name = sanitizeInput(name);
      if (slug) updateData.slug = sanitizeInput(slug);
      if (description !== undefined) updateData.description = sanitizeInput(description);

      const category = await storage.updateCategory(id, updateData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comments management routes
  app.get("/api/comments", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const comments = await storage.getAllComments();
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management CRUD endpoints
  app.patch('/api/users/:userId/admin', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { isAdmin } = req.body;
      
      // Prevent admin from removing their own admin status
      if (userId === req.session.user.id && !isAdmin) {
        return res.status(400).json({ message: 'Cannot remove your own admin status' });
      }

      const updatedUser = await storage.updateUserRole(userId, isAdmin);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return safe user data
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error('Error updating user admin status:', error);
      res.status(500).json({ message: 'Failed to update user admin status' });
    }
  });

  // Comments management endpoints  
  app.patch("/api/comments/:commentId/status", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { commentId } = req.params;
      const { status } = req.body;

      if (!status || !['approved', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Status must be "approved" or "pending"' });
      }

      const updatedComment = await storage.updateCommentStatus(commentId, status);
      
      if (!updatedComment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      res.json(updatedComment);
    } catch (error) {
      console.error('Error updating comment status:', error);
      res.status(500).json({ message: 'Failed to update comment status' });
    }
  });

  app.delete("/api/comments/:commentId", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { commentId } = req.params;
      const success = await storage.deleteComment(commentId);
      
      if (!success) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  });

  // Comments for specific posts (PUBLIC - only approved comments)
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      console.log(`[comments] Fetching comments for post: ${postId}`);
      
      const allComments = await storage.getCommentsByPostId(postId);
      console.log(`[comments] Found ${allComments.length} total comments`);
      
      // Only return approved comments for public viewing
      const approvedComments = allComments.filter(comment => comment.status === 'approved');
      console.log(`[comments] Returning ${approvedComments.length} approved comments`);
      
      res.json(approvedComments);
    } catch (error) {
      console.error("Error fetching post comments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      // Check if user is authenticated (approval no longer required)
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { postId } = req.params;
      const { content, parentId } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      // Get post details
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const commentData = {
        postId,
        postTitle: post.title,
        postSlug: post.slug,
        authorName: req.session.user.name,
        authorEmail: req.session.user.email,
        content: content.trim(),
        parentId: parentId || null,
        status: "approved", // Auto-approve comments for now
      };

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SEO management endpoints
  app.post('/api/seo/sitemap/generate', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Generate sitemap (this is already handled by the /sitemap.xml endpoint)
      res.json({ message: 'Sitemap generated successfully', url: '/sitemap.xml' });
    } catch (error) {
      console.error('[seo] Error generating sitemap:', error);
      res.status(500).json({ message: 'Failed to generate sitemap' });
    }
  });

  app.patch("/api/comments/:commentId", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { commentId } = req.params;
      const { status } = req.body;

      if (!status || !['approved', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Status must be "approved" or "pending"' });
      }

      const updatedComment = await storage.updateCommentStatus(commentId, status);
      
      if (!updatedComment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      res.json(updatedComment);
    } catch (error) {
      console.error('Error updating comment status:', error);
      res.status(500).json({ message: 'Failed to update comment status' });
    }
  });

  app.delete("/api/comments/:commentId", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { commentId } = req.params;
      const success = await storage.deleteComment(commentId);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Post new comment
  app.post("/api/comments", async (req, res) => {
    try {
      // Check if user is authenticated and approved
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!req.session.user.approved) {
        return res.status(403).json({ message: "Account approval required" });
      }

      const { postId, content, parentId } = req.body;

      if (!postId || !content) {
        return res.status(400).json({ message: "Post ID and content are required" });
      }

      const commentData = {
        postId,
        content: content.trim(),
        parentId: parentId || null,
        authorName: req.session.user.name,
        authorEmail: req.session.user.email
      };

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get comments for a specific post
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      // Check if user is authenticated and approved for comment access
      if (!req.session.user?.approved) {
        return res.status(403).json({ message: "Account approval required" });
      }

      const { postId } = req.params;
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching post comments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comments routes
  app.get("/api/comments", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const comments = await storage.getComments();
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching post comments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      
      // Check if user is logged in
      if (!req.session.user) {
        return res.status(401).json({ message: "Please log in to leave a comment" });
      }
      
      const commentData = {
        ...req.body,
        postId,
        // Use logged-in user's information
        authorName: req.session.user.name || req.session.user.username,
        authorEmail: req.session.user.email
      };

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/comments/:id", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const comment = await storage.updateComment(id, req.body);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json(comment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deleteComment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Image upload endpoint
  app.post('/api/upload/image', upload.single('image'), async (req, res) => {
    try {
      // Check if user is authenticated (removed admin requirement for image uploads)
      if (!req.session.user) {
        return res.status(403).json({ message: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ 
          message: 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' 
        });
      }

      // Upload to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'blog-images',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      const result = await uploadPromise;
      
      res.json({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Delete image endpoint
  app.delete('/api/upload/image/:publicId', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { publicId } = req.params;
      const decodedPublicId = decodeURIComponent(publicId);
      
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(decodedPublicId);
      
      if (result.result === 'ok') {
        res.json({ message: 'Image deleted successfully' });
      } else {
        res.status(404).json({ message: 'Image not found' });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Failed to delete image' });
    }
  });

  // SEO Management Routes
  app.get('/api/seo/settings', async (req, res) => {
    // Check if user is admin
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      // Return default SEO settings (in a real app, this would come from database)
      const defaultSettings = {
        siteTitle: 'Mr. S Teaches',
        siteDescription: 'A modern blog platform featuring advanced content management, user authentication, and SEO optimization tools.',
        keywords: 'blog, education, teaching, learning, content management',
        googleAnalyticsId: '',
        facebookPixelId: '',
        twitterHandle: '',
        canonicalUrl: '',
        ogImage: '',
        robotsTxt: 'User-agent: *\nAllow: /',
        enableSitemap: true
      };
      res.json(defaultSettings);
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      res.status(500).json({ message: 'Failed to fetch SEO settings' });
    }
  });

  app.post('/api/seo/settings', async (req, res) => {
    // Check if user is admin
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      // In a real app, save to database
      console.log('SEO settings updated:', req.body);
      res.json({ message: 'SEO settings saved successfully' });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      res.status(500).json({ message: 'Failed to save SEO settings' });
    }
  });

  app.post('/api/seo/sitemap/generate', async (req, res) => {
    // Check if user is admin
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      // Generate sitemap (simplified version)
      const posts = await storage.getPosts();
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Add homepage
      sitemap += '  <url>\n';
      sitemap += '    <loc>https://mr-s-teaches.com/</loc>\n';
      sitemap += '    <changefreq>daily</changefreq>\n';
      sitemap += '    <priority>1.0</priority>\n';
      sitemap += '  </url>\n';
      
      // Add posts
      posts.forEach(post => {
        if (post.status === 'published') {
          sitemap += '  <url>\n';
          sitemap += `    <loc>https://mr-s-teaches.com/posts/${post.slug || post.id}</loc>\n`;
          sitemap += '    <changefreq>weekly</changefreq>\n';
          sitemap += '    <priority>0.8</priority>\n';
          sitemap += '  </url>\n';
        }
      });
      
      sitemap += '</urlset>';
      
      console.log('Generated sitemap');
      res.json({ message: 'Sitemap generated successfully' });
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).json({ message: 'Failed to generate sitemap' });
    }
  });

  // Audio Lists routes
  app.get('/api/audio-lists', async (req, res) => {
    try {
      const audioLists = await storage.getAudioLists();
      res.json(audioLists);
    } catch (error) {
      console.error('Error fetching audio lists:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/audio-lists/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const audioList = await storage.getAudioListById(id);
      if (!audioList) {
        return res.status(404).json({ message: 'Audio list not found' });
      }
      res.json(audioList);
    } catch (error) {
      console.error('Error fetching audio list:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/audio-lists', async (req, res) => {
    try {
      // Check if user is teacher or admin
      if (!req.session.user || (!req.session.user.isAdmin && req.session.user.role !== 'teacher')) {
        return res.status(403).json({ message: 'Teacher or admin access required' });
      }

      const { title, description, audioFiles } = req.body;
      
      if (!title || !audioFiles || !Array.isArray(audioFiles)) {
        return res.status(400).json({ message: 'Title and audio files are required' });
      }

      const audioList = await storage.createAudioList({
        title,
        description: description || '',
        audioFiles,
        creatorId: req.session.user.id,
        creatorName: req.session.user.name
      });

      res.status(201).json(audioList);
    } catch (error) {
      console.error('Error creating audio list:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/audio-lists/:id', async (req, res) => {
    try {
      // Check if user is teacher or admin
      if (!req.session.user || (!req.session.user.isAdmin && req.session.user.role !== 'teacher')) {
        return res.status(403).json({ message: 'Teacher or admin access required' });
      }

      const { id } = req.params;
      const { title, description, audioFiles } = req.body;
      
      // Check if user owns this list or is admin
      const existingList = await storage.getAudioListById(id);
      if (!existingList) {
        return res.status(404).json({ message: 'Audio list not found' });
      }
      
      if (!req.session.user.isAdmin && existingList.creatorId !== req.session.user.id) {
        return res.status(403).json({ message: 'You can only edit your own audio lists' });
      }

      const updatedList = await storage.updateAudioList(id, {
        title,
        description,
        audioFiles
      });

      res.json(updatedList);
    } catch (error) {
      console.error('Error updating audio list:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/audio-lists/:id', async (req, res) => {
    try {
      // Check if user is teacher or admin
      if (!req.session.user || (!req.session.user.isAdmin && req.session.user.role !== 'teacher')) {
        return res.status(403).json({ message: 'Teacher or admin access required' });
      }

      const { id } = req.params;
      
      // Check if user owns this list or is admin
      const existingList = await storage.getAudioListById(id);
      if (!existingList) {
        return res.status(404).json({ message: 'Audio list not found' });
      }
      
      if (!req.session.user.isAdmin && existingList.creatorId !== req.session.user.id) {
        return res.status(403).json({ message: 'You can only delete your own audio lists' });
      }

      const deleted = await storage.deleteAudioList(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Audio list not found' });
      }

      res.json({ message: 'Audio list deleted successfully' });
    } catch (error) {
      console.error('Error deleting audio list:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chatroom API routes
  app.get('/api/admin/chatrooms', async (req, res) => {
    try {
      if (!req.session.user?.isAdmin && req.session.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }
      const chatrooms = await storage.getChatrooms();
      res.json(chatrooms);
    } catch (error) {
      console.error('Error fetching chatrooms:', error);
      res.status(500).json({ message: 'Failed to fetch chatrooms' });
    }
  });

  app.post('/api/admin/chatrooms', async (req, res) => {
    try {
      if (!req.session.user?.isAdmin && req.session.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }
      
      const { name, description, invitedUserIds } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Chatroom name is required' });
      }

      const chatroomData = {
        name: name.trim(),
        description: description?.trim() || '',
        createdBy: req.session.user.id,
        createdByName: req.session.user.name,
        invitedUserIds: invitedUserIds || [],
        isActive: true
      };

      const chatroom = await storage.createChatroom(chatroomData);
      res.status(201).json(chatroom);
    } catch (error) {
      console.error('Error creating chatroom:', error);
      res.status(500).json({ message: 'Failed to create chatroom' });
    }
  });

  app.put('/api/admin/chatrooms/:id', async (req, res) => {
    try {
      if (!req.session.user?.isAdmin && req.session.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const { name, description, invitedUserIds, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (invitedUserIds !== undefined) updateData.invitedUserIds = invitedUserIds;
      if (isActive !== undefined) updateData.isActive = isActive;

      let chatroom = await storage.updateChatroom(id, updateData);
      if (!chatroom) {
        return res.status(404).json({ message: 'Chatroom not found' });
      }

      // If chatroom was reactivated, generate a new access key for security
      if (isActive === true) {
        console.log('[API] Chatroom reactivated, generating new access key for security');
        chatroom = await storage.generateNewAccessKey(id);
      }

      res.json(chatroom);
    } catch (error) {
      console.error('Error updating chatroom:', error);
      res.status(500).json({ message: 'Failed to update chatroom' });
    }
  });

  app.delete('/api/admin/chatrooms/:id', async (req, res) => {
    try {
      if (!req.session.user?.isAdmin && req.session.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deleteChatroom(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Chatroom not found' });
      }

      res.json({ message: 'Chatroom deleted successfully' });
    } catch (error) {
      console.error('Error deleting chatroom:', error);
      res.status(500).json({ message: 'Failed to delete chatroom' });
    }
  });

  // Generate new access key for chatroom (teachers/admins only)
  app.post('/api/admin/chatrooms/:id/new-key', async (req, res) => {
    try {
      if (!req.session.user?.isAdmin && req.session.user?.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const chatroom = await storage.generateNewAccessKey(id);
      
      if (!chatroom) {
        return res.status(404).json({ message: 'Chatroom not found' });
      }

      res.json({ 
        message: 'New access key generated successfully',
        accessKey: chatroom.accessKey,
        chatroom: chatroom
      });
    } catch (error) {
      console.error('Error generating new access key:', error);
      res.status(500).json({ message: 'Failed to generate new access key' });
    }
  });

  // Join chatroom with access key (requires authentication)
  app.post('/api/chatrooms/join', async (req, res) => {
    try {
      // Require user authentication
      if (!req.session.user) {
        return res.status(401).json({ message: 'Authentication required to join chatrooms' });
      }

      const { accessKey } = req.body;
      
      if (!accessKey) {
        return res.status(400).json({ message: 'Access key is required' });
      }

      console.log('[API] /api/chatrooms/join - User:', req.session.user.name, 'attempting to join with key:', accessKey ? `${accessKey.substring(0, 4)}***[REDACTED]***` : 'undefined');
      
      const allChatrooms = await storage.getChatrooms();
      const chatroom = allChatrooms.find(c => c.accessKey === accessKey && c.isActive);
      
      if (!chatroom) {
        console.log('[API] /api/chatrooms/join - No active chatroom found for key:', accessKey ? `${accessKey.substring(0, 4)}***[REDACTED]***` : 'undefined');
        return res.status(404).json({ message: 'Invalid access key or chatroom is not active' });
      }

      console.log('[API] /api/chatrooms/join - Successfully joined chatroom:', chatroom.name);
      
      // CRITICAL SECURITY FIX: Sanitize response by removing sensitive accessKey field
      const { accessKey: _, ...sanitizedChatroom } = chatroom;
      
      res.json({
        message: 'Successfully joined chatroom',
        chatroom: sanitizedChatroom
      });
    } catch (error) {
      console.error('Error joining chatroom:', error);
      res.status(500).json({ message: 'Failed to join chatroom' });
    }
  });

  // Get user chatrooms - requires authentication
  app.get('/api/chatrooms', async (req, res) => {
    try {
      // Require user authentication
      if (!req.session.user) {
        return res.status(401).json({ message: 'Authentication required to view chatrooms' });
      }

      console.log('[API] /api/chatrooms - Authenticated user:', req.session.user.name);
      console.log('[API] /api/chatrooms - Session ID:', req.sessionID);
      
      console.log('[API] /api/chatrooms - Fetching all chatrooms...');
      const allChatrooms = await storage.getChatrooms();
      console.log('[API] /api/chatrooms - All chatrooms:', allChatrooms.length);
      
      // CRITICAL SECURITY FIX: Sanitize chatrooms by removing sensitive accessKey fields
      const sanitizedChatrooms = allChatrooms.map(chatroom => {
        const { accessKey: _, ...sanitized } = chatroom;
        return sanitized;
      });
      
      console.log('[API] /api/chatrooms - Sanitized chatrooms available for authenticated user:', sanitizedChatrooms.length);
      res.json(sanitizedChatrooms);
    } catch (error) {
      console.error('Error fetching user chatrooms:', error);
      res.status(500).json({ message: 'Failed to fetch chatrooms' });
    }
  });

  // Quick password reset for development - remove in production
  app.post('/api/auth/dev-reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and new password required" });
      }
      
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Not available in production" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Dev password reset error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quick login endpoint for session sync fixes
  app.get('/api/auth/quick-login', async (req, res) => {
    try {
      const userType = req.query.type || 'admin'; // Default to admin login
      
      let user;
      if (userType === 'student') {
        // Create or find a student user for testing
        user = await storage.getUserByEmail('student@example.com');
        if (!user) {
          // Create a student user if doesn't exist
          user = await storage.createUser({
            email: 'student@example.com',
            username: 'student',
            name: 'Test Student',
            password: 'hashedpassword',
            role: 'student',
            isAdmin: false,
            approved: true
          });
        }
      } else {
        // Find the admin user for quick login
        user = await storage.getUserByEmail('admin@example.com');
        if (!user) {
          return res.status(404).json({ message: 'Admin user not found' });
        }
      }

      // Set session
      req.session.userId = user.id;
      req.session.user = user;
      
      console.log('[auth] Quick login session set for user:', user.email, 'role:', user.role);
      console.log('[auth] Session ID:', req.sessionID);
      
      // Get redirect URL or default to /listen-to-type
      const redirectUrl = req.query.redirect || '/listen-to-type';
      
      // Save session and redirect
      req.session.save((err) => {
        if (err) {
          console.error('[auth] Session save error:', err);
          return res.status(500).json({ message: 'Session save failed' });
        }
        res.redirect(redirectUrl);
      });
      
    } catch (error) {
      console.error('[auth] Quick login error:', error);
      res.status(500).json({ message: 'Quick login failed' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server for chat functionality with error handling
  let wss;
  try {
    wss = new WebSocketServer({ 
      server: httpServer, 
      path: '/ws',
      perMessageDeflate: false, // Disable compression to prevent CPU/memory issues under load
      verifyClient: (info, cb) => {
        console.log('[websocket] Verifying client connection:', {
          origin: info.origin,
          host: info.req.headers.host,
          url: info.req.url
        });
        
        // Validate session synchronously
        validateWebSocketSession(info.req, sessionStore, sessionSecret, (err, session) => {
          if (err) {
            console.log('[websocket] Connection rejected:', err.message);
            logSecurityEvent('WEBSOCKET_AUTH_FAILED', {
              error: err.message,
              ip: info.req.socket.remoteAddress,
              userAgent: info.req.headers['user-agent']
            });
            return cb(false, 401, 'Unauthorized');
          }
          
          console.log('[websocket] Connection approved for user:', session.user.email);
          // Store session info for use during connection
          info.req.session = session;
          cb(true);
        });
      }
    });
    
    // Add error handler for WebSocket server
    wss.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error('[websocket] WebSocket server error: Port is already in use');
      } else {
        console.error('[websocket] WebSocket server error:', error);
      }
    });
    
  } catch (error) {
    console.error('[websocket] Failed to create WebSocket server:', error);
    // Continue without WebSocket if it fails
    wss = null;
  }
  
  // Store active chat users by chatroom (in memory)
  const chatUsers = new Map();
  const chatroomUsers = new Map(); // Map of chatroom ID -> Set of user names
  let messageId = 1;

  // Set up heartbeat interval to prevent proxy timeouts and keep sessions alive
  if (wss) {
    const heartbeatInterval = setInterval(() => {
      wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('[websocket] Terminating inactive connection');
          return ws.terminate();
        }
        
        // Reset alive flag and ping client
        ws.isAlive = false;
        ws.ping();
        
        // Refresh session TTL to prevent session expiration during WebSocket use
        if (ws.sessionId && sessionStore) {
          sessionStore.get(ws.sessionId, (err, session) => {
            if (!err && session) {
              sessionStore.touch(ws.sessionId, session, (touchErr) => {
                if (touchErr) {
                  console.error('[websocket] Failed to refresh session:', touchErr);
                }
              });
            }
          });
        }
      });
    }, 30000); // 30 second heartbeat interval
    
    // Clean up interval when server shuts down
    wss.on('close', () => {
      clearInterval(heartbeatInterval);
    });
  }

  if (wss) {
    wss.on('connection', (ws, req) => {
    console.log('[websocket] New client connected from:', req.socket.remoteAddress);
    console.log('[websocket] Connection headers:', {
      upgrade: req.headers.upgrade,
      connection: req.headers.connection,
      'sec-websocket-version': req.headers['sec-websocket-version']
    });
    
    // Store authenticated user from session validation
    ws.user = req.session?.user;
    ws.sessionId = req.session?.id;
    
    if (!ws.user) {
      console.error('[websocket] No authenticated user found in session');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    console.log('[websocket] Authenticated user connected:', ws.user.email);
    
    // Initialize heartbeat mechanism to prevent proxy timeouts and session expiration
    ws.isAlive = true;
    ws.sessionId = req.sessionID;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Add error handler for the WebSocket connection
    ws.on('error', (error) => {
      console.error('[websocket] WebSocket connection error:', error);
    });
    
    ws.on('message', (data) => {
      console.log('[websocket] Raw message received:', data.toString());
      try {
        const message = JSON.parse(data.toString());
        console.log('[websocket] Parsed message:', message);
        
        switch (message.type) {
          case 'join':
            // Verify user is authenticated via WebSocket connection
            if (!ws.user) {
              console.log('[websocket] Join rejected: User not authenticated on connection');
              logSecurityEvent('WEBSOCKET_UNAUTHORIZED_JOIN', {
                sessionId: ws.sessionId,
                messageData: sanitizeInput(JSON.stringify(message)),
                ip: ws._socket?.remoteAddress
              });
              const authErrorMessage = {
                type: 'auth_error',
                reason: 'Authentication required to join chatrooms',
                timestamp: new Date().toISOString()
              };
              ws.send(JSON.stringify(authErrorMessage));
              ws.close(1008, 'Authentication required');
              return;
            }
            
            // User joins the chat - prioritize typed name over authenticated user name
            const userName = message.name?.trim() || ws.user.name || ws.user.username || 'Anonymous';
            const userRole = ws.user.role || 'student';
            const chatroomId = message.chatroom;
            const userId = ws.user.id;
            
            console.log('[websocket] Join data - name:', userName, 'role:', userRole, 'chatroom:', chatroomId);
          console.log('[websocket] 🔍 IMPORTANT: To test multi-user chat, open this same URL in a different browser (Chrome + Firefox) or incognito window');
            
            // Check for duplicate names in the same chatroom
            if (!chatroomUsers.has(chatroomId)) {
              chatroomUsers.set(chatroomId, new Set());
            }
            
            const currentChatroomUsers = chatroomUsers.get(chatroomId);
            if (currentChatroomUsers.has(userName)) {
              console.log(`[websocket] Duplicate name "${userName}" rejected for chatroom ${chatroomId}`);
              
              // Send rejection message to this user only
              const rejectionMessage = {
                type: 'join_rejected',
                name: userName,
                reason: 'Name already taken in this chatroom',
                timestamp: new Date().toISOString()
              };
              
              console.log('[websocket] Sending rejection message:', rejectionMessage);
              ws.send(JSON.stringify(rejectionMessage));
              
              // Close the connection after a brief delay to ensure message is received
              setTimeout(() => {
                ws.close();
              }, 100);
              return;
            }
            
            // Add user to chatroom and global user tracking with authentication info
            currentChatroomUsers.add(userName);
            chatUsers.set(ws, {
              name: userName,
              role: userRole,
              chatroom: chatroomId,
              userId: userId,
              sessionId: ws.sessionId,
              joinedAt: new Date(),
              authenticated: true,
              user: ws.user // Store full user object for security checks
            });
            
            // Broadcast user joined message to all users in this chatroom
            const joinMessage = {
              type: 'user_joined',
              id: messageId++,
              username: userName,
              name: userName,
              role: userRole,
              chatroom: chatroomId,
              timestamp: new Date().toISOString()
            };
            
            broadcastToChatroom(joinMessage, chatroomId);
            console.log(`[chat] ${userName} (${userRole}) joined chatroom ${chatroomId}`);
            break;
            
          case 'message':
            // User sends a chat message  
            const user = chatUsers.get(ws);
            console.log('[websocket] Message from user:', user?.name);
            
            // Verify user is authenticated via WebSocket connection
            if (!ws.user || !user || !user.authenticated) {
              console.log('[websocket] Message rejected: User not authenticated');
              logSecurityEvent('WEBSOCKET_UNAUTHORIZED_MESSAGE', {
                sessionId: ws.sessionId,
                messageData: sanitizeInput(JSON.stringify(message)),
                ip: ws._socket?.remoteAddress
              });
              const authErrorMessage = {
                type: 'auth_error', 
                reason: 'Authentication required to send messages',
                timestamp: new Date().toISOString()
              };
              ws.send(JSON.stringify(authErrorMessage));
              ws.close(1008, 'Authentication required');
              return;
            }
            
            if (user) {
              const chatMessage = {
                type: 'message',
                id: messageId++,
                username: user.name, // This is the display name
                name: user.name,     // Alternative name field for compatibility
                role: user.role,     // User role (student/teacher)
                text: message.text,  // The actual message content
                chatroom: user.chatroom,
                timestamp: new Date().toISOString()
              };
              
              console.log('[websocket] Broadcasting message:', chatMessage);
              broadcastToChatroom(chatMessage, user.chatroom);
              console.log(`[chat] ${user.name} (${user.role}): ${message.text}`);
            } else {
              console.log('[websocket] No user found for this connection');
              console.log('[websocket] Available users:', Array.from(chatUsers.values()).map(u => ({ name: u.name, role: u.role, chatroom: u.chatroom })));
            }
            break;
        }
      } catch (error) {
        console.error('[websocket] Error parsing message:', error);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`[websocket] Client disconnected - code: ${code}, reason: ${reason}`);
      const user = chatUsers.get(ws);
      if (user) {
        // Remove user from chatroom tracking
        if (chatroomUsers.has(user.chatroom)) {
          chatroomUsers.get(user.chatroom).delete(user.name);
        }
        
        // Broadcast user left message
        const leaveMessage = {
          type: 'user_left',
          id: messageId++,
          username: user.name,
          name: user.name,
          role: user.role,
          chatroom: user.chatroom,
          timestamp: new Date().toISOString()
        };
        
        broadcastToChatroom(leaveMessage, user.chatroom);
        chatUsers.delete(ws);
        console.log(`[chat] ${user.name} left the chat`);
      }
    });
  });
  } // Close the if (wss) block

  // Broadcast message to all connected clients except sender - with backpressure protection
  function broadcast(message, excludeWs = null) {
    if (!wss) return; // Guard against missing WebSocket server
    const messageStr = JSON.stringify(message);
    
    wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) { // WebSocket.OPEN = 1
        try {
          // Check for backpressure - if buffer is too large, skip this client to prevent blocking
          if (client.bufferedAmount > 1024 * 1024) { // 1MB buffer limit
            console.warn('[websocket] Skipping client with high buffer amount:', client.bufferedAmount);
            return;
          }
          
          client.send(messageStr);
        } catch (error) {
          console.error('[websocket] Error sending message to client:', error);
          // Gracefully close problematic connection
          if (client.readyState === 1) {
            client.terminate();
          }
        }
      }
    });
  }
  
  // Broadcast message to all users in a specific chatroom
  function broadcastToChatroom(message, chatroomId, excludeWs = null) {
    if (!wss) return; // Guard against missing WebSocket server
    console.log(`[websocket] Broadcasting to chatroom ${chatroomId}:`, message.type);
    console.log(`[websocket] Total connected clients:`, wss.clients.size);
    
    // Log all users currently in the chatroom
    const chatroomUsersInChat = [];
    chatUsers.forEach((user, client) => {
      if (user.chatroom === chatroomId) {
        chatroomUsersInChat.push({
          name: user.name,
          role: user.role,
          readyState: client.readyState
        });
      }
    });
    console.log(`[websocket] Users in chatroom ${chatroomId}:`, chatroomUsersInChat);
    
    let broadcastCount = 0;
    const messageStr = JSON.stringify(message);
    
    wss.clients.forEach((client) => {
      const user = chatUsers.get(client);
      if (client !== excludeWs && client.readyState === 1 && user && user.chatroom === chatroomId) {
        try {
          // Check for backpressure - if buffer is too large, skip this client to prevent blocking
          if (client.bufferedAmount > 1024 * 1024) { // 1MB buffer limit
            console.warn('[websocket] Skipping client with high buffer amount:', client.bufferedAmount, 'for user:', user.name);
            return;
          }
          
          client.send(messageStr);
          broadcastCount++;
          console.log(`[websocket] Sent message to: ${user.name} (${user.role})`);
        } catch (error) {
          console.error('[websocket] Error sending message to client:', error);
          // Gracefully close problematic connection
          if (client.readyState === 1) {
            client.terminate();
          }
        }
      }
    });
    console.log(`[websocket] Message broadcasted to ${broadcastCount} clients`);
  }

  // Audio Quiz Routes
  app.get("/api/audio-quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getAudioQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching audio quizzes:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/audio-quizzes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const quiz = await storage.getAudioQuizById(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error('Error fetching audio quiz:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/audio-quizzes", async (req, res) => {
    try {
      // Check if user is true admin (not student admin) or teacher
      const user = req.session.user;
      const canManageQuiz = (user?.isAdmin && user?.role !== 'student') || user?.role === 'teacher';
      if (!canManageQuiz) {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      const quizData = {
        ...req.body,
        createdBy: req.session.user.id,
        createdByName: req.session.user.name || req.session.user.username
      };

      const quiz = await storage.createAudioQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error('Error creating audio quiz:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/audio-quizzes/:id", async (req, res) => {
    try {
      // Check if user is true admin (not student admin) or teacher
      const user = req.session.user;
      const canManageQuiz = (user?.isAdmin && user?.role !== 'student') || user?.role === 'teacher';
      if (!canManageQuiz) {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      const { id } = req.params;
      const quiz = await storage.updateAudioQuiz(id, req.body);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error('Error updating audio quiz:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/audio-quizzes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.session.user;
      
      // Check if user is true admin (not student admin) or teacher
      const canManageQuiz = (user?.isAdmin && user?.role !== 'student') || user?.role === 'teacher';
      if (!canManageQuiz) {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      console.log(`[API] Deleting quiz ${id} by user ${user.email} (admin: ${user.isAdmin}, role: ${user.role})`);
      
      const deleted = await storage.deleteAudioQuiz(id);
      if (!deleted) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      console.log(`[API] Quiz ${id} deleted successfully`);
      res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error('Error deleting audio quiz:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quiz Grade Routes
  app.get("/api/quiz-grades", async (req, res) => {
    try {
      // Check authentication
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { quizId, userId } = req.query;
      const user = req.session.user;
      const canViewAll = (user.isAdmin && user.role !== 'student') || user.role === 'teacher';
      
      // If user is not admin/teacher and trying to view other user's grades, deny access
      if (!canViewAll && userId && userId !== user.id) {
        return res.status(403).json({ message: "Can only view your own grades" });
      }

      let grades;
      
      if (quizId && userId) {
        // Specific user and quiz combination
        // For teachers, verify they can access this specific user's grades
        if (user.role === 'teacher' && !user.isAdmin && userId !== user.id) {
          const teacherStudents = await storage.getStudentsByTeacher(user.id);
          const studentIds = teacherStudents.map(student => student.id);
          if (!studentIds.includes(userId)) {
            return res.status(403).json({ message: "Access denied - student not assigned to you" });
          }
        }
        grades = await storage.getQuizGradesByUserAndQuiz(userId, quizId);
      } else if (canViewAll) {
        // Admin/Teacher can view all grades
        if (quizId) {
          grades = await storage.getQuizGradesByQuizId(quizId);
        } else if (userId) {
          // For teachers, verify they can access this specific user's grades
          if (user.role === 'teacher' && !user.isAdmin && userId !== user.id) {
            const teacherStudents = await storage.getStudentsByTeacher(user.id);
            const studentIds = teacherStudents.map(student => student.id);
            if (!studentIds.includes(userId)) {
              return res.status(403).json({ message: "Access denied - student not assigned to you" });
            }
          }
          grades = await storage.getQuizGradesByUserId(userId);
        } else {
          grades = await storage.getQuizGrades();
        }
        
        // If user is a teacher (but not admin), filter to only their students' grades
        if (user.role === 'teacher' && !user.isAdmin) {
          const teacherStudents = await storage.getStudentsByTeacher(user.id);
          const studentIds = teacherStudents.map(student => student.id);
          grades = grades.filter(grade => studentIds.includes(grade.userId));
        }
      } else {
        // Regular users can only view their own grades
        if (quizId) {
          grades = await storage.getQuizGradesByUserAndQuiz(user.id, quizId);
        } else {
          grades = await storage.getQuizGradesByUserId(user.id);
        }
      }

      // Add user names to grades
      const gradesWithNames = await Promise.all(
        grades.map(async (grade) => {
          const gradeUser = await storage.getUserById(grade.userId);
          const quiz = await storage.getAudioQuizById(grade.quizId);
          return {
            ...grade,
            userName: gradeUser?.name || gradeUser?.username || 'Unknown User',
            quizTitle: quiz?.title || 'Unknown Quiz'
          };
        })
      );

      res.json(gradesWithNames);
    } catch (error) {
      console.error('Error fetching quiz grades:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete quiz grade (admin/teacher only)
  app.delete("/api/quiz-grades/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.session.user;
      
      // Check if user is admin or teacher
      if (!user?.isAdmin && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      console.log(`[API] Deleting quiz grade ${id} by user ${user.email} (admin: ${user.isAdmin}, role: ${user.role})`);
      
      const deleted = await storage.deleteQuizGrade(id);
      if (!deleted) {
        return res.status(404).json({ message: "Quiz grade not found" });
      }
      
      console.log(`[API] Quiz grade ${id} deleted successfully`);
      res.json({ message: "Quiz grade deleted successfully" });
    } catch (error) {
      console.error('Error deleting quiz grade:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quiz-grades", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.user) {
        console.error('Quiz grade save failed: No authenticated user');
        return res.status(401).json({ message: "Authentication required" });
      }

      const gradeData = {
        ...req.body,
        userId: req.session.user.id,
        userName: req.session.user.name || req.session.user.username
      };

      const grade = await storage.createQuizGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      console.error('Error creating quiz grade:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Text Quiz Routes
  // Get all text quizzes
  app.get("/api/text-quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getTextQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching text quizzes:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create text quiz (admin/teacher only)
  app.post("/api/text-quizzes", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user?.isAdmin && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      const quiz = await storage.createTextQuiz(req.body);
      res.status(201).json(quiz);
    } catch (error) {
      console.error('Error creating text quiz:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update text quiz (admin/teacher only)
  app.put("/api/text-quizzes/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user?.isAdmin && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      const { id } = req.params;
      const quiz = await storage.updateTextQuiz(id, req.body);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json(quiz);
    } catch (error) {
      console.error('Error updating text quiz:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete text quiz (admin/teacher only)
  app.delete("/api/text-quizzes/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user?.isAdmin && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteTextQuiz(id);
      if (!deleted) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error('Error deleting text quiz:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Text Quiz Grade Routes
  // Get text quiz grades
  app.get("/api/text-quiz-grades", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { userId, quizId } = req.query;
      
      // If userId is provided, check if user can access that specific user's grades
      if (userId) {
        // Students can only access their own grades
        if (!user.isAdmin && user.role !== 'teacher' && userId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // For teachers, verify they can access this specific user's grades
        if (user.role === 'teacher' && !user.isAdmin && userId !== user.id) {
          const teacherStudents = await storage.getStudentsByTeacher(user.id);
          const studentIds = teacherStudents.map(student => student.id);
          if (!studentIds.includes(userId)) {
            return res.status(403).json({ message: "Access denied - student not assigned to you" });
          }
        }
        
        if (quizId) {
          // Get grades for specific user and quiz
          const grades = await storage.getTextQuizGradesByUserAndQuiz(userId, quizId);
          res.json(grades);
        } else {
          // Get all grades for specific user
          const grades = await storage.getTextQuizGradesByUserId(userId);
          res.json(grades);
        }
      } else {
        // Only admin/teacher can get all grades
        if (!user?.isAdmin && user?.role !== 'teacher') {
          return res.status(403).json({ message: "Admin or teacher access required" });
        }
        
        let grades = await storage.getTextQuizGrades();
        
        // If user is a teacher (but not admin), filter to only their students' grades
        if (user.role === 'teacher' && !user.isAdmin) {
          const teacherStudents = await storage.getStudentsByTeacher(user.id);
          const studentIds = teacherStudents.map(student => student.id);
          grades = grades.filter(grade => studentIds.includes(grade.userId));
        }
        
        res.json(grades);
      }
    } catch (error) {
      console.error('Error fetching text quiz grades:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create text quiz grade (authenticated users only)
  app.post("/api/text-quiz-grades", async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const gradeData = {
        ...req.body,
        userId: req.session.user.id,
        userName: req.session.user.name || req.session.user.username
      };

      const grade = await storage.createTextQuizGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      console.error('Error creating text quiz grade:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete text quiz grade (admin/teacher only)
  app.delete("/api/text-quiz-grades/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user?.isAdmin && user?.role !== 'teacher') {
        return res.status(403).json({ message: "Admin or teacher access required" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteTextQuizGrade(id);
      if (!deleted) {
        return res.status(404).json({ message: "Text quiz grade not found" });
      }
      
      res.json({ message: "Text quiz grade deleted successfully" });
    } catch (error) {
      console.error('Error deleting text quiz grade:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Lesson Plan Routes
  // Get lesson plans
  app.get("/api/lesson-plans", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Only teachers and admins can access lesson plans
      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { creatorId } = req.query;
      
      if (creatorId) {
        // Get lesson plans for specific creator
        const plans = await storage.getLessonPlansByCreator(creatorId);
        res.json(plans);
      } else {
        // Get all lesson plans (admin only) or own plans (teachers)
        if (user.isAdmin) {
          const plans = await storage.getLessonPlans();
          res.json(plans);
        } else {
          const plans = await storage.getLessonPlansByCreator(user.id);
          res.json(plans);
        }
      }
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific lesson plan
  app.get("/api/lesson-plans/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const plan = await storage.getLessonPlanById(id);
      
      if (!plan) {
        return res.status(404).json({ message: "Lesson plan not found" });
      }

      // Teachers can only access their own plans unless they're admin
      if (!user.isAdmin && plan.creatorId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(plan);
    } catch (error) {
      console.error('Error fetching lesson plan:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create lesson plan (teacher/admin only)
  app.post("/api/lesson-plans", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const planData = {
        ...req.body,
        creatorId: user.id,
        creatorName: user.name || user.username
      };

      const plan = await storage.createLessonPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update lesson plan (creator or admin only)
  app.put("/api/lesson-plans/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const existingPlan = await storage.getLessonPlanById(id);
      
      if (!existingPlan) {
        return res.status(404).json({ message: "Lesson plan not found" });
      }

      // Teachers can only update their own plans unless they're admin
      if (!user.isAdmin && existingPlan.creatorId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const plan = await storage.updateLessonPlan(id, req.body);
      res.json(plan);
    } catch (error) {
      console.error('Error updating lesson plan:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete lesson plan (creator or admin only)
  app.delete("/api/lesson-plans/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const existingPlan = await storage.getLessonPlanById(id);
      
      if (!existingPlan) {
        return res.status(404).json({ message: "Lesson plan not found" });
      }

      // Teachers can only delete their own plans unless they're admin
      if (!user.isAdmin && existingPlan.creatorId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteLessonPlan(id);
      if (!deleted) {
        return res.status(404).json({ message: "Lesson plan not found" });
      }
      
      res.json({ message: "Lesson plan deleted successfully" });
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google Slides Routes
  // Get Google Slides
  app.get("/api/google-slides", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { creatorId } = req.query;
      
      if (creatorId) {
        // Get slides for specific creator
        const slides = await storage.getGoogleSlidesByCreator(creatorId);
        res.json(slides);
      } else {
        // Get all slides (admin/teacher only) or own slides (teachers)
        if (user.isAdmin || user.role === 'teacher') {
          if (user.isAdmin) {
            const slides = await storage.getGoogleSlides();
            res.json(slides);
          } else {
            const slides = await storage.getGoogleSlidesByCreator(user.id);
            res.json(slides);
          }
        } else {
          // Students can see all public slides
          const allSlides = await storage.getGoogleSlides();
          const publicSlides = allSlides.filter(slide => slide.isPublic);
          res.json(publicSlides);
        }
      }
    } catch (error) {
      console.error('Error fetching Google Slides:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific Google Slide
  app.get("/api/google-slides/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      const slide = await storage.getGoogleSlideById(id);
      
      if (!slide) {
        return res.status(404).json({ message: "Google Slide not found" });
      }

      // Check access permissions
      const canAccess = user.isAdmin || 
                       slide.creatorId === user.id || 
                       (slide.isPublic && user.role === 'student');

      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(slide);
    } catch (error) {
      console.error('Error fetching Google Slide:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create Google Slide (teacher/admin only)
  app.post("/api/google-slides", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const slideData = {
        ...req.body,
        creatorId: user.id,
        creatorName: user.name || user.username
      };

      const slide = await storage.createGoogleSlide(slideData);
      res.status(201).json(slide);
    } catch (error) {
      console.error('Error creating Google Slide:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update Google Slide (creator or admin only)
  app.put("/api/google-slides/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const existingSlide = await storage.getGoogleSlideById(id);
      
      if (!existingSlide) {
        return res.status(404).json({ message: "Google Slide not found" });
      }

      // Teachers can only update their own slides unless they're admin
      if (!user.isAdmin && existingSlide.creatorId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const slide = await storage.updateGoogleSlide(id, req.body);
      res.json(slide);
    } catch (error) {
      console.error('Error updating Google Slide:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete Google Slide (creator or admin only)
  app.delete("/api/google-slides/:id", async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!user.isAdmin && user.role !== 'teacher') {
        return res.status(403).json({ message: "Teacher or admin access required" });
      }

      const { id } = req.params;
      const existingSlide = await storage.getGoogleSlideById(id);
      
      if (!existingSlide) {
        return res.status(404).json({ message: "Google Slide not found" });
      }

      // Teachers can only delete their own slides unless they're admin
      if (!user.isAdmin && existingSlide.creatorId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteGoogleSlide(id);
      if (!deleted) {
        return res.status(404).json({ message: "Google Slide not found" });
      }
      
      res.json({ message: "Google Slide deleted successfully" });
    } catch (error) {
      console.error('Error deleting Google Slide:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}