import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertBlogPostSchema, insertCommentSchema, insertCategorySchema } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        username: data.username,
        password: hashedPassword,
        isAdmin: false,
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const isValid = await bcrypt.compare(data.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Blog posts routes
  app.get("/api/posts", async (req, res) => {
    try {
      const { status = "published", categoryId, limit, offset, search } = req.query;
      
      let posts;
      if (search) {
        posts = await storage.searchBlogPosts(search as string);
      } else {
        posts = await storage.getBlogPosts({
          status: status as string,
          categoryId: categoryId as string,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined,
        });
      }
      
      // Get categories and authors for each post
      const postsWithDetails = await Promise.all(posts.map(async (post) => {
        const category = post.categoryId ? await storage.getCategory(post.categoryId) : null;
        const author = await storage.getUser(post.authorId);
        return {
          ...post,
          category,
          author: author ? { id: author.id, name: author.name, username: author.username } : null,
        };
      }));
      
      res.json(postsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment view count
      await storage.incrementViewCount(post.id);
      
      // Get category and author
      const category = post.categoryId ? await storage.getCategory(post.categoryId) : null;
      const author = await storage.getUser(post.authorId);
      
      res.json({
        ...post,
        category,
        author: author ? { id: author.id, name: author.name, username: author.username } : null,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch post" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const data = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(data);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const post = await storage.updateBlogPost(id, data);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBlogPost(id);
      
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete post" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const category = await storage.updateCategory(id, data);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete category" });
    }
  });

  // Comments routes
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getComments(postId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const data = insertCommentSchema.parse({ ...req.body, postId });
      const comment = await storage.createComment(data);
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create comment" });
    }
  });

  app.get("/api/comments", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const comments = await storage.getAllComments({
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      // Get post details for each comment
      const commentsWithPosts = await Promise.all(comments.map(async (comment) => {
        const post = await storage.getBlogPost(comment.postId);
        return {
          ...comment,
          post: post ? { id: post.id, title: post.title, slug: post.slug } : null,
        };
      }));
      
      res.json(commentsWithPosts);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch comments" });
    }
  });

  app.put("/api/comments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const comment = await storage.updateComment(id, data);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteComment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete comment" });
    }
  });

  // Admin stats route
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const allPosts = await storage.getBlogPosts();
      const publishedPosts = await storage.getBlogPosts({ status: "published" });
      const allComments = await storage.getAllComments();
      const pendingComments = await storage.getAllComments({ status: "pending" });
      
      const stats = {
        totalPosts: publishedPosts.length,
        totalComments: allComments.length,
        pendingComments: pendingComments.length,
        draftPosts: allPosts.length - publishedPosts.length,
        totalViews: publishedPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0),
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
