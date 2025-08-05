import { nanoid } from "nanoid";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// In-memory storage fallback
class MemStorage {
  constructor() {
    this.users = [];
    this.posts = [];
    this.categories = [];
    this.comments = [];
    console.log('[storage] Using in-memory storage');
    this.initializeSampleData();
  }

  // All methods for MemStorage (synchronous versions)
  async getUsers() { return this.users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }
  async getUserById(id) { return this.users.find(u => u.id === id); }
  async getUserByEmail(email) { return this.users.find(u => u.email === email); }
  async getUserByUsername(username) { return this.users.find(u => u.username === username); }
  async getUserByGoogleId(googleId) { return this.users.find(u => u.googleId === googleId); }
  async createUser(userData) {
    const user = { id: nanoid(), ...userData, createdAt: new Date().toISOString() };
    this.users.push(user);
    return user;
  }

  async updateUserRole(userId, isAdmin) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], isAdmin };
    return this.users[index];
  }

  async linkGoogleAccount(userId, googleId) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], googleId };
    return this.users[index];
  }

  async getPosts() { return this.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }
  async getPostById(id) { return this.posts.find(p => p.id === id); }
  async getPostBySlug(slug) { return this.posts.find(p => p.slug === slug); }
  async createPost(postData) {
    const post = {
      id: nanoid(),
      ...postData,
      // SEO defaults if not provided
      metaDescription: postData.metaDescription || postData.excerpt || '',
      metaKeywords: postData.metaKeywords || [],
      ogTitle: postData.ogTitle || postData.title,
      ogDescription: postData.ogDescription || postData.excerpt || '',
      ogImage: postData.ogImage || postData.featuredImage || '',
      canonicalUrl: postData.canonicalUrl || '',
      focusKeyword: postData.focusKeyword || '',
      seoTitle: postData.seoTitle || postData.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postData.status === 'published' ? new Date().toISOString() : null
    };
    this.posts.push(post);
    if (post.categoryId) {
      const category = this.categories.find(cat => cat.id === post.categoryId);
      if (category) category.postCount = this.posts.filter(p => p.categoryId === post.categoryId).length;
    }
    return post;
  }

  async updatePost(id, postData) {
    const index = this.posts.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.posts[index] = { ...this.posts[index], ...postData, updatedAt: new Date().toISOString() };
    return this.posts[index];
  }

  async deletePost(id) {
    const index = this.posts.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.posts.splice(index, 1);
    this.comments = this.comments.filter(c => c.postId !== id);
    return true;
  }

  async getCategories() { return this.categories.sort((a, b) => a.name.localeCompare(b.name)); }
  async getCategoryById(id) { return this.categories.find(c => c.id === id); }
  async getCategoryBySlug(slug) { return this.categories.find(c => c.slug === slug); }
  async createCategory(categoryData) {
    const category = { id: nanoid(), ...categoryData, postCount: 0, createdAt: new Date().toISOString() };
    this.categories.push(category);
    return category;
  }

  async updateCategory(id, categoryData) {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.categories[index] = { ...this.categories[index], ...categoryData, updatedAt: new Date().toISOString() };
    return this.categories[index];
  }

  async deleteCategory(id) {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.categories.splice(index, 1);
    return true;
  }

  async getComments() { return this.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }
  async getCommentsByPostId(postId) {
    // Return flat array of all approved comments for the post
    // The frontend will handle the parent/child relationship logic
    const allComments = this.comments.filter(c => c.postId === postId && c.status === 'approved');
    return allComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  async getCommentById(id) { return this.comments.find(c => c.id === id); }
  async createComment(commentData) {
    const post = this.posts.find(p => p.id === commentData.postId);
    const comment = {
      id: nanoid(),
      ...commentData,
      postTitle: post?.title || '',
      postSlug: post?.slug || '',
      parentId: commentData.parentId || null, // For replies
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.comments.push(comment);
    return comment;
  }

  async updateComment(id, commentData) {
    const index = this.comments.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.comments[index] = { ...this.comments[index], ...commentData, updatedAt: new Date().toISOString() };
    return this.comments[index];
  }

  async deleteComment(id) {
    const index = this.comments.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.comments.splice(index, 1);
    return true;
  }



  async updateUserApproval(userId, approved) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], approved };
    return this.users[index];
  }

  async updateUserProfile(userId, profileData) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], ...profileData, updatedAt: new Date().toISOString() };
    return this.users[index];
  }

  async updateUserPassword(userId, hashedPassword) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], password: hashedPassword, updatedAt: new Date().toISOString() };
    return this.users[index];
  }

  async updateUserRole(userId, isAdmin) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], isAdmin };
    return this.users[index];
  }

  async updateUserPassword(userId, hashedPassword) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    user.password = hashedPassword;
    return true;
  }

  async deleteUser(userId) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  initializeSampleData() {
    // Same sample data initialization as before but synchronous
    const hashedPassword = bcrypt.hashSync('password', 10);
    
    const adminUser = {
      id: nanoid(),
      email: "admin@example.com",
      username: "admin",
      name: "Admin User",
      password: hashedPassword,
      isAdmin: true,
      approved: true,
      createdAt: new Date().toISOString()
    };

    const regularUser = {
      id: nanoid(),
      email: "user@example.com",
      username: "user",
      name: "Regular User",
      password: hashedPassword,
      isAdmin: false,
      approved: true,
      createdAt: new Date().toISOString()
    };

    this.users.push(adminUser, regularUser);

    const techCategory = {
      id: nanoid(),
      name: "Technology",
      slug: "technology",
      description: "Latest trends and insights in technology",
      postCount: 0,
      createdAt: new Date().toISOString()
    };

    const designCategory = {
      id: nanoid(),
      name: "Design",
      slug: "design",
      description: "UI/UX design principles and best practices",
      postCount: 0,
      createdAt: new Date().toISOString()
    };

    this.categories.push(techCategory, designCategory);

    // Add sample posts...
    const post1 = {
      id: nanoid(),
      title: "The Future of JavaScript Frameworks",
      slug: "future-javascript-frameworks",
      content: "<h2>The Ever-Evolving JavaScript Ecosystem</h2><p>JavaScript frameworks continue to evolve rapidly...</p>",
      excerpt: "Exploring the current state and future trends in JavaScript frameworks and web development.",
      categoryId: techCategory.id,
      categoryName: techCategory.name,
      authorId: adminUser.id,
      authorName: adminUser.name,
      status: "published",
      featured: true,
      featuredImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      tags: ["javascript", "frameworks", "react", "vue", "future trends"],
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // SEO fields
      metaDescription: "Discover the future of JavaScript frameworks. Learn about React, Vue, Angular, and emerging trends in modern web development.",
      metaKeywords: ["javascript", "frameworks", "react", "vue", "angular", "web development", "programming"],
      ogTitle: "The Future of JavaScript Frameworks | BlogCraft",
      ogDescription: "Explore the evolving landscape of JavaScript frameworks and what the future holds for web development.",
      ogImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=630",
      canonicalUrl: "",
      focusKeyword: "javascript frameworks",
      seoTitle: "The Future of JavaScript Frameworks - Complete Guide 2025"
    };

    this.posts.push(post1);
    techCategory.postCount = 1;

    // Add sample comments with replies
    const comment1 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "John Doe",
      authorEmail: "john@example.com",
      content: "Great article! I really enjoyed reading about the future of JavaScript frameworks. React and Vue have been amazing to work with.",
      parentId: null,
      status: "approved",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    };

    const comment2 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "Jane Smith",
      authorEmail: "jane@example.com",
      content: "This is very insightful. I'm particularly interested in the performance improvements mentioned. Do you have any specific benchmarks?",
      parentId: null,
      status: "approved",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    };

    const comment3 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "Mike Johnson",
      authorEmail: "mike@example.com",
      content: "Interesting perspective, but I think you're missing some important aspects about Angular. It's still very relevant in enterprise environments.",
      parentId: null,
      status: "approved",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
    };

    // Add a reply to comment1
    const reply1 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "Sarah Wilson",
      authorEmail: "sarah@example.com",
      content: "@John Doe I totally agree! Have you tried the new React 18 features? The concurrent rendering is a game changer.",
      parentId: comment1.id,
      status: "approved",
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() // 18 hours ago
    };

    // Add a reply to comment2
    const reply2 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "Admin User",
      authorEmail: "admin@example.com",
      content: "@Jane Smith Great question! I'll be publishing a detailed performance comparison article next week with comprehensive benchmarks.",
      parentId: comment2.id,
      status: "approved",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
    };

    this.comments.push(comment1, comment2, comment3, reply1, reply2);
  }
}

// MongoDB storage for production
export class MongoStorage {
  constructor() {
    this.client = null;
    this.db = null;
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;

    if (!process.env.MONGODB_URI) {
      throw new Error('[mongodb] MONGODB_URI environment variable not set');
    }

    try {
      console.log('[mongodb] Attempting to connect to MongoDB...');
      
      // Create client with timeout options
      this.client = new MongoClient(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 10000, // 10 second timeout
        socketTimeoutMS: 10000
      });
      
      // Connect with timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
        )
      ]);
      
      this.db = this.client.db(); // Use default database from connection string
      this.connected = true;
      console.log('[mongodb] Connected successfully');
      
      // Initialize with sample data if collections are empty
      await this.initializeSampleData();
    } catch (error) {
      console.error('[mongodb] Connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log('[mongodb] Disconnected');
    }
  }

  async clearAll() {
    if (!this.connected) await this.connect();
    
    // Drop all collections
    await this.db.collection('users').deleteMany({});
    await this.db.collection('categories').deleteMany({});
    await this.db.collection('posts').deleteMany({});
    await this.db.collection('comments').deleteMany({});
    
    console.log('[mongodb] All data cleared');
    
    // Reinitialize sample data
    await this.initializeSampleData();
  }

  async fixAdminUser() {
    console.log('[mongodb] Fixing admin user permissions...');
    const result = await this.db.collection('users').updateOne(
      { email: "admin@example.com" },
      { $set: { isAdmin: true } }
    );
    console.log('[mongodb] Admin user fix result:', result.modifiedCount, 'documents modified');
  }

  async initializeSampleData() {
    // Check if data already exists
    const existingUsers = await this.db.collection('users').countDocuments();
    if (existingUsers > 0) {
      // Fix admin user if data exists
      await this.fixAdminUser();
      return; // Data already exists
    }
    
    console.log('[mongodb] Initializing sample data...');
    
    // Import bcrypt for password hashing
    const bcrypt = await import('bcryptjs');
    
    // Create sample users with properly hashed passwords
    const adminUser = {
      id: nanoid(),
      email: "admin@example.com",
      username: "admin",
      name: "Admin User",
      password: await bcrypt.hash("password", 10),
      isAdmin: true,
      approved: true,
      createdAt: new Date().toISOString()
    };
    
    const regularUser = {
      id: nanoid(),
      email: "user@example.com", 
      username: "user",
      name: "Regular User",
      password: await bcrypt.hash("password", 10),
      isAdmin: false,
      approved: true,
      createdAt: new Date().toISOString()
    };
    
    await this.db.collection('users').insertMany([adminUser, regularUser]);
    console.log('[mongodb] Sample users created');
    
    // Create sample categories
    const techCategory = {
      id: nanoid(),
      name: "Technology",
      slug: "technology",
      description: "Latest in tech and innovation",
      postCount: 0,
      createdAt: new Date().toISOString()
    };
    
    const designCategory = {
      id: nanoid(),
      name: "Design",
      slug: "design", 
      description: "UI/UX and creative design",
      postCount: 0,
      createdAt: new Date().toISOString()
    };
    
    await this.db.collection('categories').insertMany([techCategory, designCategory]);
    
    // Create sample posts
    const post1 = {
      id: nanoid(),
      title: "Getting Started with Modern Web Development",
      slug: "getting-started-modern-web-development",
      content: `<h2>Introduction to Modern Web Development</h2>
        <p>Web development has evolved significantly over the past decade. With the rise of modern frameworks like React, Vue, and Angular, developers now have powerful tools to build interactive and dynamic web applications.</p>
        
        <h3>Key Technologies</h3>
        <ul>
          <li><strong>React</strong> - A JavaScript library for building user interfaces</li>
          <li><strong>Node.js</strong> - JavaScript runtime for server-side development</li>
          <li><strong>Express</strong> - Fast, unopinionated web framework for Node.js</li>
          <li><strong>MongoDB</strong> - NoSQL database for modern applications</li>
        </ul>
        
        <h3>Best Practices</h3>
        <p>When building modern web applications, it's important to follow these best practices:</p>
        <ol>
          <li>Write clean, maintainable code</li>
          <li>Use version control effectively</li>
          <li>Implement proper error handling</li>
          <li>Optimize for performance</li>
          <li>Ensure security best practices</li>
        </ol>
        
        <blockquote>
          "The best way to learn web development is by building real projects and solving real problems."
        </blockquote>
        
        <p>Whether you're just starting out or looking to modernize your skills, the key is to stay curious and keep building.</p>`,
      excerpt: "Learn the fundamentals of modern web development with React, Node.js, and other cutting-edge technologies.",
      categoryId: techCategory.id,
      categoryName: techCategory.name,
      authorId: adminUser.id,
      authorName: adminUser.name,
      status: "published",
      featured: true,
      featuredImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["web development", "react", "javascript", "tutorial"],
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const post2 = {
      id: nanoid(),
      title: "Designing for Accessibility: A Complete Guide",
      slug: "designing-for-accessibility-guide",
      content: `<h2>Why Accessibility Matters</h2>
        <p>Accessibility in web design ensures that websites and applications can be used by everyone, including people with disabilities. It's not just about compliance—it's about creating inclusive experiences.</p>
        
        <h3>Key Principles of Accessible Design</h3>
        <h4>1. Perceivable</h4>
        <p>Information must be presentable in ways users can perceive:</p>
        <ul>
          <li>Provide text alternatives for images</li>
          <li>Use sufficient color contrast</li>
          <li>Make content adaptable to different presentations</li>
        </ul>
        
        <h4>2. Operable</h4>
        <p>Interface components must be operable:</p>
        <ul>
          <li>Make all functionality keyboard accessible</li>
          <li>Give users enough time to read content</li>
          <li>Don't use content that causes seizures</li>
        </ul>
        
        <h4>3. Understandable</h4>
        <p>Information and UI operation must be understandable:</p>
        <ul>
          <li>Make text readable and understandable</li>
          <li>Make content appear and operate predictably</li>
        </ul>
        
        <h4>4. Robust</h4>
        <p>Content must be robust enough for various user agents:</p>
        <ul>
          <li>Maximize compatibility with assistive technologies</li>
          <li>Use valid, semantic HTML</li>
        </ul>
        
        <h3>Practical Tips</h3>
        <p>Here are some practical ways to improve accessibility:</p>
        <pre><code>// Example: Proper button markup
&lt;button type="button" aria-label="Close dialog"&gt;
  &lt;span aria-hidden="true"&gt;×&lt;/span&gt;
&lt;/button&gt;</code></pre>
        
        <p>Remember: accessibility benefits everyone, not just people with disabilities. It improves usability, SEO, and overall user experience.</p>`,
      excerpt: "Learn how to design and build accessible web experiences that work for everyone.",
      categoryId: designCategory.id,
      categoryName: designCategory.name,
      authorId: adminUser.id,
      authorName: adminUser.name,
      status: "published",
      featured: false,
      featuredImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["accessibility", "design", "ux", "inclusive design"],
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      // SEO fields
      metaDescription: "Complete guide to designing accessible web experiences. Learn WCAG principles, implementation tips, and best practices for inclusive design.",
      metaKeywords: ["accessibility", "web design", "WCAG", "inclusive design", "UX", "usability"],
      ogTitle: "Designing for Accessibility: Complete Guide | BlogCraft",
      ogDescription: "Master web accessibility with our comprehensive guide covering WCAG principles and practical implementation strategies.",
      ogImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630",
      canonicalUrl: "",
      focusKeyword: "web accessibility",
      seoTitle: "Web Accessibility Guide - WCAG Best Practices 2025"
    };
    
    const post3 = {
      id: nanoid(),
      title: "The Future of JavaScript Frameworks",
      slug: "future-javascript-frameworks",
      content: `<h2>The Ever-Evolving JavaScript Ecosystem</h2>
        <p>JavaScript frameworks continue to evolve at a rapid pace. From React's hooks to Vue's Composition API, the landscape is constantly changing.</p>
        
        <h3>Current State of Frameworks</h3>
        <p>The most popular frameworks today include:</p>
        <ul>
          <li><strong>React</strong> - Still the most widely used, with a huge ecosystem</li>
          <li><strong>Vue</strong> - Known for its gentle learning curve and versatility</li>
          <li><strong>Angular</strong> - Full-featured framework for large applications</li>
          <li><strong>Svelte</strong> - Compile-time optimization for better performance</li>
        </ul>
        
        <h3>Emerging Trends</h3>
        <p>Several trends are shaping the future:</p>
        <ol>
          <li><strong>Server-Side Rendering (SSR)</strong> - Better SEO and performance</li>
          <li><strong>Static Site Generation (SSG)</strong> - Fast, secure, and scalable</li>
          <li><strong>Edge Computing</strong> - Bringing computation closer to users</li>
          <li><strong>Web Assembly</strong> - Near-native performance in browsers</li>
        </ol>
        
        <blockquote>
          "The best framework is the one that solves your specific problem efficiently."
        </blockquote>
        
        <h3>What's Next?</h3>
        <p>The future likely holds:</p>
        <ul>
          <li>Better developer experience with improved tooling</li>
          <li>Smaller bundle sizes and faster load times</li>
          <li>More focus on accessibility and performance</li>
          <li>Better integration with emerging web standards</li>
        </ul>
        
        <p>The key is to stay adaptable and focus on fundamentals while keeping an eye on emerging trends.</p>`,
      excerpt: "Exploring the current state and future trends in JavaScript frameworks and web development.",
      categoryId: techCategory.id,
      categoryName: techCategory.name,
      authorId: adminUser.id,
      authorName: adminUser.name,
      status: "published",
      featured: true,
      featuredImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["javascript", "frameworks", "react", "vue", "future trends"],
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.db.collection('posts').insertMany([post1, post2, post3]);
    
    // Update category post counts
    await this.db.collection('categories').updateOne(
      { id: techCategory.id },
      { $set: { postCount: 2 } }
    );
    await this.db.collection('categories').updateOne(
      { id: designCategory.id },
      { $set: { postCount: 1 } }
    );
    
    // Create sample comments
    const comment1 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "John Doe",
      authorEmail: "john@example.com",
      content: "Great article! I really enjoyed reading about the modern web development approaches. React has definitely changed how I build applications.",
      parentId: null,
      status: "approved",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
    };

    const comment2 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "Jane Smith",
      authorEmail: "jane@example.com",
      content: "This is very insightful. I'm particularly interested in the performance improvements mentioned. Do you have any specific benchmarks?",
      parentId: null,
      status: "pending",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    };

    const comment3 = {
      id: nanoid(),
      postId: post2.id,
      postTitle: post2.title,
      postSlug: post2.slug,
      authorName: "Mike Johnson",
      authorEmail: "mike@example.com",
      content: "Accessibility is so important but often overlooked. Thanks for the practical tips!",
      parentId: null,
      status: "approved",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
    };

    // Add a reply to comment1
    const reply1 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: "Sarah Wilson",
      authorEmail: "sarah@example.com",
      content: "@John Doe I totally agree! Have you tried the new React 18 features? The concurrent rendering is a game changer.",
      parentId: comment1.id,
      status: "approved",
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() // 18 hours ago
    };

    // Add a reply to comment2
    const reply2 = {
      id: nanoid(),
      postId: post1.id,
      postTitle: post1.title,
      postSlug: post1.slug,
      authorName: adminUser.name,
      authorEmail: adminUser.email,
      content: "@Jane Smith Great question! I'll be publishing a detailed performance comparison article next week with comprehensive benchmarks.",
      parentId: comment2.id,
      status: "approved",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
    };

    await this.db.collection('comments').insertMany([comment1, comment2, comment3, reply1, reply2]);
    console.log('[mongodb] Sample comments created');
  }

  // User methods
  async getUsers() {
    await this.connect();
    return await this.db.collection('users').find({}).toArray();
  }

  async getUserById(id) {
    await this.connect();
    return await this.db.collection('users').findOne({ id });
  }

  async getUserByEmail(email) {
    await this.connect();
    return await this.db.collection('users').findOne({ email });
  }

  async getUserByUsername(username) {
    await this.connect();
    return await this.db.collection('users').findOne({ username });
  }

  async getUserByGoogleId(googleId) {
    await this.connect();
    return await this.db.collection('users').findOne({ googleId });
  }

  async createUser(userData) {
    await this.connect();
    const user = {
      id: nanoid(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    await this.db.collection('users').insertOne(user);
    return user;
  }

  async updateUserRole(userId, isAdmin) {
    await this.connect();
    console.log('[mongodb] Looking for user with id:', userId);
    
    // First check if user exists
    const existingUser = await this.db.collection('users').findOne({ id: userId });
    if (!existingUser) {
      console.log('[mongodb] User not found with id:', userId);
      return null;
    }
    
    console.log('[mongodb] Found user:', existingUser.email, 'updating isAdmin to:', isAdmin);
    
    const result = await this.db.collection('users').findOneAndUpdate(
      { id: userId },
      { $set: { isAdmin } },
      { returnDocument: 'after' }
    );
    
    console.log('[mongodb] Update result:', result);
    return result || result.value;
  }

  async updateUserApproval(userId, approved) {
    await this.connect();
    console.log('[mongodb] Looking for user with id:', userId);
    
    // First check if user exists
    const existingUser = await this.db.collection('users').findOne({ id: userId });
    if (!existingUser) {
      console.log('[mongodb] User not found with id:', userId);
      return null;
    }
    
    console.log('[mongodb] Found user:', existingUser.email, 'updating approved to:', approved);
    
    const result = await this.db.collection('users').findOneAndUpdate(
      { id: userId },
      { $set: { approved } },
      { returnDocument: 'after' }
    );
    
    console.log('[mongodb] Update result:', result);
    return result || result.value;
  }

  async deleteUser(userId) {
    await this.connect();
    console.log('[mongodb] Deleting user with id:', userId);
    
    // First check if user exists
    const existingUser = await this.db.collection('users').findOne({ id: userId });
    if (!existingUser) {
      console.log('[mongodb] User not found with id:', userId);
      return false;
    }
    
    console.log('[mongodb] Found user:', existingUser.email, 'proceeding with deletion');
    
    const result = await this.db.collection('users').deleteOne({ id: userId });
    console.log('[mongodb] Delete result:', result.deletedCount, 'users deleted');
    
    return result.deletedCount > 0;
  }

  async updateUserProfile(userId, profileData) {
    await this.connect();
    const result = await this.db.collection('users').findOneAndUpdate(
      { id: userId },
      { $set: { ...profileData, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return result || result.value;
  }

  async updateUserPassword(userId, hashedPassword) {
    await this.connect();
    const result = await this.db.collection('users').findOneAndUpdate(
      { id: userId },
      { $set: { password: hashedPassword, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return result || result.value;
  }

  async linkGoogleAccount(userId, googleId) {
    await this.connect();
    const result = await this.db.collection('users').findOneAndUpdate(
      { id: userId },
      { $set: { googleId } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Post methods
  async getPosts() {
    await this.connect();
    return await this.db.collection('posts').find({}).sort({ createdAt: -1 }).toArray();
  }

  async getPostById(id) {
    await this.connect();
    return await this.db.collection('posts').findOne({ id });
  }

  async getPostBySlug(slug) {
    await this.connect();
    return await this.db.collection('posts').findOne({ slug });
  }

  async createPost(postData) {
    await this.connect();
    const post = {
      id: nanoid(),
      ...postData,
      // SEO defaults if not provided
      metaDescription: postData.metaDescription || postData.excerpt || '',
      metaKeywords: postData.metaKeywords || [],
      ogTitle: postData.ogTitle || postData.title,
      ogDescription: postData.ogDescription || postData.excerpt || '',
      ogImage: postData.ogImage || postData.featuredImage || '',
      canonicalUrl: postData.canonicalUrl || '',
      focusKeyword: postData.focusKeyword || '',
      seoTitle: postData.seoTitle || postData.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postData.status === 'published' ? new Date().toISOString() : null
    };
    await this.db.collection('posts').insertOne(post);
    
    // Update category post count
    if (post.categoryId) {
      const postCount = await this.db.collection('posts').countDocuments({ categoryId: post.categoryId });
      await this.db.collection('categories').updateOne(
        { id: post.categoryId },
        { $set: { postCount } }
      );
    }
    
    return post;
  }

  async updatePost(id, postData) {
    await this.connect();
    const existingPost = await this.db.collection('posts').findOne({ id });
    if (!existingPost) return null;
    
    const oldCategoryId = existingPost.categoryId;
    const updatedPost = {
      ...existingPost,
      ...postData,
      updatedAt: new Date().toISOString(),
      publishedAt: postData.status === 'published' && !existingPost.publishedAt 
        ? new Date().toISOString() 
        : existingPost.publishedAt
    };
    
    await this.db.collection('posts').updateOne({ id }, { $set: updatedPost });
    
    // Update category post counts
    if (oldCategoryId !== postData.categoryId) {
      if (oldCategoryId) {
        const oldPostCount = await this.db.collection('posts').countDocuments({ categoryId: oldCategoryId });
        await this.db.collection('categories').updateOne(
          { id: oldCategoryId },
          { $set: { postCount: oldPostCount } }
        );
      }
      if (postData.categoryId) {
        const newPostCount = await this.db.collection('posts').countDocuments({ categoryId: postData.categoryId });
        await this.db.collection('categories').updateOne(
          { id: postData.categoryId },
          { $set: { postCount: newPostCount } }
        );
      }
    }
    
    return updatedPost;
  }

  async deletePost(id) {
    await this.connect();
    const post = await this.db.collection('posts').findOne({ id });
    if (!post) return false;
    
    await this.db.collection('posts').deleteOne({ id });
    
    // Update category post count
    if (post.categoryId) {
      const postCount = await this.db.collection('posts').countDocuments({ categoryId: post.categoryId });
      await this.db.collection('categories').updateOne(
        { id: post.categoryId },
        { $set: { postCount } }
      );
    }
    
    // Delete associated comments
    await this.db.collection('comments').deleteMany({ postId: id });
    
    return true;
  }

  // Category methods
  async getCategories() {
    await this.connect();
    return await this.db.collection('categories').find({}).sort({ name: 1 }).toArray();
  }

  async getCategoryById(id) {
    await this.connect();
    return await this.db.collection('categories').findOne({ id });
  }

  async getCategoryBySlug(slug) {
    await this.connect();
    return await this.db.collection('categories').findOne({ slug });
  }

  async createCategory(categoryData) {
    await this.connect();
    const category = {
      id: nanoid(),
      ...categoryData,
      postCount: 0,
      createdAt: new Date().toISOString()
    };
    await this.db.collection('categories').insertOne(category);
    return category;
  }

  async updateCategory(id, categoryData) {
    await this.connect();
    const existingCategory = await this.db.collection('categories').findOne({ id });
    if (!existingCategory) return null;
    
    const updatedCategory = {
      ...existingCategory,
      ...categoryData,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.collection('categories').updateOne({ id }, { $set: updatedCategory });
    
    // Update posts with new category name
    if (categoryData.name) {
      await this.db.collection('posts').updateMany(
        { categoryId: id },
        { $set: { categoryName: categoryData.name } }
      );
    }
    
    return updatedCategory;
  }

  async deleteCategory(id) {
    await this.connect();
    const result = await this.db.collection('categories').deleteOne({ id });
    
    if (result.deletedCount > 0) {
      // Update posts to remove category reference
      await this.db.collection('posts').updateMany(
        { categoryId: id },
        { $set: { categoryId: null, categoryName: null } }
      );
    }
    
    return result.deletedCount > 0;
  }

  // Comment methods
  async getComments() {
    await this.connect();
    return await this.db.collection('comments').find({}).sort({ createdAt: -1 }).toArray();
  }

  async getCommentsByPostId(postId) {
    await this.connect();
    // Return flat array of all approved comments for the post
    // The frontend will handle the parent/child relationship logic
    const allComments = await this.db.collection('comments')
      .find({ postId, status: 'approved' })
      .sort({ createdAt: 1 })
      .toArray();
    
    return allComments;
  }

  async getCommentById(id) {
    await this.connect();
    return await this.db.collection('comments').findOne({ id });
  }

  async createComment(commentData) {
    await this.connect();
    const post = await this.db.collection('posts').findOne({ id: commentData.postId });
    const comment = {
      id: nanoid(),
      ...commentData,
      postTitle: post?.title || '',
      postSlug: post?.slug || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await this.db.collection('comments').insertOne(comment);
    return comment;
  }

  async getAllComments() {
    await this.connect();
    const comments = await this.db.collection('comments')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get post titles for each comment
    const commentsWithPosts = await Promise.all(
      comments.map(async (comment) => {
        const post = await this.db.collection('posts').findOne({ id: comment.postId });
        return {
          ...comment,
          postTitle: post?.title || 'Unknown Post'
        };
      })
    );
    
    return commentsWithPosts;
  }

  async updateCommentStatus(commentId, status) {
    await this.connect();
    const result = await this.db.collection('comments').findOneAndUpdate(
      { id: commentId },
      { $set: { status, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async updateComment(id, commentData) {
    await this.connect();
    const existingComment = await this.db.collection('comments').findOne({ id });
    if (!existingComment) return null;
    
    const updatedComment = {
      ...existingComment,
      ...commentData,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.collection('comments').updateOne({ id }, { $set: updatedComment });
    return updatedComment;
  }

  async deleteComment(id) {
    await this.connect();
    const result = await this.db.collection('comments').deleteOne({ id });
    return result.deletedCount > 0;
  }
}

// Create storage instance with improved fallback
let storage;

async function initializeStorage() {
  try {
    if (process.env.MONGODB_URI) {
      console.log('[storage] Attempting MongoDB connection...');
      const mongoStorage = new MongoStorage();
      await mongoStorage.connect(); // Test connection
      storage = mongoStorage;
      console.log('[storage] MongoDB initialized successfully');
    } else {
      console.log('[storage] No MongoDB URI found, using in-memory storage');
      storage = new MemStorage();
    }
  } catch (error) {
    console.error('[storage] MongoDB connection failed, falling back to in-memory storage:', error.message);
    storage = new MemStorage();
  }
}

// Initialize storage but don't block startup
initializeStorage().catch(error => {
  console.error('[storage] Storage initialization failed:', error);
  // Fallback to in-memory storage if everything fails
  if (!storage) {
    storage = new MemStorage();
  }
});

// Provide immediate fallback
if (!storage) {
  storage = new MemStorage();
}

export { storage };