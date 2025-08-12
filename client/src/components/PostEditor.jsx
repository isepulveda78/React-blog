import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

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
  const [editorMode, setEditorMode] = useState('rich'); // 'rich' or 'html'

  useEffect(() => {
    fetchCategories();
    if (post) {
      console.log('PostEditor: Loading post data:', post);
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
      console.log('PostEditor: Featured image from post:', post.featuredImage);
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
        console.log('Upload successful, setting featuredImage to:', data.url);
        
        // Ensure the URL is properly formatted and not HTML encoded
        const cleanUrl = data.url
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x2F;/g, '/')
          .replace(/&#x27;/g, "'");
        
        console.log('Cleaned URL:', cleanUrl);
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

    console.log('PostEditor: Saving post with data:', formData);
    console.log('PostEditor: Featured image being saved:', formData.featuredImage);

    setLoading(true);
    
    try {
      const url = post ? `/api/posts/${post.id}` : '/api/posts';
      const method = post ? 'PUT' : 'POST';
      
      const saveData = {
        ...formData,
        authorId: user.id,
        authorName: user.name || user.username
      };
      
      console.log('PostEditor: Full save data:', saveData);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        const savedPost = await response.json();
        console.log('PostEditor: Post saved successfully:', savedPost);
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
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className={`btn ${editorMode === 'rich' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setEditorMode('rich')}
                          >
                            Rich Text
                          </button>
                          <button
                            type="button"
                            className={`btn ${editorMode === 'html' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setEditorMode('html')}
                          >
                            HTML
                          </button>
                        </div>
                      </div>

                      {editorMode === 'rich' ? (
                        <Editor
                          apiKey="no-api-key"
                          value={formData.content}
                          onEditorChange={(content) => handleChange('content', content)}
                          init={{
                            height: 400,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                              'paste', 'directionality', 'emoticons', 'template', 'codesample'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                              'bold italic forecolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'table | link image | removeformat | help',
                            table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
                            table_appearance_options: false,
                            table_grid: false,
                            table_class_list: [
                              { title: 'None', value: '' },
                              { title: 'Bootstrap Table', value: 'table' },
                              { title: 'Bootstrap Striped', value: 'table table-striped' },
                              { title: 'Bootstrap Bordered', value: 'table table-bordered' }
                            ],
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                            paste_data_images: true,
                            images_upload_handler: async (blobInfo, success, failure) => {
                              try {
                                const formData = new FormData();
                                formData.append('image', blobInfo.blob(), blobInfo.filename());

                                const response = await fetch('/api/upload-image', {
                                  method: 'POST',
                                  credentials: 'include',
                                  body: formData
                                });

                                if (response.ok) {
                                  const data = await response.json();
                                  success(data.url);
                                } else {
                                  failure('Image upload failed');
                                }
                              } catch (error) {
                                failure('Image upload failed: ' + error.message);
                              }
                            },
                            setup: (editor) => {
                              editor.on('change', () => {
                                const content = editor.getContent();
                                handleChange('content', content);
                              });
                            }
                          }}
                        />
                      ) : (
                        /* HTML Editor */
                        <div className="position-relative">
                          <textarea
                            className="form-control"
                            rows="15"
                            value={formData.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder="Write your post content here using HTML..."
                            style={{ fontFamily: 'monospace', fontSize: '14px' }}
                          />
                          <div className="position-absolute top-0 end-0 p-2">
                            <small className="text-muted">HTML Mode</small>
                          </div>
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