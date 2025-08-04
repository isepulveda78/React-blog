// Use global React and components from window
const { useState, useEffect, createContext, useContext } = React;

// Components will be loaded as window objects
const Navigation = window.Navigation;
const Hero = window.Hero;
const Home = window.Home;
const BlogListing = window.BlogListing;
const BlogPost = window.BlogPost;
const AdminDashboard = window.AdminDashboard;
const AdminPosts = window.AdminPosts;
const AdminUsers = window.AdminUsers;
const AdminComments = window.AdminComments;
const AdminPostEditor = window.AdminPostEditor;
const SEOManagement = window.SEOManagement;
const UserProfile = window.UserProfile;
const NotFound = window.NotFound;

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
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
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  return children;
};

// Main App Component
const App = () => {
  return React.createElement(AuthProvider, null,
    React.createElement(SimpleRouter, null,
      React.createElement(AppRoutes)
    )
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
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return React.createElement(
      'div',
      { className: 'd-flex justify-content-center align-items-center min-vh-100' },
      React.createElement(
        'div',
        { className: 'spinner-border text-primary', role: 'status' },
        React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
      )
    );
  }

  // Make user available globally for all components
  window.currentUser = user;
  
  // Simple routing based on location
  let CurrentComponent = Home;
  let componentProps = { user };

  if (location === '/blog') {
    CurrentComponent = BlogListing;
  } else if (location.startsWith('/blog/')) {
    CurrentComponent = BlogPost;
    componentProps = { user, slug: location.replace('/blog/', '') };
  } else if (location === '/admin' && user && user.isAdmin) {
    CurrentComponent = AdminDashboard;
  } else if (location === '/admin/posts' && user && user.isAdmin) {
    CurrentComponent = AdminPosts;
  } else if (location === '/admin/users' && user && user.isAdmin) {
    CurrentComponent = AdminUsers;
  } else if (location === '/admin/comments' && user && user.isAdmin) {
    CurrentComponent = AdminComments;
  } else if (location === '/seo-management' && user && user.isAdmin) {
    CurrentComponent = SEOManagement;
  } else if (location === '/profile' && user && user.approved) {
    CurrentComponent = UserProfile;
  } else if (location !== '/') {
    CurrentComponent = NotFound;
    componentProps = {};
  }

  return React.createElement(
    'div',
    { className: 'min-vh-100 d-flex flex-column' },
    Navigation && React.createElement(Navigation, { user, onLogout: logout }),
    React.createElement(
      'main',
      { className: 'flex-grow-1' },
      CurrentComponent && React.createElement(CurrentComponent, componentProps)
    ),
    React.createElement(
      'footer',
      { className: 'bg-dark text-light py-4 mt-auto' },
      React.createElement(
        'div',
        { className: 'container text-center' },
        React.createElement('p', { className: 'mb-0' }, '© 2025 Mr. S Teaches. All rights reserved.')
      )
    )
  );
};

// Export to window for global access
window.App = App;