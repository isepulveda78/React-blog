# BlogCraft - Modern Blog Platform

## Overview

BlogCraft is a full-stack blog platform built with a React frontend and Express backend. The application provides a complete content management system with both public blog viewing and administrative capabilities. It features user authentication, blog post management, commenting system, and category organization.

## User Preferences

Preferred communication style: Simple, everyday language.
Tech stack preferences: JavaScript (JSX) without TypeScript, Bootstrap UI framework instead of shadcn/ui.

## Recent Changes (August 2025)

- Successfully converted entire codebase from TypeScript to JavaScript (JSX) 
- Replaced all shadcn/ui components with Bootstrap 5 components and styling
- Removed complex Vite middleware setup for simpler static file serving approach
- Implemented browser-based React and JSX transpilation using CDN libraries
- Cleaned up server-side TypeScript files, now using only JavaScript files
- Application now runs with simplified Express server serving static files directly

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
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon Database serverless driver
- **Authentication**: Session-based authentication with bcrypt password hashing
- **API Design**: RESTful API endpoints with proper HTTP status codes
- **Storage**: In-memory storage interface with database implementation

### Project Structure
- **Monorepo Layout**: Shared code between client and server in `/shared` directory
- **Client Code**: React application in `/client` directory
- **Server Code**: Express API in `/server` directory
- **Database**: Schema definitions and migrations managed by Drizzle

### Database Schema
- **Users**: Authentication and profile information with admin roles
- **Categories**: Blog post categorization with slugs and post counts
- **Blog Posts**: Rich content with metadata, SEO fields, and publishing workflow
- **Comments**: Nested commenting system with moderation capabilities

### Authentication & Authorization
- **User Registration/Login**: Email and username-based authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Admin users have access to management interfaces
- **Session Management**: Client-side storage with localStorage persistence

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