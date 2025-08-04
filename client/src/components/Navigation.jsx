const { React, useState, useEffect } = window;

const Navigation = ({ user, onLogout }) => {
  console.log('Navigation component - current user:', user);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

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

  return (
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
                      onClick={onLogout}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-warning"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          email: 'admin@example.com',
                          password: 'password'
                        })
                      });
                      
                      if (response.ok) {
                        const userData = await response.json();
                        console.log('Admin login successful:', userData);
                        window.location.reload();
                      } else {
                        alert('Login failed');
                      }
                    } catch (error) {
                      alert('Login error: ' + error.message);
                    }
                  }}
                >
                  Admin Login
                </button>
                <a
                  href="/api/auth/google"
                  className="btn btn-outline-primary"
                >
                  Google Sign In
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

window.Navigation = Navigation;