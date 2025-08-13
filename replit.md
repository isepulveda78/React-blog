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
- **BREAKTHROUGH: Solved Google Drive/Dropbox audio streaming issue** - Implemented server-side audio proxy that automatically converts sharing URLs to direct download format and streams audio files, bypassing CORS and hotlinking restrictions
- **Completed systematic alert() replacement with toast notifications** - Replaced all JavaScript alert functions with Bootstrap toast messages throughout the application
- **Enhanced Word Sorter with clickable list title editing** - Implemented inline editing functionality allowing users to click on list titles to rename them, removed separate input fields for cleaner UI
- **Restored City Builder to working version** - Reverted from broken modular architecture back to fully functional single-file implementation with resizable roads and water, drag-and-drop building placement, comprehensive resize handles, and PNG export functionality
- **COMPLETED: Comprehensive Text Quiz System** - Built complete text-based quiz system with same functionality as audio quizzes: create/edit/delete quizzes (teacher/admin), take quizzes (students), grade tracking in admin dashboard, and integrated results display in user profiles with tabbed interface
- **COMPLETED: Attempt Limits Feature** - Added configurable attempt limits (1, 2, 3, 5, 10, unlimited) to both audio and text quizzes with real-time tracking and enforcement
- **Updated Educational Tools Access** - Modified educational tools page so students see only quizzes and Spanish Alphabet, while teachers/admins retain access to all tools
- **RESOLVED: Blog update visibility issue** - Fixed blog refresh system with aggressive cache-busting, enhanced debugging tools, and proper Wouter router navigation. Blog data updates now appear immediately with working "Read More" functionality.
- **RESOLVED: HTML encoding display issue** - Applied comprehensive HTML entity decoding to all blog API endpoints (public posts, individual posts, admin routes). Blog post updates now display correctly without HTML entity artifacts, with proper cache-busting for immediate visibility.
- **RESOLVED: WebSocket server conflicts** - Fixed persistent WebSocket port conflicts that were preventing server restarts. Server now starts reliably without port blocking issues.
- **RESOLVED: iframe embedding blocked** - Fixed Content Security Policy to allow iframe embedding from Google Docs, Google Drive, YouTube, Vimeo, and other educational platforms.
- **REMOVED: Editor.js Dependencies** - Removed Editor.js block editor due to complexity issues and reverted to simple textarea elements with HTML formatting support for reliable content editing.
- **COMPLETED: Production Code Cleanup** - Removed all debugging console.log statements from blog components, admin interfaces, and editor components for cleaner production-ready code.

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
- **Data Collections**: Users, posts, categories, comments, audio quizzes, text quizzes, quiz grades
- **Cloud Storage**: Cloudinary for image uploads
- **Real-time Features**: WebSocket chat system with database-backed chatrooms for educational tools, including PDF export for teachers/admins.
- **Audio Proxy System**: Server-side proxy at `/api/audio-proxy` that automatically converts Google Drive/Dropbox sharing URLs to direct download format, handles CORS restrictions, and streams audio files with proper range request support for seeking.

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

- **Bingo Generator**: Custom bingo card creation for educational activities.
- **Spanish Alphabet**: Interactive soundboard for learning Spanish letters.
- **Word Sorter**: Drag-and-drop word sorting activities with clickable list title editing and PDF export functionality.
- **Listen to Type**: Audio-based typing practice tool with chatroom integration.
- **Audio Quizzes**: Complete audio quiz system with custom play controls, server-side proxy for cloud storage files, teacher grading dashboard, and support for Google Drive/Dropbox/OneDrive audio files.
- **Text Quizzes**: Comprehensive text-based multiple choice quiz system with create, edit, take, and grade functionality. Includes dedicated admin dashboard for grading and student profile integration for performance tracking.

### Authentication & Authorization
- **User Registration/Login**: Email/password and Google OAuth authentication.
- **Password Security**: bcrypt hashing.
- **Immediate Blog Access**: Authenticated users can immediately read posts and leave comments without approval.
- **Role-Based Access**: Admin users have access to management interfaces, students have chat access.
- **Session Management**: Server-side session validation with proper React context integration.
- **Chatroom Access Control**: Teachers/admins can create private chatrooms and invite specific users.
- **Security Enhancements**: Helmet.js for security headers, rate limiting, comprehensive input validation (email, username, passwords, content), express-mongo-sanitize for NoSQL injection prevention, security event logging, secure cookies, strong password requirements, XSS protection, restricted file uploads, and HTTPS configuration.

### Content Editing
- **Simple HTML Editor**: Direct HTML textarea editing with helpful formatting hints for reliable content creation.
- **Content Storage**: HTML content stored in database with proper entity encoding/decoding.
- **Media Support**: Image upload and embedding via Cloudinary integration.
- **HTML Support**: Users can write HTML directly for formatting (headers, bold, italic, lists, links, etc.).
- **iframe Embedding**: Support for embedding Google Docs, Google Drive presentations, YouTube videos, and other educational content via iframe tags.

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