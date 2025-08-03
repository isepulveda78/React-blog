import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Navbar, Nav, Modal, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../hooks/use-auth";

function AuthModal({ show, onHide, isLogin, onToggleMode }) {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      onHide();
      setFormData({ email: '', password: '', username: '', name: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isLogin ? 'Sign In' : 'Create Account'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {!isLogin && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onToggleMode}>
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <Spinner animation="border" size="sm" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function BlogNavbar() {
  const { user, logout, isAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleShowAuth = (loginMode = true) => {
    setIsLoginMode(loginMode);
    setShowAuthModal(true);
  };

  const handleToggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <>
      <Navbar bg="white" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand as={Link} href="/" className="fw-bold text-primary fs-3">
            BlogCraft
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="ms-auto">
              {user ? (
                <>
                  <Nav.Link className="text-muted">Welcome, {user.name}</Nav.Link>
                  {isAdmin && (
                    <Nav.Link as={Link} href="/admin" className="text-primary">
                      Admin Dashboard
                    </Nav.Link>
                  )}
                  <Button variant="outline-secondary" size="sm" onClick={logout}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowAuth(true)}>
                    Sign In
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleShowAuth(false)}>
                    Sign Up
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <AuthModal
        show={showAuthModal}
        onHide={() => setShowAuthModal(false)}
        isLogin={isLoginMode}
        onToggleMode={handleToggleAuthMode}
      />
    </>
  );
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured).slice(0, 3);
  const recentPosts = filteredPosts.filter(post => !post.featured).slice(0, 6);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <BlogNavbar />
      
      <Container>
        {/* Hero Section */}
        <Row className="mb-5">
          <Col lg={8} className="mx-auto text-center">
            <h1 className="display-4 fw-bold mb-4">Welcome to BlogCraft</h1>
            <p className="lead text-muted mb-4">
              Discover amazing stories, insights, and ideas from our community of writers.
            </p>
            
            {/* Search and Filter */}
            <Row className="justify-content-center">
              <Col md={8}>
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Form.Select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <Row className="mb-5">
            <Col>
              <h2 className="h3 fw-bold mb-4">Featured Posts</h2>
              <Row>
                {featuredPosts.map((post) => (
                  <Col key={post.id} lg={4} md={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Badge bg="primary" className="mb-2">Featured</Badge>
                        <Card.Title>
                          <Link href={`/posts/${post.slug}`} className="text-decoration-none">
                            {post.title}
                          </Link>
                        </Card.Title>
                        <Card.Text className="text-muted">
                          {post.excerpt || `${post.content.replace(/<[^>]*>/g, '').substring(0, 120)}...`}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            By {post.authorName} • {new Date(post.publishedAt).toLocaleDateString()}
                          </small>
                          {post.categoryName && (
                            <Badge bg="secondary">{post.categoryName}</Badge>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        )}

        {/* Recent Posts */}
        <Row className="mb-5">
          <Col>
            <h2 className="h3 fw-bold mb-4">Recent Posts</h2>
            {postsLoading ? (
              <Row>
                {[...Array(6)].map((_, i) => (
                  <Col key={i} lg={4} md={6} className="mb-4">
                    <Card>
                      <Card.Body>
                        <div className="placeholder-glow">
                          <div className="placeholder col-6"></div>
                          <div className="placeholder col-4"></div>
                          <div className="placeholder col-8"></div>
                          <div className="placeholder col-3"></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : recentPosts.length === 0 ? (
              <Alert variant="info">
                <h5>No posts found</h5>
                <p>No posts match your search criteria. Try adjusting your search or category filter.</p>
              </Alert>
            ) : (
              <Row>
                {recentPosts.map((post) => (
                  <Col key={post.id} lg={4} md={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body>
                        <Card.Title>
                          <Link href={`/posts/${post.slug}`} className="text-decoration-none">
                            {post.title}
                          </Link>
                        </Card.Title>
                        <Card.Text className="text-muted">
                          {post.excerpt || `${post.content.replace(/<[^>]*>/g, '').substring(0, 120)}...`}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            By {post.authorName} • {new Date(post.publishedAt).toLocaleDateString()}
                          </small>
                          {post.categoryName && (
                            <Badge bg="secondary">{post.categoryName}</Badge>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>

        {/* Categories Section */}
        {categories.length > 0 && (
          <Row className="mb-5">
            <Col>
              <h2 className="h3 fw-bold mb-4">Browse by Category</h2>
              <Row>
                {categories.map((category) => (
                  <Col key={category.id} md={4} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <Card.Title>{category.name}</Card.Title>
                        <Card.Text className="text-muted">
                          {category.description}
                        </Card.Text>
                        <Badge bg="primary">{category.postCount} posts</Badge>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        )}
      </Container>

      {/* Footer */}
      <footer className="bg-dark text-light py-4 mt-5">
        <Container>
          <Row>
            <Col className="text-center">
              <p>&copy; 2024 BlogCraft. Built with React and Bootstrap.</p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}