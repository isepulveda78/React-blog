import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Container, Row, Col, Card, Button, Form, Alert, Table, Modal, Badge } from "react-bootstrap";
import { useAuth } from "../hooks/use-auth";
import { queryClient, apiRequest } from "../lib/queryClient";

function AdminSidebar() {
  return (
    <div className="bg-dark text-light p-3" style={{ minHeight: '100vh', width: '250px' }}>
      <h4 className="mb-4">Admin Panel</h4>
      <nav>
        <ul className="list-unstyled">
          <li className="mb-2">
            <Link href="/admin" className="text-light text-decoration-none d-block p-2 rounded">
              📊 Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/posts" className="text-light text-decoration-none d-block p-2 rounded">
              📝 Posts
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/categories" className="text-light text-decoration-none d-block p-2 rounded bg-primary">
              🏷️ Categories
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/comments" className="text-light text-decoration-none d-block p-2 rounded">
              💬 Comments
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/seo" className="text-light text-decoration-none d-block p-2 rounded">
              🔍 SEO Management
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/users" className="text-light text-decoration-none d-block p-2 rounded">
              👥 Users
            </Link>
          </li>
          <li className="mt-4">
            <Link href="/" className="text-light text-decoration-none d-block p-2 rounded">
              ← Back to Blog
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default function AdminCategories() {
  const { isAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: ""
  });
  const [error, setError] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAdmin,
  });

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !editingCategory ? { slug: generateSlug(value) } : {})
    }));
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowCreateModal(false);
      setFormData({ name: "", slug: "", description: "" });
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      setFormData({ name: "", slug: "", description: "" });
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteCategory(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "" });
    setError("");
  };

  const handleDelete = () => {
    if (deleteCategory) {
      deleteCategoryMutation.mutate(deleteCategory.id);
    }
  };

  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={6}>
            <Alert variant="warning">
              <h4>Access Denied</h4>
              <p>You don't have permission to access the admin area.</p>
              <Link href="/">
                <Button variant="primary">Return to Blog</Button>
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div className="d-flex">
      <AdminSidebar />
      
      <div className="flex-grow-1">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 mb-0">Categories</h1>
            <p className="text-muted mb-0">Organize your blog posts into categories</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            ➕ New Category
          </Button>
        </div>

        <Container fluid className="p-4">
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Categories ({categories.length})</h5>
                </Card.Header>
                <Card.Body>
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading categories...</p>
                    </div>
                  ) : categories.length === 0 ? (
                    <Alert variant="info">
                      <h5>No categories yet</h5>
                      <p>Create categories to organize your blog posts.</p>
                      <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        Create Your First Category
                      </Button>
                    </Alert>
                  ) : (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Slug</th>
                          <th>Posts</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category.id}>
                            <td>
                              <div>
                                <h6 className="mb-1">{category.name}</h6>
                                {category.description && (
                                  <small className="text-muted">{category.description}</small>
                                )}
                              </div>
                            </td>
                            <td>
                              <code>/{category.slug}</code>
                            </td>
                            <td>
                              <Badge bg="secondary">{category.postCount || 0}</Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEdit(category)}
                              >
                                ✏️ Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => setDeleteCategory(category)}
                              >
                                🗑️ Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {editingCategory && (
              <Col lg={4}>
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Edit Category</h5>
                    <Button variant="outline-secondary" size="sm" onClick={handleCancelEdit}>
                      ✕
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>URL Slug *</Form.Label>
                        <Form.Control
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Brief description..."
                        />
                      </Form.Group>

                      <div className="d-grid gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={updateCategoryMutation.isPending}
                        >
                          {updateCategoryMutation.isPending ? 'Updating...' : 'Update Category'}
                        </Button>
                        <Button variant="outline-secondary" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Container>
      </div>

      {/* Create Category Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Category</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Category Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Technology, Design, Business..."
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>URL Slug *</Form.Label>
              <Form.Control
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="technology"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="A brief description of this category..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteCategory} onHide={() => setDeleteCategory(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the category "{deleteCategory?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteCategory(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteCategoryMutation.isPending}
          >
            {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete Category'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}