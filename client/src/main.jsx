// Import React and ReactDOM from CDN (already loaded in HTML)
const { StrictMode, useState, useEffect, createContext, useContext } = React;
const { createRoot } = ReactDOM;

// Simple auth context for inline React app
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const userData = await response.json();
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const newUser = await response.json();
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return React.createElement(AuthContext.Provider, {
    value: { user, login, register, logout, isLoading }
  }, children);
};

const useAuth = () => useContext(AuthContext);

// Auth Modal Component
const AuthModal = ({ show, onHide, isLogin, onToggleMode }) => {
  const [formData, setFormData] = useState({
    name: '', username: '', email: '', password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        setSuccess('Login successful!');
        setTimeout(() => {
          onHide();
          window.location.reload();
        }, 1000);
      } else {
        const result = await register(formData);
        setSuccess(result.message || 'Registration successful! Please wait for admin approval.');
        setFormData({ name: '', username: '', email: '', password: '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return React.createElement('div', {
    className: 'modal fade show',
    style: { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }
  },
    React.createElement('div', { className: 'modal-dialog' },
      React.createElement('div', { className: 'modal-content' },
        React.createElement('div', { className: 'modal-header' },
          React.createElement('h5', { className: 'modal-title' },
            isLogin ? 'Sign In' : 'Sign Up'
          ),
          React.createElement('button', {
            type: 'button',
            className: 'btn-close',
            onClick: onHide
          })
        ),
        React.createElement('div', { className: 'modal-body' },
          error && React.createElement('div', { className: 'alert alert-danger' }, error),
          success && React.createElement('div', { className: 'alert alert-success' }, success),
          React.createElement('form', { onSubmit: handleSubmit },
            !isLogin && React.createElement('div', { className: 'mb-3' },
              React.createElement('label', { className: 'form-label' }, 'Full Name'),
              React.createElement('input', {
                type: 'text',
                className: 'form-control',
                value: formData.name,
                onChange: (e) => setFormData({...formData, name: e.target.value}),
                required: true
              })
            ),
            !isLogin && React.createElement('div', { className: 'mb-3' },
              React.createElement('label', { className: 'form-label' }, 'Username'),
              React.createElement('input', {
                type: 'text',
                className: 'form-control',
                value: formData.username,
                onChange: (e) => setFormData({...formData, username: e.target.value}),
                required: true
              })
            ),
            React.createElement('div', { className: 'mb-3' },
              React.createElement('label', { className: 'form-label' }, 'Email'),
              React.createElement('input', {
                type: 'email',
                className: 'form-control',
                value: formData.email,
                onChange: (e) => setFormData({...formData, email: e.target.value}),
                required: true
              })
            ),
            React.createElement('div', { className: 'mb-3' },
              React.createElement('label', { className: 'form-label' }, 'Password'),
              React.createElement('input', {
                type: 'password',
                className: 'form-control',
                value: formData.password,
                onChange: (e) => setFormData({...formData, password: e.target.value}),
                required: true
              })
            ),
            React.createElement('button', {
              type: 'submit',
              className: 'btn btn-primary w-100',
              disabled: isSubmitting
            }, isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up'))
          ),
          React.createElement('hr'),
          React.createElement('p', { className: 'text-center mb-0' },
            isLogin ? "Don't have an account? " : "Already have an account? ",
            React.createElement('button', {
              type: 'button',
              className: 'btn btn-link p-0',
              onClick: onToggleMode
            }, isLogin ? 'Sign Up' : 'Sign In')
          )
        )
      )
    )
  );
};

// Simple Home Component
const SimpleHome = () => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load posts for everyone to see (but not access)
  useEffect(() => {
    // Always use the public endpoint to show post previews to everyone
    fetch('/api/posts/public', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Failed to fetch posts');
      })
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading posts:', err);
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const handleShowAuth = (isLogin) => {
    setIsLoginMode(isLogin);
    setShowAuthModal(true);
  };

  const handleToggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  const handlePostClick = (post) => {
    if (!user) {
      // Show login modal for unauthenticated users
      setIsLoginMode(true);
      setShowAuthModal(true);
    } else if (!user.approved) {
      // Show message for unapproved users
      alert('Your account is pending approval. Please wait for an administrator to approve your account before you can read blog posts.');
    } else {
      // Approved users can access posts (for now just show an alert, later we can implement full post view)
      alert(`You can now read: ${post.title}\n\n(Full post reading functionality will be implemented next)`);
    }
  };

  return React.createElement('div', { className: 'min-vh-100', style: { backgroundColor: '#f8f9fa' } },
    // Navigation
    React.createElement('nav', { className: 'navbar navbar-expand-lg navbar-dark bg-primary' },
      React.createElement('div', { className: 'container' },
        React.createElement('a', { className: 'navbar-brand fw-bold' }, 'BlogCraft'),
        React.createElement('div', { className: 'navbar-nav ms-auto' },
          user ? React.createElement('div', { className: 'd-flex align-items-center' },
            React.createElement('span', { className: 'text-light me-3' }, `Welcome, ${user.name}`),
            user.isAdmin && React.createElement('a', {
              href: '#',
              className: 'btn btn-outline-light btn-sm me-2',
              onClick: (e) => {
                e.preventDefault();
                window.location.href = '/admin';
              }
            }, 'Dashboard'),
            React.createElement('button', {
              className: 'btn btn-outline-light btn-sm',
              onClick: logout
            }, 'Logout')
          ) : React.createElement('div', null,
            React.createElement('button', {
              className: 'btn btn-outline-light btn-sm me-2',
              onClick: () => handleShowAuth(true)
            }, 'Sign In'),
            React.createElement('button', {
              className: 'btn btn-light btn-sm',
              onClick: () => handleShowAuth(false)
            }, 'Sign Up')
          )
        )
      )
    ),

    // Main Content
    React.createElement('div', { className: 'container mt-5' },
      React.createElement('div', { className: 'row justify-content-center' },
        React.createElement('div', { className: 'col-lg-8 text-center' },
          React.createElement('h1', { className: 'display-4 fw-bold mb-4' }, 'Welcome to BlogCraft'),
          
          React.createElement('div', null,
            React.createElement('p', { className: 'lead text-muted mb-4' },
              'Discover amazing stories, insights, and ideas from our community of writers.'
            ),
            
            // Status message based on user state
            !user ? React.createElement('div', {
              className: 'alert alert-info mx-auto mb-4',
              style: { maxWidth: '500px' }
            },
              React.createElement('h6', { className: 'alert-heading' }, 'Join Our Community'),
              React.createElement('p', { className: 'mb-0' }, 'Sign up to read full articles and join the discussion!')
            ) : !user.approved ? React.createElement('div', {
              className: 'alert alert-warning mx-auto mb-4',
              style: { maxWidth: '500px' }
            },
              React.createElement('h6', { className: 'alert-heading' }, 'Account Pending Approval'),
              React.createElement('p', { className: 'mb-0' }, 'Your account is being reviewed. You\'ll be able to read articles once approved!')
            ) : React.createElement('div', {
              className: 'alert alert-success mx-auto mb-4',
              style: { maxWidth: '500px' }
            },
              React.createElement('h6', { className: 'alert-heading' }, 'Welcome Back!'),
              React.createElement('p', { className: 'mb-0' }, 'You have full access to all our content.')
            )
          )
        )
      )
    ),

    // Blog Posts Section - Show to everyone
    React.createElement('div', { className: 'container mt-5' },
      React.createElement('div', { className: 'row' },
        React.createElement('div', { className: 'col-12' },
          React.createElement('h2', { className: 'text-center mb-4' }, 'Latest Articles'),
          
          loading ? React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'spinner-border text-primary' })
          ) : posts.length === 0 ? React.createElement('div', { className: 'text-center' },
            React.createElement('p', { className: 'text-muted' }, 'No articles available yet.')
          ) : React.createElement('div', { className: 'row' },
            posts.slice(0, 6).map(post => 
              React.createElement('div', { 
                key: post.id, 
                className: 'col-md-6 col-lg-4 mb-4' 
              },
                React.createElement('div', { 
                  className: 'card h-100 shadow-sm',
                  style: { cursor: 'pointer' },
                  onClick: () => handlePostClick(post)
                },
                  post.featuredImage && React.createElement('img', {
                    src: post.featuredImage,
                    className: 'card-img-top',
                    alt: post.title,
                    style: { 
                      height: '200px', 
                      objectFit: 'cover'
                    }
                  }),
                  React.createElement('div', { className: 'card-body d-flex flex-column' },
                    React.createElement('h5', { className: 'card-title' }, post.title),
                    React.createElement('p', { className: 'card-text flex-grow-1 text-muted' }, 
                      post.excerpt || (post.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...')
                    ),
                    React.createElement('div', { className: 'mt-auto' },
                      React.createElement('div', { className: 'd-flex justify-content-between align-items-center' },
                        React.createElement('small', { className: 'text-muted' }, 
                          `By ${post.authorName}`
                        ),
                        React.createElement('small', { className: 'text-muted' }, 
                          new Date(post.publishedAt).toLocaleDateString()
                        )
                      ),
                      post.categoryName && React.createElement('div', { className: 'mt-2' },
                        React.createElement('span', { className: 'badge bg-secondary' }, post.categoryName)
                      ),
                      React.createElement('div', { className: 'mt-2' },
                        React.createElement('span', { 
                          className: `badge ${!user ? 'bg-primary' : !user.approved ? 'bg-warning' : 'bg-success'}`
                        }, !user ? 'Sign in to read' : !user.approved ? 'Approval needed' : 'Read now')
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),

    React.createElement(AuthModal, {
      show: showAuthModal,
      onHide: () => setShowAuthModal(false),
      isLogin: isLoginMode,
      onToggleMode: handleToggleAuthMode
    })
  );
};

// Main App
const App = () => {
  return React.createElement(AuthProvider, null,
    React.createElement(SimpleHome)
  );
};

// Mount the app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(StrictMode, null,
  React.createElement(App)
));