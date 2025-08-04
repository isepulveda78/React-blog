import { useAuth } from "../hooks/use-auth";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import { Link } from "wouter";

export default function DebugDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  
  console.log('Debug Dashboard - Auth State:', {
    user: user ? { email: user.email, isAdmin: user.isAdmin } : null,
    isAdmin,
    isLoading
  });

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <Alert variant="info">
            <h4>Debug Dashboard - Authentication Status</h4>
            <p><strong>User:</strong> {user ? `${user.email} (ID: ${user.id})` : 'Not found'}</p>
            <p><strong>Is Admin:</strong> {user?.isAdmin ? 'Yes' : 'No'}</p>
            <p><strong>Hook isAdmin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Local Storage:</strong> {localStorage.getItem('user') ? 'Present' : 'Not found'}</p>
          </Alert>
          
          {/* Always show the SEO Management button for testing */}
          <Card className="mt-4">
            <Card.Header>
              <h5>SEO Management Test</h5>
            </Card.Header>
            <Card.Body>
              <p>Testing direct access to SEO Management:</p>
              <div className="d-grid gap-2">
                <Link href="/admin/seo">
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
                    🔍 SEO Management System (TEST)
                  </Button>
                </Link>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    fetch('/api/auth/user', { credentials: 'include' })
                      .then(res => res.json())
                      .then(data => {
                        console.log('Server auth check:', data);
                        alert('Server response: ' + JSON.stringify(data, null, 2));
                      })
                      .catch(err => {
                        console.log('Server auth error:', err);
                        alert('Server error: ' + err.message);
                      });
                  }}
                >
                  Test Server Authentication
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}