import React, { useState, useEffect } from 'react';


const { toast } = window;

const PostEditor = ({ user, post, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'draft',
    featuredImage: '',
    tags: [],
    metaDescription: '',
    metaKeywords: [],
    seoTitle: '',
    focusKeyword: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [editorMode, setEditorMode] = useState('html'); // 'rich' or 'html' - default to HTML
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const textareaRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const highlightOverlayRef = React.useRef(null);

  useEffect(() => {
    fetchCategories();
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        categoryId: post.categoryId || '',
        status: post.status || 'draft',
        featuredImage: post.featuredImage || '',
        tags: post.tags || [],
        metaDescription: post.metaDescription || '',
        metaKeywords: post.metaKeywords || [],
        seoTitle: post.seoTitle || '',
        focusKeyword: post.focusKeyword || ''
      });
    }
  }, [post]);

  // Scroll to current match and update highlighting
  useEffect(() => {
    if (searchMatches.length > 0 && currentMatchIndex !== -1 && textareaRef.current) {
      const match = searchMatches[currentMatchIndex];
      const textarea = textareaRef.current;
      
      // Calculate line position for scrolling
      const textBeforeMatch = textarea.value.substring(0, match.start);
      const lines = textBeforeMatch.split('\n');
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      const scrollPosition = (lines.length - 1) * lineHeight;
      
      // Scroll to center the match in the viewport
      textarea.scrollTop = Math.max(0, scrollPosition - textarea.clientHeight / 2);
      
      // Update highlight mirror to show current match with different styling
      updateHighlightMirror(formData.content, searchMatches);
      
      // Add a brief visual pulse to the current match
      setTimeout(() => {
        if (highlightOverlayRef.current) {
          const currentMarkElement = highlightOverlayRef.current.querySelector('mark.current-match');
          if (currentMarkElement) {
            currentMarkElement.style.transition = 'transform 0.2s ease';
            currentMarkElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
              currentMarkElement.style.transform = 'scale(1)';
            }, 200);
          }
        }
      }, 50);
    }
  }, [currentMatchIndex, searchMatches]);



  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    handleChange('tags', tags);
  };

  const handleKeywordsChange = (value) => {
    const keywords = value.split(',').map(kw => kw.trim()).filter(kw => kw);
    handleChange('metaKeywords', keywords);
  };

  // Search functionality
  const findAllMatches = (searchValue, content) => {
    const matches = [];
    if (!searchValue || !content) return matches;
    
    const lowerContent = content.toLowerCase();
    const lowerSearch = searchValue.toLowerCase();
    let index = 0;
    
    while ((index = lowerContent.indexOf(lowerSearch, index)) !== -1) {
      matches.push({
        start: index,
        end: index + searchValue.length,
        text: content.substring(index, index + searchValue.length)
      });
      index++;
    }
    
    return matches;
  };

  const performSearch = (searchValue) => {
    if (!searchValue || !textareaRef.current) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const textarea = textareaRef.current;
    const content = textarea.value;
    const matches = findAllMatches(searchValue, content);
    
    setSearchMatches(matches);
    
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      updateHighlightMirror(content, matches);
    } else {
      setCurrentMatchIndex(-1);
      updateHighlightMirror('', []);
    }
  };



  const handleSearchInput = (searchValue) => {
    setSearchTerm(searchValue);
    // Automatically search as user types
    if (searchValue.trim()) {
      // Debounce the search to avoid too many searches
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        performSearch(searchValue.trim());
      }, 300);
    } else {
      // Clear highlights when search term is empty
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      updateHighlightMirror('', []);
    }
  };

  const findNext = () => {
    if (searchMatches.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
  };

  const findPrevious = () => {
    if (searchMatches.length === 0) return;

    const prevIndex = currentMatchIndex === 0 ? searchMatches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
  };

  // Update highlight mirror with only the current match highlighted
  const updateHighlightMirror = (content, matches) => {
    if (!highlightOverlayRef.current) return;
    
    if (matches.length === 0 || currentMatchIndex === -1) {
      highlightOverlayRef.current.innerHTML = '';
      return;
    }

    // Only highlight the current match, not all matches
    const currentMatch = matches[currentMatchIndex];
    let highlightedContent = '';
    
    // Add text before the current match (invisible)
    highlightedContent += escapeHtml(content.substring(0, currentMatch.start));
    
    // Add the highlighted current match
    highlightedContent += `<mark class="current-match">${escapeHtml(currentMatch.text)}</mark>`;
    
    // Add remaining text after the match (invisible)
    highlightedContent += escapeHtml(content.substring(currentMatch.end));
    
    highlightOverlayRef.current.innerHTML = highlightedContent;
    
    // Sync scroll position and ensure perfect alignment
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const mirror = highlightOverlayRef.current;
      
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
      
      // Force exact font matching
      const computedStyle = getComputedStyle(textarea);
      mirror.style.fontFamily = computedStyle.fontFamily;
      mirror.style.fontSize = computedStyle.fontSize;
      mirror.style.lineHeight = computedStyle.lineHeight;
      mirror.style.letterSpacing = computedStyle.letterSpacing;
      mirror.style.wordSpacing = computedStyle.wordSpacing;
    }
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  };



  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      setShowSearch(true);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }, 100);
    } else if (e.key === 'Escape' && showSearch) {
      setShowSearch(false);
      setSearchTerm('');
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      textareaRef.current?.focus();
    } else if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
      e.preventDefault();
      findNext();
    } else if (e.shiftKey && e.key === 'F3' || (e.ctrlKey && e.shiftKey && e.key === 'G')) {
      e.preventDefault();
      findPrevious();
    }
  };

  // Auto-focus search input when search bar opens
  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
        if (searchTerm) {
          searchInputRef.current.select();
        }
      }, 100);
    }
  }, [showSearch]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();

        
        // Ensure the URL is properly formatted and not HTML encoded
        const cleanUrl = data.url
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x2F;/g, '/')
          .replace(/&#x27;/g, "'");
        

        handleChange('featuredImage', cleanUrl);
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: `Upload failed: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: `Upload failed: ${error.message}`,
        variant: "destructive"
      });
    }

    setImageUploading(false);
    // Clear the file input
    event.target.value = '';
  };

  // Image insertion is now handled by TinyMCE's built-in image upload handler

  // These functions are no longer needed with TinyMCE
  // formatText, insertLink, and insertHTML have been replaced by TinyMCE's built-in functionality

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive"
      });
      return;
    }



    setLoading(true);
    
    try {
      const url = post ? `/api/posts/${post.id}` : '/api/posts';
      const method = post ? 'PUT' : 'POST';
      
      const saveData = {
        ...formData,
        authorId: user.id,
        authorName: user.name || user.username
      };
      

      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        const savedPost = await response.json();

        onSave(savedPost);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: `Error saving post: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Error saving post",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="display-5 fw-bold text-primary">
              {post ? 'Edit Post' : 'Create New Post'}
            </h1>
            <div className="btn-group">
              <button 
                className={`btn ${!previewMode ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setPreviewMode(false)}
              >
                Edit
              </button>
              <button 
                className={`btn ${previewMode ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setPreviewMode(true)}
              >
                Preview
              </button>
            </div>
          </div>

          {!previewMode ? (
            <div className="row">
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Post Content</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Enter post title"
                      />
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0">Content *</label>
                        <div className="d-flex gap-2">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className={`btn ${editorMode === 'rich' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setEditorMode('rich')}
                            >
                              <i className="fas fa-font me-1"></i>Rich Text
                            </button>
                            <button
                              type="button"
                              className={`btn ${editorMode === 'html' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setEditorMode('html')}
                            >
                              <i className="fas fa-code me-1"></i>HTML
                            </button>
                          </div>
                          {editorMode === 'html' && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setShowSearch(!showSearch)}
                              title="Search in HTML (Ctrl+F)"
                            >
                              <i className="fas fa-search"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search Bar for HTML Mode */}
                      {editorMode === 'html' && showSearch && (
                        <div className="card mb-3 border-info">
                          <div className="card-body py-2">
                            <div className="row align-items-center">
                              <div className="col-md-6">
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">
                                    <i className="fas fa-search"></i>
                                  </span>
                                  <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="form-control"
                                    placeholder="Search in HTML content..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (searchTerm) {
                                          performSearch(searchTerm);
                                        }
                                      } else if (e.key === 'Escape') {
                                        setShowSearch(false);
                                        setSearchTerm('');
                                        setSearchMatches([]);
                                        setCurrentMatchIndex(-1);
                                        textareaRef.current?.focus();
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                      if (searchTerm) {
                                        performSearch(searchTerm);
                                      }
                                    }}
                                    title="Search"
                                  >
                                    <i className="fas fa-search"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={findPrevious}
                                    title="Previous (Shift+F3)"
                                  >
                                    <i className="fas fa-chevron-up"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={findNext}
                                    title="Next (F3)"
                                  >
                                    <i className="fas fa-chevron-down"></i>
                                  </button>
                                </div>
                              </div>
                              <div className="col-md-2">
                                {searchMatches.length > 0 && (
                                  <small className="text-muted">
                                    {currentMatchIndex + 1} of {searchMatches.length}
                                  </small>
                                )}
                              </div>
                              <div className="col-md-1">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => {
                                    setShowSearch(false);
                                    setSearchTerm('');
                                    setSearchMatches([]);
                                    setCurrentMatchIndex(-1);
                                  }}
                                  title="Close (Esc)"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                            <small className="text-muted">
                              Use Ctrl+F to open search, Enter to start searching, F3 for next, Shift+F3 for previous, Esc to close
                            </small>
                          </div>
                        </div>
                      )}

                      <div className={`textarea-with-highlights ${searchMatches.length > 0 ? 'position-relative' : ''}`}>
                        {/* Highlight mirror for visual feedback */}
                        {searchMatches.length > 0 && (
                          <div
                            ref={highlightOverlayRef}
                            className={`highlight-mirror ${editorMode === 'html' ? 'font-monospace' : ''}`}
                            style={{
                              fontSize: editorMode === 'html' ? '13px' : '14px'
                            }}
                          />
                        )}
                        
                        <textarea
                          ref={textareaRef}
                          className={`form-control ${editorMode === 'html' ? 'font-monospace' : ''} ${searchMatches.length > 0 ? 'search-active' : ''}`}
                          rows="15"
                          value={formData.content}
                          onChange={(e) => {
                            handleChange('content', e.target.value);
                            // Update highlights when content changes
                            if (searchMatches.length > 0) {
                              const newMatches = findAllMatches(searchTerm, e.target.value);
                              setSearchMatches(newMatches);
                              if (newMatches.length === 0) {
                                setCurrentMatchIndex(-1);
                              } else if (currentMatchIndex >= newMatches.length) {
                                setCurrentMatchIndex(0);
                              }
                              updateHighlightMirror(e.target.value, newMatches);
                            }
                          }}
                          onKeyDown={handleKeyDown}
                          onScroll={(e) => {
                            // Sync scroll position with highlight mirror
                            if (highlightOverlayRef.current) {
                              highlightOverlayRef.current.scrollTop = e.target.scrollTop;
                              highlightOverlayRef.current.scrollLeft = e.target.scrollLeft;
                            }
                          }}
                          placeholder={editorMode === 'html' ? 
                            "Enter HTML content here...\n\nExample HTML:\n<h2>Heading</h2>\n<p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>\n<ul>\n  <li>List item 1</li>\n  <li>List item 2</li>\n</ul>" : 
                            "Write your post content here. You can use HTML tags for formatting (e.g., <strong>bold</strong>, <em>italic</em>, <h2>heading</h2>)..."
                          }
                          style={{ 
                            fontSize: editorMode === 'html' ? '13px' : '14px',
                            ...(searchMatches.length > 0 && currentMatchIndex !== -1 && {
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              position: 'relative',
                              zIndex: 1
                            })
                          }}
                        />
                        
                        {/* Match counter */}
                        {searchMatches.length > 0 && (
                          <div 
                            className="position-absolute bg-warning text-dark px-2 py-1 rounded"
                            style={{
                              bottom: '10px',
                              right: '10px',
                              fontSize: '12px',
                              pointerEvents: 'none',
                              zIndex: 5,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
{searchMatches.length} match{searchMatches.length !== 1 ? 'es' : ''} found{currentMatchIndex !== -1 ? ` | Viewing: ${currentMatchIndex + 1}` : ''}
                          </div>
                        )}
                      </div>
                      
                      {/* HTML Preview Section */}
                      {editorMode === 'html' && (
                        <div className="mt-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">
                              <i className="fas fa-eye me-2"></i>
                              Live HTML Preview
                            </h6>
                            {formData.content && (
                              <small className="text-success">
                                <i className="fas fa-check-circle me-1"></i>
                                Preview updating...
                              </small>
                            )}
                          </div>
                          <div 
                            className="card border-primary"
                            style={{ maxHeight: '400px', overflowY: 'auto' }}
                          >
                            <div className="card-body">
                              {formData.content ? (
                                <div 
                                  dangerouslySetInnerHTML={{ __html: formData.content }}
                                  style={{ 
                                    lineHeight: '1.6',
                                    fontSize: '16px'
                                  }}
                                />
                              ) : (
                                <div className="text-muted text-center py-4">
                                  <i className="fas fa-code fa-2x mb-2"></i>
                                  <p>Start typing HTML above to see the live preview here!</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <small className="text-muted mt-2 d-block">
                            <i className="fas fa-info-circle me-1"></i>
                            This preview shows exactly how your HTML will appear when published. Preview updates as you type.
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Excerpt</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.excerpt}
                        onChange={(e) => handleChange('excerpt', e.target.value)}
                        placeholder="Brief description of the post"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card mb-3">
                  <div className="card-header">
                    <h5 className="mb-0">Post Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.categoryId}
                        onChange={(e) => handleChange('categoryId', e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Featured Image</label>
                      
                      {/* Current image display */}
                      {formData.featuredImage && (
                        <div className="mb-2">
                          <div className="position-relative">
                            <img
                              src={formData.featuredImage}
                              alt="Current featured image"
                              className="img-fluid rounded"
                              style={{ maxHeight: '200px', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                              onClick={() => handleChange('featuredImage', '')}
                              title="Remove image"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                          <small className="text-muted">Current featured image</small>
                        </div>
                      )}
                      
                      {/* Image upload/change button */}
                      <div className="mb-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="form-control"
                          id="featuredImageUpload"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={() => document.getElementById('featuredImageUpload').click()}
                          disabled={imageUploading}
                        >
                          {imageUploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-cloud-upload-alt me-2"></i>
                              {formData.featuredImage ? 'Change Featured Image' : 'Upload Featured Image'}
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Manual URL input */}
                      <input
                        type="url"
                        className="form-control"
                        value={formData.featuredImage}
                        onChange={(e) => handleChange('featuredImage', e.target.value)}
                        placeholder="Or paste image URL"
                      />
                      <small className="text-muted">
                        {formData.featuredImage ? 
                          'You can change the image URL above or upload a new file' : 
                          'Upload a file or paste an image URL'
                        }
                      </small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Tags</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.tags.join(', ')}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        placeholder="tag1, tag2, tag3"
                      />
                      <small className="text-muted">Separate tags with commas</small>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">SEO Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">SEO Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.seoTitle}
                        onChange={(e) => handleChange('seoTitle', e.target.value)}
                        placeholder="SEO optimized title"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Meta Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.metaDescription}
                        onChange={(e) => handleChange('metaDescription', e.target.value)}
                        placeholder="Meta description for search engines"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Focus Keyword</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.focusKeyword}
                        onChange={(e) => handleChange('focusKeyword', e.target.value)}
                        placeholder="Primary keyword"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Meta Keywords</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.metaKeywords.join(', ')}
                        onChange={(e) => handleKeywordsChange(e.target.value)}
                        placeholder="keyword1, keyword2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Preview</h5>
              </div>
              <div className="card-body">
                <h1>{formData.title || 'Untitled Post'}</h1>
                {formData.featuredImage && (
                  <img 
                    src={formData.featuredImage} 
                    alt={formData.title}
                    className="img-fluid mb-3"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                )}
                <div 
                  className="post-content"
                  dangerouslySetInnerHTML={{ __html: formData.content || 'No content yet...' }}
                />
                {formData.tags.length > 0 && (
                  <div className="mt-3">
                    <strong>Tags: </strong>
                    {formData.tags.map(tag => (
                      <span key={tag} className="badge bg-secondary me-1">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 d-flex gap-2">
            <button 
              className="btn btn-success btn-lg"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : (post ? 'Update Post' : 'Create Post')}
            </button>
            <button 
              className="btn btn-secondary btn-lg"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;