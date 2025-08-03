import { Link } from "wouter";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";

export default function NotFound() {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={6} className="text-center">
          <div className="mb-4">
            <h1 className="display-1 text-muted">404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
              <Button variant="primary" size="lg">
                Go Back Home
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}