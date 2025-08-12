# BlogCraft - Modern Educational Blog Platform

A comprehensive full-stack blog platform designed for educational content with advanced quiz systems, real-time features, and modern web technologies.

## 🚀 Features

### Core Blog Features
- **Modern Blog Platform**: Complete content management system with rich text editing
- **User Authentication**: Google OAuth and local authentication with role-based access
- **SEO Optimized**: Dynamic meta tags, sitemaps, and comprehensive SEO management
- **Real-time Updates**: Live comment system with WebSocket integration
- **Category Management**: Organized content with category filtering and search

### Educational Tools
- **Audio Quiz System**: Custom audio quizzes with cloud storage integration (Google Drive/Dropbox)
- **Text Quiz System**: Multiple choice quizzes with grading and progress tracking
- **Spanish Alphabet Tool**: Interactive soundboard for language learning
- **Word Sorter**: Drag-and-drop educational activities with PDF export
- **Bingo Generator**: Custom educational bingo cards
- **Listen to Type**: Audio-based typing practice with chat integration
- **Code Evolution Visualizer**: Real-time code visualization with interactive timeline

### Advanced Features
- **Role-Based Access Control**: Student, Teacher, and Admin roles with appropriate permissions
- **Real-time Chat System**: WebSocket-powered chatrooms for educational collaboration
- **Grade Tracking**: Comprehensive dashboard for quiz performance monitoring
- **Attempt Limits**: Configurable quiz attempt restrictions
- **PDF Export**: Generate PDF reports for various educational tools
- **Hot Reload Development**: Instant feedback development environment

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Bootstrap 5** - Responsive design framework
- **Wouter** - Lightweight routing
- **Vite** - Fast development and build tool
- **React Hook Form + Zod** - Form handling and validation

### Backend
- **Express.js** - Web application framework
- **MongoDB** - Document database with in-memory fallback
- **WebSocket** - Real-time communication
- **Passport.js** - Authentication middleware
- **Cloudinary** - Image storage and optimization

### Security & Performance
- **Helmet.js** - Security headers
- **Rate Limiting** - API protection
- **Input Sanitization** - XSS and injection prevention
- **Session Management** - Secure user sessions
- **Cache Control** - Optimized data delivery

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB (optional - falls back to in-memory storage)
- Google OAuth credentials (for social login)
- Cloudinary account (for image uploads)

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Session Secret
SESSION_SECRET=your_secure_session_secret
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/blogcraft.git
   cd blogcraft
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Visit the application:**
   Open http://localhost:5000 in your browser

## 📁 Project Structure

```
blogcraft/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Backend Express application
│   ├── index.ts          # Main server entry point
│   ├── routes.js         # API routes
│   ├── storage.js        # Data layer abstraction
│   └── security.js       # Security middleware
├── package.json          # Dependencies and scripts
└── vite.config.js        # Build configuration
```

## 🎯 Usage

### For Students
- Read blog posts and educational content
- Take audio and text quizzes
- View progress and grades in profile
- Participate in educational chat rooms
- Use interactive learning tools

### For Teachers
- Create and manage quiz content
- Monitor student progress and grades
- Access all educational tools
- Manage chatroom discussions
- Export reports and data

### For Admins
- Full content management capabilities
- User role and permission management
- SEO and site configuration
- System monitoring and analytics
- Complete administrative control

## 🔒 Security Features

- **Authentication**: Secure Google OAuth and local auth
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive data sanitization
- **Rate Limiting**: API abuse prevention
- **Security Headers**: Helmet.js protection
- **Session Security**: Secure cookie management
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Request validation

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production MongoDB instance
- Set up production domain for OAuth callbacks
- Configure CloudFlare or CDN for static assets

### Replit Deployment
This project is optimized for Replit deployment with:
- Automatic port configuration
- Environment variable management
- Hot reload development environment
- Production build optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation in `replit.md`
- Review the project wiki for detailed guides

## 🏆 Acknowledgments

- Built with modern web technologies
- Optimized for educational environments
- Designed for scalability and performance
- Community-driven feature development

---

**BlogCraft** - Empowering education through modern web technology