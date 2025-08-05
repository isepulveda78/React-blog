import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// Import actual components for production build
import WorkingCityBuilder from './pages/city-builder-working.jsx';
import EducationalTools from './pages/educational-tools.jsx';
import BingoGenerator from './pages/bingo-generator.jsx';
import SoundDemo from './pages/sound-demo.jsx';
import MP3Guide from './pages/mp3-guide.jsx';
import SpanishAlphabet from './pages/spanish-alphabet.jsx';
import WordSorter from './pages/word-sorter.jsx';
import UserProfile from './pages/user-profile.jsx';

// Make React hooks available globally for all components (for compatibility with existing components)
window.React = React;
window.useState = useState;
window.useEffect = useEffect;
window.useRef = useRef;
window.useCallback = useCallback;

// Simple fallback components for immediate functionality
const Navigation = ({ user, onLogout }) => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
    <div className="container">
      <a className="navbar-brand" href="/">BlogCraft</a>
      <div className="navbar-nav ms-auto">
        {user ? (
          <>
            <span className="navbar-text me-3">Hello, {user.name}</span>
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <a className="btn btn-outline-light btn-sm" href="/api/auth/google">Login</a>
        )}
      </div>
    </div>
  </nav>
);

const Home = ({ user }) => (
  <div className="container my-5">
    <div className="text-center mb-5">
      <h1 className="display-4 mb-4">Welcome to BlogCraft</h1>
      <p className="lead">A modern blog platform with advanced content management and SEO tools.</p>
      {!user && (
        <a href="/api/auth/google" className="btn btn-primary btn-lg">Get Started</a>
      )}
    </div>
    <div className="row">
      <div className="col-md-8 mx-auto">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Platform Features</h5>
            <ul className="list-unstyled">
              <li>✓ User authentication with Google OAuth</li>
              <li>✓ Rich text blog post editing</li>
              <li>✓ SEO optimization tools</li>
              <li>✓ Admin dashboard for content management</li>
              <li>✓ Educational tools and interactive components</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotFound = ({ message }) => (
  <div className="container my-5 text-center">
    <h2>Page Not Found</h2>
    <p>{message || "The page you're looking for doesn't exist."}</p>
    <a href="/" className="btn btn-primary">Go Home</a>
  </div>
);

// Use imported components directly, with fallback for admin components not yet imported
const BlogListing = window.BlogListing || NotFound;
const BlogPost = window.BlogPost || NotFound;
const AdminDashboard = window.AdminDashboard || NotFound;
const AdminPosts = window.AdminPosts || NotFound;
const AdminUsers = window.AdminUsers || NotFound;
const AdminComments = window.AdminComments || NotFound;
const AdminPostEditor = window.AdminPostEditor || NotFound;
const SEOManagement = window.SEOManagement || NotFound;

// Main components now imported directly
const CityBuilder = WorkingCityBuilder;

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated with backend session
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Not authenticated");
      })
      .then((userData) => {
        console.log("User authenticated:", userData);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setIsLoading(false);
      })
      .catch(() => {
        // Not authenticated, check localStorage as fallback
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem("user");
          }
        }
        setIsLoading(false);
      });
  }, []);

  const login = async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const userData = await response.json();
    console.log("Login successful:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const newUser = await response.json();
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    return newUser;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Simple routing function
const SimpleRouter = ({ children }) => {
  const [location, setLocation] = useState(window.location.pathname);

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
  return React.createElement(
    AuthProvider,
    null,
    React.createElement(SimpleRouter, null, React.createElement(AppRoutes)),
  );
};

const AppRoutes = () => {
  const { user, logout, isLoading } = useAuth();
  const [location, setLocation] = useState(window.location.pathname);

  // Update location on navigation
  React.useEffect(() => {
    const handlePopState = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (isLoading) {
    return React.createElement(
      "div",
      {
        className:
          "d-flex justify-content-center align-items-center min-vh-100",
      },
      React.createElement(
        "div",
        { className: "spinner-border text-primary", role: "status" },
        React.createElement(
          "span",
          { className: "visually-hidden" },
          "Loading...",
        ),
      ),
    );
  }

  // Make user available globally for all components
  window.currentUser = user;

  // Simple routing based on location - default to CityBuilder for city-building platform
  console.log("DEBUG: Current location:", location);
  console.log("DEBUG: Available components:", {
    WorkingCityBuilder: !!WorkingCityBuilder,
    CityBuilder: !!CityBuilder,
    Home: !!Home
  });
  let CurrentComponent = CityBuilder || Home;
  let componentProps = { user };
  console.log("DEBUG: Initial component chosen:", CurrentComponent?.name || "No component");

  if (location === "/blog") {
    CurrentComponent = BlogListing;
  } else if (location.startsWith("/blog/")) {
    CurrentComponent = BlogPost;
    componentProps = { user, slug: location.replace("/blog/", "") };
  } else if (location === "/educational-tools") {
    CurrentComponent = EducationalTools;
  } else if (location === "/sound-demo") {
    CurrentComponent = SoundDemo;
  } else if (location === "/mp3-guide") {
    CurrentComponent = MP3Guide;
  } else if (location === "/spanish-alphabet") {
    CurrentComponent = SpanishAlphabet;
  } else if (location === "/admin") {
    if (!user) {
      // Redirect to home with login prompt for unauthenticated users
      window.location.href = "/?message=login-required";
      return null;
    } else if (!user.isAdmin) {
      // Show access denied for non-admin users
      CurrentComponent = NotFound;
      componentProps = { message: "Access denied. Admin privileges required." };
    } else {
      CurrentComponent = AdminDashboard;
    }
  } else if (location === "/admin/posts") {
    if (!user || !user.isAdmin) {
      window.location.href = "/?message=admin-required";
      return null;
    }
    CurrentComponent = AdminPosts;
  } else if (location === "/admin/users") {
    if (!user || !user.isAdmin) {
      window.location.href = "/?message=admin-required";
      return null;
    }
    CurrentComponent = AdminUsers;
  } else if (location === "/admin/comments") {
    if (!user || !user.isAdmin) {
      window.location.href = "/?message=admin-required";
      return null;
    }
    CurrentComponent = AdminComments;
  } else if (location === "/seo-management") {
    if (!user || !user.isAdmin) {
      window.location.href = "/?message=admin-required";
      return null;
    }
    CurrentComponent = SEOManagement;
  } else if (location === "/profile") {
    if (!user) {
      window.location.href = "/?message=login-required";
      return null;
    } else if (!user.approved) {
      CurrentComponent = NotFound;
      componentProps = {
        message: "Account pending approval. Please wait for admin approval.",
      };
    } else {
      CurrentComponent = UserProfile;
    }
  } else if (location === "/city-builder") {
    console.log("ROUTE: Loading CityBuilder, WorkingCityBuilder available:", !!WorkingCityBuilder);
    CurrentComponent = CityBuilder;
  } else if (location === "/bingo-generator") {
    CurrentComponent = BingoGenerator;
  } else if (location === "/word-sorter") {
    CurrentComponent = WordSorter;
  } else if (location !== "/") {
    CurrentComponent = NotFound;
    componentProps = {};
  }

  console.log("DEBUG: Final component chosen:", CurrentComponent?.name || "No component");
  console.log("DEBUG: Component props:", componentProps);

  return React.createElement(
    "div",
    { className: "min-vh-100 d-flex flex-column" },
    Navigation && React.createElement(Navigation, { user, onLogout: logout }),
    React.createElement(
      "main",
      { className: "flex-grow-1" },
      CurrentComponent && React.createElement(CurrentComponent, componentProps),
    ),
    React.createElement(
      "footer",
      { className: "bg-dark text-light py-4 mt-auto" },
      React.createElement(
        "div",
        { className: "container text-center" },
        React.createElement(
          "p",
          { className: "mb-0" },
          "© 2025 Mr. S Teaches. All rights reserved.",
        ),
      ),
    ),
  );
};

// Export to window for global access
window.App = App;

// Default export for ES6 module import
export default App;
