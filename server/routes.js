import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

export function registerRoutes(app) {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, name, password } = req.body;

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

      // Create user
      const user = await storage.createUser({
        email,
        username,
        name,
        password: hashedPassword,
        isAdmin: false,
        approved: false  // New users start as unapproved
      });

      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      // Don't set session for unapproved users
      res.json({ 
        ...userResponse, 
        message: "Registration successful! Your account is pending approval. Please wait for an administrator to approve your account before you can access the blog." 
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

      // Check if user is approved
      if (!user.approved) {
        return res.status(403).json({ message: "Your account is pending approval. Please wait for an administrator to approve your account." });
      }

      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      // Set session
      req.session.userId = user.id;
      req.session.user = userResponse;

      res.json(userResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.session.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
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
      // Check if user is authenticated and approved
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required to view blog posts" });
      }
      if (!req.session.user.approved) {
        return res.status(403).json({ message: "Your account must be approved to view blog posts" });
      }

      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/posts/:slugOrId", async (req, res) => {
    try {
      // Check if user is authenticated and approved
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required to view blog posts" });
      }
      if (!req.session.user.approved) {
        return res.status(403).json({ message: "Your account must be approved to view blog posts" });
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
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
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
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { isAdmin } = req.body;

      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ message: 'isAdmin must be a boolean' });
      }

      const updatedUser = await storage.updateUserRole(userId, isAdmin);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

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
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  app.patch('/api/users/:userId/approval', async (req, res) => {
    try {
      // Check if user is admin
      if (!req.session.user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { approved } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({ message: 'approved must be a boolean' });
      }

      const updatedUser = await storage.updateUserApproval(userId, approved);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

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
      console.error('Error updating user approval:', error);
      res.status(500).json({ message: 'Failed to update user approval' });
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
}