import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Alert, Spinner, Form } from "react-bootstrap";
import { Link } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { apiRequest } from "../lib/queryClient";

export default function AdminUsers() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h4>Access Denied</h4>
          <p>You don't have permission to access this page.</p>
          <Link href="/">
            <Button variant="primary">Go Back Home</Button>
          </Link>
        </Alert>
      </Container>
    );
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ userId, approved }) => {
      return await apiRequest(`/api/users/${userId}/approval`, {
        method: 'PATCH',
        body: { approved }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/users"]);
      setShowApprovalModal(false);
      setSelectedUser(null);
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }) => {
      return await apiRequest(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: { isAdmin }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/users"]);
    },
  });

  const handleApprovalAction = (user, action) => {
    setSelectedUser(user);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const confirmApprovalAction = () => {
    if (selectedUser) {
      approvalMutation.mutate({
        userId: selectedUser.id,
        approved: approvalAction === 'approve'
      });
    }
  };

  const handleRoleToggle = (user) => {
    roleMutation.mutate({
      userId: user.id,
      isAdmin: !user.isAdmin
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="h2 fw-bold">User Management</h1>
              <Link href="/admin">
                <Button variant="outline-secondary">Back to Admin</Button>
              </Link>
            </div>
          </Col>
        </Row>

        {/* Pending Approvals */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">
                  Pending Approvals 
                  {pendingUsers.length > 0 && (
                    <Badge bg="danger" className="ms-2">{pendingUsers.length}</Badge>
                  )}
                </h5>
              </Card.Header>
              <Card.Body>
                {isLoading ? (
                  <div className="text-center">
                    <Spinner animation="border" />
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <Alert variant="success" className="mb-0">
                    <h6>All caught up!</h6>
                    <p className="mb-0">No pending user approvals at this time.</p>
                  </Alert>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>@{u.username}</td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td>
                            <Button
                              variant="success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleApprovalAction(u, 'approve')}
                              disabled={approvalMutation.isPending}
                            >
                              {approvalMutation.isPending && selectedUser?.id === u.id && approvalAction === 'approve' ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                'Approve'
                              )}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleApprovalAction(u, 'reject')}
                              disabled={approvalMutation.isPending}
                            >
                              {approvalMutation.isPending && selectedUser?.id === u.id && approvalAction === 'reject' ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                'Reject'
                              )}
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
        </Row>

        {/* All Users */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">All Users ({users.length})</h5>
              </Card.Header>
              <Card.Body>
                {isLoading ? (
                  <div className="text-center">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>@{u.username}</td>
                          <td>
                            <Badge bg={u.approved ? 'success' : 'warning'}>
                              {u.approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={u.isAdmin ? 'primary' : 'secondary'}>
                              {u.isAdmin ? 'Admin' : 'User'}
                            </Badge>
                          </td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td>
                            {!u.approved ? (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleApprovalAction(u, 'approve')}
                                disabled={approvalMutation.isPending}
                              >
                                Approve
                              </Button>
                            ) : u.id !== user.id && (
                              <Button
                                variant={u.isAdmin ? 'outline-secondary' : 'outline-primary'}
                                size="sm"
                                onClick={() => handleRoleToggle(u)}
                                disabled={roleMutation.isPending}
                              >
                                {roleMutation.isPending ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  u.isAdmin ? 'Remove Admin' : 'Make Admin'
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Approval Confirmation Modal */}
        <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {approvalAction === 'approve' ? 'Approve User' : 'Reject User'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser && (
              <div>
                <p>
                  Are you sure you want to <strong>{approvalAction}</strong> the following user?
                </p>
                <Card className="bg-light">
                  <Card.Body>
                    <div><strong>Name:</strong> {selectedUser.name}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>Username:</strong> @{selectedUser.username}</div>
                    <div><strong>Registered:</strong> {formatDate(selectedUser.createdAt)}</div>
                  </Card.Body>
                </Card>
                {approvalAction === 'approve' ? (
                  <Alert variant="success" className="mt-3 mb-0">
                    This user will be able to access blog posts after approval.
                  </Alert>
                ) : (
                  <Alert variant="danger" className="mt-3 mb-0">
                    This user will not be able to access the blog content. This action can be reversed later.
                  </Alert>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'approve' ? 'success' : 'danger'}
              onClick={confirmApprovalAction}
              disabled={approvalMutation.isPending}
            >
              {approvalMutation.isPending ? (
                <Spinner animation="border" size="sm" />
              ) : (
                `${approvalAction === 'approve' ? 'Approve' : 'Reject'} User`
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}