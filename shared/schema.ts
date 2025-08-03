// This file is kept for compatibility with the existing imports
// The actual schemas are now managed in memory by the storage layer

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  password: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  categoryName?: string;
  authorId: string;
  authorName: string;
  status: 'draft' | 'published';
  featured: boolean;
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}