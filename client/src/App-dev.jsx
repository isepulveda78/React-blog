// Use global React and components from window
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// Make React hooks available globally for all components
window.React = React;
window.useState = useState;
window.useEffect = useEffect;
window.useRef = useRef;
window.useCallback = useCallback;

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
const CityBuilder = window.CityBuilder;
const EducationalTools = window.EducationalTools;
const BingoGenerator = window.BingoGenerator;
const SoundDemo = window.SoundDemo;
const MP3Guide = window.MP3Guide;
const SpanishAlphabet = window.SpanishAlphabet;
const NotFound = window.NotFound;

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

  const login = async (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const register = async (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
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
    WorkingCityBuilder: !!window.WorkingCityBuilder,
    StableCityBuilder: !!window.StableCityBuilder,
    CityBuilder: !!window.CityBuilder,
    Home: !!window.Home
  });
  let CurrentComponent = window.WorkingCityBuilder || window.StableCityBuilder || CityBuilder || Home;
  let componentProps = { user };
  console.log("DEBUG: Initial component chosen:", CurrentComponent?.name || "No component");

  if (location === "/blog") {
    CurrentComponent = BlogListing;
  } else if (location.startsWith("/blog/")) {
    CurrentComponent = BlogPost;
    componentProps = { user, slug: location.replace("/blog/", "") };
  } else if (location === "/admin") {
    if (!user) {
      window.location.href = "/?message=login-required";
      return null;
    }
    if (!user.isAdmin) {
      window.location.href = "/?message=admin-required";
      return null;
    }
    CurrentComponent = AdminDashboard;
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
  } else if (location.startsWith("/admin/posts/")) {
    if (!user || !user.isAdmin) {
      window.location.href = "/?message=admin-required";
      return null;
    }
    CurrentComponent = AdminPostEditor;
    componentProps = { user, postId: location.replace("/admin/posts/", "") };
  } else if (location === "/admin/seo") {
    if (!user || !user.isAdmin) {
      window.location.href = "/?message=admin-required";
      return null;
    }
    CurrentComponent = SEOManagement;
  } else if (location === "/educational-tools") {
    CurrentComponent = EducationalTools;
  } else if (location === "/sound-demo") {
    CurrentComponent = SoundDemo;
  } else if (location === "/mp3-guide") {
    CurrentComponent = MP3Guide;
  } else if (location === "/spanish-alphabet") {
    CurrentComponent = SpanishAlphabet;
  } else if (location === "/profile") {
    if (!user) {
      window.location.href = "/?message=login-required";
      return null;
    }
    if (!user.approved) {
      CurrentComponent = NotFound;
      componentProps = {
        message: "Account pending approval. Please wait for admin approval.",
      };
    } else {
      CurrentComponent = UserProfile;
    }
  } else if (location === "/city-builder") {
    console.log("ROUTE: Loading CityBuilder, WorkingCityBuilder available:", !!window.WorkingCityBuilder);
    CurrentComponent = window.WorkingCityBuilder || window.StableCityBuilder || CityBuilder;
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