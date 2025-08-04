// Import React and ReactDOM from CDN (already loaded in HTML)
const { StrictMode } = React;
const { createRoot } = ReactDOM;

// HomePage component
const HomePage = () => {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/posts', { credentials: 'include' })
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
          React.createElement('div', { 
            className: 'card h-100',
            style: { cursor: 'pointer' },
            onClick: () => {
              window.location.hash = `#/post/${post.slug}`;
              window.location.reload();
            }
          },
            React.createElement('div', { className: 'card-body' },
              React.createElement('h5', { className: 'card-title' }, post.title),
              React.createElement('p', { className: 'card-text' }, post.excerpt),
              React.createElement('small', { className: 'text-muted' }, 
                `By ${post.authorName} • ${new Date(post.publishedAt).toLocaleDateString()}`
              ),
              React.createElement('div', { className: 'mt-2' },
                React.createElement('span', { className: 'btn btn-primary btn-sm' }, 'Read More →')
              )
            )
          )
        )
      )
    )
  );
};

// Blog Post Detail Component
const BlogPostDetail = ({ slug, onBack }) => {
  const [post, setPost] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [commentLoading, setCommentLoading] = React.useState(false);
  const [newComment, setNewComment] = React.useState({
    authorName: '',
    authorEmail: '',
    content: ''
  });
  const [submittingComment, setSubmittingComment] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/posts/slug/${slug}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error('Post not found');
        }
        return res.json();
      })
      .then(data => {
        setPost(data);
        setLoading(false);
        // Load comments for this post
        loadComments(data.id);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const loadComments = async (postId) => {
    setCommentLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        credentials: 'include'
      });
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!post || !newComment.authorName || !newComment.authorEmail || !newComment.content) {
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newComment,
          postId: post.id
        })
      });

      if (response.ok) {
        setNewComment({ authorName: '', authorEmail: '', content: '' });
        // Show success message
        alert('Comment submitted successfully! It will appear after approval.');
        // Reload comments to show any immediately approved ones
        loadComments(post.id);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to submit comment');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' })
    );
  }

  if (error) {
    return React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'alert alert-danger' }, error),
      React.createElement('button', { 
        className: 'btn btn-primary',
        onClick: () => {
          window.location.hash = '#/';
          window.location.reload();
        }
      }, '← Back to Home')
    );
  }

  if (!post) {
    return React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'alert alert-warning' }, 'Post not found'),
      React.createElement('button', { 
        className: 'btn btn-primary',
        onClick: () => {
          window.location.hash = '#/';
          window.location.reload();
        }
      }, '← Back to Home')
    );
  }

  return React.createElement('div', { className: 'container' },
    React.createElement('div', { className: 'row justify-content-center' },
      React.createElement('div', { className: 'col-lg-8' },
        React.createElement('button', { 
          className: 'btn btn-outline-primary mb-4',
          onClick: () => {
            window.location.hash = '#/';
            window.location.reload();
          }
        }, '← Back to Home'),
        React.createElement('article', { className: 'blog-post' },
          React.createElement('header', { className: 'mb-4' },
            React.createElement('h1', { className: 'display-4 mb-3' }, post.title),
            React.createElement('div', { className: 'text-muted mb-3' },
              React.createElement('span', null, `By ${post.authorName} • `),
              React.createElement('span', null, new Date(post.publishedAt).toLocaleDateString()),
              post.categoryName && React.createElement('span', null, ` • ${post.categoryName}`)
            ),
            post.excerpt && React.createElement('p', { className: 'lead' }, post.excerpt)
          ),
          React.createElement('div', { 
            className: 'post-content',
            dangerouslySetInnerHTML: { __html: post.content }
          }),
          post.tags && post.tags.length > 0 && React.createElement('div', { className: 'mt-4 mb-5' },
            React.createElement('h6', null, 'Tags:'),
            React.createElement('div', null,
              post.tags.map(tag => 
                React.createElement('span', { 
                  key: tag, 
                  className: 'badge bg-secondary me-2' 
                }, tag)
              )
            )
          ),

          // Comments Section
          React.createElement('hr', { className: 'my-5' }),
          React.createElement('section', { className: 'comments-section' },
            React.createElement('h4', { className: 'mb-4' }, 'Comments'),
            
            // Existing Comments
            commentLoading ? 
              React.createElement('div', { className: 'text-center mb-4' },
                React.createElement('div', { className: 'spinner-border spinner-border-sm' })
              ) :
              comments.length > 0 ? 
                React.createElement('div', { className: 'mb-5' },
                  comments.map(comment => 
                    React.createElement('div', { 
                      key: comment.id, 
                      className: 'card mb-3' 
                    },
                      React.createElement('div', { className: 'card-body' },
                        React.createElement('div', { className: 'd-flex justify-content-between align-items-start mb-2' },
                          React.createElement('h6', { className: 'card-title mb-0' }, comment.authorName),
                          React.createElement('small', { className: 'text-muted' }, 
                            new Date(comment.createdAt).toLocaleDateString()
                          )
                        ),
                        React.createElement('p', { className: 'card-text' }, comment.content)
                      )
                    )
                  )
                ) :
                React.createElement('p', { className: 'text-muted mb-4' }, 'No comments yet. Be the first to comment!'),

            // Comment Form
            React.createElement('div', { className: 'card' },
              React.createElement('div', { className: 'card-header' },
                React.createElement('h5', { className: 'mb-0' }, 'Leave a Comment')
              ),
              React.createElement('div', { className: 'card-body' },
                React.createElement('form', { onSubmit: handleCommentSubmit },
                  React.createElement('div', { className: 'row mb-3' },
                    React.createElement('div', { className: 'col-md-6' },
                      React.createElement('label', { className: 'form-label' }, 'Name *'),
                      React.createElement('input', {
                        type: 'text',
                        className: 'form-control',
                        value: newComment.authorName,
                        onChange: (e) => setNewComment({...newComment, authorName: e.target.value}),
                        required: true
                      })
                    ),
                    React.createElement('div', { className: 'col-md-6' },
                      React.createElement('label', { className: 'form-label' }, 'Email *'),
                      React.createElement('input', {
                        type: 'email',
                        className: 'form-control',
                        value: newComment.authorEmail,
                        onChange: (e) => setNewComment({...newComment, authorEmail: e.target.value}),
                        required: true
                      }),
                      React.createElement('small', { className: 'form-text text-muted' }, 'Your email will not be published')
                    )
                  ),
                  React.createElement('div', { className: 'mb-3' },
                    React.createElement('label', { className: 'form-label' }, 'Comment *'),
                    React.createElement('textarea', {
                      className: 'form-control',
                      rows: 4,
                      value: newComment.content,
                      onChange: (e) => setNewComment({...newComment, content: e.target.value}),
                      placeholder: 'Share your thoughts...',
                      required: true
                    })
                  ),
                  React.createElement('button', {
                    type: 'submit',
                    className: 'btn btn-primary',
                    disabled: submittingComment
                  }, submittingComment ? 'Submitting...' : 'Post Comment')
                )
              )
            )
          )
        )
      )
    )
  );
};

// Blog Post Editor Component
const BlogPostEditor = ({ user, onBack }) => {
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [excerpt, setExcerpt] = React.useState('');
  const [content, setContent] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [featured, setFeatured] = React.useState(false);
  const [status, setStatus] = React.useState('draft');
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [quillEditor, setQuillEditor] = React.useState(null);
  const editorRef = React.useRef(null);

  React.useEffect(() => {
    fetch('/api/categories', { credentials: 'include' })
      .then(r => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  // Initialize Quill editor
  React.useEffect(() => {
    if (editorRef.current && !quillEditor && window.Quill) {
      // Clear any existing content first
      editorRef.current.innerHTML = '';
      
      const quill = new window.Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'blockquote', 'code-block'],
            [{ 'align': [] }],
            ['clean']
          ]
        },
        placeholder: 'Write your blog post content here...'
      });

      // Set up content change handler
      quill.on('text-change', () => {
        setContent(quill.root.innerHTML);
      });

      setQuillEditor(quill);
    }
    
    // Cleanup function to destroy editor on unmount
    return () => {
      if (quillEditor) {
        // Don't destroy here as it would cause issues during re-renders
      }
    };
  }, []);

  // Update Quill content when content state changes externally
  React.useEffect(() => {
    if (quillEditor && content !== quillEditor.root.innerHTML) {
      const selection = quillEditor.getSelection();
      quillEditor.root.innerHTML = content;
      if (selection) {
        quillEditor.setSelection(selection);
      }
    }
  }, [content, quillEditor]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const postData = {
        title,
        slug,
        excerpt,
        content,
        categoryId,
        categoryName: categories.find(c => c.id === categoryId)?.name || '',
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featured,
        status,
        authorId: user.id,
        authorName: user.name || user.username
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      setSuccess('Blog post created successfully!');
      // Reset form
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent('');
      setCategoryId('');
      setTags('');
      setFeatured(false);
      setStatus('draft');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const imageData = await response.json();
      
      // Insert image into Quill editor
      if (quillEditor) {
        const range = quillEditor.getSelection(true);
        quillEditor.insertEmbed(range.index, 'image', imageData.url);
        quillEditor.setSelection(range.index + 1);
      } else {
        // Fallback for when editor isn't ready
        const imageHtml = `<img src="${imageData.url}" alt="Blog image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
        setContent(prevContent => prevContent + '\n\n' + imageHtml + '\n\n');
      }
      
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  return React.createElement('div', null,
    React.createElement('div', { className: 'mb-3' },
      React.createElement('button', { 
        className: 'btn btn-secondary', 
        onClick: onBack 
      }, '← Back to Dashboard')
    ),
    React.createElement('h1', { className: 'mb-4' }, 'Write New Blog Post'),
    
    error && React.createElement('div', { className: 'alert alert-danger' }, error),
    success && React.createElement('div', { className: 'alert alert-success' }, success),
    
    React.createElement('form', { onSubmit: handleSubmit },
      React.createElement('div', { className: 'row' },
        React.createElement('div', { className: 'col-md-8' },
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Title *'),
            React.createElement('input', {
              type: 'text',
              className: 'form-control',
              value: title,
              onChange: handleTitleChange,
              required: true
            })
          ),
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Slug *'),
            React.createElement('input', {
              type: 'text',
              className: 'form-control',
              value: slug,
              onChange: (e) => setSlug(e.target.value),
              required: true
            })
          ),
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Excerpt'),
            React.createElement('textarea', {
              className: 'form-control',
              rows: 3,
              value: excerpt,
              onChange: (e) => setExcerpt(e.target.value),
              placeholder: 'Brief description for the blog post...'
            })
          ),
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Content *'),
            React.createElement('div', {
              ref: editorRef,
              style: { minHeight: '300px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '0.375rem' },
              id: 'quill-editor-container'
            })
          ),
          React.createElement('div', { className: 'mb-3' },
            React.createElement('label', { className: 'form-label' }, 'Add Image'),
            React.createElement('input', {
              type: 'file',
              className: 'form-control',
              accept: 'image/*',
              onChange: handleImageUpload,
              disabled: uploadingImage
            }),
            React.createElement('small', { className: 'form-text text-muted' }, 
              uploadingImage ? 'Uploading image...' : 'Upload an image to insert into your blog post content'
            )
          )
        ),
        React.createElement('div', { className: 'col-md-4' },
          React.createElement('div', { className: 'card' },
            React.createElement('div', { className: 'card-header' },
              React.createElement('h6', { className: 'mb-0' }, 'Post Settings')
            ),
            React.createElement('div', { className: 'card-body' },
              React.createElement('div', { className: 'mb-3' },
                React.createElement('label', { className: 'form-label' }, 'Category'),
                React.createElement('select', {
                  className: 'form-select',
                  value: categoryId,
                  onChange: (e) => setCategoryId(e.target.value)
                },
                  React.createElement('option', { value: '' }, 'Select Category'),
                  categories.map(cat => 
                    React.createElement('option', { key: cat.id, value: cat.id }, cat.name)
                  )
                )
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('label', { className: 'form-label' }, 'Tags'),
                React.createElement('input', {
                  type: 'text',
                  className: 'form-control',
                  value: tags,
                  onChange: (e) => setTags(e.target.value),
                  placeholder: 'tag1, tag2, tag3'
                })
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('label', { className: 'form-label' }, 'Status'),
                React.createElement('select', {
                  className: 'form-select',
                  value: status,
                  onChange: (e) => setStatus(e.target.value)
                },
                  React.createElement('option', { value: 'draft' }, 'Draft'),
                  React.createElement('option', { value: 'published' }, 'Published')
                )
              ),
              React.createElement('div', { className: 'form-check mb-3' },
                React.createElement('input', {
                  type: 'checkbox',
                  className: 'form-check-input',
                  id: 'featured',
                  checked: featured,
                  onChange: (e) => setFeatured(e.target.checked)
                }),
                React.createElement('label', { className: 'form-check-label', htmlFor: 'featured' }, 'Featured Post')
              )
            )
          )
        )
      ),
      React.createElement('div', { className: 'mt-4' },
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary me-2',
          disabled: loading
        }, loading ? 'Publishing...' : 'Publish Post'),
        React.createElement('button', {
          type: 'button',
          className: 'btn btn-outline-secondary',
          onClick: onBack
        }, 'Cancel')
      )
    )
  );
};

// User Management Component
const UserManagement = ({ user, onBack }) => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [updatingUserId, setUpdatingUserId] = React.useState(null);

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          throw new Error('Admin access required. Please make sure you are logged in as an admin.');
        }
        throw new Error(errorData.message || 'Failed to load users');
      }
      const usersData = await response.json();
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId, currentIsAdmin) => {
    setUpdatingUserId(userId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({ isAdmin: !currentIsAdmin })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u
      ));
      
      setSuccess(`User role updated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' })
    );
  }

  return React.createElement('div', null,
    React.createElement('div', { className: 'mb-3' },
      React.createElement('button', { 
        className: 'btn btn-secondary', 
        onClick: onBack 
      }, '← Back to Dashboard')
    ),
    React.createElement('h1', { className: 'mb-4' }, 'User Management'),
    React.createElement('p', { className: 'text-muted mb-4' }, 'Manage user roles and permissions. Only admin users can access this area.'),
    
    error && React.createElement('div', { className: 'alert alert-danger' }, error),
    success && React.createElement('div', { className: 'alert alert-success' }, success),
    
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-header' },
        React.createElement('h5', { className: 'mb-0' }, `All Users (${users.length})`)
      ),
      React.createElement('div', { className: 'card-body p-0' },
        React.createElement('div', { className: 'table-responsive' },
          React.createElement('table', { className: 'table table-hover mb-0' },
            React.createElement('thead', { className: 'table-light' },
              React.createElement('tr', null,
                React.createElement('th', null, 'Name'),
                React.createElement('th', null, 'Email'),
                React.createElement('th', null, 'Username'),
                React.createElement('th', null, 'Role'),
                React.createElement('th', null, 'Joined'),
                React.createElement('th', null, 'Actions')
              )
            ),
            React.createElement('tbody', null,
              users.map(u => 
                React.createElement('tr', { key: u.id },
                  React.createElement('td', null,
                    React.createElement('strong', null, u.name || u.username),
                    u.id === user.id && React.createElement('span', { className: 'badge bg-primary ms-2' }, 'You')
                  ),
                  React.createElement('td', null, u.email),
                  React.createElement('td', null, u.username),
                  React.createElement('td', null,
                    React.createElement('span', { 
                      className: `badge ${u.isAdmin ? 'bg-danger' : 'bg-secondary'}` 
                    }, u.isAdmin ? 'Admin' : 'User')
                  ),
                  React.createElement('td', null, 
                    u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'
                  ),
                  React.createElement('td', null,
                    u.id === user.id ? 
                      React.createElement('span', { className: 'text-muted' }, 'Current User') :
                      React.createElement('button', {
                        className: `btn btn-sm ${u.isAdmin ? 'btn-outline-warning' : 'btn-outline-success'}`,
                        onClick: () => toggleUserRole(u.id, u.isAdmin),
                        disabled: updatingUserId === u.id
                      }, 
                        updatingUserId === u.id ? 'Updating...' : 
                        u.isAdmin ? 'Remove Admin' : 'Make Admin'
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

// Comment Management Component
const CommentManagement = ({ user, onBack }) => {
  const [comments, setComments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [updatingCommentId, setUpdatingCommentId] = React.useState(null);

  React.useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const response = await fetch('/api/comments', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load comments');
      }
      const commentsData = await response.json();
      setComments(commentsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCommentStatus = async (commentId, newStatus) => {
    setUpdatingCommentId(commentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update comment');
      }

      // Update local state
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, status: newStatus } : c
      ));
      
      setSuccess(`Comment ${newStatus} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingCommentId(null);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setUpdatingCommentId(commentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete comment');
      }

      // Remove from local state
      setComments(comments.filter(c => c.id !== commentId));
      
      setSuccess('Comment deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingCommentId(null);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'spinner-border' })
    );
  }

  const pendingComments = comments.filter(c => c.status === 'pending');
  const approvedComments = comments.filter(c => c.status === 'approved');
  const rejectedComments = comments.filter(c => c.status === 'rejected');

  return React.createElement('div', null,
    React.createElement('div', { className: 'mb-3' },
      React.createElement('button', { 
        className: 'btn btn-secondary', 
        onClick: onBack 
      }, '← Back to Dashboard')
    ),
    React.createElement('h1', { className: 'mb-4' }, 'Comment Management'),
    React.createElement('p', { className: 'text-muted mb-4' }, 'Moderate user comments and manage their visibility on your blog.'),
    
    error && React.createElement('div', { className: 'alert alert-danger' }, error),
    success && React.createElement('div', { className: 'alert alert-success' }, success),
    
    // Summary Cards
    React.createElement('div', { className: 'row mb-4' },
      React.createElement('div', { className: 'col-md-4' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title text-warning' }, 'Pending'),
            React.createElement('p', { className: 'card-text display-6' }, pendingComments.length)
          )
        )
      ),
      React.createElement('div', { className: 'col-md-4' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title text-success' }, 'Approved'),
            React.createElement('p', { className: 'card-text display-6' }, approvedComments.length)
          )
        )
      ),
      React.createElement('div', { className: 'col-md-4' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title text-danger' }, 'Total'),
            React.createElement('p', { className: 'card-text display-6' }, comments.length)
          )
        )
      )
    ),

    // Comments List
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-header' },
        React.createElement('h5', { className: 'mb-0' }, `All Comments (${comments.length})`)
      ),
      React.createElement('div', { className: 'card-body p-0' },
        comments.length === 0 ? 
          React.createElement('div', { className: 'text-center p-4' },
            React.createElement('p', { className: 'text-muted' }, 'No comments yet.')
          ) :
          React.createElement('div', { className: 'table-responsive' },
            React.createElement('table', { className: 'table table-hover mb-0' },
              React.createElement('thead', { className: 'table-light' },
                React.createElement('tr', null,
                  React.createElement('th', null, 'Author'),
                  React.createElement('th', null, 'Comment'),
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
                      React.createElement('div', null,
                        React.createElement('strong', null, comment.authorName),
                        React.createElement('br'),
                        React.createElement('small', { className: 'text-muted' }, comment.authorEmail)
                      )
                    ),
                    React.createElement('td', null,
                      React.createElement('div', { 
                        style: { maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }
                      }, comment.content.length > 100 ? comment.content.substring(0, 100) + '...' : comment.content)
                    ),
                    React.createElement('td', null,
                      React.createElement('div', null,
                        React.createElement('strong', null, comment.postTitle),
                        React.createElement('br'),
                        React.createElement('small', { className: 'text-muted' }, comment.postSlug)
                      )
                    ),
                    React.createElement('td', null,
                      React.createElement('span', { 
                        className: `badge ${
                          comment.status === 'approved' ? 'bg-success' : 
                          comment.status === 'rejected' ? 'bg-danger' : 'bg-warning'
                        }` 
                      }, comment.status.charAt(0).toUpperCase() + comment.status.slice(1))
                    ),
                    React.createElement('td', null, 
                      new Date(comment.createdAt).toLocaleDateString()
                    ),
                    React.createElement('td', null,
                      React.createElement('div', { className: 'btn-group btn-group-sm' },
                        comment.status !== 'approved' && React.createElement('button', {
                          className: 'btn btn-outline-success',
                          onClick: () => updateCommentStatus(comment.id, 'approved'),
                          disabled: updatingCommentId === comment.id,
                          title: 'Approve'
                        }, '✓'),
                        comment.status !== 'rejected' && React.createElement('button', {
                          className: 'btn btn-outline-warning',
                          onClick: () => updateCommentStatus(comment.id, 'rejected'),
                          disabled: updatingCommentId === comment.id,
                          title: 'Reject'
                        }, '✗'),
                        React.createElement('button', {
                          className: 'btn btn-outline-danger',
                          onClick: () => deleteComment(comment.id),
                          disabled: updatingCommentId === comment.id,
                          title: 'Delete'
                        }, '🗑')
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

// AdminDashboard component
const AdminDashboard = ({ user }) => {
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [stats, setStats] = React.useState({ posts: 0, categories: 0, comments: 0, users: 0 });
  const [posts, setPosts] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/posts', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/categories', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/comments', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/users', { credentials: 'include' }).then(r => r.json())
    ]).then(([postsData, categories, comments, users]) => {
      setPosts(postsData);
      setStats({
        posts: postsData.length,
        categories: categories.length,
        comments: comments.length,
        users: users.length
      });
    }).catch(console.error);
  }, [currentView]);

  if (currentView === 'write') {
    return React.createElement(BlogPostEditor, { 
      user, 
      onBack: () => setCurrentView('dashboard') 
    });
  }

  if (currentView === 'users') {
    return React.createElement(UserManagement, { 
      user, 
      onBack: () => setCurrentView('dashboard') 
    });
  }

  if (currentView === 'comments') {
    return React.createElement(CommentManagement, { 
      user, 
      onBack: () => setCurrentView('dashboard') 
    });
  }

  return React.createElement('div', null,
    React.createElement('h1', { className: 'mb-4' }, 'Admin Dashboard'),
    React.createElement('p', { className: 'lead' }, `Welcome back, ${user.name || user.username}!`),
    
    React.createElement('div', { className: 'mb-4' },
      React.createElement('button', {
        className: 'btn btn-primary btn-lg me-3',
        onClick: () => setCurrentView('write')
      }, '📝 Write New Blog Post'),
      React.createElement('button', {
        className: 'btn btn-info btn-lg me-3',
        onClick: () => setCurrentView('users')
      }, '👥 Manage Users'),
      React.createElement('button', {
        className: 'btn btn-warning btn-lg',
        onClick: () => setCurrentView('comments')
      }, '💬 Moderate Comments')
    ),
    
    React.createElement('div', { className: 'row mb-4' },
      React.createElement('div', { className: 'col-md-3' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, 'Posts'),
            React.createElement('p', { className: 'card-text display-4' }, stats.posts)
          )
        )
      ),
      React.createElement('div', { className: 'col-md-3' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, 'Categories'),
            React.createElement('p', { className: 'card-text display-4' }, stats.categories)
          )
        )
      ),
      React.createElement('div', { className: 'col-md-3' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, 'Comments'),
            React.createElement('p', { className: 'card-text display-4' }, stats.comments)
          )
        )
      ),
      React.createElement('div', { className: 'col-md-3' },
        React.createElement('div', { className: 'card text-center' },
          React.createElement('div', { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, 'Users'),
            React.createElement('p', { className: 'card-text display-4' }, stats.users)
          )
        )
      )
    ),
    
    React.createElement('h3', { className: 'mb-3' }, 'Recent Posts'),
    React.createElement('div', { className: 'table-responsive' },
      React.createElement('table', { className: 'table table-striped' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'Title'),
            React.createElement('th', null, 'Status'),
            React.createElement('th', null, 'Category'),
            React.createElement('th', null, 'Published'),
            React.createElement('th', null, 'Featured')
          )
        ),
        React.createElement('tbody', null,
          posts.slice(0, 10).map(post =>
            React.createElement('tr', { key: post.id },
              React.createElement('td', null, post.title),
              React.createElement('td', null,
                React.createElement('span', { 
                  className: `badge ${post.status === 'published' ? 'bg-success' : 'bg-warning'}` 
                }, post.status)
              ),
              React.createElement('td', null, post.categoryName || 'Uncategorized'),
              React.createElement('td', null, post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'),
              React.createElement('td', null, post.featured ? '⭐' : '')
            )
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
          credentials: 'include',
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

          // Main content based on current view
          (() => {
            const hash = window.location.hash;
            if (user?.isAdmin && hash === '#/admin') {
              return React.createElement(AdminDashboard, { user });
            } else if (hash.startsWith('#/post/')) {
              const slug = hash.replace('#/post/', '');
              return React.createElement(BlogPostDetail, { slug });
            } else {
              return React.createElement(HomePage);
            }
          })()
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