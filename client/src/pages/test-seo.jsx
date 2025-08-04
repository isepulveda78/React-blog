import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import { Link } from "wouter";

export default function TestSEO() {
  return (
    <Container className="py-5">
      <Row>
        <Col>
          <Alert variant="success">
            <h4>SEO Management System - Test Page</h4>
            <p>This is a test SEO management page that bypasses all authentication.</p>
          </Alert>
          
          <Card className="mt-4">
            <Card.Header>
              <h5>SEO Management Features</h5>
            </Card.Header>
            <Card.Body>
              <h6>Available Features:</h6>
              <ul>
                <li>Real-time SEO scoring and analysis</li>
                <li>Global SEO settings configuration</li>
                <li>Meta tag and Open Graph optimization</li>
                <li>Sitemap and robots.txt generation</li>
                <li>SEO recommendations and content analysis</li>
              </ul>
              
              <div className="mt-3">
                <Link href="/admin">
                  <Button variant="primary">Back to Admin</Button>
                </Link>
                <Link href="/admin/seo">
                  <Button variant="warning" className="ms-2">Try Main SEO Page</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}