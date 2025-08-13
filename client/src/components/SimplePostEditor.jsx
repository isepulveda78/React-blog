import React, { useState, useEffect } from 'react';

const { toast } = window;

const SimplePostEditor = ({ user, post, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'draft'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [contentRef, setContentRef] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        categoryId: post.categoryId || '',
        status: post.status || 'draft'
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

  // HTML editing helper functions
  const insertHtml = (htmlTag, hasContent = false) => {
    if (!contentRef) return;
    
    const textarea = contentRef;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let newContent;
    if (hasContent) {
      const placeholder = selectedText || 'text';
      if (htmlTag === 'link') {
        const url = prompt('Enter URL:');
        if (url) {
          newContent = `<a href="${url}">${placeholder}</a>`;
        } else {
          return;
        }
      } else {
        newContent = `<${htmlTag}>${placeholder}</${htmlTag}>`;
      }
    } else {
      newContent = htmlTag;
    }
    
    const newText = formData.content.substring(0, start) + newContent + formData.content.substring(end);
    handleChange('content', newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + newContent.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    const text = prompt('Enter link text:');
    if (url && text) {
      insertHtml(`<a href="${url}">${text}</a>`);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    const alt = prompt('Enter alt text:');
    if (url) {
      insertHtml(`<img src="${url}" alt="${alt || 'Image'}" style="max-width: 100%;" />`);
    }
  };

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
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Post Details</h5>
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
                  <label className="form-label">Content *</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setShowPreview(!showPreview)}
                      title="Toggle Preview"
                    >
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                  </div>
                </div>

                {/* HTML Toolbar */}
                <div className="border rounded-top p-2 bg-light">
                  <div className="btn-toolbar" role="toolbar">
                    <div className="btn-group me-2" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('strong', true)}
                        title="Bold"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('em', true)}
                        title="Italic"
                      >
                        <em>I</em>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('u', true)}
                        title="Underline"
                      >
                        <u>U</u>
                      </button>
                    </div>
                    
                    <div className="btn-group me-2" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('h2', true)}
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('h3', true)}
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('p', true)}
                        title="Paragraph"
                      >
                        P
                      </button>
                    </div>

                    <div className="btn-group me-2" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={insertLink}
                        title="Insert Link"
                      >
                        🔗 Link
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={insertImage}
                        title="Insert Image"
                      >
                        🖼️ Image
                      </button>
                    </div>

                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('<br />')}
                        title="Line Break"
                      >
                        BR
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => insertHtml('<hr />')}
                        title="Horizontal Rule"
                      >
                        HR
                      </button>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className={showPreview ? "col-md-6" : "col-12"}>
                    <textarea
                      ref={setContentRef}
                      className="form-control border-top-0"
                      rows="15"
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      placeholder="Write your post content here. Use the toolbar above to add HTML elements..."
                      style={{ 
                        fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
                        fontSize: '13px',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: showPreview ? 0 : undefined
                      }}
                    />
                  </div>
                  
                  {showPreview && (
                    <div className="col-md-6">
                      <div 
                        className="form-control border-top-0 bg-white"
                        style={{ 
                          minHeight: '400px',
                          borderTopRightRadius: 0,
                          overflow: 'auto'
                        }}
                      >
                        <div 
                          dangerouslySetInnerHTML={{ __html: formData.content || '<p><em>Preview will appear here...</em></p>' }}
                          className="p-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <small className="text-muted mt-1">
                  <strong>HTML Tips:</strong> Use &lt;strong&gt; for bold, &lt;em&gt; for italic, &lt;h2&gt; for headings, &lt;p&gt; for paragraphs, &lt;a href="url"&gt; for links, &lt;img src="url"&gt; for images.
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Excerpt</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Brief description of the post..."
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) => handleChange('categoryId', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
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
                </div>
              </div>

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
      </div>
    </div>
  );
};

export default SimplePostEditor;