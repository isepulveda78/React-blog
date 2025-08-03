import { nanoid } from "nanoid";

// In-memory storage for development
export class MemStorage {
  constructor() {
    this.users = [];
    this.posts = [];
    this.categories = [];
    this.comments = [];
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Create sample users
    const adminUser = {
      id: nanoid(),
      email: "admin@example.com",
      username: "admin",
      name: "Admin User",
      password: "$2a$10$rQ3VF4v5bJ.A4I2Dkz2hIu4.J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X", // "password"
      isAdmin: true,
      createdAt: new Date().toISOString()
    };
    
    const regularUser = {
      id: nanoid(),
      email: "user@example.com", 
      username: "user",
      name: "Regular User",
      password: "$2a$10$rQ3VF4v5bJ.A4I2Dkz2hIu4.J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X", // "password"
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    
    this.users.push(adminUser, regularUser);
    
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
    
    this.categories.push(techCategory, designCategory);
    
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
      tags: ["accessibility", "design", "ux", "inclusive design"],
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
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
      tags: ["javascript", "frameworks", "react", "vue", "future trends"],
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.posts.push(post1, post2, post3);
    
    // Update category post counts
    techCategory.postCount = this.posts.filter(p => p.categoryId === techCategory.id).length;
    designCategory.postCount = this.posts.filter(p => p.categoryId === designCategory.id).length;
  }

  // User methods
  async getUsers() {
    return this.users;
  }

  async getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async getUserByUsername(username) {
    return this.users.find(user => user.username === username);
  }

  async createUser(userData) {
    const user = {
      id: nanoid(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  // Post methods
  async getPosts() {
    return this.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getPostById(id) {
    return this.posts.find(post => post.id === id);
  }

  async getPostBySlug(slug) {
    return this.posts.find(post => post.slug === slug);
  }

  async createPost(postData) {
    const post = {
      id: nanoid(),
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postData.status === 'published' ? new Date().toISOString() : null
    };
    this.posts.push(post);
    
    // Update category post count
    if (post.categoryId) {
      const category = this.categories.find(cat => cat.id === post.categoryId);
      if (category) {
        category.postCount = this.posts.filter(p => p.categoryId === post.categoryId).length;
      }
    }
    
    return post;
  }

  async updatePost(id, postData) {
    const index = this.posts.findIndex(post => post.id === id);
    if (index === -1) return null;
    
    const oldCategoryId = this.posts[index].categoryId;
    
    this.posts[index] = {
      ...this.posts[index],
      ...postData,
      updatedAt: new Date().toISOString(),
      publishedAt: postData.status === 'published' && !this.posts[index].publishedAt 
        ? new Date().toISOString() 
        : this.posts[index].publishedAt
    };
    
    // Update category post counts
    if (oldCategoryId !== postData.categoryId) {
      if (oldCategoryId) {
        const oldCategory = this.categories.find(cat => cat.id === oldCategoryId);
        if (oldCategory) {
          oldCategory.postCount = this.posts.filter(p => p.categoryId === oldCategoryId).length;
        }
      }
      if (postData.categoryId) {
        const newCategory = this.categories.find(cat => cat.id === postData.categoryId);
        if (newCategory) {
          newCategory.postCount = this.posts.filter(p => p.categoryId === postData.categoryId).length;
        }
      }
    }
    
    return this.posts[index];
  }

  async deletePost(id) {
    const index = this.posts.findIndex(post => post.id === id);
    if (index === -1) return false;
    
    const post = this.posts[index];
    this.posts.splice(index, 1);
    
    // Update category post count
    if (post.categoryId) {
      const category = this.categories.find(cat => cat.id === post.categoryId);
      if (category) {
        category.postCount = this.posts.filter(p => p.categoryId === post.categoryId).length;
      }
    }
    
    // Delete associated comments
    this.comments = this.comments.filter(comment => comment.postId !== id);
    
    return true;
  }

  // Category methods
  async getCategories() {
    return this.categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCategoryById(id) {
    return this.categories.find(category => category.id === id);
  }

  async getCategoryBySlug(slug) {
    return this.categories.find(category => category.slug === slug);
  }

  async createCategory(categoryData) {
    const category = {
      id: nanoid(),
      ...categoryData,
      postCount: 0,
      createdAt: new Date().toISOString()
    };
    this.categories.push(category);
    return category;
  }

  async updateCategory(id, categoryData) {
    const index = this.categories.findIndex(category => category.id === id);
    if (index === -1) return null;
    
    this.categories[index] = {
      ...this.categories[index],
      ...categoryData,
      updatedAt: new Date().toISOString()
    };
    
    // Update posts with new category name
    this.posts.forEach(post => {
      if (post.categoryId === id) {
        post.categoryName = categoryData.name;
      }
    });
    
    return this.categories[index];
  }

  async deleteCategory(id) {
    const index = this.categories.findIndex(category => category.id === id);
    if (index === -1) return false;
    
    this.categories.splice(index, 1);
    
    // Update posts to remove category reference
    this.posts.forEach(post => {
      if (post.categoryId === id) {
        post.categoryId = null;
        post.categoryName = null;
      }
    });
    
    return true;
  }

  // Comment methods
  async getComments() {
    return this.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getCommentsByPostId(postId) {
    return this.comments
      .filter(comment => comment.postId === postId && comment.status === 'approved')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async getCommentById(id) {
    return this.comments.find(comment => comment.id === id);
  }

  async createComment(commentData) {
    const post = this.posts.find(p => p.id === commentData.postId);
    const comment = {
      id: nanoid(),
      ...commentData,
      postTitle: post?.title || '',
      postSlug: post?.slug || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.comments.push(comment);
    return comment;
  }

  async updateComment(id, commentData) {
    const index = this.comments.findIndex(comment => comment.id === id);
    if (index === -1) return null;
    
    this.comments[index] = {
      ...this.comments[index],
      ...commentData,
      updatedAt: new Date().toISOString()
    };
    
    return this.comments[index];
  }

  async deleteComment(id) {
    const index = this.comments.findIndex(comment => comment.id === id);
    if (index === -1) return false;
    
    this.comments.splice(index, 1);
    return true;
  }
}

export const storage = new MemStorage();