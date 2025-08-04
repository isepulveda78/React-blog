import { useState, useEffect } from "react";
import { Container, Row, Col, Alert, Button } from "react-bootstrap";
import { useAuth } from "../hooks/use-auth";
import { updateMetaTags } from "../utils/seo.js";

export default function SimpleHome() {
  const { user } = useAuth();

  // Update homepage SEO meta tags
  useEffect(() => {
    updateMetaTags({
      title: 'BlogCraft - Modern Blog Platform',
      description: 'Join our community of writers and readers. Access exclusive blog content, engage with authors, and share your thoughts.',
      keywords: ['blog', 'platform', 'community', 'writing', 'reading', 'content'],
      ogTitle: 'BlogCraft - Modern Blog Platform',
      ogDescription: 'Join our community of writers and readers. Access exclusive blog content and engage with authors.',
      ogImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630',
      canonicalUrl: window.location.href,
      seoTitle: 'BlogCraft - Modern Blog Platform for Writers and Readers'
    });
  }, []);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row className="mb-5">
          <Col lg={8} className="mx-auto text-center">
            <h1 className="display-4 fw-bold mb-4">Welcome to BlogCraft</h1>
            
            <div>Debug Info: {JSON.stringify({user: user ? {approved: user.approved, isAdmin: user.isAdmin} : null})}</div>
            
            {!user ? (
              <div>
                <p className="lead text-muted mb-4">
                  Join our community of writers and readers. Sign up to access exclusive blog content.
                </p>
                <Alert variant="info" className="mx-auto" style={{ maxWidth: '500px' }}>
                  <Alert.Heading>Authentication Required</Alert.Heading>
                  <p>Please sign in or create an account to view blog posts.</p>
                </Alert>
              </div>
            ) : !user.approved ? (
              <div>
                <p className="lead text-muted mb-4">
                  Your account is being reviewed by our administrators.
                </p>
                <Alert variant="warning" className="mx-auto" style={{ maxWidth: '500px' }}>
                  <Alert.Heading>Account Pending Approval</Alert.Heading>
                  <p>Your account has been created successfully! Please wait for an administrator to approve your account before you can access blog posts.</p>
                </Alert>
              </div>
            ) : (
              <div>
                <p className="lead text-muted mb-4">
                  Welcome back! You now have full access to our blog content.
                </p>
                <Alert variant="success" className="mx-auto" style={{ maxWidth: '500px' }}>
                  <Alert.Heading>Access Granted</Alert.Heading>
                  <p>Your account has been approved. You can now view all blog posts and interact with the community.</p>
                </Alert>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}