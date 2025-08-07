import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";

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
      console.log('[auth/me] Session user:', req.session?.user);
      console.log('[auth/me] Session ID:', req.sessionID);
      
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

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
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
        email,
        username,
        name,
        password: hashedPassword,
        role: role,
        isAdmin: false,
        approved: true   // New users can read posts immediately
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

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
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
      
      // Add category name if categoryId is provided
      if (postData.categoryId) {
        const category = await storage.getCategoryById(postData.categoryId);
        if (category) {
          postData.categoryName = category.name;
        }
      }

      const post = await storage.createPost(postData);
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
      // Check if user is authenticated and admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
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

      const category = await storage.createCategory(req.body);
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
      const category = await storage.updateCategory(id, req.body);
      
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
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
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

  // Get user chatrooms (for invited users)
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
      
      const userChatrooms = allChatrooms.filter(chatroom => 
        chatroom.isActive && 
        (chatroom.invitedUserIds.includes(req.session.user.id) || req.session.user.isAdmin)
      );
      
      console.log('[API] /api/chatrooms - User chatrooms:', userChatrooms.length);
      res.json(userChatrooms);
    } catch (error) {
      console.error('Error fetching user chatrooms:', error);
      res.status(500).json({ message: 'Failed to fetch chatrooms' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server for chat functionality
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active chat users (in memory)
  const chatUsers = new Map();
  let messageId = 1;

  wss.on('connection', (ws) => {
    console.log('[websocket] New client connected');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            // User joins the chat
            chatUsers.set(ws, {
              name: message.name,
              joinedAt: new Date()
            });
            
            // Broadcast user joined message
            const joinMessage = {
              type: 'user_joined',
              id: messageId++,
              name: message.name,
              timestamp: new Date().toISOString()
            };
            
            broadcast(joinMessage);
            console.log(`[chat] ${message.name} joined the chat`);
            break;
            
          case 'message':
            // User sends a chat message
            const user = chatUsers.get(ws);
            if (user) {
              const chatMessage = {
                type: 'message',
                id: messageId++,
                name: user.name,
                text: message.text,
                timestamp: new Date().toISOString()
              };
              
              broadcast(chatMessage);
              console.log(`[chat] ${user.name}: ${message.text}`);
            }
            break;
        }
      } catch (error) {
        console.error('[websocket] Error parsing message:', error);
      }
    });
    
    ws.on('close', () => {
      const user = chatUsers.get(ws);
      if (user) {
        // Broadcast user left message
        const leaveMessage = {
          type: 'user_left',
          id: messageId++,
          name: user.name,
          timestamp: new Date().toISOString()
        };
        
        broadcast(leaveMessage, ws);
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

  return httpServer;
}