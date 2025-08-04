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

  const handleShowAuth = (isLogin) => {
    setIsLoginMode(isLogin);
    setShowAuthModal(true);
  };

  const handleToggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
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
              href: '/admin',
              className: 'btn btn-outline-light btn-sm me-2'
            }, 'Admin'),
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
          
          !user ? React.createElement('div', null,
            React.createElement('p', { className: 'lead text-muted mb-4' },
              'Join our community of writers and readers. Sign up to access exclusive blog content.'
            ),
            React.createElement('div', {
              className: 'alert alert-info mx-auto',
              style: { maxWidth: '500px' }
            },
              React.createElement('h5', { className: 'alert-heading' }, 'Authentication Required'),
              React.createElement('p', { className: 'mb-0' }, 'Please sign in or create an account to view blog posts.')
            )
          ) : !user.approved ? React.createElement('div', null,
            React.createElement('p', { className: 'lead text-muted mb-4' },
              'Your account is being reviewed by our administrators.'
            ),
            React.createElement('div', {
              className: 'alert alert-warning mx-auto',
              style: { maxWidth: '500px' }
            },
              React.createElement('h5', { className: 'alert-heading' }, 'Account Pending Approval'),
              React.createElement('p', { className: 'mb-0' }, 'Your account has been created successfully! Please wait for an administrator to approve your account before you can access blog posts.')
            )
          ) : React.createElement('div', null,
            React.createElement('p', { className: 'lead text-muted mb-4' },
              'Welcome back! You now have full access to our blog content.'
            ),
            React.createElement('div', {
              className: 'alert alert-success mx-auto',
              style: { maxWidth: '500px' }
            },
              React.createElement('h5', { className: 'alert-heading' }, 'Access Granted'),
              React.createElement('p', { className: 'mb-0' }, 'Your account has been approved. You can now view all blog posts and interact with the community.')
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