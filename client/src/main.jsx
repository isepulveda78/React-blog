// Import React and ReactDOM from CDN (already loaded in HTML)
const { StrictMode } = React;
const { createRoot } = ReactDOM;

// HomePage component
const HomePage = () => {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading posts:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' })
    );
  }

  return React.createElement('div', null,
    React.createElement('h1', { className: 'text-center mb-4' }, 'BlogCraft - Modern Blog Platform'),
    React.createElement('div', { className: 'text-center mb-4' },
      React.createElement('p', { className: 'lead' }, 'Welcome to our modern blog platform built with JavaScript and Bootstrap!'),
      React.createElement('p', null, 'MongoDB integration is working perfectly. All data is now persistent!')
    ),
    React.createElement('div', { className: 'row' },
      posts.map(post => 
        React.createElement('div', { key: post.id, className: 'col-md-6 col-lg-4 mb-4' },
          React.createElement('div', { className: 'card h-100' },
            React.createElement('div', { className: 'card-body' },
              React.createElement('h5', { className: 'card-title' }, post.title),
              React.createElement('p', { className: 'card-text' }, post.excerpt),
              React.createElement('small', { className: 'text-muted' }, 
                `By ${post.authorName} • ${new Date(post.publishedAt).toLocaleDateString()}`
              )
            )
          )
        )
      )
    )
  );
};

// AdminDashboard component
const AdminDashboard = ({ user }) => {
  const [stats, setStats] = React.useState({ posts: 0, categories: 0, comments: 0 });

  React.useEffect(() => {
    Promise.all([
      fetch('/api/posts').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/comments').then(r => r.json())
    ]).then(([posts, categories, comments]) => {
      setStats({
        posts: posts.length,
        categories: categories.length,
        comments: comments.length
      });
    }).catch(console.error);
  }, []);

  return React.createElement('div', null,
    React.createElement('h1', { className: 'mb-4' }, 'Admin Dashboard'),
    React.createElement('p', { className: 'lead' }, `Welcome back, ${user.name || user.username}!`),
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-md-4' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, 'Posts'),
            React.createElement('p', { className: 'card-text display-4' }, stats.posts)
          )
        )
      ),
      React.createElement('div', { className: 'col-md-4' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, 'Categories'),
            React.createElement('p', { className: 'card-text display-4' }, stats.categories)
          )
        )
      ),
      React.createElement('div', { className: 'col-md-4' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, 'Comments'),
            React.createElement('p', { className: 'card-text display-4' }, stats.comments)
          )
        )
      )
    )
  );
};

// App component with authentication and routing
const App = () => {
    const [user, setUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showLogin, setShowLogin] = React.useState(false);
    const [showRegister, setShowRegister] = React.useState(false);

    React.useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    }, []);

    const login = async (credentials) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }

        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setShowLogin(false);
        return userData;
      } catch (error) {
        throw error;
      }
    };

    const logout = () => {
      setUser(null);
      localStorage.removeItem('user');
    };

    // Login Modal
    const LoginModal = () => {
      const [email, setEmail] = React.useState('');
      const [password, setPassword] = React.useState('');
      const [error, setError] = React.useState('');
      const [loading, setLoading] = React.useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
          await login({ email, password });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      return React.createElement('div', { 
        className: `modal fade ${showLogin ? 'show' : ''}`, 
        style: { display: showLogin ? 'block' : 'none' }
      },
        React.createElement('div', { className: 'modal-dialog' },
          React.createElement('div', { className: 'modal-content' },
            React.createElement('div', { className: 'modal-header' },
              React.createElement('h5', { className: 'modal-title' }, 'Login'),
              React.createElement('button', { 
                type: 'button', 
                className: 'btn-close', 
                onClick: () => setShowLogin(false) 
              })
            ),
            React.createElement('div', { className: 'modal-body' },
              React.createElement('form', { onSubmit: handleSubmit },
                error && React.createElement('div', { className: 'alert alert-danger' }, error),
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Email'),
                  React.createElement('input', {
                    type: 'email',
                    className: 'form-control',
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    required: true
                  })
                ),
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Password'),
                  React.createElement('input', {
                    type: 'password',
                    className: 'form-control',
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    required: true
                  })
                ),
                React.createElement('button', {
                  type: 'submit',
                  className: 'btn btn-primary',
                  disabled: loading
                }, loading ? 'Logging in...' : 'Login')
              )
            )
          )
        )
      );
    };

    if (isLoading) {
      return React.createElement('div', { className: 'container-fluid d-flex justify-content-center align-items-center', style: { height: '100vh' } },
        React.createElement('div', { className: 'spinner-border' })
      );
    }

    return React.createElement('div', { className: 'container-fluid' },
      // Navigation
      React.createElement('nav', { className: 'navbar navbar-expand-lg navbar-dark bg-primary' },
        React.createElement('div', { className: 'container' },
          React.createElement('a', { 
            className: 'navbar-brand', 
            href: '#/', 
            onClick: (e) => { 
              e.preventDefault(); 
              window.location.hash = '#/';
              window.location.reload();
            }
          }, 'BlogCraft'),
          React.createElement('div', { className: 'navbar-nav ms-auto' },
            user && React.createElement('a', { 
              key: 'home',
              className: 'nav-link me-3', 
              href: '#/',
              onClick: (e) => { 
                e.preventDefault(); 
                window.location.hash = '#/';
                window.location.reload();
              }
            }, 'Home'),
            user ? [
              React.createElement('span', { key: 'welcome', className: 'navbar-text me-3' }, `Welcome, ${user.name || user.username}!`),
              user.isAdmin && React.createElement('a', { 
                key: 'admin', 
                className: 'nav-link', 
                href: '#/admin',
                onClick: (e) => { 
                  e.preventDefault(); 
                  window.location.hash = '#/admin';
                  window.location.reload(); // Force reload to update view
                }
              }, 'Admin Dashboard'),
              React.createElement('button', { 
                key: 'logout',
                className: 'btn btn-outline-light btn-sm', 
                onClick: logout 
              }, 'Logout')
            ] : [
              React.createElement('button', { 
                key: 'login',
                className: 'btn btn-outline-light btn-sm me-2', 
                onClick: () => setShowLogin(true) 
              }, 'Login')
            ]
          )
        )
      ),
      
      // Main content
      React.createElement('main', { className: 'container my-4' },
        React.createElement('div', null,
          // Show admin info for debugging
          user && React.createElement('div', { className: 'alert alert-info mb-3' },
            `Logged in as: ${user.name || user.username} | Admin: ${user.isAdmin ? 'Yes' : 'No'} | Hash: ${window.location.hash}`
          ),
          
          // Main content based on current view
          user?.isAdmin && window.location.hash === '#/admin' ? 
            React.createElement(AdminDashboard, { user }) :
            React.createElement(HomePage)
        )
      ),
      
      // Login Modal
      React.createElement(LoginModal)
    );
  };

createRoot(document.getElementById('root')).render(
  React.createElement(StrictMode, null,
    React.createElement(App)
  )
);