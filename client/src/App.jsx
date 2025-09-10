import React, { useState, useEffect, createContext, useContext } from 'react'
import { Router, Route, Switch, Link, useLocation } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'

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
import WordBingo from './pages/word-bingo.jsx'
import SpanishAlphabet from './pages/spanish-alphabet.jsx'
import WordSorter from './pages/word-sorter.jsx'
import ListenToType from './pages/listen-to-type.jsx'

import CodeEvolutionVisualization from './pages/code-evolution.jsx'
import CrosswordGenerator from './pages/crossword-generator.jsx'
import AudioQuizzes from './pages/audio-quizzes.jsx'
import TextQuizzes from './pages/text-quizzes.jsx'
import AudioLists from './pages/audio-lists.jsx'
import LessonPlans from './pages/lesson-plans.jsx'
import GoogleSlides from './pages/google-slides.jsx'
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

// Utility function to get user from localStorage 
export const getUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error('Error parsing stored user:', e);
    localStorage.removeItem('user');
    return null;
  }
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
        // Clear any stale localStorage data when auth fails
        localStorage.removeItem('user')
        setUser(null)
        setIsLoading(false)
      })
      
    // Listen for user updates from authentication modal
    const handleUserUpdate = (event) => {
      if (event.detail) {
        console.log('[AuthProvider] User updated via event:', event.detail.name)
        setUser(event.detail)
      }
    }
    
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    window.currentUser = null
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
  const { user, logout } = useAuth()
  const [location] = useLocation()

  // Debug logging for routing
  console.log('[Router] Current location:', location)
  console.log('[Router] User:', user ? user.name : 'No user')

  // Protected route wrapper
  const ProtectedRoute = ({ children, requireAdmin = false, requireApproval = true }) => {
    // Only use user from valid server session - no localStorage fallback
    const currentUser = user;
    
    console.log('[ProtectedRoute] user:', currentUser?.name, 'requireAdmin:', requireAdmin, 'isAdmin:', currentUser?.isAdmin);
    
    if (!currentUser) {
      console.log('[ProtectedRoute] No user, showing login message');
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

    if (requireApproval && !currentUser.approved) {
      console.log('[ProtectedRoute] User not approved');
      return (
        <div className="container py-5">
          <div className="alert alert-warning">
            <h4>Account Pending Approval</h4>
            <p>Your account is waiting for admin approval. Please check back later.</p>
          </div>
        </div>
      )
    }

    if (requireAdmin && !currentUser.isAdmin) {
      console.log('[ProtectedRoute] User not admin, isAdmin:', currentUser.isAdmin);
      return (
        <div className="container py-5">
          <div className="alert alert-danger">
            <h4>Access Denied</h4>
            <p>You need admin privileges to access this page.</p>
          </div>
        </div>
      )
    }

    console.log('[ProtectedRoute] Rendering children successfully');
    // Pass the currentUser (from localStorage if needed) to children
    return React.cloneElement(children, { user: currentUser })
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation user={user} onLogout={logout} />
      <main className="flex-grow-1">
        <Switch>
          <Route path="/admin/posts/new" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminPostEditor />
            </ProtectedRoute>
          )} />
          <Route path="/admin/posts/edit/:id" component={({ params }) => (
            <ProtectedRoute requireAdmin={true}>
              <AdminPostEditor postId={params.id} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/posts" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminPosts />
            </ProtectedRoute>
          )} />
          <Route path="/admin/users" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminUsers />
            </ProtectedRoute>
          )} />
          <Route path="/admin/comments" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminComments />
            </ProtectedRoute>
          )} />
          <Route path="/admin/categories" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminCategories />
            </ProtectedRoute>
          )} />
          <Route path="/admin/seo" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <SEOManagement />
            </ProtectedRoute>
          )} />
          <Route path="/admin/quiz-grades-dashboard" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminQuizGradesDashboard />
            </ProtectedRoute>
          )} />
          <Route path="/admin/text-quiz-grades-dashboard" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminTextQuizGradesDashboard />
            </ProtectedRoute>
          )} />
          <Route path="/admin/chatrooms" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminChatrooms />
            </ProtectedRoute>
          )} />
          <Route path="/admin" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          )} />
          <Route path="/blog/:slug" component={({ params }) => (
            <ProtectedRoute requireApproval={false}>
              <BlogPost slug={params.slug} />
            </ProtectedRoute>
          )} />
          <Route path="/blog" component={() => (
            <ProtectedRoute requireApproval={false}>
              <BlogListing />
            </ProtectedRoute>
          )} />
          <Route path="/educational-tools" component={() => (
            <ProtectedRoute requireApproval={false}>
              <EducationalTools />
            </ProtectedRoute>
          )} />
          <Route path="/bingo-generator" component={() => (
            <ProtectedRoute requireApproval={false}>
              <BingoGenerator />
            </ProtectedRoute>
          )} />
          <Route path="/word-bingo" component={() => (
            <ProtectedRoute requireApproval={false}>
              <WordBingo />
            </ProtectedRoute>
          )} />
          <Route path="/spanish-alphabet" component={() => (
            <ProtectedRoute requireApproval={false}>
              <SpanishAlphabet />
            </ProtectedRoute>
          )} />
          <Route path="/word-sorter" component={() => (
            <ProtectedRoute requireApproval={false}>
              <WordSorter />
            </ProtectedRoute>
          )} />
          <Route path="/listen-to-type" component={() => <ListenToType />} />
          <Route path="/code-evolution" component={() => (
            <ProtectedRoute requireApproval={false}>
              <CodeEvolutionVisualization />
            </ProtectedRoute>
          )} />
          <Route path="/crossword-generator" component={() => (
            <ProtectedRoute requireApproval={false}>
              <CrosswordGenerator />
            </ProtectedRoute>
          )} />
          <Route path="/audio-quizzes" component={() => (
            <ProtectedRoute requireApproval={false}>
              <AudioQuizzes />
            </ProtectedRoute>
          )} />
          <Route path="/text-quizzes" component={() => (
            <ProtectedRoute requireApproval={false}>
              <TextQuizzes />
            </ProtectedRoute>
          )} />
          <Route path="/audio-lists" component={() => (
            <ProtectedRoute requireApproval={false}>
              <AudioLists />
            </ProtectedRoute>
          )} />
          <Route path="/lesson-plans" component={() => (
            <ProtectedRoute requireApproval={false}>
              <LessonPlans />
            </ProtectedRoute>
          )} />
          <Route path="/google-slides" component={() => (
            <ProtectedRoute requireApproval={false}>
              <GoogleSlides user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/profile" component={() => (
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          )} />
          <Route path="/" component={() => <Home user={user} />} />
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
      <Router hook={useHashLocation}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App