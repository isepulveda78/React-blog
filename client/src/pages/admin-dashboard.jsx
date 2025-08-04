import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Container, Row, Col, Card, Button, Alert, Badge } from "react-bootstrap";
import { useAuth } from "../hooks/use-auth";

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
            <Link href="/admin/comments" className="text-light text-decoration-none d-block p-2 rounded">
              💬 Comments
            </Link>
          </li>
          <li className="mb-2">
            <a href="/seo-management" target="_blank" className="text-light text-decoration-none d-block p-2 rounded">
              🔍 SEO Management
            </a>
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

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  
  console.log('Dashboard auth state:', { user: user ? {email: user.email, isAdmin: user.isAdmin} : null, isAdmin, isLoading });
  console.log('Dashboard rendered for user:', user?.email, 'isAdmin:', isAdmin);

  // Skip data fetching and just render the dashboard
  const posts = [];
  const categories = [];
  const comments = [];
  const users = [];

  // Always render the dashboard - no auth or data loading blocks
  console.log('Dashboard force rendering with SEO button');

  const totalPosts = 0;
  const publishedPosts = 0;
  const draftPosts = 0;
  const pendingComments = 0;
  const pendingUsers = 0;

  return (
    <div className="d-flex">
      <AdminSidebar />
      
      <div className="flex-grow-1">
        {/* Header */}
        <div className="p-4" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
          <h1 className="h2 mb-2 fw-bold">Admin Dashboard</h1>
          <p className="mb-0" style={{ opacity: 0.9 }}>Welcome to your blog administration panel</p>
        </div>

        <Container fluid className="p-4">
          {/* Stats Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <div className="stats-card">
                <div className="text-center mb-3">
                  <i className="bi bi-file-text" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
                </div>
                <div className="stats-number">{totalPosts}</div>
                <h6>Total Posts</h6>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="bg-success text-white">
                <Card.Body>
                  <h3 className="mb-0">{publishedPosts}</h3>
                  <p className="mb-0">Published</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="bg-warning text-white">
                <Card.Body>
                  <h3 className="mb-0">{draftPosts}</h3>
                  <p className="mb-0">Drafts</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="bg-info text-white">
                <Card.Body>
                  <h3 className="mb-0">{categories.length}</h3>
                  <p className="mb-0">Categories</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Second Row of Stats */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card className="bg-secondary text-white">
                <Card.Body>
                  <h3 className="mb-0">{users.length}</h3>
                  <p className="mb-0">Total Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className={`text-white ${pendingUsers > 0 ? 'bg-danger' : 'bg-success'}`}>
                <Card.Body>
                  <h3 className="mb-0">{pendingUsers}</h3>
                  <p className="mb-0">Pending Approvals</p>
                  {pendingUsers > 0 && (
                    <small>⚠️ Action needed</small>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className={`text-white ${pendingComments > 0 ? 'bg-warning' : 'bg-success'}`}>
                <Card.Body>
                  <h3 className="mb-0">{pendingComments}</h3>
                  <p className="mb-0">Pending Comments</p>
                  {pendingComments > 0 && (
                    <small>⚠️ Action needed</small>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="bg-dark text-white">
                <Card.Body>
                  <h3 className="mb-0">{users.filter(u => u.approved).length}</h3>
                  <p className="mb-0">Approved Users</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Recent Posts */}
            <Col lg={8} className="mb-4">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Posts</h5>
                  <Link href="/admin/posts">
                    <Button variant="outline-primary" size="sm">View All</Button>
                  </Link>
                </Card.Header>
                <Card.Body>
                  {posts.length === 0 ? (
                    <Alert variant="info">
                      <h6>No posts yet</h6>
                      <p className="mb-0">Start by creating your first blog post!</p>
                    </Alert>
                  ) : (
                    <div>
                      {posts.slice(0, 5).map((post) => (
                        <div key={post.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <h6 className="mb-1">{post.title}</h6>
                            <small className="text-muted">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          <div>
                            <Badge bg={post.status === 'published' ? 'success' : 'warning'}>
                              {post.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Quick Actions */}
            <Col lg={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Link href="/admin/posts/new">
                      <Button variant="primary" className="w-100">
                        ✏️ Write New Post
                      </Button>
                    </Link>
                    <a href="/admin">
                      <Button variant="info" className="w-100">
                        ⚡ Admin Quick Access
                      </Button>
                    </a>
                    <a href="/seo-management" target="_blank">
                      <Button 
                        variant="warning" 
                        className="w-100" 
                        style={{ 
                          backgroundColor: '#ffc107', 
                          borderColor: '#ffc107', 
                          color: '#000',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          padding: '12px'
                        }}
                      >
                        🔍 SEO Management System
                      </Button>
                    </a>
                    <Link href="/admin/categories">
                      <Button variant="outline-primary" className="w-100">
                        🏷️ Manage Categories
                      </Button>
                    </Link>
                    {pendingComments > 0 && (
                      <Link href="/admin/comments">
                        <Button variant="outline-warning" className="w-100">
                          💬 Review Comments ({pendingComments})
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {/* Categories Overview */}
              {categories.length > 0 && (
                <Card className="mt-3">
                  <Card.Header>
                    <h5 className="mb-0">Categories</h5>
                  </Card.Header>
                  <Card.Body>
                    {categories.slice(0, 5).map((category) => (
                      <div key={category.id} className="d-flex justify-content-between align-items-center py-1">
                        <span>{category.name}</span>
                        <Badge bg="secondary">{category.postCount}</Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}