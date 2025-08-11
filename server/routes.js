import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
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

export function registerRoutes(app) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

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
        res.redirect('/');
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
        res.json(user);
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

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, name, password, role } = req.body;

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

      // Validate role
      if (!role || !['teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: "Please select a valid role (teacher or student)" });
      }

      // Create user
      const user = await storage.createUser({
        email: email.toLowerCase().trim(), // Normalize email
        username: username.trim(),
        name: name.trim(),
        password: hashedPassword,
        role: role,
        isAdmin: false,
        approved: true   // New users can read posts immediately
      });

      logSecurityEvent('USER_REGISTERED', { 
        email: sanitizeInput(email), 
        username: sanitizeInput(username), 
        role: role, 
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
      const posts = await storage.getPosts();
      // Return posts with limited information for public viewing
      const publicPosts = posts.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        authorName: post.authorName,
        publishedAt: post.publishedAt,
        categoryName: post.categoryName,
        categoryId: post.categoryId,
        featuredImage: post.featuredImage,
        slug: post.slug,
        // Include content for excerpt generation but limit it
        content: post.content ? post.content.substring(0, 200) : ''
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

      res.json(post);
    } catch (error) {
      console.error("Error fetching public post:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/:slugOrId", async (req, res) => {
    try {
      // Check if user is authenticated (approval no longer required)
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required to view blog posts" });
      }

      const { slugOrId } = req.params;
      
      // Try to find by slug first, then by ID
      let post = await storage.getPostBySlug(slugOrId);
      if (!post) {
        post = await storage.getPostById(slugOrId);
      }

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

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
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const postData = req.body;
      
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

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const postData = req.body;
      
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

  // Chatroom API routes
  app.get('/api/admin/chatrooms', async (req, res) => {
    try {
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
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
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
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
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { name, description, invitedUserIds, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (invitedUserIds !== undefined) updateData.invitedUserIds = invitedUserIds;
      if (isActive !== undefined) updateData.isActive = isActive;

      const chatroom = await storage.updateChatroom(id, updateData);
      if (!chatroom) {
        return res.status(404).json({ message: 'Chatroom not found' });
      }

      res.json(chatroom);
    } catch (error) {
      console.error('Error updating chatroom:', error);
      res.status(500).json({ message: 'Failed to update chatroom' });
    }
  });

  app.delete('/api/admin/chatrooms/:id', async (req, res) => {
    try {
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
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

  // Get user chatrooms - accessible to all authenticated users (students and teachers)
  app.get('/api/chatrooms', async (req, res) => {
    try {
      console.log('[API] /api/chatrooms - Session user:', req.session?.user);
      console.log('[API] /api/chatrooms - Session ID:', req.sessionID);
      
      if (!req.session.user) {
        console.log('[API] /api/chatrooms - No authenticated user');
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log('[API] /api/chatrooms - Fetching all chatrooms...');
      const allChatrooms = await storage.getChatrooms();
      console.log('[API] /api/chatrooms - All chatrooms:', allChatrooms.length);
      
      // Allow all authenticated users (students, teachers, admins) to access all chatrooms
      // This enables collaborative learning for everyone
      console.log('[API] /api/chatrooms - User chatrooms for', req.session.user.email + ':', allChatrooms.length);
      res.json(allChatrooms);
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

  // Create WebSocket server for chat functionality
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info) => {
      console.log('[websocket] Verifying client connection:', {
        origin: info.origin,
        host: info.req.headers.host,
        url: info.req.url
      });
      return true; // Accept all connections for now
    }
  });
  
  // Store active chat users by chatroom (in memory)
  const chatUsers = new Map();
  const chatroomUsers = new Map(); // Map of chatroom ID -> Set of user names
  let messageId = 1;

  wss.on('connection', (ws, req) => {
    console.log('[websocket] New client connected from:', req.socket.remoteAddress);
    console.log('[websocket] Connection headers:', {
      upgrade: req.headers.upgrade,
      connection: req.headers.connection,
      'sec-websocket-version': req.headers['sec-websocket-version']
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
            // User joins the chat - fallback to username if name not provided (for compatibility)
            const userName = message.name || message.username || 'Anonymous';
            const userRole = message.role || 'student';
            const chatroomId = message.chatroom;
            
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
            
            // Add user to chatroom and global user tracking
            currentChatroomUsers.add(userName);
            chatUsers.set(ws, {
              name: userName,
              role: userRole,
              chatroom: chatroomId,
              joinedAt: new Date()
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
            console.log('[websocket] Message from user:', user);
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

  // Broadcast message to all connected clients except sender
  function broadcast(message, excludeWs = null) {
    wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(JSON.stringify(message));
      }
    });
  }
  
  // Broadcast message to all users in a specific chatroom
  function broadcastToChatroom(message, chatroomId, excludeWs = null) {
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
    wss.clients.forEach((client) => {
      const user = chatUsers.get(client);
      if (client !== excludeWs && client.readyState === 1 && user && user.chatroom === chatroomId) {
        try {
          client.send(JSON.stringify(message));
          broadcastCount++;
          console.log(`[websocket] Sent message to: ${user.name} (${user.role})`);
        } catch (error) {
          console.error('[websocket] Error sending message to client:', error);
        }
      }
    });
    console.log(`[websocket] Message broadcasted to ${broadcastCount} clients`);
  }

  return httpServer;
}