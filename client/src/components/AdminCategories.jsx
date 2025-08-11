import React, { useState, useEffect } from 'react';

const AdminCategories = ({ user }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug when name changes
    if (field === 'name') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(editingCategory 
          ? 'Category updated successfully' 
          : 'Category created successfully'
        );
        
        // Reset form and refresh categories
        setFormData({ name: '', slug: '', description: '' });
        setEditingCategory(null);
        setShowForm(false);
        await fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Category deleted successfully');
        await fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Error deleting category');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', slug: '', description: '' });
    setEditingCategory(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="display-5 fw-bold text-primary">Category Management</h1>
            <button
              className="btn btn-success"
              onClick={() => setShowForm(true)}
              disabled={showForm}
            >
              <i className="fas fa-plus me-2"></i>
              Add New Category
            </button>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-dismissible fade show">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}

          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          placeholder="Enter category name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Slug</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.slug}
                          onChange={(e) => handleFormChange('slug', e.target.value)}
                          placeholder="category-url-slug"
                        />
                        <small className="text-muted">
                          Used in URLs. Auto-generated from name if left empty.
                        </small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Optional description for this category"
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          {editingCategory ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingCategory ? 'Update Category' : 'Create Category'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Categories ({categories.length})</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2 text-muted">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-folder-open display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">No Categories Yet</h5>
                  <p className="text-muted">Create your first category to organize your blog posts.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th>Posts</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => (
                        <tr key={category.id}>
                          <td>
                            <strong>{category.name}</strong>
                          </td>
                          <td>
                            <code>{category.slug}</code>
                          </td>
                          <td>
                            {category.description ? (
                              <span className="text-muted">
                                {category.description.length > 50 
                                  ? category.description.substring(0, 50) + '...'
                                  : category.description
                                }
                              </span>
                            ) : (
                              <span className="text-muted fst-italic">No description</span>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {category.postCount || 0} posts
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(category.createdAt).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleEdit(category)}
                                title="Edit Category"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(category.id, category.name)}
                                title="Delete Category"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;