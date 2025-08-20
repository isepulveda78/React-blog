# BlogCraft - Modern Blog Platform

## Overview
BlogCraft is a full-stack blog platform providing a complete content management system with public blog viewing and administrative capabilities. It features user authentication, blog post management, a commenting system, category organization, and comprehensive SEO implementation. The project vision is to offer a robust and user-friendly platform for content creators with a focus on modern web technologies and a streamlined development experience, offering a robust and user-friendly platform for content creators.

## User Preferences
Preferred communication style: Simple, everyday language.
Tech stack preferences: JavaScript (JSX) without TypeScript, Bootstrap UI framework instead of shadcn/ui.
Development preference: Fast iteration with immediate visual feedback - expects changes to be visible immediately after making edits.
Cache management: Successfully implemented polling-based hot reload system for instant change detection and automatic page refresh. System detects file changes every 2 seconds and triggers automatic browser refreshes. Working reliably with proper development file serving and cache control headers.
Inline editing preference: User requires stable cursor behavior during WYSIWYG editing - cursor jumping issues have been resolved by removing problematic cursor save/restore logic.

## System Architecture

### Frontend Architecture
- **Framework**: React 18
- **UI Components**: Bootstrap 5 components and styling
- **Build Tool**: Vite for development and production builds with hot module replacement
- **Forms**: React Hook Form with Zod validation
- **UI/UX Decisions**: Simple and clean interface, focus on Bootstrap 5 styling, inline editing for certain elements (e.g., Word Sorter list titles).
- **Hero Image Management**: Simple code-based system for easy image switching and cache-busting.
- **Client-side Routing**: Hash-based routing with Wouter's `useHashLocation` hook to prevent "not found" errors on page refresh and ensure correct back button navigation. Internal links within blog posts are handled for client-side navigation.

### Backend Architecture
- **Framework**: Express.js with JavaScript
- **Database**: MongoDB with native driver for data persistence, with graceful fallback to in-memory storage if MongoDB unavailable.
- **Authentication**: Session-based authentication with bcrypt password hashing and Google OAuth integration (passport-google-oauth20). Utilizes localStorage for robust session persistence.
- **API Design**: RESTful API endpoints.
- **Data Collections**: Users, posts, categories, comments, audio quizzes, text quizzes, quiz grades.
- **Cloud Storage**: Cloudinary for image uploads.
- **Real-time Features**: WebSocket chat system with database-backed chatrooms.
- **Audio Proxy System**: Server-side proxy at `/api/audio-proxy` for converting Google Drive/Dropbox sharing URLs to direct download format, handling CORS, and streaming audio files with range request support.
- **Content Storage**: HTML content stored in database with proper entity encoding/decoding. HTML entity decoding applied to all blog API endpoints for correct display.
- **Security Enhancements**: Helmet.js for security headers, rate limiting, comprehensive input validation, `express-mongo-sanitize` for NoSQL injection prevention, security event logging, secure cookies, strong password requirements, XSS protection, and restricted file uploads. Content Security Policy configured to allow iframe embedding from Google Docs, Google Drive, YouTube, Vimeo.

### Project Structure
- **Simplified Layout**: Consolidated architecture with minimal file structure.
- **Client Code**: Single React application in `/client/src/main.jsx`.
- **Server Code**: Express API in `/server` directory.

### Database Schema
- **Users**: Authentication, profile information, admin roles, teacher/student roles.
- **Categories**: Blog post categorization.
- **Blog Posts**: Rich content with metadata, SEO fields, publishing workflow. Slugs automatically regenerate on title changes.
- **Comments**: Nested commenting system.
- **Chatrooms**: Admin-created chat spaces with invitation lists and access control.

### Educational Tools & Features
- **Bingo Generator**: Custom bingo card creation.
- **Spanish Alphabet**: Interactive soundboard.
- **Word Sorter**: Drag-and-drop word sorting with clickable list title editing and PDF export.
- **Listen to Type**: Audio-based typing practice tool.
- **Audio Quizzes**: Complete audio quiz system with custom play controls, server-side proxy, and teacher grading dashboard. Configurable attempt limits.
- **Text Quizzes**: Comprehensive text-based multiple choice quiz system with create, edit, take, and grade functionality. Includes admin dashboard for grading and student profile integration for performance tracking. Configurable attempt limits.
- **Audio Lists System**: Manage audio files from Google Drive for student access. Features loading spinners on play buttons and proper admin controls for create/edit/delete operations.

### Authentication & Authorization
- **User Registration/Login**: Email/password and Google OAuth authentication.
- **Role-Based Access**: Admin users have management interface access, students have chat access, and specific tool access based on role.
- **Secure WYSIWYG Inline Editing**: Click-to-edit functionality for blog posts with admin-only access, stable cursor behavior, server-side XSS protection, and session authentication. Cursor jumping issues resolved (August 2025).

### Content Editing
- **Simple HTML Editor**: Direct HTML textarea editing with formatting hints.
- **Media Support**: Image upload and embedding via Cloudinary.
- **iframe Embedding**: Support for embedding educational content from various platforms.

### SEO Implementation
- **SEO Management Dashboard**: Admin interface for SEO analysis and settings.
- **Dynamic Meta Tag Management**: Automatic meta tag updates for blog posts.
- **Sitemap and Robots.txt Generation**: Automated XML sitemap and robots.txt generation.

### Deployment Configuration
- **Build System**: Vite for frontend, esbuild for backend.
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