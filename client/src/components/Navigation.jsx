const { React, useState, useEffect } = window;

const Navigation = ({ user, onLogout }) => {
  console.log('Navigation component - current user:', user);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const isActive = (path) => currentPath === path;

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setCurrentPath(path);
  };

  const handleAuthModalToggle = () => {
    setIsLoginMode(!isLoginMode);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    window.currentUser = null;
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Simple inline AuthModal since window.AuthModal might not load properly
  const AuthModalComponent = () => {
    if (!showAuthModal) return null;
    
    const [formData, setFormData] = useState({
      email: "",
      password: "",
      username: "",
      name: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Authentication failed");
        }

        const userData = await response.json();
        console.log("Authentication successful:", userData);
        
        // Update global user state and refresh
        window.currentUser = userData;
        localStorage.setItem("user", JSON.stringify(userData));
        window.location.reload();
        
        setShowAuthModal(false);
        setFormData({ email: "", password: "", username: "", name: "" });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    return React.createElement("div", {
      className: "modal show d-block",
      style: { backgroundColor: "rgba(0,0,0,0.5)" },
      onClick: (e) => {
        if (e.target === e.currentTarget) setShowAuthModal(false);
      }
    },
      React.createElement("div", {
        className: "modal-dialog modal-dialog-centered",
        onClick: (e) => e.stopPropagation()
      },
        React.createElement("div", { className: "modal-content" },
          React.createElement("div", { className: "modal-header" },
            React.createElement("h5", { className: "modal-title" },
              isLoginMode ? "Sign In" : "Create Account"
            ),
            React.createElement("button", {
              type: "button",
              className: "btn-close",
              onClick: () => setShowAuthModal(false)
            })
          ),
          React.createElement("form", { onSubmit: handleSubmit },
            React.createElement("div", { className: "modal-body" },
              error && React.createElement("div", { className: "alert alert-danger" }, error),
              
              // Google Sign-In Button
              React.createElement("div", { className: "d-grid gap-2 mb-3" },
                React.createElement("a", {
                  href: "/api/auth/google",
                  className: "btn btn-outline-danger"
                },
                  React.createElement("i", { className: "fab fa-google me-2" }),
                  isLoginMode ? "Sign in with Google" : "Sign up with Google"
                )
              ),
              
              React.createElement("div", { className: "text-center mb-3" },
                React.createElement("span", { className: "text-muted" }, "or")
              ),

              // Name field for registration
              !isLoginMode && React.createElement("div", { className: "mb-3" },
                React.createElement("label", { className: "form-label" }, "Full Name"),
                React.createElement("input", {
                  type: "text",
                  className: "form-control",
                  name: "name",
                  value: formData.name,
                  onChange: handleChange,
                  required: true
                })
              ),

              // Username field for registration
              !isLoginMode && React.createElement("div", { className: "mb-3" },
                React.createElement("label", { className: "form-label" }, "Username"),
                React.createElement("input", {
                  type: "text",
                  className: "form-control",
                  name: "username",
                  value: formData.username,
                  onChange: handleChange,
                  required: true
                })
              ),

              // Email field
              React.createElement("div", { className: "mb-3" },
                React.createElement("label", { className: "form-label" }, "Email"),
                React.createElement("input", {
                  type: "email",
                  className: "form-control",
                  name: "email",
                  value: formData.email,
                  onChange: handleChange,
                  required: true
                })
              ),

              // Password field
              React.createElement("div", { className: "mb-3" },
                React.createElement("label", { className: "form-label" }, "Password"),
                React.createElement("input", {
                  type: "password",
                  className: "form-control",
                  name: "password",
                  value: formData.password,
                  onChange: handleChange,
                  required: true
                })
              )
            ),
            React.createElement("div", { className: "modal-footer" },
              React.createElement("button", {
                type: "button",
                className: "btn btn-outline-secondary",
                onClick: handleAuthModalToggle
              },
                isLoginMode
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in"
              ),
              React.createElement("button", {
                type: "submit",
                className: "btn btn-primary",
                disabled: isLoading
              },
                isLoading
                  ? React.createElement("span", { className: "spinner-border spinner-border-sm me-2" })
                  : null,
                isLoginMode ? "Sign In" : "Create Account"
              )
            )
          )
        )
      )
    );
  };

  return (
    <>
      {/* Inline AuthModal */}
      {React.createElement(AuthModalComponent)}
      
      {/* Navigation */}
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <a 
          className="navbar-brand fw-bold text-primary"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
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
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/');
                }}
              >
                Home
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/blog');
                }}
              >
                All Posts
              </a>
            </li>
            {user && user.isAdmin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle text-danger fw-bold"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={{ backgroundColor: '#fff3cd', padding: '8px 12px', borderRadius: '4px' }}
                >
                  🔧 ADMIN PANEL
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a
                      className="dropdown-item"
                      href="/admin"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/admin');
                      }}
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="/admin/posts"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/admin/posts');
                      }}
                    >
                      Manage Posts
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="/admin/users"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/admin/users');
                      }}
                    >
                      Manage Users
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="/admin/comments"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/admin/comments');
                      }}
                    >
                      Manage Comments
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="/seo-management"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('/seo-management');
                      }}
                    >
                      SEO Management
                    </a>
                  </li>
                </ul>
              </li>
            )}
            

          </ul>
          
          <div className="navbar-nav">
            {/* Debug info */}
            <span className="navbar-text me-2 small text-muted">
              User: {user ? `${user.username} (Admin: ${user.isAdmin ? 'Yes' : 'No'})` : 'Not logged in'}
            </span>
            
            {/* Always visible admin access button */}
            <button
              className="btn btn-danger btn-sm me-2"
              onClick={() => {
                window.history.pushState({}, '', '/admin');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              🔧 Admin Dashboard
            </button>
            
            {/* Always visible logout button for testing */}
            <button
              className="btn btn-warning btn-sm me-2"
              onClick={handleLogout}
              style={{ backgroundColor: '#ffc107', border: '2px solid #000' }}
            >
              LOGOUT NOW
            </button>
            
            {user ? (
              <div className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  {user.profileImage && (
                    <img
                      src={user.profileImage}
                      alt={user.username}
                      className="rounded-circle me-2"
                      style={{ width: "32px", height: "32px", objectFit: "cover" }}
                    />
                  )}
                  {user.username}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setIsLoginMode(true);
                    setShowAuthModal(true);
                  }}
                >
                  Sign In
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsLoginMode(false);
                    setShowAuthModal(true);
                  }}
                >
                  Sign Up
                </button>
                <a
                  href="/api/auth/google"
                  className="btn btn-outline-danger"
                >
                  <i className="fab fa-google me-1"></i>
                  Google
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
};

window.Navigation = Navigation;