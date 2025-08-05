# BlogCraft - Modern Blog Platform

## Overview

BlogCraft is a full-stack blog platform built with a React frontend and Express backend. The application provides a complete content management system with both public blog viewing and administrative capabilities. It features user authentication, blog post management, commenting system, and category organization.

## User Preferences

Preferred communication style: Simple, everyday language.
Tech stack preferences: JavaScript (JSX) without TypeScript, Bootstrap UI framework instead of shadcn/ui.
Development preference: Fast iteration with immediate visual feedback - expects changes to be visible immediately after making edits.
Cache management: Implemented hot reload system for instant change detection and automatic page refresh.

## Recent Changes (August 2025)

- Successfully converted entire codebase from TypeScript to JavaScript (JSX) 
- Replaced all shadcn/ui components with Bootstrap 5 components and styling
- **Modern React Setup**: Upgraded from CDN-based to NPM-based React with proper build tooling
- **Component Structure**: Organized code into individual component files with ES6 imports
- **Vite Integration**: Proper Vite dev server with React transformation and hot module replacement
- Server runs Express API while Vite handles React frontend with proxy configuration
- **MongoDB Integration Added**: Replaced in-memory storage with MongoDB database support
- **Fallback Storage**: Application gracefully falls back to in-memory storage if MongoDB connection fails
- **Environment Configuration**: Uses MONGODB_URI environment variable from Replit Secrets
- **User Management System**: Added comprehensive admin interface for managing user roles
- **Session Authentication**: Fixed session management with proper credential handling
- **Cloudinary Integration**: Added image upload capabilities for blog posts with cloud storage
- **Blog Post Editor**: Enhanced with image upload functionality and rich content management
- **Streamlined Comment System**: Removed manual name/email entry - comments now automatically use logged-in user's session data
- **Threaded Comment Replies**: Implemented nested reply structure where replies appear visually indented within parent comments
- **Comment Authentication**: Only logged-in users can comment or reply, with proper session validation
- **Blog Post Preview System**: Implemented public blog post display with authentication-gated access
- **Access Control Model**: Blog posts visible on homepage to everyone, but clicking requires login and approval
- **Public API Endpoint**: Added `/api/posts/public` route for non-authenticated post previews
- **Google OAuth Integration**: Added Google Sign-In authentication with passport-google-oauth20
- **Dual Authentication Support**: Users can register/login with either email/password or Google accounts
- **Google Account Linking**: Existing email accounts can be linked to Google accounts automatically
- **Unified Approval System**: Both email and Google registrations require admin approval before accessing content
- **Complete User Management System**: Full CRUD operations for user accounts with comprehensive admin interface
- **Delete User Feature**: Safe user deletion with confirmation dialogs and protection against self-deletion
- **Admin Safety Measures**: Main admin account cannot be deleted, users cannot delete themselves
- **Real-time User Interface**: Instant updates without page refresh for all user management operations
- **User Profile Management**: Users can update their profile information (name, username, email) and change passwords
- **Admin Password Reset**: Administrators can reset any user's password through the admin interface
- **Profile Security**: Current password verification required for user password changes, admin overrides available
- **Comprehensive SEO Implementation**: Complete SEO optimization system with meta tags, Open Graph, structured data
- **SEO Management Dashboard**: Dedicated admin interface for SEO analysis, settings, and optimization tools
- **Dynamic Meta Tag Management**: Automatic meta tag updates for blog posts with custom SEO fields
- **Sitemap and Robots.txt Generation**: Automated XML sitemap and robots.txt generation for search engines
- **SEO Content Analysis**: Real-time SEO scoring and optimization suggestions for blog posts
- **Search Engine Integration**: Support for Google Analytics, Search Console, and other SEO tools
- **SEO Management Access Issue Resolved**: Created standalone HTML-based SEO management system accessible at `/seo-management`
- **Direct SEO Access**: Bypassed React routing issues with dedicated server route for SEO functionality
- **Complete SEO Interface**: Fully functional SEO management with real-time analysis, meta tag optimization, and sitemap generation
- **Admin Quick Access Page**: Created `/admin-access` with direct links to all admin functions including prominent SEO Management access
- **Multiple SEO Access Points**: SEO Management available via `/seo-management`, `/admin-access`, and sidebar navigation
- **SEO System Status**: Fully operational and confirmed working with comprehensive feature set
- **Admin Navigation Update**: All admin dashboard links now redirect to `/admin-access` (Admin Quick Access page) instead of internal admin components
- **Site Name Consistency**: Updated all references from "BlogCraft" to "Mr. S Teaches" across navbar, meta tags, and admin interfaces
- **Cache Management**: Implemented cache clearing functionality for fresh UI updates
- **React Component Migration**: Converted HTML-based admin pages to proper React components for better integration
- **Admin Access Page**: Created `/admin-access` React component with Assan-inspired design and Bootstrap styling
- **HTML File Cleanup**: Removed standalone HTML files, now using React routing for all admin functionality
- **Admin Dashboard Simplified**: Replaced complex admin dashboard with SimpleAdmin component for reliable access
- **Admin Route Fixed**: `/admin` now uses simplified component that loads quickly and provides all admin functionality
- **Admin Success Route**: `/admin-success` provides dedicated access to SEO settings and admin tools
- **Comprehensive Rich Text Editor**: Implemented full-featured WYSIWYG editor with formatting toolbar, HTML source view, and Cloudinary integration
- **Rich Text Features**: Bold, italic, underline, headings, lists, alignment, links, image insertion, clear formatting, and paste handling
- **SEO Management System**: Complete SEO optimization system with settings, content analysis, and tools
- **SEO Content Analysis**: Real-time SEO scoring for blog posts with issues detection and optimization recommendations
- **SEO Settings Interface**: Professional SEO configuration with site metadata, social media, and analytics integration
- **Sitemap Generation**: Automated XML sitemap generation and robots.txt management for search engines
- **Blog Posts Listing Page**: Comprehensive blog posts page with pagination, category filtering, and search functionality at `/blog` route
- **Enhanced Navigation**: Added "All Posts" button to navigation menu for easy access to blog posts listing
- **Access Control Integration**: Blog posts page respects user authentication and approval status with appropriate messaging
- **Hot Reload System**: Implemented automatic page refresh system for instant development feedback
- **Cache Management**: Implemented cache clearing functionality for fresh UI updates
- **Security Enhancement**: Fixed critical authentication vulnerability - all admin routes now properly protected with multi-level access control
- **Project Cleanup**: Removed unnecessary files and dependencies - streamlined to essential components only
- **NPM-Based React Setup**: Converted from CDN-based React to proper NPM dependencies with component imports
- **Component Architecture**: Restructured to use individual React component files with ES6 imports/exports
- **Modern Development Setup**: Implemented proper Vite build system with React JSX transformation
- **Critical Browser Cache Issue (January 2025)**: Severe browser caching preventing JavaScript updates from loading despite multiple cache-busting attempts including version parameters, timestamps, file exclusions, and hardcoded overrides. University building icon remains cached as graduation cap (🎓) despite code changes to classical building (🏛️). Multiple approaches attempted: new building types, cache headers, manual refresh instructions - all unsuccessful.
- **CityBuilder Color Palette Issue Resolved (January 2025)**: Successfully diagnosed and fixed Bootstrap CSS conflicts that were hiding building palette items. Issue was Bootstrap classes interfering with React component rendering. Solution: Replaced all Bootstrap classes with inline CSS styling for the sidebar palette, ensuring full visibility of all building categories (Residential, Commercial, Industrial, Public, Nature) and infrastructure items (Road, Water). Sidebar now fully functional with drag-and-drop building placement, resize functionality, and keyboard deletion system.
- **CityBuilder Background Color Customization (January 2025)**: Added comprehensive background color system with 5 preset themes (Grass, Desert, Ocean, Snow, Dark) plus custom color picker. Users can now select any background color using native HTML color input with live preview and hex code display. Background changes apply instantly to canvas without affecting placed buildings or infrastructure.
- **CityBuilder Building Labeling System (January 2025)**: Implemented complete custom labeling functionality for all buildings. Users can double-click any placed building to add custom names/labels with inline text editing. Labels display below buildings with auto-save on Enter/blur and cancel on Escape. System supports both default building names and custom user-defined labels.
- **CityBuilder JavaScript Error Resolution (January 2025)**: Fixed critical script loading issues by creating new React.createElement-based component (city-builder-working.jsx) to replace problematic JSX syntax. Component now loads successfully with full functionality including drag-and-drop, labeling, background customization, and all interactive features.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management with optimistic updates
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for development and production builds
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with JavaScript
- **Database**: MongoDB with native driver for data persistence
- **Storage Fallback**: Graceful fallback to in-memory storage if MongoDB unavailable
- **Authentication**: Session-based authentication with bcrypt password hashing
- **API Design**: RESTful API endpoints with proper HTTP status codes
- **Data Collections**: Users, posts, categories, and comments stored in MongoDB collections

### Project Structure
- **Simplified Layout**: Consolidated architecture with minimal file structure
- **Client Code**: Single React application in `/client/src/main.jsx` with integrated components
- **Server Code**: Express API in `/server` directory with TypeScript entry point
- **Database**: MongoDB with native driver, graceful fallback to in-memory storage

### Database Schema
- **Users**: Authentication and profile information with admin roles
- **Categories**: Blog post categorization with slugs and post counts
- **Blog Posts**: Rich content with metadata, SEO fields, and publishing workflow
- **Comments**: Nested commenting system with moderation capabilities

### Authentication & Authorization
- **User Registration/Login**: Email and username-based authentication with Google OAuth integration
- **Password Security**: bcrypt hashing with salt rounds
- **Multi-Level Access Control**: Three-tier security system (login required → approval required → admin required)
- **Protected Admin Routes**: All admin functionality secured with comprehensive authentication checks
- **Role-Based Access**: Admin users have access to management interfaces with proper verification
- **Session Management**: Client-side storage with localStorage persistence and server-side validation

### Rich Text Editing
- **Custom Editor**: Built-in rich text editor with formatting controls
- **Content Storage**: HTML content stored directly in database
- **Media Support**: Image upload and embedding capabilities

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database with UUID primary keys
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and migrations
- **Drizzle Kit**: Database migration and introspection tools

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant styling

### State Management & Data Fetching
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast bundling for production
- **PostCSS**: CSS processing with Autoprefixer