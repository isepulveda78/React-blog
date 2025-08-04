import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Container, Row, Col, Card, Button, Badge, Alert, Table, Dropdown, Modal } from "react-bootstrap";
import { useAuth } from "../hooks/use-auth";
import { queryClient, apiRequest } from "../lib/queryClient";

function AdminSidebar() {
  return (
    <div className="bg-dark text-light p-3" style={{ minHeight: '100vh', width: '250px' }}>
      <h4 className="mb-4">Admin Panel</h4>
      <nav>
        <ul className="list-unstyled">
          <li className="mb-2">
            <Link href="/admin-access" className="text-light text-decoration-none d-block p-2 rounded">
              📊 Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/posts" className="text-light text-decoration-none d-block p-2 rounded bg-primary">
              📝 Posts
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/categories" className="text-light text-decoration-none d-block p-2 rounded">
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

export default function AdminPosts() {
  const { isAdmin } = useAuth();
  const [deletePostId, setDeletePostId] = useState(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: isAdmin,
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest("DELETE", `/api/posts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setDeletePostId(null);
    },
  });

  const handleDelete = () => {
    if (deletePostId) {
      deletePostMutation.mutate(deletePostId);
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
            <h1 className="h3 mb-0">Posts</h1>
            <p className="text-muted mb-0">Manage your blog posts</p>
          </div>
          <Link href="/admin/posts/new">
            <Button variant="primary">
              ➕ New Post
            </Button>
          </Link>
        </div>

        <Container fluid className="p-4">
          <Card>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <Alert variant="info">
                  <h5>No posts yet</h5>
                  <p>Start creating amazing content for your blog!</p>
                  <Link href="/admin/posts/new">
                    <Button variant="primary">Create Your First Post</Button>
                  </Link>
                </Alert>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Category</th>
                      <th>Author</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id}>
                        <td>
                          <div>
                            <h6 className="mb-1">{post.title}</h6>
                            {post.featured && <Badge bg="warning">Featured</Badge>}
                          </div>
                        </td>
                        <td>
                          <Badge bg={post.status === 'published' ? 'success' : 'warning'}>
                            {post.status}
                          </Badge>
                        </td>
                        <td>{post.categoryName || 'Uncategorized'}</td>
                        <td>{post.authorName}</td>
                        <td>
                          <small>
                            {post.status === 'published' 
                              ? new Date(post.publishedAt).toLocaleDateString()
                              : new Date(post.createdAt).toLocaleDateString()
                            }
                          </small>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" size="sm">
                              Actions
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item as={Link} href={`/posts/${post.slug}`}>
                                👁️ View
                              </Dropdown.Item>
                              <Dropdown.Item as={Link} href={`/admin/posts/edit/${post.id}`}>
                                ✏️ Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                className="text-danger"
                                onClick={() => setDeletePostId(post.id)}
                              >
                                🗑️ Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deletePostId} onHide={() => setDeletePostId(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this post? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeletePostId(null)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deletePostMutation.isPending}
          >
            {deletePostMutation.isPending ? 'Deleting...' : 'Delete Post'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}