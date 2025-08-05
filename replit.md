# BlogCraft - Modern Blog Platform

## Overview
BlogCraft is a full-stack blog platform providing a complete content management system with public blog viewing and administrative capabilities. It features user authentication, blog post management, a commenting system, category organization, and comprehensive SEO implementation. The project vision is to offer a robust and user-friendly platform for content creators with a focus on modern web technologies and a streamlined development experience.

## User Preferences
Preferred communication style: Simple, everyday language.
Tech stack preferences: JavaScript (JSX) without TypeScript, Bootstrap UI framework instead of shadcn/ui.
Development preference: Fast iteration with immediate visual feedback - expects changes to be visible immediately after making edits.
Cache management: Implemented hot reload system for instant change detection and automatic page refresh.

## System Architecture

### Frontend Architecture
- **Framework**: React 18
- **UI Components**: Bootstrap 5 components and styling
- **Build Tool**: Vite for development and production builds with hot module replacement
- **Forms**: React Hook Form with Zod validation (though user prefers JSX without TS, Zod still used for validation)

### Backend Architecture
- **Framework**: Express.js with JavaScript
- **Database**: MongoDB with native driver for data persistence, with graceful fallback to in-memory storage if MongoDB unavailable
- **Authentication**: Session-based authentication with bcrypt password hashing and Google OAuth integration (passport-google-oauth20)
- **API Design**: RESTful API endpoints
- **Data Collections**: Users, posts, categories, and comments
- **Cloud Storage**: Cloudinary for image uploads

### Project Structure
- **Simplified Layout**: Consolidated architecture with minimal file structure
- **Client Code**: Single React application in `/client/src/main.jsx`
- **Server Code**: Express API in `/server` directory

### Database Schema
- **Users**: Authentication, profile information, admin roles, and teacher/student roles.
- **Categories**: Blog post categorization.
- **Blog Posts**: Rich content with metadata, SEO fields, and publishing workflow.
- **Comments**: Nested commenting system.

### Authentication & Authorization
- **User Registration/Login**: Email/password and Google OAuth authentication.
- **Password Security**: bcrypt hashing.
- **Multi-Level Access Control**: Three-tier security (login required → approval required → admin required).
- **Role-Based Access**: Admin users have access to management interfaces.
- **Session Management**: Client-side storage with localStorage persistence and server-side validation.

### Rich Text Editing
- **Custom Editor**: Built-in WYSIWYG editor with formatting controls.
- **Content Storage**: HTML content stored in database.
- **Media Support**: Image upload and embedding via Cloudinary.

### SEO Implementation
- **SEO Management Dashboard**: Dedicated admin interface for SEO analysis, settings, and optimization.
- **Dynamic Meta Tag Management**: Automatic meta tag updates for blog posts.
- **Sitemap and Robots.txt Generation**: Automated XML sitemap and robots.txt generation.
- **SEO Content Analysis**: Real-time SEO scoring and optimization suggestions.

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
- **Cloudinary**: Cloud storage for images.
- **Passport.js** and **passport-google-oauth20**: For authentication.

## Deployment Configuration

### Build System
- **Development Mode**: Uses CDN-based React and in-browser Babel transpilation for fast development
- **Production Build**: Vite builds optimized bundles with proper asset hashing and minification
- **Hybrid Architecture**: Maintains compatibility between development and production modes

### Build Process
- `npm run build` creates production-ready assets in `dist/` directory
- Frontend assets are bundled and optimized by Vite into `dist/public/`
- Server code is bundled by esbuild into `dist/index.js`
- Static assets (sounds, images) are automatically copied to build output

### Server Configuration
- **Development**: Serves files from `client/` directory with hot reload
- **Production**: Serves built assets from `dist/public/` with optimized caching
- **Routing**: Supports client-side routing with proper fallback handling
- **Assets**: Handles all static file types including audio, images, and fonts

### Recent Build Fixes Applied
- Created proper Vite configuration with correct root and output directories
- Implemented production-ready index.html template with module scripts
- Added post-build script to ensure correct file naming
- Updated server to conditionally serve development vs production assets
- Fixed asset bundling and static file serving for deployment

### Major Architecture Conversion (August 2025)
- **Complete ES6 Module Migration**: Converted entire application from window-based to proper ES6 modules
- **Modern React Architecture**: Rebuilt main.jsx and App.jsx with proper React patterns and imports
- **Component System Overhaul**: All components now use standard import/export instead of window objects
- **Vite Build Integration**: Production build now working perfectly with proper bundling
- **Clean Development**: Eliminated all "exports is not defined" and script errors
- **Ready for Deployment**: Application fully converted to modern React/Vite architecture

### Components Successfully Converted to ES6:
- Navigation, Hero, Home, BlogCard, BlogListing
- AdminDashboard, AdminPosts, AdminUsers, AdminComments, AdminPostEditor
- SEOManagement, NotFound, BlogPost, UserProfile
- EducationalTools, BingoGenerator, SpanishAlphabet, WordSorter
- Simplified CityBuilder (complex version temporarily disabled)