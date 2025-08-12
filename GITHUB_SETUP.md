# GitHub Setup Guide for BlogCraft

This guide will help you push your BlogCraft project to GitHub and set up proper version control.

## 📋 Prerequisites

1. **Git installed** on your local machine
2. **GitHub account** created
3. **SSH keys** set up (recommended) or HTTPS access token

## 🚀 Step-by-Step GitHub Setup

### 1. Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com) and log in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository settings:
   - **Repository name**: `blogcraft` (or your preferred name)
   - **Description**: "Modern Educational Blog Platform with Quiz Systems"
   - **Visibility**: Choose Public or Private
   - **DO NOT** check "Initialize with README" (we already have files)
   - **DO NOT** add .gitignore or license (we have them)
4. Click **"Create repository"**

### 2. Initialize Local Git Repository

In your project directory (where this file is located), run:

```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: BlogCraft educational platform"

# Add GitHub remote (replace with your GitHub username/repo)
git remote add origin https://github.com/YOUR_USERNAME/blogcraft.git

# Push to GitHub
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` with your actual GitHub username.

### 3. Alternative: Using SSH (Recommended)

If you have SSH keys set up:

```bash
# Add remote with SSH
git remote add origin git@github.com:YOUR_USERNAME/blogcraft.git

# Push to GitHub
git push -u origin main
```

## 🔧 Setting Up Environment Variables

### 1. Create Environment File

Copy the example file:
```bash
cp .env.example .env
```

### 2. Configure Required Services

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://your-domain.com/api/auth/google/callback` (production)

#### Cloudinary Setup (for image uploads):
1. Create account at [Cloudinary.com](https://cloudinary.com/)
2. Get Cloud Name, API Key, and API Secret from dashboard
3. Add to your `.env` file

#### MongoDB Setup (optional):
- **Local MongoDB**: Install MongoDB locally
- **MongoDB Atlas**: Create free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Skip**: App works with in-memory storage if no MongoDB URI provided

### 3. Update .env File

Edit your `.env` file with actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (optional - falls back to in-memory)
MONGODB_URI=your_mongodb_connection_string

# Google OAuth (required for login)
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Session Secret (generate secure random string)
SESSION_SECRET=your_secure_random_session_secret
```

## 📝 Git Workflow Best Practices

### Daily Development Workflow:

```bash
# Check status
git status

# Add changes
git add .

# Commit with descriptive message
git commit -m "Add specific feature or fix description"

# Push to GitHub
git push origin main
```

### Feature Development:

```bash
# Create new feature branch
git checkout -b feature/new-quiz-system

# Make changes and commit
git add .
git commit -m "Add new quiz system with timer functionality"

# Push feature branch
git push origin feature/new-quiz-system

# Create Pull Request on GitHub
```

### Before Making Changes:

```bash
# Pull latest changes
git pull origin main

# Check what files changed
git diff

# View commit history
git log --oneline
```

## 🔒 Security Checklist

### Before Pushing to GitHub:

- [ ] `.env` file is in `.gitignore` (✅ Already done)
- [ ] No API keys in source code
- [ ] No passwords in source code
- [ ] Cookie files excluded (✅ Already done)
- [ ] Build files excluded (✅ Already done)

### Environment Variables to NEVER commit:
- ❌ `GOOGLE_CLIENT_SECRET`
- ❌ `CLOUDINARY_API_SECRET`
- ❌ `SESSION_SECRET`
- ❌ `MONGODB_URI` (if contains credentials)

## 🚀 Deployment Options

### Replit Deployment:
1. Your project is already Replit-optimized
2. Set environment variables in Replit Secrets
3. Use the Deploy button in Replit

### Vercel Deployment:
```bash
npm install -g vercel
vercel
```

### Heroku Deployment:
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set GOOGLE_CLIENT_ID=your_value
heroku config:set GOOGLE_CLIENT_SECRET=your_value
# ... (set all required env vars)

# Deploy
git push heroku main
```

## 🆘 Troubleshooting

### Common Issues:

**"Repository not found" error:**
- Check if repository URL is correct
- Verify you have access to the repository
- Try HTTPS instead of SSH or vice versa

**"Permission denied" error:**
- Check SSH keys are set up correctly
- Try using personal access token for HTTPS

**Environment variables not working:**
- Ensure `.env` file is in project root
- Check variable names match exactly
- Restart server after changing `.env`

**OAuth login not working:**
- Verify redirect URIs in Google Console
- Check CLIENT_ID and CLIENT_SECRET are correct
- Ensure domain matches OAuth settings

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)

## 🎯 Next Steps

After pushing to GitHub:

1. ✅ **Set up GitHub Issues** for bug tracking
2. ✅ **Create GitHub Projects** for task management  
3. ✅ **Set up GitHub Actions** for CI/CD
4. ✅ **Add collaborators** if working in a team
5. ✅ **Create development branch** for safer development
6. ✅ **Set up branch protection rules** for main branch

---

**Success!** Your BlogCraft project is now on GitHub and ready for collaborative development! 🎉