import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

// Simple Navigation Component for Production
const SimpleNavigation = ({ user, onLogout }) => {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePathChange);
    return () => window.removeEventListener("popstate", handlePathChange);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setCurrentPath(path);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    window.location.href = "/";
  };

  const isActive = (path) => currentPath === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <a 
          className="navbar-brand fw-bold text-primary fs-3" 
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("/");
          }}
        >
          Mr. S Teaches
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a 
                className={`nav-link ${isActive("/") ? "active fw-bold" : ""}`}
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/");
                }}
              >
                Home
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${isActive("/blog") ? "active fw-bold" : ""}`}
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/blog");
                }}
              >
                Blog & Resources
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${isActive("/educational-tools") ? "active fw-bold" : ""}`}
                href="/educational-tools"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/educational-tools");
                }}
              >
                Educational Tools
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${isActive("/city-builder") ? "active fw-bold" : ""}`}
                href="/city-builder"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/city-builder");
                }}
              >
                City Builder
              </a>
            </li>
            {user && user.isAdmin && (
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle" 
                  href="#" 
                  role="button" 
                  data-bs-toggle="dropdown"
                >
                  Admin
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a 
                      className="dropdown-item" 
                      href="/admin"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo("/admin");
                      }}
                    >
                      Dashboard
                    </a>
                  </li>
                </ul>
              </li>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <>
                <span className="navbar-text me-3">Welcome, {user.name || user.username}!</span>
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <a href="/api/auth/google" className="btn btn-primary">
                Sign In with Google
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Simple Hero Component
const Hero = ({ user }) => {
  return (
    <div className="hero-section bg-primary text-white py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center">
            <h1 className="display-4 fw-bold mb-4">Welcome to Mr. S Teaches</h1>
            <p className="lead mb-4">
              Interactive educational platform featuring city building tools, 
              blog resources, and engaging learning experiences.
            </p>
            {!user && (
              <a href="/api/auth/google" className="btn btn-light btn-lg">
                Get Started
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Home Component
const Home = ({ user }) => {
  return (
    <div>
      <Hero user={user} />
      <div className="container py-5">
        <div className="row">
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Educational Tools</h5>
                <p className="card-text">
                  Explore interactive tools designed for engaging learning experiences.
                </p>
                <a href="/educational-tools" className="btn btn-primary">
                  Explore Tools
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">City Builder</h5>
                <p className="card-text">
                  Design and build your own virtual cities with our interactive city builder.
                </p>
                <a href="/city-builder" className="btn btn-primary">
                  Start Building
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Blog & Resources</h5>
                <p className="card-text">
                  Read educational articles and access teaching resources.
                </p>
                <a href="/blog" className="btn btn-primary">
                  Read More
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// Simple Router
const SimpleRouter = ({ children }) => {
  const [location, setLocation] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handlePopState = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return children;
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <SimpleRouter>
        <AppRoutes />
      </SimpleRouter>
    </AuthProvider>
  );
};

const AppRoutes = () => {
  const { user, logout, isLoading } = useAuth();
  const [location, setLocation] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handlePopState = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Simple routing - default to Home
  let CurrentComponent = Home;
  let componentProps = { user };

  // You can extend this routing logic as needed
  if (location === "/blog") {
    CurrentComponent = () => (
      <div className="container py-5">
        <h1>Blog Coming Soon</h1>
        <p>The blog section is being developed.</p>
      </div>
    );
  } else if (location === "/educational-tools") {
    CurrentComponent = () => (
      <div className="container py-5">
        <h1>Educational Tools</h1>
        <p>Interactive educational tools coming soon.</p>
      </div>
    );
  } else if (location === "/city-builder") {
    CurrentComponent = () => (
      <div className="container py-5">
        <h1>City Builder</h1>
        <p>City building tool coming soon.</p>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <SimpleNavigation user={user} onLogout={logout} />
      <main className="flex-grow-1">
        <CurrentComponent {...componentProps} />
      </main>
      <footer className="bg-dark text-light py-4 mt-auto">
        <div className="container text-center">
          <p className="mb-0">© 2025 Mr. S Teaches. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Initialize the app
ReactDOM.createRoot(document.getElementById('root')).render(<App />);