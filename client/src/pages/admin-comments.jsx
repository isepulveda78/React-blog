import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Modal } from "react-bootstrap";
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
            <Link href="/admin/categories" className="text-light text-decoration-none d-block p-2 rounded">
              🏷️ Categories
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/comments" className="text-light text-decoration-none d-block p-2 rounded bg-primary">
              💬 Comments
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

export default function AdminComments() {
  const { isAdmin } = useAuth();
  const [deleteComment, setDeleteComment] = useState(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/comments"],
    enabled: isAdmin,
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await apiRequest("PUT", `/api/comments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest("DELETE", `/api/comments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setDeleteComment(null);
    },
  });

  const handleApprove = (commentId) => {
    updateCommentMutation.mutate({ id: commentId, status: 'approved' });
  };

  const handleReject = (commentId) => {
    updateCommentMutation.mutate({ id: commentId, status: 'rejected' });
  };

  const handleDelete = () => {
    if (deleteComment) {
      deleteCommentMutation.mutate(deleteComment.id);
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

  const pendingComments = comments.filter(comment => comment.status === 'pending');
  const approvedComments = comments.filter(comment => comment.status === 'approved');
  const rejectedComments = comments.filter(comment => comment.status === 'rejected');

  return (
    <div className="d-flex">
      <AdminSidebar />
      
      <div className="flex-grow-1">
        {/* Header */}
        <div className="bg-white shadow-sm p-4">
          <h1 className="h3 mb-0">Comments</h1>
          <p className="text-muted mb-0">Moderate comments from your blog posts</p>
        </div>

        <Container fluid className="p-4">
          {/* Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="bg-warning text-white">
                <Card.Body>
                  <h4 className="mb-0">{pendingComments.length}</h4>
                  <p className="mb-0">Pending Review</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-success text-white">
                <Card.Body>
                  <h4 className="mb-0">{approvedComments.length}</h4>
                  <p className="mb-0">Approved</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-danger text-white">
                <Card.Body>
                  <h4 className="mb-0">{rejectedComments.length}</h4>
                  <p className="mb-0">Rejected</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-info text-white">
                <Card.Body>
                  <h4 className="mb-0">{comments.length}</h4>
                  <p className="mb-0">Total Comments</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5 className="mb-0">All Comments</h5>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <Alert variant="info">
                  <h5>No comments yet</h5>
                  <p className="mb-0">Comments from your blog posts will appear here for moderation.</p>
                </Alert>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Author</th>
                      <th>Comment</th>
                      <th>Post</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments.map((comment) => (
                      <tr key={comment.id}>
                        <td>
                          <div>
                            <h6 className="mb-1">{comment.authorName}</h6>
                            <small className="text-muted">{comment.authorEmail}</small>
                          </div>
                        </td>
                        <td>
                          <p className="mb-0" style={{ maxWidth: '300px' }}>
                            {comment.content.length > 100 
                              ? `${comment.content.substring(0, 100)}...`
                              : comment.content
                            }
                          </p>
                        </td>
                        <td>
                          <Link href={`/posts/${comment.postSlug}`} className="text-decoration-none">
                            {comment.postTitle}
                          </Link>
                        </td>
                        <td>
                          <small>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <Badge 
                            bg={
                              comment.status === 'approved' ? 'success' :
                              comment.status === 'rejected' ? 'danger' : 'warning'
                            }
                          >
                            {comment.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {comment.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleApprove(comment.id)}
                                  disabled={updateCommentMutation.isPending}
                                >
                                  ✓ Approve
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleReject(comment.id)}
                                  disabled={updateCommentMutation.isPending}
                                >
                                  ✗ Reject
                                </Button>
                              </>
                            )}
                            {comment.status === 'rejected' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleApprove(comment.id)}
                                disabled={updateCommentMutation.isPending}
                              >
                                ✓ Approve
                              </Button>
                            )}
                            {comment.status === 'approved' && (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleReject(comment.id)}
                                disabled={updateCommentMutation.isPending}
                              >
                                ✗ Reject
                              </Button>
                            )}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => setDeleteComment(comment)}
                            >
                              🗑️
                            </Button>
                          </div>
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
      <Modal show={!!deleteComment} onHide={() => setDeleteComment(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this comment? This action cannot be undone.
          <div className="mt-3 p-3 bg-light rounded">
            <strong>{deleteComment?.authorName}:</strong>
            <p className="mb-0 mt-1">{deleteComment?.content}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteComment(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteCommentMutation.isPending}
          >
            {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete Comment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}