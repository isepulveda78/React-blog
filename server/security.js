import validator from 'validator';

/**
 * Security utilities for input validation and sanitization
 */

// Sanitize user inputs to prevent XSS and injection attacks
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Escape HTML entities to prevent XSS
  let sanitized = validator.escape(input);
  
  // Remove any potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, '');
  
  return sanitized.trim();
};

// Validate email format
export const validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 100;
};

// Validate username (alphanumeric, underscore, hyphen only)
export const validateUsername = (username) => {
  return validator.isAlphanumeric(username.replace(/[-_]/g, '')) && 
         username.length >= 3 && 
         username.length <= 30;
};

// Validate post title
export const validatePostTitle = (title) => {
  return typeof title === 'string' && 
         title.trim().length >= 3 && 
         title.trim().length <= 200;
};

// Validate post content (basic length check)
export const validatePostContent = (content) => {
  return typeof content === 'string' && 
         content.trim().length >= 10 && 
         content.trim().length <= 50000;
};

// Validate category name
export const validateCategoryName = (name) => {
  return typeof name === 'string' && 
         name.trim().length >= 2 && 
         name.trim().length <= 50;
};

// Validate comment content
export const validateCommentContent = (content) => {
  return typeof content === 'string' && 
         content.trim().length >= 1 && 
         content.trim().length <= 1000;
};

// Validate chatroom name
export const validateChatroomName = (name) => {
  return typeof name === 'string' && 
         name.trim().length >= 2 && 
         name.trim().length <= 100;
};

// Sanitize object by applying sanitizeInput to all string properties
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Middleware to sanitize request body
export const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

// Check if password meets security requirements
export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }
  
  return { valid: true };
};

// Validate URL format
export const validateURL = (url) => {
  if (!url) return true; // Optional URLs can be empty
  
  try {
    new URL(url);
    return validator.isURL(url) && url.length <= 500;
  } catch {
    return false;
  }
};

// Security logging utility
export const logSecurityEvent = (event, details = {}) => {
  console.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};