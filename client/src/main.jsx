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
        React.createElement('div', { className: 'alert alert-info' },
          'User management interface coming soon!'
        )
      )
    )
  );
};

// Admin Comments Management Component
const AdminComments = () => {
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
        React.createElement('div', { className: 'alert alert-info' },
          'Comment management interface coming soon!'
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