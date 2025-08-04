const { React, useState, useEffect } = window;

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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        handleChange('featuredImage', data.url);
        alert('Image uploaded successfully!');
      } else {
        const error = await response.json();
        alert('Upload failed: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    }

    setImageUploading(false);
    // Clear the file input
    event.target.value = '';
  };

  const insertImageInContent = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const imageHtml = `\n<img src="${data.url}" alt="Uploaded image" class="img-fluid my-3" />\n`;
        setFormData(prev => ({ ...prev, content: prev.content + imageHtml }));
        alert('Image inserted into content!');
      } else {
        const error = await response.json();
        alert('Upload failed: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    }

    setImageUploading(false);
    event.target.value = '';
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setLoading(true);
    
    try {
      const url = post ? `/api/posts/${post.id}` : '/api/posts';
      const method = post ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          authorId: user.id,
          authorName: user.name || user.username
        })
      });

      if (response.ok) {
        const savedPost = await response.json();
        onSave(savedPost);
      } else {
        const error = await response.json();
        alert('Error saving post: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post');
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
                      <label className="form-label">Content *</label>
                      
                      {/* Image upload for content */}
                      <div className="mb-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={insertImageInContent}
                          className="form-control"
                          id="contentImageUpload"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => document.getElementById('contentImageUpload').click()}
                          disabled={imageUploading}
                        >
                          {imageUploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-image me-2"></i>
                              Insert Image
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="position-relative">
                        <textarea
                          className="form-control"
                          rows="15"
                          value={formData.content}
                          onChange={(e) => handleChange('content', e.target.value)}
                          placeholder="Write your post content here..."
                          style={{ fontFamily: 'monospace' }}
                        />
                        <div className="position-absolute top-0 end-0 p-2">
                          <small className="text-muted">HTML supported</small>
                        </div>
                      </div>
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
                      
                      {/* Image upload button */}
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
                          className="btn btn-primary btn-sm w-100"
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
                              Upload Featured Image
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
                      
                      {/* Image preview */}
                      {formData.featuredImage && (
                        <div className="mt-2">
                          <img
                            src={formData.featuredImage}
                            alt="Featured image preview"
                            className="img-fluid rounded"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
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

window.PostEditor = PostEditor;