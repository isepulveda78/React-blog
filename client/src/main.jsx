// Import React and ReactDOM from CDN (already loaded in HTML)
const { StrictMode, useState, useEffect, createContext, useContext, useRef } = React;
const { createRoot } = ReactDOM;

// Simple auth context for inline React app
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated with backend session
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then(userData => {
        console.log('User authenticated:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsLoading(false);
      })
      .catch(() => {
        // Not authenticated, check localStorage as fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem('user');
          }
        }
        setIsLoading(false);
      });
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
    console.log('Login successful:', userData);
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

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = '/';
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
          React.createElement('div', { className: 'text-center my-3' },
            React.createElement('span', { className: 'text-muted' }, '── OR ──')
          ),
          React.createElement('a', {
            href: '/api/auth/google',
            className: 'btn btn-outline-danger w-100 mb-3 d-flex align-items-center justify-content-center',
            style: { textDecoration: 'none' }
          },
            React.createElement('svg', {
              className: 'me-2',
              width: '20',
              height: '20',
              viewBox: '0 0 24 24',
              fill: 'currentColor'
            },
              React.createElement('path', {
                d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z',
                fill: '#4285F4'
              }),
              React.createElement('path', {
                d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z',
                fill: '#34A853'
              }),
              React.createElement('path', {
                d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z',
                fill: '#FBBC05'
              }),
              React.createElement('path', {
                d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z',
                fill: '#EA4335'
              })
            ),
            isLogin ? 'Sign In with Google' : 'Sign Up with Google'
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

// Simple router for handling different pages
const Router = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  useEffect(() => {
    const handlePopState = () => {
      console.log('Route changed to:', window.location.pathname);
      setCurrentPath(window.location.pathname);  
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  console.log('Current path:', currentPath);

  if (currentPath === '/admin') {
    return React.createElement(AdminDashboard);
  } else if (currentPath === '/admin/posts') {
    return React.createElement(AdminPosts);
  } else if (currentPath.startsWith('/admin/posts/edit/')) {
    const postId = currentPath.split('/').pop();
    return React.createElement(PostEditor, { postId });
  } else if (currentPath === '/admin/posts/new') {
    return React.createElement(PostEditor, { postId: null });
  } else if (currentPath === '/admin/users') {
    return React.createElement(AdminUsers);
  } else if (currentPath === '/admin/comments') {
    return React.createElement(AdminComments);
  } else if (currentPath.startsWith('/posts/')) {
    return React.createElement(BlogPostReader);
  }
  
  return React.createElement(SimpleHome);
};

// Post Editor Component
const PostEditor = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'draft',
    featuredImage: ''
  });

  // Initialize Quill editor after component mounts
  const [quillEditor, setQuillEditor] = useState(null);
  const quillRef = useRef(null);

  // Load post data if editing
  useEffect(() => {
    if (postId) {
      fetch(`/api/posts/${postId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          setPost(data);
          setFormData({
            title: data.title || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            categoryId: data.categoryId || '',
            status: data.status || 'draft',
            featuredImage: data.featuredImage || ''
          });
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to load post: ' + err.message);
          setLoading(false);
        });
    }
  }, [postId]);

  // Load categories
  useEffect(() => {
    fetch('/api/categories', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      })
      .catch(console.error);
  }, []);

  // Initialize Quill editor
  useEffect(() => {
    if (quillRef.current && !quillEditor) {
      console.log('Initializing Quill editor...');
      
      // Load Quill from CDN if not already loaded
      if (!window.Quill) {
        console.log('Loading Quill from CDN...');
        
        const link = document.createElement('link');
        link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
        script.onload = () => {
          console.log('Quill loaded, initializing...');
          setTimeout(initializeQuill, 100); // Small delay to ensure DOM is ready
        };
        script.onerror = () => {
          console.error('Failed to load Quill');
          setError('Failed to load rich text editor');
        };
        document.head.appendChild(script);
      } else {
        console.log('Quill already loaded, initializing...');
        setTimeout(initializeQuill, 100);
      }
    }
  }, [quillRef.current, quillEditor]);

  const initializeQuill = () => {
    if (quillRef.current && window.Quill && !quillEditor) {
      console.log('Creating Quill instance...');
      
      try {
        const quill = new window.Quill(quillRef.current, {
          theme: 'snow',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              ['clean']
            ]
          }
        });

        console.log('Quill instance created successfully');

        // Set initial content if editing
        if (formData.content) {
          console.log('Setting initial content...');
          quill.root.innerHTML = formData.content;
        }

        // Listen for content changes
        quill.on('text-change', () => {
          const content = quill.root.innerHTML;
          setFormData(prev => ({ ...prev, content }));
        });

        setQuillEditor(quill);
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error('Failed to initialize Quill:', err);
        setError('Failed to initialize rich text editor: ' + err.message);
      }
    } else {
      console.log('Quill initialization skipped:', {
        hasRef: !!quillRef.current,
        hasQuill: !!window.Quill,
        hasEditor: !!quillEditor
      });
    }
  };

  // Update Quill content when formData.content changes (for loading existing posts)
  useEffect(() => {
    if (quillEditor && formData.content !== quillEditor.root.innerHTML) {
      quillEditor.root.innerHTML = formData.content;
    }
  }, [formData.content, quillEditor]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.imageUrl;
    } catch (err) {
      setError('Image upload failed: ' + err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = postId ? `/api/posts/${postId}` : '/api/posts';
      const method = postId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          authorId: post?.authorId || 'current-user', // You might want to get this from auth context
          authorName: post?.authorName || 'Admin User'
        })
      });

      if (response.ok) {
        // Navigate back to posts list
        window.history.pushState({}, '', '/admin/posts');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to save post');
      }
    } catch (err) {
      setError('Error saving post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'container mt-5' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'spinner-border' },
          React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
        )
      )
    );
  }

  return React.createElement('div', { className: 'container mt-4' },
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-12' },
        React.createElement('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
          React.createElement('h2', null, postId ? 'Edit Post' : 'Create New Post'),
          React.createElement('div', null,
            React.createElement('button', {
              className: 'btn btn-secondary me-2',
              onClick: () => {
                window.history.pushState({}, '', '/admin/posts');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }, 'Back to Posts'),
            React.createElement('button', {
              className: 'btn btn-primary',
              onClick: handleSave,
              disabled: saving
            }, saving ? 'Saving...' : 'Save Post')
          )
        ),

        error && React.createElement('div', { className: 'alert alert-danger' }, error),

        React.createElement('div', { className: 'card' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('div', { className: 'row' },
              React.createElement('div', { className: 'col-md-8' },
                // Title
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Title'),
                  React.createElement('input', {
                    type: 'text',
                    className: 'form-control',
                    value: formData.title,
                    onChange: (e) => handleInputChange('title', e.target.value),
                    placeholder: 'Enter post title...'
                  })
                ),

                // Content - Rich Text Editor
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Content'),
                  React.createElement('div', {
                    ref: quillRef,
                    style: { minHeight: '300px', marginBottom: '42px' },
                    className: 'border rounded'
                  }),
                  !quillEditor && React.createElement('div', { className: 'text-muted small' },
                    'Loading rich text editor...'
                  )
                ),

                // Excerpt
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Excerpt'),
                  React.createElement('textarea', {
                    className: 'form-control',
                    rows: 3,
                    value: formData.excerpt,
                    onChange: (e) => handleInputChange('excerpt', e.target.value),
                    placeholder: 'Brief description or excerpt...'
                  })
                )
              ),

              React.createElement('div', { className: 'col-md-4' },
                // Status
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Status'),
                  React.createElement('select', {
                    className: 'form-select',
                    value: formData.status,
                    onChange: (e) => handleInputChange('status', e.target.value)
                  },
                    React.createElement('option', { value: 'draft' }, 'Draft'),
                    React.createElement('option', { value: 'published' }, 'Published')
                  )
                ),

                // Category
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Category'),
                  React.createElement('select', {
                    className: 'form-select',
                    value: formData.categoryId,
                    onChange: (e) => handleInputChange('categoryId', e.target.value)
                  },
                    React.createElement('option', { value: '' }, 'Select category...'),
                    categories.map(cat =>
                      React.createElement('option', { key: cat.id, value: cat.id }, cat.name)
                    )
                  )
                ),

                // Featured Image Upload
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 'Featured Image'),
                  React.createElement('input', {
                    type: 'file',
                    className: 'form-control mb-2',
                    accept: 'image/*',
                    onChange: async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const imageUrl = await handleImageUpload(file);
                          handleInputChange('featuredImage', imageUrl);
                        } catch (err) {
                          console.error('Upload failed:', err);
                        }
                      }
                    },
                    disabled: uploading
                  }),
                  React.createElement('small', { className: 'text-muted' }, 
                    'Upload an image or paste URL below'
                  )
                ),

                // Featured Image URL (alternative)
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('input', {
                    type: 'url',
                    className: 'form-control',
                    value: formData.featuredImage,
                    onChange: (e) => handleInputChange('featuredImage', e.target.value),
                    placeholder: 'Or paste image URL here...'
                  })
                ),

                uploading && React.createElement('div', { className: 'mb-3' },
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'spinner-border spinner-border-sm me-2' }),
                    React.createElement('span', null, 'Uploading image...')
                  )
                ),

                formData.featuredImage && React.createElement('div', { className: 'mb-3' },
                  React.createElement('img', {
                    src: formData.featuredImage,
                    alt: 'Featured image preview',
                    className: 'img-fluid rounded',
                    style: { maxHeight: '200px' }
                  })
                )
              )
            )
          )
        )
      )
    )
  );
};

// Admin Posts Management Component
const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/posts', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Posts API response:', data);
        // Ensure data is an array
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error('Expected array, got:', typeof data, data);
          setPosts([]);
          setError('Invalid posts data format');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Posts loading error:', err);
        setError('Failed to load posts: ' + err.message);
        setLoading(false);
        setPosts([]);
      });
  }, []);

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      alert('Error deleting post');
    }
  };

  const toggleStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setPosts(posts.map(p => p.id === postId ? {...p, status: newStatus} : p));
      }
    } catch (err) {
      alert('Error updating post status');
    }
  };

  if (loading) return React.createElement('div', { className: 'container mt-5' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' }, 
        React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
      )
    )
  );

  return React.createElement('div', { className: 'container mt-4' },
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-12' },
        React.createElement('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
          React.createElement('h2', null, 'Manage Posts'),
          React.createElement('div', null,
            React.createElement('button', {
              className: 'btn btn-secondary me-2',
              onClick: () => {
                window.history.pushState({}, '', '/admin');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }, 'Back to Dashboard'),
            React.createElement('button', {
              className: 'btn btn-primary',
              onClick: () => {
                window.history.pushState({}, '', '/admin/posts/new');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }, 'New Post')
          )
        ),
        
        error && React.createElement('div', { className: 'alert alert-danger' }, error),
        
        posts.length === 0 ? 
          React.createElement('div', { className: 'text-center py-5' },
            React.createElement('p', { className: 'text-muted' }, 'No posts found')
          ) :
          React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-body p-0' },
              React.createElement('div', { className: 'table-responsive' },
                React.createElement('table', { className: 'table table-hover mb-0' },
                  React.createElement('thead', { className: 'table-light' },
                    React.createElement('tr', null,
                      React.createElement('th', null, 'Title'),
                      React.createElement('th', null, 'Author'),
                      React.createElement('th', null, 'Status'),
                      React.createElement('th', null, 'Created'),
                      React.createElement('th', null, 'Actions')
                    )
                  ),
                  React.createElement('tbody', null,
                    posts.map(post => 
                      React.createElement('tr', { key: post.id },
                        React.createElement('td', null,
                          React.createElement('div', null,
                            React.createElement('h6', { className: 'mb-1' }, post.title),
                            React.createElement('small', { className: 'text-muted' }, 
                              post.excerpt ? post.excerpt.substring(0, 80) + '...' : ''
                            )
                          )
                        ),
                        React.createElement('td', null, post.authorName || 'Unknown'),
                        React.createElement('td', null,
                          React.createElement('span', {
                            className: `badge ${post.status === 'published' ? 'bg-success' : 'bg-warning'}`
                          }, post.status || 'draft')
                        ),
                        React.createElement('td', null, 
                          new Date(post.createdAt).toLocaleDateString()
                        ),
                        React.createElement('td', null,
                          React.createElement('div', { className: 'btn-group btn-group-sm' },
                            React.createElement('button', {
                              className: 'btn btn-outline-primary',
                              onClick: () => {
                                window.history.pushState({}, '', `/admin/posts/edit/${post.id}`);
                                window.dispatchEvent(new PopStateEvent('popstate'));
                              }
                            }, 'Edit'),
                            React.createElement('button', {
                              className: `btn btn-outline-${post.status === 'published' ? 'warning' : 'success'}`,
                              onClick: () => toggleStatus(post.id, post.status)
                            }, post.status === 'published' ? 'Unpublish' : 'Publish'),
                            React.createElement('button', {
                              className: 'btn btn-outline-danger',
                              onClick: () => deletePost(post.id)
                            }, 'Delete')
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
      )
    )
  );
};

// Admin Users Management Component  
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Users API response:', data);
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('Expected array, got:', typeof data, data);
          setUsers([]);
          setError('Invalid users data format');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Users loading error:', err);
        setError('Failed to load users: ' + err.message);
        setLoading(false);
        setUsers([]);
      });
  }, []);

  const toggleUserApproval = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    console.log(`Toggling approval for user ${userId}: ${currentStatus} -> ${newStatus}`);
    
    try {
      const response = await fetch(`/api/users/${userId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved: newStatus })
      });
      
      console.log('Approval response status:', response.status);
      
      if (response.ok) {
        const updatedUser = await response.json();
        console.log('User approval updated:', updatedUser);
        setUsers(users.map(u => u.id === userId ? {...u, approved: newStatus} : u));
      } else {
        const errorData = await response.text();
        console.error('Approval failed:', response.status, errorData);
        alert(`Error updating user approval: ${response.status} ${errorData}`);
      }
    } catch (err) {
      console.error('Approval error:', err);
      alert('Error updating user approval: ' + err.message);
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = !currentRole;
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isAdmin: newRole })
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? {...u, isAdmin: newRole} : u));
      }
    } catch (err) {
      alert('Error updating user role');
    }
  };

  if (loading) return React.createElement('div', { className: 'container mt-5' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' }, 
        React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
      )
    )
  );

  return React.createElement('div', { className: 'container mt-4' },
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-12' },
        React.createElement('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
          React.createElement('h2', null, 'Manage Users'),
          React.createElement('button', {
            className: 'btn btn-secondary',
            onClick: () => {
              window.history.pushState({}, '', '/admin');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }, 'Back to Dashboard')
        ),

        error && React.createElement('div', { className: 'alert alert-danger' }, error),

        users.length === 0 ? 
          React.createElement('div', { className: 'text-center py-5' },
            React.createElement('p', { className: 'text-muted' }, 'No users found')
          ) :
          React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-body p-0' },
              React.createElement('div', { className: 'table-responsive' },
                React.createElement('table', { className: 'table table-hover mb-0' },
                  React.createElement('thead', { className: 'table-light' },
                    React.createElement('tr', null,
                      React.createElement('th', null, 'User'),
                      React.createElement('th', null, 'Email'),
                      React.createElement('th', null, 'Role'),
                      React.createElement('th', null, 'Status'),
                      React.createElement('th', null, 'Joined'),
                      React.createElement('th', null, 'Actions')
                    )
                  ),
                  React.createElement('tbody', null,
                    users.map(user => 
                      React.createElement('tr', { key: user.id },
                        React.createElement('td', null,
                          React.createElement('div', null,
                            React.createElement('h6', { className: 'mb-1' }, user.name || 'Unknown'),
                            React.createElement('small', { className: 'text-muted' }, `@${user.username}`)
                          )
                        ),
                        React.createElement('td', null, user.email),
                        React.createElement('td', null,
                          React.createElement('span', {
                            className: `badge ${user.isAdmin ? 'bg-danger' : 'bg-secondary'}`
                          }, user.isAdmin ? 'Admin' : 'User')
                        ),
                        React.createElement('td', null,
                          React.createElement('span', {
                            className: `badge ${user.approved ? 'bg-success' : 'bg-warning'}`
                          }, user.approved ? 'Approved' : 'Pending')
                        ),
                        React.createElement('td', null, 
                          new Date(user.createdAt).toLocaleDateString()
                        ),
                        React.createElement('td', null,
                          React.createElement('div', { className: 'btn-group btn-group-sm' },
                            React.createElement('button', {
                              className: `btn btn-outline-${user.approved ? 'warning' : 'success'}`,
                              onClick: () => toggleUserApproval(user.id, user.approved)
                            }, user.approved ? 'Unapprove' : 'Approve'),
                            React.createElement('button', {
                              className: `btn btn-outline-${user.isAdmin ? 'secondary' : 'danger'}`,
                              onClick: () => toggleUserRole(user.id, user.isAdmin),
                              disabled: user.id === 'current-admin' // Prevent admin from removing their own admin status
                            }, user.isAdmin ? 'Remove Admin' : 'Make Admin')
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
      )
    )
  );
};

// Blog Post Reading Component
const BlogPostReader = () => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const { user, logout } = useAuth();

  // Get slug from URL
  const slug = window.location.pathname.split('/posts/')[1];

  useEffect(() => {
    if (!slug) return;

    // Load post content (authenticated endpoint)
    fetch(`/api/posts/${slug}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setPost(data);
        return fetch(`/api/posts/${data.id}/comments`, { credentials: 'include' });
      })
      .then(res => res.ok ? res.json() : [])
      .then(commentsData => {
        setComments(Array.isArray(commentsData) ? commentsData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading post:', err);
        setError('Failed to load post: ' + err.message);
        setLoading(false);
      });
  }, [slug]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId: post.id,
          content: newComment.trim(),
          parentId: replyingTo
        })
      });

      if (response.ok) {
        setNewComment('');
        setReplyingTo(null);
        // Refresh comments
        const commentsRes = await fetch(`/api/posts/${post.id}/comments`, { credentials: 'include' });
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(Array.isArray(commentsData) ? commentsData : []);
        }
      } else {
        alert('Failed to post comment');
      }
    } catch (err) {
      alert('Error posting comment');
    }
  };

  if (loading) return React.createElement('div', { className: 'container mt-5' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' }, 
        React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
      )
    )
  );

  if (error) return React.createElement('div', { className: 'container mt-5' },
    React.createElement('div', { className: 'alert alert-danger' }, error),
    React.createElement('button', {
      className: 'btn btn-primary',
      onClick: () => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 'Back to Home')
  );

  if (!post) return React.createElement('div', { className: 'container mt-5' },
    React.createElement('div', { className: 'alert alert-warning' }, 'Post not found'),
    React.createElement('button', {
      className: 'btn btn-primary',
      onClick: () => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 'Back to Home')
  );

  return React.createElement('div', { className: 'min-vh-100', style: { backgroundColor: '#f8f9fa' } },
    // Navigation
    React.createElement('nav', { className: 'navbar navbar-expand-lg navbar-dark bg-primary' },
      React.createElement('div', { className: 'container' },
        React.createElement('a', { 
          className: 'navbar-brand fw-bold',
          href: '/',
          onClick: (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, 'BlogCraft'),
        React.createElement('div', { className: 'navbar-nav ms-auto' },
          React.createElement('div', { className: 'd-flex align-items-center' },
            React.createElement('span', { className: 'text-light me-3' }, `Welcome, ${user.name}`),
            user.isAdmin && React.createElement('button', {
              className: 'btn btn-outline-light btn-sm me-2',
              onClick: () => {
                window.history.pushState({}, '', '/admin');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }, 'Dashboard'),
            React.createElement('button', {
              className: 'btn btn-outline-light btn-sm',
              onClick: logout
            }, 'Logout')
          )
        )
      )
    ),

    // Post Content
    React.createElement('div', { className: 'container mt-4' },
      React.createElement('div', { className: 'row justify-content-center' },
        React.createElement('div', { className: 'col-lg-8' },
          
          // Back button
          React.createElement('div', { className: 'mb-3' },
            React.createElement('button', {
              className: 'btn btn-outline-secondary',
              onClick: () => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }, '← Back to Home')
          ),

          // Post header
          React.createElement('div', { className: 'card mb-4' },
            post.featuredImage && React.createElement('img', {
              src: post.featuredImage,
              className: 'card-img-top',
              alt: post.title,
              style: { height: '300px', objectFit: 'cover' }
            }),
            React.createElement('div', { className: 'card-body' },
              React.createElement('div', { className: 'mb-3' },
                post.categoryName && React.createElement('span', { className: 'badge bg-primary me-2' }, post.categoryName),
                post.featured && React.createElement('span', { className: 'badge bg-warning' }, 'Featured')
              ),
              React.createElement('h1', { className: 'card-title mb-3' }, post.title),
              React.createElement('div', { className: 'text-muted mb-3' },
                React.createElement('small', null, 
                  `By ${post.authorName} • ${new Date(post.publishedAt).toLocaleDateString()}`
                )
              ),
              post.excerpt && React.createElement('p', { className: 'lead text-muted' }, post.excerpt)
            )
          ),

          // Post content
          React.createElement('div', { className: 'card mb-4' },
            React.createElement('div', { 
              className: 'card-body',
              dangerouslySetInnerHTML: { __html: post.content }
            })
          ),

          // Comments section
          React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-header' },
              React.createElement('h5', { className: 'mb-0' }, `Comments (${comments.length})`)
            ),
            React.createElement('div', { className: 'card-body' },
              
              // Comment form
              React.createElement('form', { onSubmit: handleCommentSubmit, className: 'mb-4' },
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('label', { className: 'form-label' }, 
                    replyingTo ? 'Reply to comment' : 'Leave a comment'
                  ),
                  React.createElement('textarea', {
                    className: 'form-control',
                    rows: 3,
                    value: newComment,
                    onChange: (e) => setNewComment(e.target.value),
                    placeholder: 'Share your thoughts...'
                  })
                ),
                React.createElement('div', { className: 'd-flex gap-2' },
                  React.createElement('button', {
                    type: 'submit',
                    className: 'btn btn-primary'
                  }, replyingTo ? 'Post Reply' : 'Post Comment'),
                  replyingTo && React.createElement('button', {
                    type: 'button',
                    className: 'btn btn-secondary',
                    onClick: () => setReplyingTo(null)
                  }, 'Cancel Reply')
                )
              ),

              // Comments list
              comments.length === 0 ? React.createElement('p', { className: 'text-muted' }, 
                'No comments yet. Be the first to share your thoughts!'
              ) : React.createElement('div', null,
                comments.map(comment => 
                  React.createElement('div', { 
                    key: comment.id,
                    className: 'border-bottom pb-3 mb-3'
                  },
                    React.createElement('div', { className: 'mb-2' },
                      React.createElement('strong', null, comment.authorName || 'Anonymous'),
                      React.createElement('small', { className: 'text-muted ms-2' }, 
                        new Date(comment.createdAt).toLocaleDateString()
                      )
                    ),
                    React.createElement('p', { className: 'mb-2' }, comment.content),
                    React.createElement('button', {
                      className: 'btn btn-sm btn-outline-primary',
                      onClick: () => {
                        setReplyingTo(comment.id);
                        document.querySelector('textarea').focus();
                      }
                    }, 'Reply'),
                    
                    // Show replies
                    comment.replies && comment.replies.length > 0 && React.createElement('div', { 
                      className: 'ms-4 mt-3' 
                    },
                      comment.replies.map(reply =>
                        React.createElement('div', {
                          key: reply.id,
                          className: 'border-start border-3 border-light ps-3 mb-3'
                        },
                          React.createElement('div', { className: 'mb-1' },
                            React.createElement('strong', null, reply.authorName || 'Anonymous'),
                            React.createElement('small', { className: 'text-muted ms-2' }, 
                              new Date(reply.createdAt).toLocaleDateString()
                            )
                          ),
                          React.createElement('p', { className: 'mb-0' }, reply.content)
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};

// Admin Comments Management Component
const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/comments', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Comments API response:', data);
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          console.error('Expected array, got:', typeof data, data);
          setComments([]);
          setError('Invalid comments data format');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Comments loading error:', err);
        setError('Failed to load comments: ' + err.message);
        setLoading(false);
        setComments([]);
      });
  }, []);

  const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        alert('Failed to delete comment');
      }
    } catch (err) {
      alert('Error deleting comment');
    }
  };

  const toggleCommentApproval = async (commentId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setComments(comments.map(c => c.id === commentId ? {...c, status: newStatus} : c));
      } else {
        const errorData = await response.json();
        alert(`Failed to ${newStatus} comment: ${errorData.message}`);
      }
    } catch (err) {
      alert('Error updating comment status: ' + err.message);
    }
  };

  if (loading) return React.createElement('div', { className: 'container mt-5' },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' }, 
        React.createElement('span', { className: 'visually-hidden' }, 'Loading...')
      )
    )
  );

  return React.createElement('div', { className: 'container mt-4' },
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-12' },
        React.createElement('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
          React.createElement('h2', null, 'Manage Comments'),
          React.createElement('button', {
            className: 'btn btn-secondary',
            onClick: () => {
              window.history.pushState({}, '', '/admin');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }, 'Back to Dashboard')
        ),

        error && React.createElement('div', { className: 'alert alert-danger' }, error),

        comments.length === 0 ? 
          React.createElement('div', { className: 'text-center py-5' },
            React.createElement('p', { className: 'text-muted' }, 'No comments found')
          ) :
          React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-body p-0' },
              React.createElement('div', { className: 'table-responsive' },
                React.createElement('table', { className: 'table table-hover mb-0' },
                  React.createElement('thead', { className: 'table-light' },
                    React.createElement('tr', null,
                      React.createElement('th', null, 'Comment'),
                      React.createElement('th', null, 'Author'),
                      React.createElement('th', null, 'Post'),
                      React.createElement('th', null, 'Status'),
                      React.createElement('th', null, 'Date'),
                      React.createElement('th', null, 'Actions')
                    )
                  ),
                  React.createElement('tbody', null,
                    comments.map(comment => 
                      React.createElement('tr', { key: comment.id },
                        React.createElement('td', null,
                          React.createElement('div', { style: { maxWidth: '300px' } },
                            React.createElement('p', { className: 'mb-1' }, 
                              comment.content.length > 100 
                                ? comment.content.substring(0, 100) + '...' 
                                : comment.content
                            ),
                            comment.parentId && React.createElement('small', { className: 'text-muted' }, 
                              '↳ Reply to another comment'
                            )
                          )
                        ),
                        React.createElement('td', null,
                          React.createElement('div', null,
                            React.createElement('strong', null, comment.authorName || 'Anonymous'),
                            comment.authorEmail && React.createElement('br'),
                            comment.authorEmail && React.createElement('small', { className: 'text-muted' }, comment.authorEmail)
                          )
                        ),
                        React.createElement('td', null,
                          React.createElement('div', null,
                            React.createElement('strong', null, comment.postTitle || 'Unknown Post'),
                            React.createElement('br'),
                            React.createElement('small', { className: 'text-muted' }, `Post ID: ${comment.postId}`)
                          )
                        ),
                        React.createElement('td', null,
                          React.createElement('span', {
                            className: `badge ${comment.status === 'approved' ? 'bg-success' : 'bg-warning'}`
                          }, comment.status || 'pending')
                        ),
                        React.createElement('td', null, 
                          new Date(comment.createdAt).toLocaleDateString()
                        ),
                        React.createElement('td', null,
                          React.createElement('div', { className: 'btn-group btn-group-sm' },
                            React.createElement('button', {
                              className: `btn btn-outline-${comment.status === 'approved' ? 'warning' : 'success'}`,
                              onClick: () => toggleCommentApproval(comment.id, comment.status)
                            }, comment.status === 'approved' ? 'Unapprove' : 'Approve'),
                            React.createElement('button', {
                              className: 'btn btn-outline-danger',
                              onClick: () => deleteComment(comment.id)
                            }, 'Delete')
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
      )
    )
  );
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) {
      window.location.href = '/';
      return;
    }
    
    // Load admin stats
    Promise.all([
      fetch('/api/users', { credentials: 'include' }),
      fetch('/api/posts', { credentials: 'include' }),
      fetch('/api/categories', { credentials: 'include' })
    ]).then(async ([usersRes, postsRes, categoriesRes]) => {
      const users = usersRes.ok ? await usersRes.json() : [];
      const posts = postsRes.ok ? await postsRes.json() : [];
      const categories = categoriesRes.ok ? await categoriesRes.json() : [];
      
      setStats({
        totalUsers: users.length,
        pendingUsers: users.filter(u => !u.approved).length,
        totalPosts: posts.length,
        totalCategories: categories.length
      });
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user]);

  if (!user?.isAdmin) {
    return React.createElement('div', { className: 'container mt-5' },
      React.createElement('div', { className: 'alert alert-danger' },
        'Access denied. Admin privileges required.'
      )
    );
  }

  return React.createElement('div', { className: 'min-vh-100', style: { backgroundColor: '#f8f9fa' } },
    // Navigation
    React.createElement('nav', { className: 'navbar navbar-expand-lg navbar-dark bg-primary' },
      React.createElement('div', { className: 'container' },
        React.createElement('a', { 
          className: 'navbar-brand fw-bold',
          href: '/',
          onClick: (e) => {
            e.preventDefault();
            window.location.href = '/';
          }
        }, 'BlogCraft Admin'),
        React.createElement('div', { className: 'navbar-nav ms-auto' },
          React.createElement('div', { className: 'd-flex align-items-center' },
            React.createElement('span', { className: 'text-light me-3' }, `Welcome, ${user.name}`),
            React.createElement('button', {
              className: 'btn btn-outline-light btn-sm',
              onClick: logout
            }, 'Logout')
          )
        )
      )
    ),

    // Admin Content
    React.createElement('div', { className: 'container mt-4' },
      React.createElement('div', { className: 'row' },
        React.createElement('div', { className: 'col-12' },
          React.createElement('h1', { className: 'mb-4' }, 'Admin Dashboard'),
          
          loading ? React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'spinner-border text-primary' })
          ) : React.createElement('div', { className: 'row' },
            React.createElement('div', { className: 'col-md-3 mb-4' },
              React.createElement('div', { className: 'card bg-primary text-white' },
                React.createElement('div', { className: 'card-body' },
                  React.createElement('h5', { className: 'card-title' }, 'Total Users'),
                  React.createElement('h2', { className: 'mb-0' }, stats?.totalUsers || 0)
                )
              )
            ),
            React.createElement('div', { className: 'col-md-3 mb-4' },
              React.createElement('div', { className: 'card bg-warning text-white' },
                React.createElement('div', { className: 'card-body' },
                  React.createElement('h5', { className: 'card-title' }, 'Pending Approval'),
                  React.createElement('h2', { className: 'mb-0' }, stats?.pendingUsers || 0)
                )
              )
            ),
            React.createElement('div', { className: 'col-md-3 mb-4' },
              React.createElement('div', { className: 'card bg-success text-white' },
                React.createElement('div', { className: 'card-body' },
                  React.createElement('h5', { className: 'card-title' }, 'Blog Posts'),
                  React.createElement('h2', { className: 'mb-0' }, stats?.totalPosts || 0)
                )
              )
            ),
            React.createElement('div', { className: 'col-md-3 mb-4' },
              React.createElement('div', { className: 'card bg-info text-white' },
                React.createElement('div', { className: 'card-body' },
                  React.createElement('h5', { className: 'card-title' }, 'Categories'),
                  React.createElement('h2', { className: 'mb-0' }, stats?.totalCategories || 0)
                )
              )
            )
          ),

          // Quick Actions
          React.createElement('div', { className: 'row mt-4' },
            React.createElement('div', { className: 'col-12' },
              React.createElement('h3', { className: 'mb-3' }, 'Quick Actions'),
              React.createElement('div', { className: 'row' },
                React.createElement('div', { className: 'col-md-4 mb-3' },
                  React.createElement('div', { className: 'card' },
                    React.createElement('div', { className: 'card-body text-center' },
                      React.createElement('h5', { className: 'card-title' }, 'Manage Users'),
                      React.createElement('p', { className: 'card-text' }, 'Approve new users and manage permissions'),
                      React.createElement('a', { 
                        href: '/admin/users',
                        className: 'btn btn-primary'
                      }, 'View Users')
                    )
                  )
                ),
                React.createElement('div', { className: 'col-md-4 mb-3' },
                  React.createElement('div', { className: 'card' },
                    React.createElement('div', { className: 'card-body text-center' },
                      React.createElement('h5', { className: 'card-title' }, 'Manage Posts'),
                      React.createElement('p', { className: 'card-text' }, 'Create, edit, and manage blog posts'),
                      React.createElement('a', { 
                        href: '/admin/posts',
                        className: 'btn btn-success'
                      }, 'View Posts')
                    )
                  )
                ),
                React.createElement('div', { className: 'col-md-4 mb-3' },
                  React.createElement('div', { className: 'card' },
                    React.createElement('div', { className: 'card-body text-center' },
                      React.createElement('h5', { className: 'card-title' }, 'Manage Comments'),
                      React.createElement('p', { className: 'card-text' }, 'Moderate and manage user comments'),
                      React.createElement('a', { 
                        href: '/admin/comments',
                        className: 'btn btn-warning'
                      }, 'View Comments')
                    )
                  )
                )
              )
            )
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
  const [urlMessage, setUrlMessage] = useState('');

  // Check for URL parameters and load posts
  useEffect(() => {
    // Check for URL message parameter
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message === 'pending-approval') {
      setUrlMessage('Your Google account registration is pending approval. Please wait for an administrator to approve your account.');
      // Clean URL
      window.history.replaceState({}, '', '/');
    }

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
      // Approved users can access posts - navigate to post reading page
      window.history.pushState({}, '', `/posts/${post.slug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
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
            user.isAdmin && React.createElement('button', {
              className: 'btn btn-outline-light btn-sm me-2',
              onClick: (e) => {
                e.preventDefault();
                console.log('Dashboard clicked, user:', user);
                window.history.pushState({}, '', '/admin');
                window.dispatchEvent(new PopStateEvent('popstate'));
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
            
            // URL message for Google OAuth pending approval
            urlMessage && React.createElement('div', {
              className: 'alert alert-warning mx-auto mb-4',
              style: { maxWidth: '500px' }
            },
              React.createElement('h6', { className: 'alert-heading' }, 'Registration Pending'),
              React.createElement('p', { className: 'mb-0' }, urlMessage)
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
    React.createElement(Router)
  );
};

// Mount the app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(StrictMode, null,
  React.createElement(App)
));