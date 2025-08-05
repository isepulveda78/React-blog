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

// Admin Dashboard Component
const AdminDashboard = ({ user }) => {
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-primary mb-4">Admin Dashboard</h1>
          <p className="lead text-muted mb-5">
            Manage your educational platform content and users from here.
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">📝</div>
              <h5 className="card-title">Manage Posts</h5>
              <p className="card-text">Create, edit, and publish blog posts.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/admin/posts')}
              >
                Go to Posts
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">👥</div>
              <h5 className="card-title">Manage Users</h5>
              <p className="card-text">Approve users and manage permissions.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/admin/users')}
              >
                Go to Users
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">💬</div>
              <h5 className="card-title">Manage Comments</h5>
              <p className="card-text">Moderate and approve user comments.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/admin/comments')}
              >
                Go to Comments
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🎨</div>
              <h5 className="card-title">Educational Tools</h5>
              <p className="card-text">Manage educational content and tools.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/educational-tools')}
              >
                Go to Tools
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🏗️</div>
              <h5 className="card-title">City Builder</h5>
              <p className="card-text">Access the city building application.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/city-builder')}
              >
                Go to Builder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Admin Components
const AdminPosts = ({ user }) => (
  <div className="container py-5">
    <h1>Manage Posts</h1>
    <p>Blog post management interface coming soon.</p>
    <a href="/admin" className="btn btn-secondary">Back to Dashboard</a>
  </div>
);

const AdminUsers = ({ user }) => (
  <div className="container py-5">
    <h1>Manage Users</h1>
    <p>User management interface coming soon.</p>
    <a href="/admin" className="btn btn-secondary">Back to Dashboard</a>
  </div>
);

const AdminComments = ({ user }) => (
  <div className="container py-5">
    <h1>Manage Comments</h1>
    <p>Comment moderation interface coming soon.</p>
    <a href="/admin" className="btn btn-secondary">Back to Dashboard</a>
  </div>
);

const BlogListing = ({ user }) => (
  <div className="container py-5">
    <h1>Blog & Resources</h1>
    <p>Blog posts and educational resources coming soon.</p>
  </div>
);

const BlogPost = ({ user, slug }) => (
  <div className="container py-5">
    <h1>Blog Post: {slug}</h1>
    <p>Individual blog post content coming soon.</p>
  </div>
);

const EducationalTools = ({ user }) => {
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-primary mb-4">Educational Tools</h1>
          <p className="lead text-muted mb-5">
            Interactive learning tools designed for engaging educational experiences.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* City Builder */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🏗️</div>
              <h5 className="card-title">City Builder</h5>
              <p className="card-text">Design and build your own virtual cities with interactive drag-and-drop tools.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/city-builder')}
              >
                Start Building
              </button>
            </div>
          </div>
        </div>

        {/* Bingo Generator */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🎲</div>
              <h5 className="card-title">Bingo Card Generator</h5>
              <p className="card-text">Create custom bingo cards with number ranges and print-ready layouts.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/bingo-generator')}
              >
                Generate Cards  
              </button>
            </div>
          </div>
        </div>

        {/* Spanish Alphabet */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">🔤</div>
              <h5 className="card-title">Spanish Alphabet Soundboard</h5>
              <p className="card-text">Interactive Spanish letter learning with audio pronunciation and speech synthesis.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/spanish-alphabet')}
              >
                Learn Letters
              </button>
            </div>
          </div>
        </div>

        {/* Word Sorter */}
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-3">📝</div>
              <h5 className="card-title">Word Sorter</h5>
              <p className="card-text">Drag and drop words between customizable lists for vocabulary activities with PDF export.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigateTo('/word-sorter')}
              >
                Sort Words
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

const CityBuilder = ({ user }) => (
  <div className="container py-5">
    <h1>City Builder</h1>
    <p>Interactive city building tool coming soon.</p>
    <div className="alert alert-info">
      This feature will include drag-and-drop building placement, 
      customizable city layouts, and export functionality.
    </div>
  </div>
);

const UserProfile = ({ user }) => (
  <div className="container py-5">
    <h1>User Profile</h1>
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Welcome, {user?.name || user?.username}!</h5>
        <p className="card-text">Manage your profile and preferences here.</p>
      </div>
    </div>
  </div>
);

// Educational Tool Components
const SpanishAlphabet = ({ user }) => (
  <div className="container py-5">
    <h1 className="display-4 fw-bold text-primary mb-4">Spanish Alphabet Soundboard</h1>
    <div className="alert alert-info">
      <h5>Interactive Spanish Letter Learning</h5>
      <p>This tool helps students learn Spanish letter pronunciation with audio feedback.</p>
    </div>
    <div className="row g-3">
      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(letter => (
        <div key={letter} className="col-6 col-md-3 col-lg-2">
          <button 
            className="btn btn-outline-primary w-100 p-3 fw-bold fs-4"
            onClick={() => alert(`Playing sound for letter ${letter}`)}
          >
            {letter}
          </button>
        </div>
      ))}
    </div>
    <div className="mt-4">
      <button className="btn btn-success btn-lg me-3">
        🎵 Play All Letters
      </button>
      <button className="btn btn-secondary btn-lg">
        🔇 Stop All
      </button>
    </div>
  </div>
);

const WordSorter = ({ user }) => {
  const [list1, setList1] = React.useState([]);
  const [list2, setList2] = React.useState([]);
  const [newWord, setNewWord] = React.useState('');
  const [list1Title, setList1Title] = React.useState('List 1');
  const [list2Title, setList2Title] = React.useState('List 2');

  const addWord = () => {
    if (newWord.trim()) {
      setList1([...list1, { id: Date.now(), text: newWord.trim() }]);
      setNewWord('');
    }
  };

  return (
    <div className="container py-5">
      <h1 className="display-4 fw-bold text-primary mb-4">Word Sorter</h1>
      <div className="alert alert-info">
        <h5>Drag & Drop Word Sorting</h5>
        <p>Add words and drag them between lists for vocabulary activities.</p>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Add new word..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addWord()}
            />
            <button className="btn btn-primary" onClick={addWord}>Add Word</button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <input
                type="text"
                className="form-control"
                value={list1Title}
                onChange={(e) => setList1Title(e.target.value)}
              />
            </div>
            <div className="card-body">
              {list1.map(word => (
                <div key={word.id} className="badge bg-primary m-1 p-2">
                  {word.text}
                </div>
              ))}
              {list1.length === 0 && <p className="text-muted">Drag words here...</p>}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <input
                type="text"
                className="form-control"
                value={list2Title}
                onChange={(e) => setList2Title(e.target.value)}
              />
            </div>
            <div className="card-body">
              {list2.map(word => (
                <div key={word.id} className="badge bg-success m-1 p-2">
                  {word.text}
                </div>
              ))}
              {list2.length === 0 && <p className="text-muted">Drag words here...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BingoGenerator = ({ user }) => {
  const [title, setTitle] = React.useState('BINGO');
  const [minNumber, setMinNumber] = React.useState(1);
  const [maxNumber, setMaxNumber] = React.useState(75);
  const [numCards, setNumCards] = React.useState(1);

  return (
    <div className="container py-5">
      <h1 className="display-4 fw-bold text-primary mb-4">Bingo Card Generator</h1>
      <div className="alert alert-info">
        <h5>Create Custom Bingo Cards</h5>
        <p>Generate educational bingo cards with custom number ranges and titles.</p>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header"><h5>Card Settings</h5></div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="row">
                <div className="col-6">
                  <label className="form-label">Min Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={minNumber}
                    onChange={(e) => setMinNumber(parseInt(e.target.value))}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Max Number</label>
                  <input
                    type="number"
                    className="form-control"
                    value={maxNumber}
                    onChange={(e) => setMaxNumber(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="form-label">Number of Cards</label>
                <input
                  type="number"
                  className="form-control"
                  value={numCards}
                  onChange={(e) => setNumCards(parseInt(e.target.value))}
                />
              </div>
              <button className="btn btn-primary mt-3">Generate Cards</button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header"><h5>Preview</h5></div>
            <div className="card-body text-center">
              <h4>{title}</h4>
              <div className="row">
                {['B', 'I', 'N', 'G', 'O'].map(letter => (
                  <div key={letter} className="col">
                    <div className="fw-bold p-2 bg-primary text-white">{letter}</div>
                  </div>
                ))}
              </div>
              <p className="text-muted mt-2">Sample bingo card layout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SoundDemo = ({ user }) => (
  <div className="container py-5">
    <h1 className="display-4 fw-bold text-primary mb-4">Sound Demo</h1>
    <div className="alert alert-info">
      <h5>Audio Integration Examples</h5>
      <p>Explore different ways to integrate audio into educational content.</p>
    </div>
    
    <div className="row g-4">
      <div className="col-md-6">
        <div className="card">
          <div className="card-body text-center">
            <h5 className="card-title">Button Click Sound</h5>
            <button className="btn btn-primary btn-lg">
              🔊 Click Me
            </button>
            <p className="text-muted mt-2">Plays sound on button interaction</p>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card">
          <div className="card-body text-center">
            <h5 className="card-title">Success Sound</h5>
            <button className="btn btn-success btn-lg">
              ✅ Success
            </button>
            <p className="text-muted mt-2">Celebration sound for achievements</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MP3Guide = ({ user }) => (
  <div className="container py-5">
    <h1 className="display-4 fw-bold text-primary mb-4">MP3 Integration Guide</h1>
    <div className="alert alert-success">
      <h5>📚 Audio Integration Best Practices</h5>
      <p>Learn how to effectively integrate audio files into educational applications.</p>
    </div>
    
    <div className="row">
      <div className="col-md-8">
        <div className="card">
          <div className="card-body">
            <h5>Key Features</h5>
            <ul>
              <li>Web Audio API integration for precise sound control</li>
              <li>Preloading audio files for better performance</li>
              <li>Error handling for missing audio files</li>
              <li>Accessibility considerations for audio content</li>
              <li>Mobile device compatibility</li>
            </ul>
            
            <h5 className="mt-4">Implementation Examples</h5>
            <div className="bg-light p-3 rounded">
              <code>
                const audio = new Audio('/sounds/example.mp3');<br/>
                audio.play().catch(console.error);
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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

  // Admin routes - require authentication and admin privileges
  if (location === "/admin") {
    if (!user) {
      window.location.href = "/?message=login-required";
      return null;
    }
    if (!user.isAdmin) {
      CurrentComponent = () => (
        <div className="container py-5">
          <div className="alert alert-danger">
            Access denied. Admin privileges required.
          </div>
        </div>
      );
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
  } else if (location === "/blog") {
    CurrentComponent = BlogListing;
  } else if (location.startsWith("/blog/")) {
    CurrentComponent = BlogPost;
    componentProps = { user, slug: location.replace("/blog/", "") };
  } else if (location === "/educational-tools") {
    CurrentComponent = EducationalTools;
  } else if (location === "/city-builder") {
    CurrentComponent = CityBuilder;
  } else if (location === "/spanish-alphabet") {
    CurrentComponent = SpanishAlphabet;
  } else if (location === "/word-sorter") {
    CurrentComponent = WordSorter;
  } else if (location === "/bingo-generator") {
    CurrentComponent = BingoGenerator;
  } else if (location === "/sound-demo") {
    CurrentComponent = SoundDemo;
  } else if (location === "/mp3-guide") {
    CurrentComponent = MP3Guide;
  } else if (location === "/profile" && user && user.approved) {
    CurrentComponent = UserProfile;
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