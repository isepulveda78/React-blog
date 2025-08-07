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
- **Chatrooms**: Admin-created chat spaces with invitation lists and access control.

### Authentication & Authorization
- **User Registration/Login**: Email/password and Google OAuth authentication.
- **Password Security**: bcrypt hashing.
- **Immediate Blog Access**: Authenticated users can immediately read posts and leave comments without approval.
- **Role-Based Access**: Admin users have access to management interfaces, students have chat access.
- **Session Management**: Server-side session validation with proper React context integration.
- **No Approval Required**: Complete removal of approval barriers for authenticated users accessing blog content and commenting.
- **Chatroom Access Control**: Teachers/admins can create private chatrooms and invite specific users.

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
- EducationalTools, BingoGenerator, SpanishAlphabet, WordSorter, ListenToType
- Simplified CityBuilder (complex version temporarily disabled)

### Real-Time Features (August 2025)
- **WebSocket Chat System**: Added real-time chatroom functionality to Listen to Type educational tool
- **Database-Backed Chatrooms**: Chatrooms now stored in MongoDB for persistence across server restarts
- **Chatroom Integration**: Students can select from admin-created chatrooms in Listen to Type interface
- **Live User Tracking**: Shows when users join/leave the chat with timestamps
- **Message Broadcasting**: All connected users see messages instantly
- **Auto-Scroll**: Chat automatically scrolls to show latest messages
- **Admin Chatrooms**: Comprehensive chatroom management system for admins with create/edit/delete functionality
- **Role-Based Chat Access**: Chat features restricted to students only, with teacher/admin oversight capabilities
- **Persistent Data**: Sample chatrooms automatically created on first MongoDB initialization
- **Duplicate Name Prevention**: Backend prevents duplicate usernames per chatroom with toast notifications
- **Enhanced Username Display**: Chat messages prominently show sender names with role badges

### Production vs Development Authentication Fix (August 2025)
- **Identified Issue**: Production and development environments had reversed authentication behavior
  - Development: Logged-in users could access chatrooms with proper username display
  - Production: Authentication and username display not working correctly
- **Root Cause**: Session configuration inconsistencies between environments
- **Solution Applied**: 
  - Enhanced session configuration with explicit cookie settings and session name
  - Improved authentication request headers with cache control and explicit credentials
  - Added comprehensive logging for authentication debugging
  - Fixed duplicate method definitions in storage class
- **Build Process**: Uses Vite for frontend building and esbuild for backend compilation
- **Static File Serving**: Development serves from `client/` while production serves from `dist/public/`
- **Testing**: Created production test script to verify functionality before deployment

## Deployment Configuration (Latest)

### Port Configuration
- **Application Port**: Server listens on port 5000 (configurable via PORT environment variable)
- **Binding Interface**: Server binds to "0.0.0.0" for external access compatibility
- **Port Forwarding**: Replit forwards external port 80 to internal port 5000
- **Environment Variable**: PORT is set to "5000" in .replit configuration

### Production Deployment Setup
- **Build Command**: `npm run build` - Creates production bundles in dist/
- **Start Command**: `npm run start` - Runs production server from dist/index.js
- **Static Files**: Production serves from `dist/public/` directory
- **Server Bundle**: Backend code compiled to `dist/index.js` via esbuild

### Authentication & Blog Access Fixes Applied (August 2025)
- **Authentication Context**: Fixed BlogPost component to properly receive user from React context instead of window globals
- **Approval Requirement Removal**: Eliminated approval barriers preventing authenticated users from accessing blog content
- **Comment System**: Fixed comment posting by removing approval requirements from API endpoints
- **Component Props**: Corrected user prop passing through BlogPost, CommentForm, and CommentItem components
- **Routing**: Updated protected routes to allow immediate blog access for authenticated users
- **User Experience**: Authenticated users can now immediately read posts, view comments, and post comments

### Chat Authentication Enhancement (August 2025)
- **Listen to Type Protection**: Added authentication requirement to `/listen-to-type` route using ProtectedRoute wrapper
- **Username Priority Fix**: Corrected username display logic to prioritize typed custom names over authenticated user names
- **Session Authentication**: Users must be logged in to access chat functionality from educational tools
- **User Experience**: Custom typed names (like "Bob" or "Sarah") now display correctly in chat messages instead of defaulting to account name
- **Access Control**: Educational tools page links to Listen to Type now require user authentication for chat access

### PDF Export Feature for Chatrooms (August 2025)
- **Teacher PDF Export**: Added PDF export functionality exclusively for teachers and admins in chatrooms
- **Comprehensive Export**: PDF includes chatroom name, export timestamp, teacher name, and all conversation messages
- **Professional Format**: Clean, formatted PDF with timestamps, usernames, roles, and message types (joined/left/message)
- **Access Control**: Export button only visible to users with teacher or admin roles when messages are present
- **Dependencies Added**: Integrated jsPDF and html2canvas libraries for client-side PDF generation
- **Toast Notifications**: User feedback for successful exports and error handling
- **File Naming**: Auto-generated filenames with chatroom name and date for easy organization

### React Error #130 Resolution (August 2025)
- **Root Cause**: Vite JSX transformation issue causing "Element type is invalid" errors in development mode due to jsx-runtime conflicts
- **Solution Applied**: Comprehensive Vite configuration fix with production build approach for stability
- **Technical Implementation**: 
  - Updated vite.config.js with esbuild jsx: 'automatic' and jsxRuntime: 'automatic'
  - Fixed Babel plugin configuration with proper runtime and importSource settings
  - Switched to production build serving for React component stability
  - Eliminated development JSX transformation conflicts
- **Build Process**: Now uses npm run build + serve from dist/public for consistent React rendering
- **Verified Fix**: Minimal app testing confirmed React error #130 completely resolved
- **Architecture**: Ready to restore full application with all Admin components and routing functionality

### Blog Post Viewing & Navigation Fixes (August 2025)
- **Public Post Access**: Created public endpoint `/api/posts/public/:slugOrId` for unauthenticated post viewing
- **Removed Authentication Barriers**: Blog posts now viewable without user login requirements
- **Slug Generation**: Added automatic slug generation for new posts based on title
- **Navigation Fallback**: BlogListing now uses post ID when slug is missing (handles legacy posts)
- **Post Visibility**: Fixed "post not found" issue preventing public access to created posts

### Previous Deployment Fixes (August 2025)
- Verified server binds to "0.0.0.0" interface for external access
- Confirmed PORT environment variable configuration matches .replit settings
- Ensured production build process generates correct file structure
- Server correctly serves static files from dist/public in production mode