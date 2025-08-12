import React, { useState, useEffect, createContext, useContext } from 'react'
import { Router, Route, Switch, Link, useLocation } from 'wouter'

// Import components - Adding debug logs to find undefined component
import Navigation from './components/Navigation.jsx'
import Hero from './components/Hero.jsx'
import Home from './components/Home.jsx'
import BlogListing from './components/BlogListing.jsx'
import BlogPost from './pages/blog-post.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import AdminPosts from './components/AdminPosts.jsx'
import AdminUsers from './components/AdminUsers.jsx'
import AdminComments from './components/AdminComments.jsx'
import AdminCategories from './components/AdminCategories.jsx'
import AdminPostEditor from './components/AdminPostEditor.jsx'
import SEOManagement from './components/SEOManagement.jsx'
import AdminChatrooms from './components/AdminChatrooms.jsx'
import AdminQuizGradesDashboard from './components/AdminQuizGradesDashboard.jsx'
import AdminTextQuizGradesDashboard from './components/AdminTextQuizGradesDashboard.jsx'

// Clean imports without debug logs
import Footer from './components/Footer.jsx'
import UserProfile from './pages/user-profile.jsx'
import EducationalTools from './pages/educational-tools.jsx'
import BingoGenerator from './pages/bingo-generator.jsx'
import SpanishAlphabet from './pages/spanish-alphabet.jsx'
import WordSorter from './pages/word-sorter.jsx'
import ListenToType from './pages/listen-to-type.jsx'

import CodeEvolutionVisualization from './pages/code-evolution.jsx'
import CrosswordGenerator from './pages/crossword-generator.jsx'
import AudioQuizzes from './pages/audio-quizzes.jsx'
import TextQuizzes from './pages/text-quizzes.jsx'
import NotFound from './components/NotFound.jsx'

// Auth Context
const AuthContext = createContext(null)

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated with backend session
    console.log('[AuthProvider] Checking authentication status...')
    fetch('/api/auth/me', { 
      credentials: 'include',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
      .then(async (res) => {
        console.log('[AuthProvider] Auth response status:', res.status)
        if (res.ok) {
          const text = await res.text();
          console.log('[AuthProvider] Raw response:', text.substring(0, 200));
          try {
            return JSON.parse(text);
          } catch (parseError) {
            console.error('[AuthProvider] JSON parse error:', parseError.message);
            console.error('[AuthProvider] Response was:', text);
            throw new Error('Invalid JSON response from server');
          }
        }
        throw new Error('Not authenticated')
      })
      .then((userData) => {
        console.log('User authenticated:', userData)
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        setIsLoading(false)
      })
      .catch((error) => {
        console.log('[AuthProvider] Auth failed:', error.message)
        // Not authenticated, check localStorage as fallback
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            console.log('[AuthProvider] Using localStorage user:', parsedUser.name)
            setUser(parsedUser)
          } catch (e) {
            console.log('[AuthProvider] Invalid localStorage user, clearing')
            localStorage.removeItem('user')
          }
        }
        setIsLoading(false)
      })
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const text = await res.text();
        try {
          const userData = JSON.parse(text);
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
          return userData
        } catch (parseError) {
          console.error('Error parsing refresh response:', parseError.message);
          console.error('Response was:', text);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Route components
const AppRoutes = () => {
  const { user } = useAuth()
  const [location] = useLocation()

  // Protected route wrapper
  const ProtectedRoute = ({ children, requireAdmin = false, requireApproval = true }) => {
    console.log('ProtectedRoute - user:', user?.name, 'requireAdmin:', requireAdmin);
    
    if (!user) {
      console.log('No user, showing login message');
      return (
        <div className="container py-5">
          <div className="alert alert-info text-center">
            <h4>Authentication Required</h4>
            <p>Please log in to access this feature.</p>
            <a href="/api/auth/google" className="btn btn-primary">
              Login with Google
            </a>
          </div>
        </div>
      )
    }

    if (requireApproval && !user.approved) {
      console.log('User not approved');
      return (
        <div className="container py-5">
          <div className="alert alert-warning">
            <h4>Account Pending Approval</h4>
            <p>Your account is waiting for admin approval. Please check back later.</p>
          </div>
        </div>
      )
    }

    if (requireAdmin && !user.isAdmin) {
      console.log('User not admin, isAdmin:', user.isAdmin);
      return (
        <div className="container py-5">
          <div className="alert alert-danger">
            <h4>Access Denied</h4>
            <p>You need admin privileges to access this page.</p>
          </div>
        </div>
      )
    }

    console.log('ProtectedRoute - rendering children');
    return children
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation user={user} />
      <main className="flex-grow-1">
        <Switch>
          <Route path="/admin/posts" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminPosts user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/" component={() => <Home user={user} />} />
          <Route path="/blog" component={() => <BlogListing user={user} />} />
          <Route path="/blog/:slug" component={({ params }) => (
            <ProtectedRoute requireApproval={false}>
              <BlogPost slug={params.slug} user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/educational-tools" component={() => <EducationalTools user={user} />} />
          <Route path="/bingo-generator" component={() => <BingoGenerator user={user} />} />
          <Route path="/spanish-alphabet" component={() => <SpanishAlphabet user={user} />} />
          <Route path="/word-sorter" component={() => <WordSorter user={user} />} />
          <Route path="/listen-to-type" component={() => (
            <ProtectedRoute requireApproval={false}>
              <ListenToType user={user} />
            </ProtectedRoute>
          )} />

          <Route path="/code-evolution" component={() => <CodeEvolutionVisualization user={user} />} />
          <Route path="/crossword-generator" component={() => <CrosswordGenerator user={user} />} />
          <Route path="/audio-quizzes" component={() => <AudioQuizzes user={user} />} />
          <Route path="/text-quizzes" component={() => <TextQuizzes user={user} />} />
          <Route path="/profile" component={() => (
            <ProtectedRoute>
              <UserProfile user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/chatrooms" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminChatrooms user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          )} />

          <Route path="/admin/posts/new" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminPostEditor user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/posts/edit/:id" component={({ params }) => (
            <ProtectedRoute requireAdmin={true}>
              <AdminPostEditor user={user} postId={params.id} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/users" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminUsers user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/comments" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminComments user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/categories" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminCategories user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/seo" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <SEOManagement user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/quiz-grades-dashboard" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminQuizGradesDashboard user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/text-quiz-grades-dashboard" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminTextQuizGradesDashboard user={user} />
            </ProtectedRoute>
          )} />

          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App