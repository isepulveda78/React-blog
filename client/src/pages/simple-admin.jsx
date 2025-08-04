import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'wouter';
import { useAuth } from '../hooks/use-auth';

export default function SimpleAdmin() {
  const { user, isLoading } = useAuth();

  console.log('Simple Admin page loaded, user:', user?.email);

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading admin panel...</p>
      </Container>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        padding: '40px 0'
      }}>
        <Container>
          <h1 className="display-5 fw-bold">Admin Panel</h1>
          <p className="lead mb-0">Welcome, {user?.name || user?.email}</p>
        </Container>
      </div>

      <Container className="py-5">
        <Row>
          {/* SEO Management */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div style={{ 
                  fontSize: '3rem',
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '20px'
                }}>
                  🔍
                </div>
                <Card.Title>SEO Management</Card.Title>
                <Card.Text>
                  Complete SEO optimization tools and analytics.
                </Card.Text>
                <Link href="/admin/seo">
                  <Button variant="warning" className="w-100">Access SEO</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Posts Management */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div style={{ fontSize: '3rem', color: '#667eea', marginBottom: '20px' }}>
                  📝
                </div>
                <Card.Title>Manage Posts</Card.Title>
                <Card.Text>
                  Create, edit, and manage blog posts.
                </Card.Text>
                <Link href="/admin/posts">
                  <Button variant="primary" className="w-100">Manage Posts</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* User Management */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div style={{ fontSize: '3rem', color: '#28a745', marginBottom: '20px' }}>
                  👥
                </div>
                <Card.Title>Manage Users</Card.Title>
                <Card.Text>
                  User accounts, approvals, and permissions.
                </Card.Text>
                <Link href="/admin/users">
                  <Button variant="success" className="w-100">Manage Users</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Comments */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '20px' }}>
                  💬
                </div>
                <Card.Title>Moderate Comments</Card.Title>
                <Card.Text>
                  Review and moderate user comments.
                </Card.Text>
                <Link href="/admin/comments">
                  <Button variant="danger" className="w-100">Moderate Comments</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Categories */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div style={{ fontSize: '3rem', color: '#6f42c1', marginBottom: '20px' }}>
                  🏷️
                </div>
                <Card.Title>Categories</Card.Title>
                <Card.Text>
                  Organize posts with categories and tags.
                </Card.Text>
                <Link href="/admin/categories">
                  <Button variant="primary" className="w-100">Manage Categories</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Back to Blog */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div style={{ fontSize: '3rem', color: '#17a2b8', marginBottom: '20px' }}>
                  🏠
                </div>
                <Card.Title>Back to Blog</Card.Title>
                <Card.Text>
                  Return to the main blog homepage.
                </Card.Text>
                <Link href="/">
                  <Button variant="info" className="w-100">Go to Blog</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Body>
                <h5>Quick Stats</h5>
                <p className="text-muted">Dashboard loaded successfully for: <strong>{user?.email}</strong></p>
                <p className="text-muted">Admin status: <strong>{user?.isAdmin ? 'Yes' : 'No'}</strong></p>
                <p className="text-muted">Time: <strong>{new Date().toLocaleString()}</strong></p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}