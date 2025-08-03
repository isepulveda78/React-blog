import { type User, type InsertUser, type Category, type InsertCategory, type BlogPost, type InsertBlogPost, type Comment, type InsertComment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Blog Posts
  getBlogPosts(options?: { status?: string; categoryId?: string; limit?: number; offset?: number }): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<BlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;
  searchBlogPosts(query: string): Promise<BlogPost[]>;
  incrementViewCount(id: string): Promise<void>;
  
  // Comments
  getComments(postId: string): Promise<Comment[]>;
  getComment(id: string): Promise<Comment | undefined>;
  getAllComments(options?: { status?: string; limit?: number }): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, comment: Partial<Comment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private blogPosts: Map<string, BlogPost>;
  private comments: Map<string, Comment>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.blogPosts = new Map();
    this.comments = new Map();
    
    // Initialize with admin user and sample data
    this.initializeData();
  }

  private async initializeData() {
    // Create admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@blogcraft.com",
      password: "$2a$10$rOFLaEJWnBhVNe2I.YIhQeJ4Rnj8Wf7Zq9.X8FgHyTcVbNmQpSdAe", // password: admin123
      name: "Admin User",
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create categories
    const techCategory: Category = {
      id: randomUUID(),
      name: "Technology",
      slug: "technology",
      description: "Articles about technology and development",
      postCount: 0,
    };
    this.categories.set(techCategory.id, techCategory);

    const designCategory: Category = {
      id: randomUUID(),
      name: "Design",
      slug: "design",
      description: "UI/UX design and creative content",
      postCount: 0,
    };
    this.categories.set(designCategory.id, designCategory);

    const businessCategory: Category = {
      id: randomUUID(),
      name: "Business",
      slug: "business",
      description: "Business strategy and entrepreneurship",
      postCount: 0,
    };
    this.categories.set(businessCategory.id, businessCategory);

    // Create sample blog posts
    const post1: BlogPost = {
      id: randomUUID(),
      title: "The Future of Web Development: Trends to Watch in 2024",
      slug: "future-of-web-development-2024",
      excerpt: "Explore the cutting-edge technologies and methodologies that are shaping the future of web development, from AI integration to progressive web apps.",
      content: `<p>Web development continues to evolve at a rapid pace, with new technologies and methodologies emerging constantly. As we move through 2024, several key trends are shaping the future of how we build and interact with web applications.</p>

<h2>AI Integration in Development</h2>
<p>Artificial Intelligence is no longer just a buzzword in web development. From code generation tools to intelligent testing frameworks, AI is becoming an integral part of the development workflow. Tools like GitHub Copilot and ChatGPT are already changing how developers write code, and this trend will only accelerate.</p>

<h2>Progressive Web Apps (PWAs) Going Mainstream</h2>
<p>Progressive Web Apps continue to bridge the gap between web and native applications. With improved browser support and better tooling, PWAs are becoming the go-to solution for businesses looking to provide app-like experiences without the complexity of native development.</p>

<blockquote>The future of web development lies in creating seamless, intelligent experiences that adapt to user needs in real-time.</blockquote>

<h2>WebAssembly Performance Gains</h2>
<p>WebAssembly (WASM) is enabling high-performance applications that were previously impossible in the browser. From gaming to data visualization, WASM is opening new possibilities for web applications.</p>`,
      featuredImage: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      categoryId: techCategory.id,
      authorId: adminUser.id,
      status: "published",
      allowComments: true,
      metaTitle: "The Future of Web Development: Trends to Watch in 2024",
      metaDescription: "Explore the cutting-edge technologies and methodologies shaping web development in 2024.",
      tags: ["web development", "technology", "AI", "PWA", "WebAssembly"],
      viewCount: 156,
      createdAt: new Date("2024-03-15"),
      updatedAt: new Date("2024-03-15"),
      publishedAt: new Date("2024-03-15"),
    };
    this.blogPosts.set(post1.id, post1);

    const post2: BlogPost = {
      id: randomUUID(),
      title: "Designing for Accessibility: A Complete Guide",
      slug: "designing-for-accessibility-guide",
      excerpt: "Learn how to create inclusive web experiences that work for everyone, with practical tips and real-world examples.",
      content: `<p>Accessibility in web design isn't just about compliance—it's about creating inclusive experiences that work for everyone. This comprehensive guide will walk you through the essential principles and practical techniques for building accessible websites.</p>

<h2>Understanding Web Accessibility</h2>
<p>Web accessibility means ensuring that websites and web applications can be used by people with disabilities, including those who rely on assistive technologies like screen readers, voice recognition software, or alternative input devices.</p>

<h2>The Four Principles of Accessibility</h2>
<ul>
<li><strong>Perceivable</strong> - Information must be presentable in ways users can perceive</li>
<li><strong>Operable</strong> - Interface components must be operable by all users</li>
<li><strong>Understandable</strong> - Information and UI operation must be understandable</li>
<li><strong>Robust</strong> - Content must be robust enough to work with various assistive technologies</li>
</ul>

<h2>Practical Implementation Tips</h2>
<p>Start with semantic HTML, provide meaningful alt text for images, ensure sufficient color contrast, and make your site keyboard navigable. These foundational steps will significantly improve your site's accessibility.</p>`,
      featuredImage: "https://images.unsplash.com/photo-1616628188859-7a11abb6fcc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      categoryId: designCategory.id,
      authorId: adminUser.id,
      status: "published",
      allowComments: true,
      metaTitle: "Designing for Accessibility: A Complete Guide",
      metaDescription: "Learn how to create inclusive web experiences with practical accessibility tips and techniques.",
      tags: ["accessibility", "design", "UX", "inclusive design"],
      viewCount: 89,
      createdAt: new Date("2024-03-14"),
      updatedAt: new Date("2024-03-14"),
      publishedAt: new Date("2024-03-14"),
    };
    this.blogPosts.set(post2.id, post2);

    // Update category post counts
    techCategory.postCount = 1;
    designCategory.postCount = 1;
    this.categories.set(techCategory.id, techCategory);
    this.categories.set(designCategory.id, designCategory);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id, postCount: 0 };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated = { ...category, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Blog Posts
  async getBlogPosts(options: { status?: string; categoryId?: string; limit?: number; offset?: number } = {}): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());
    
    if (options.status) {
      posts = posts.filter(post => post.status === options.status);
    }
    
    if (options.categoryId) {
      posts = posts.filter(post => post.categoryId === options.categoryId);
    }
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    if (options.offset) {
      posts = posts.slice(options.offset);
    }
    
    if (options.limit) {
      posts = posts.slice(0, options.limit);
    }
    
    return posts;
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const now = new Date();
    const post: BlogPost = { 
      ...insertPost, 
      id, 
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: insertPost.status === 'published' ? now : null,
    };
    this.blogPosts.set(id, post);
    
    // Update category post count
    if (post.categoryId && post.status === 'published') {
      const category = this.categories.get(post.categoryId);
      if (category) {
        category.postCount = (category.postCount || 0) + 1;
        this.categories.set(post.categoryId, category);
      }
    }
    
    return post;
  }

  async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const post = this.blogPosts.get(id);
    if (!post) return undefined;
    
    const wasPublished = post.status === 'published';
    const updated = { 
      ...post, 
      ...updates, 
      updatedAt: new Date(),
      publishedAt: updates.status === 'published' && !post.publishedAt ? new Date() : post.publishedAt
    };
    this.blogPosts.set(id, updated);
    
    // Update category post count
    if (post.categoryId && !wasPublished && updated.status === 'published') {
      const category = this.categories.get(post.categoryId);
      if (category) {
        category.postCount = (category.postCount || 0) + 1;
        this.categories.set(post.categoryId, category);
      }
    } else if (post.categoryId && wasPublished && updated.status !== 'published') {
      const category = this.categories.get(post.categoryId);
      if (category && category.postCount > 0) {
        category.postCount = category.postCount - 1;
        this.categories.set(post.categoryId, category);
      }
    }
    
    return updated;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const post = this.blogPosts.get(id);
    if (post && post.categoryId && post.status === 'published') {
      const category = this.categories.get(post.categoryId);
      if (category && category.postCount > 0) {
        category.postCount = category.postCount - 1;
        this.categories.set(post.categoryId, category);
      }
    }
    return this.blogPosts.delete(id);
  }

  async searchBlogPosts(query: string): Promise<BlogPost[]> {
    const lowercaseQuery = query.toLowerCase();
    const posts = Array.from(this.blogPosts.values())
      .filter(post => 
        post.status === 'published' && (
          post.title.toLowerCase().includes(lowercaseQuery) ||
          post.excerpt?.toLowerCase().includes(lowercaseQuery) ||
          post.content.toLowerCase().includes(lowercaseQuery) ||
          post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        )
      );
    
    return posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async incrementViewCount(id: string): Promise<void> {
    const post = this.blogPosts.get(id);
    if (post) {
      post.viewCount = (post.viewCount || 0) + 1;
      this.blogPosts.set(id, post);
    }
  }

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId && comment.status === 'approved')
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    return comments;
  }

  async getComment(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getAllComments(options: { status?: string; limit?: number } = {}): Promise<Comment[]> {
    let comments = Array.from(this.comments.values());
    
    if (options.status) {
      comments = comments.filter(comment => comment.status === options.status);
    }
    
    comments.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    if (options.limit) {
      comments = comments.slice(0, options.limit);
    }
    
    return comments;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = { 
      ...insertComment, 
      id, 
      status: 'pending',
      likes: 0,
      createdAt: new Date() 
    };
    this.comments.set(id, comment);
    return comment;
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updated = { ...comment, ...updates };
    this.comments.set(id, updated);
    return updated;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }
}

export const storage = new MemStorage();
