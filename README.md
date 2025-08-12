# BlogCraft - Modern Blog Platform

A comprehensive educational assessment platform that enables dynamic text and audio quizzing with robust user management and interactive learning experiences.

## 🚀 Features

### Core Functionality
- **Blog Management**: Full CRUD operations for blog posts with rich text editing
- **User Authentication**: Secure login system with Google OAuth integration
- **Admin Dashboard**: Complete administrative interface for content management
- **Comment System**: Interactive commenting with moderation capabilities
- **Category Management**: Organize content with custom categories
- **SEO Optimization**: Built-in SEO tools and meta tag management

### Educational Tools
- **Audio Quizzes**: Interactive audio-based assessment system
- **Text Quizzes**: Traditional text-based quizzing functionality
- **Educational Games**: 
  - Bingo Generator
  - Spanish Alphabet Learning
  - Word Sorter
  - Listen-to-Type exercises
  - Crossword Generator
- **Real-time Chat**: WebSocket-powered chat rooms for collaboration
- **Progress Tracking**: Grade dashboards and performance analytics

### Technical Features
- **Real-time Updates**: Hot reload system for development
- **File Upload**: Image management with Cloudinary integration
- **Responsive Design**: Mobile-friendly Bootstrap UI
- **Security**: Rate limiting, input sanitization, and secure sessions
- **Database**: MongoDB with optimized queries and indexing

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Bootstrap 5** - Responsive UI framework
- **Wouter** - Lightweight routing
- **React Query** - Data fetching and caching

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Passport.js** - Authentication middleware
- **WebSocket** - Real-time communication

### Development Tools
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type safety (configuration files)
- **ESBuild** - Fast JavaScript bundler

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd blogcraft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   # Database
   DATABASE_URL=your_mongodb_connection_string
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Session
   SESSION_SECRET=your_session_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure all environment variables listed above
- Ensure MongoDB database is accessible
- Set up proper domain and SSL certificates

## 🏗️ Project Structure

```
blogcraft/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main application component
│   └── public/            # Static assets
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.js         # API routes
│   ├── storage.js        # Database operations
│   └── security.js       # Security utilities
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md             # This file
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type checking

### Key Development Features
- **Hot Reload**: Automatic browser refresh on file changes
- **Development Logging**: Comprehensive console logging
- **Error Handling**: Detailed error messages and stack traces
- **Security**: Development vs production security configurations

## 🎓 Educational Features

### Quiz System
- Create and manage audio quizzes with file upload
- Text-based quizzing with multiple question types
- Grade tracking and analytics dashboard
- Student progress monitoring

### Interactive Tools
- **Bingo Generator**: Customizable bingo cards for classroom activities
- **Spanish Alphabet**: Interactive learning tool for Spanish language
- **Word Sorter**: Vocabulary organization and learning
- **Listen-to-Type**: Audio comprehension exercises
- **Crossword Generator**: Custom crossword puzzles

### Chat System
- Real-time WebSocket communication
- Multiple chat rooms
- Message history and moderation

## 🔐 Security Features

- **Rate Limiting**: Protection against API abuse
- **Input Sanitization**: MongoDB injection prevention
- **CORS Configuration**: Secure cross-origin requests
- **Helmet**: Security headers and CSP
- **Session Management**: Secure user sessions
- **File Upload Security**: Image type validation and size limits

## 👥 User Roles

- **Students**: Access to quizzes, educational tools, and chat
- **Admins**: Full administrative access to all features
- **Content Managers**: Blog post and content management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the console logs for detailed error messages
2. Verify all environment variables are properly set
3. Ensure MongoDB connection is working
4. Review the security settings for your deployment environment

## 🔄 Recent Updates

- Fixed critical React mounting issues
- Implemented polling-based hot reload system
- Enhanced security with comprehensive middleware
- Added real-time WebSocket communication
- Improved file upload handling with Cloudinary
- Optimized database queries and indexing

---

Built with ❤️ for modern education and content management.