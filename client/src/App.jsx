import React, { useState, useEffect, createContext, useContext } from 'react'
import { Router, Route, Switch, Link, useLocation } from 'wouter'

// Import components
import Navigation from './components/Navigation.jsx'
import Hero from './components/Hero.jsx'
import Home from './components/Home.jsx'
import BlogListing from './components/BlogListing.jsx'
import BlogPost from './pages/blog-post.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
// Removed AdminPosts component definition to eliminate conflicts
import AdminUsers from './components/AdminUsers.jsx'
import AdminComments from './components/AdminComments.jsx'
// Temporarily commented out AdminPostEditor import
// import AdminPostEditor from './components/AdminPostEditor.jsx'
import SEOManagement from './components/SEOManagement.jsx'
import Footer from './components/Footer.jsx'
import UserProfile from './pages/user-profile.jsx'
import EducationalTools from './pages/educational-tools.jsx'
import BingoGenerator from './pages/bingo-generator.jsx'
import SpanishAlphabet from './pages/spanish-alphabet.jsx'
import WordSorter from './pages/word-sorter.jsx'
import CityBuilder from './pages/city-builder-simple.jsx'
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
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('Not authenticated')
      })
      .then((userData) => {
        console.log('User authenticated:', userData)
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        setIsLoading(false)
      })
      .catch(() => {
        // Not authenticated, check localStorage as fallback
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
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
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
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
      console.log('No user, redirecting to Google auth');
      window.location.href = '/api/auth/google'
      return null
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
          <Route path="/city-builder" component={() => <div style={{ height: '100vh', overflow: 'hidden' }}><CityBuilder user={user} /></div>} />
          <Route path="/profile" component={() => (
            <ProtectedRoute>
              <UserProfile user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          )} />
          <Route path="/admin/posts" component={() => {
            console.log('Route /admin/posts accessed - user:', user?.name);
            return (
              <ProtectedRoute requireAdmin={true}>
                <div className="container py-5">
                  <h1 className="display-4 fw-bold text-success">✅ Direct JSX Working!</h1>
                  <div className="alert alert-info">
                    User: {user?.name}, Admin: {user?.isAdmin ? 'Yes' : 'No'}
                  </div>
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => alert('Direct JSX button works!')}
                  >
                    Test Direct JSX
                  </button>
                </div>
              </ProtectedRoute>
            );
          }} />
          <Route path="/admin/posts/new" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <div className="container py-5">
                <h1>Create New Post</h1>
                <div className="alert alert-info">Post creation temporarily disabled for debugging</div>
              </div>
            </ProtectedRoute>
          )} />
          <Route path="/admin/posts/edit/:id" component={({ params }) => (
            <ProtectedRoute requireAdmin={true}>
              <div className="container py-5">
                <h1>Edit Post {params.id}</h1>
                <div className="alert alert-info">Post editing temporarily disabled for debugging</div>
              </div>
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
          <Route path="/admin/seo" component={() => (
            <ProtectedRoute requireAdmin={true}>
              <SEOManagement user={user} />
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