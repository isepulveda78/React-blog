# BlogCraft - Modern Blog Platform

## Overview
BlogCraft is a full-stack blog platform providing a complete content management system with public blog viewing and administrative capabilities. It features user authentication, blog post management, a commenting system, category organization, and comprehensive SEO implementation. The project vision is to offer a robust and user-friendly platform for content creators with a focus on modern web technologies and a streamlined development experience, offering a robust and user-friendly platform for content creators.

## User Preferences
Preferred communication style: Simple, everyday language.
Tech stack preferences: JavaScript (JSX) without TypeScript, Bootstrap UI framework instead of shadcn/ui.
Development preference: Fast iteration with immediate visual feedback - expects changes to be visible immediately after making edits.
Cache management: Successfully implemented polling-based hot reload system for instant change detection and automatic page refresh. System detects file changes every 2 seconds and triggers automatic browser refreshes. Working reliably with proper development file serving and cache control headers.

## Recent Issues Resolved (August 2025)
- Fixed critical React mounting issue where components weren't rendering despite HTML loading properly
- Resolved Vite middleware ordering problems that prevented JSX module loading
- Fixed host blocking errors by adding Replit domain allowedHosts configuration
- Restored functional React application with proper Vite development server integration
- Permanently resolved infinite reload loop by disabling problematic custom hot reload system
- Fixed authentication JSON parsing error with enhanced error handling and debugging
- Stabilized WebSocket chat system with comprehensive client connection tracking

## System Architecture

### Frontend Architecture
- **Framework**: React 18
- **UI Components**: Bootstrap 5 components and styling
- **Build Tool**: Vite for development and production builds with hot module replacement
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with JavaScript
- **Database**: MongoDB with native driver for data persistence, with graceful fallback to in-memory storage if MongoDB unavailable
- **Authentication**: Session-based authentication with bcrypt password hashing and Google OAuth integration (passport-google-oauth20)
- **API Design**: RESTful API endpoints
- **Data Collections**: Users, posts, categories, and comments
- **Cloud Storage**: Cloudinary for image uploads
- **Real-time Features**: WebSocket chat system with database-backed chatrooms for educational tools, including PDF export for teachers/admins.

### Project Structure
- **Simplified Layout**: Consolidated architecture with minimal file structure
- **Client Code**: Single React application in `/client/src/main.jsx`
- **Server Code**: Express API in `/server` directory

### Database Schema
- **Users**: Authentication, profile information, admin roles, and teacher/student roles.
- **Categories**: Blog post categorization.
- **Blog Posts**: Rich content with metadata, SEO fields, and publishing workflow.
- **Comments**: Nested commenting system.
- **Chatrooms**: Admin-created chat spaces with invitation lists and access control.

### Educational Tools & Features
- **Code Evolution Visualization**: Real-time code evolution visualization with engaging transitions, interactive timeline, play/pause controls, and statistics tracking.
- **City Builder**: Interactive city planning and building tool.
- **Bingo Generator**: Custom bingo card creation for educational activities.
- **Spanish Alphabet**: Interactive soundboard for learning Spanish letters.
- **Word Sorter**: Drag-and-drop word sorting activities.
- **Listen to Type**: Audio-based typing practice tool with chatroom integration.

### Authentication & Authorization
- **User Registration/Login**: Email/password and Google OAuth authentication.
- **Password Security**: bcrypt hashing.
- **Immediate Blog Access**: Authenticated users can immediately read posts and leave comments without approval.
- **Role-Based Access**: Admin users have access to management interfaces, students have chat access.
- **Session Management**: Server-side session validation with proper React context integration.
- **Chatroom Access Control**: Teachers/admins can create private chatrooms and invite specific users.
- **Security Enhancements**: Helmet.js for security headers, rate limiting, comprehensive input validation (email, username, passwords, content), express-mongo-sanitize for NoSQL injection prevention, security event logging, secure cookies, strong password requirements, XSS protection, restricted file uploads, and HTTPS configuration.

### Rich Text Editing
- **Custom Editor**: Built-in WYSIWYG editor with formatting controls.
- **Content Storage**: HTML content stored in database.
- **Media Support**: Image upload and embedding via Cloudinary.

### SEO Implementation
- **SEO Management Dashboard**: Dedicated admin interface for SEO analysis, settings, and optimization.
- **Dynamic Meta Tag Management**: Automatic meta tag updates for blog posts.
- **Sitemap and Robots.txt Generation**: Automated XML sitemap and robots.txt generation.
- **SEO Content Analysis**: Real-time SEO scoring and optimization suggestions.

### Deployment Configuration
- **Build System**: Vite for frontend, esbuild for backend.
- **Hybrid Architecture**: Compatible development (CDN-based React, in-browser Babel) and production (optimized bundles) modes.
- **Port Configuration**: Server listens on port 5000, binds to "0.0.0.0".
- **Production Setup**: `npm run build` creates `dist/`, `npm run start` runs `dist/index.js`, static files served from `dist/public/`.

## External Dependencies

### Database & ORM
- **MongoDB**: Primary database for data persistence.

### UI & Styling
- **Bootstrap 5**: UI framework for styling.

### State Management & Data Fetching
- **React Hook Form**: Form state management.
- **Zod**: Runtime type validation and schema definition.

### Development Tools
- **Vite**: Build tool and development server.
- **Hot Reload System**: Custom inline hot reload implementation for instant development feedback with visual indicators and console logging.
- **Express.js**: Backend framework.

### Cloud Services
- **Cloudinary**: Cloud storage for images.

### Authentication Libraries
- **Passport.js** and **passport-google-oauth20**: For authentication.

### Security Libraries
- **Helmet.js**: For security headers.
- **express-mongo-sanitize**: For NoSQL injection prevention.
- **validator**: For input sanitization.

### PDF Generation Libraries
- **jsPDF**: For client-side PDF generation.
- **html2canvas**: For rendering HTML to canvas for PDF export.