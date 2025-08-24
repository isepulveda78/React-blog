import React, { useState, useEffect } from 'react';

const GoogleSlides = ({ user }) => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    googleSlidesUrl: '',
    embedUrl: '',
    isPublic: true,
    category: '',
    tags: ''
  });

  const isTeacherOrAdmin = user && (user.isAdmin || user.role === 'teacher');

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/google-slides', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSlides(data);
      } else {
        setError('Failed to fetch Google Slides');
      }
    } catch (error) {
      console.error('Error fetching Google Slides:', error);
      setError('Failed to fetch Google Slides');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const extractEmbedUrl = (googleSlidesUrl) => {
    if (!googleSlidesUrl) return '';
    
    // Extract the presentation ID from various Google Slides URL formats
    let presentationId = '';
    
    if (googleSlidesUrl.includes('/presentation/d/')) {
      const match = googleSlidesUrl.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        presentationId = match[1];
      }
    }
    
    if (presentationId) {
      return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`;
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.googleSlidesUrl.includes('docs.google.com/presentation')) {
      setError('Please enter a valid Google Slides URL');
      return;
    }

    try {
      const embedUrl = extractEmbedUrl(formData.googleSlidesUrl);
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      
      const slideData = {
        ...formData,
        embedUrl,
        tags: tagsArray
      };

      const url = editingSlide ? `/api/google-slides/${editingSlide.id}` : '/api/google-slides';
      const method = editingSlide ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(slideData)
      });

      if (response.ok) {
        await fetchSlides();
        resetForm();
        setShowCreateForm(false);
        setEditingSlide(null);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save Google Slide');
      }
    } catch (error) {
      console.error('Error saving Google Slide:', error);
      setError('Failed to save Google Slide');
    }
  };

  const handleEdit = (slide) => {
    setFormData({
      title: slide.title,
      description: slide.description || '',
      googleSlidesUrl: slide.googleSlidesUrl,
      embedUrl: slide.embedUrl || '',
      isPublic: slide.isPublic,
      category: slide.category || '',
      tags: slide.tags ? slide.tags.join(', ') : ''
    });
    setEditingSlide(slide);
    setShowCreateForm(true);
  };

  const handleDelete = async (slideId) => {
    if (window.confirm('Are you sure you want to delete this Google Slide?')) {
      try {
        const response = await fetch(`/api/google-slides/${slideId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          await fetchSlides();
        } else {
          setError('Failed to delete Google Slide');
        }
      } catch (error) {
        console.error('Error deleting Google Slide:', error);
        setError('Failed to delete Google Slide');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      googleSlidesUrl: '',
      embedUrl: '',
      isPublic: true,
      category: '',
      tags: ''
    });
  };

  const openSlide = (slide) => {
    window.open(slide.googleSlidesUrl, '_blank');
  };

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>Authentication Required</h4>
          <p>Please log in to access Google Slides.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">
          <i className="fab fa-google me-2"></i>
          Google Slides
        </h1>
        {isTeacherOrAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingSlide(null);
              setShowCreateForm(true);
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Add Google Slide
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h4>{editingSlide ? 'Edit Google Slide' : 'Add New Google Slide'}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-8">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Math, Science, History"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Brief description of the presentation content"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Google Slides URL *</label>
                <input
                  type="url"
                  className="form-control"
                  name="googleSlidesUrl"
                  value={formData.googleSlidesUrl}
                  onChange={(e) => {
                    handleInputChange(e);
                    // Auto-generate embed URL
                    const embedUrl = extractEmbedUrl(e.target.value);
                    setFormData(prev => ({ ...prev, embedUrl }));
                  }}
                  placeholder="https://docs.google.com/presentation/d/..."
                  required
                />
                <div className="form-text">
                  Paste the sharing link from Google Slides. Make sure the presentation is set to "Anyone with the link can view".
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  className="form-control"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="tag1, tag2, tag3"
                />
                <div className="form-text">
                  Separate tags with commas to help students find related content.
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="isPublic"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="isPublic">
                    Make this presentation visible to students
                  </label>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  <i className="fas fa-save me-2"></i>
                  {editingSlide ? 'Update Slide' : 'Add Slide'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingSlide(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Slides List */}
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {slides.length === 0 ? (
            <div className="col-12">
              <div className="text-center py-5">
                <i className="fab fa-google fa-3x text-muted mb-3"></i>
                <h3 className="text-muted">No Google Slides yet</h3>
                <p className="text-muted">
                  {isTeacherOrAdmin 
                    ? "Add your first Google Slides presentation to get started."
                    : "No presentations are available at the moment."
                  }
                </p>
              </div>
            </div>
          ) : (
            slides.map(slide => (
              <div key={slide.id} className="col-lg-6 col-xl-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{slide.title}</h5>
                      {slide.isPublic && (
                        <span className="badge bg-success">Public</span>
                      )}
                    </div>
                    
                    {slide.description && (
                      <p className="card-text text-muted small">{slide.description}</p>
                    )}
                    
                    <div className="small text-muted mb-2">
                      {slide.category && (
                        <div><strong>Category:</strong> {slide.category}</div>
                      )}
                      <div>Created by {slide.creatorName}</div>
                      <div>{new Date(slide.createdAt).toLocaleDateString()}</div>
                    </div>

                    {slide.tags && slide.tags.length > 0 && (
                      <div className="mb-3">
                        {slide.tags.map((tag, index) => (
                          <span key={index} className="badge bg-light text-dark me-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Embedded Preview */}
                    {slide.embedUrl && (
                      <div className="mb-3">
                        <iframe
                          src={slide.embedUrl}
                          width="100%"
                          height="200"
                          frameBorder="0"
                          allowFullScreen
                          title={slide.title}
                          style={{ border: '1px solid #dee2e6', borderRadius: '0.375rem' }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer bg-transparent">
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openSlide(slide)}
                      >
                        <i className="fab fa-google me-1"></i>
                        Open in Google Slides
                      </button>
                      
                      {isTeacherOrAdmin && (user.isAdmin || slide.creatorId === user.id) && (
                        <>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleEdit(slide)}
                          >
                            <i className="fas fa-edit me-1"></i>
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(slide.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleSlides;