import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'wouter';

export default function AdminAccess() {
  return (
    <div className="min-vh-100" style={{ backgroundColor: '#fafbfc' }}>
      {/* Hero Section */}
      <div className="text-center" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 0',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><defs><pattern id=\'grain\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'><circle cx=\'20\' cy=\'20\' r=\'1\' fill=\'white\' opacity=\'0.1\'/><circle cx=\'80\' cy=\'40\' r=\'1\' fill=\'white\' opacity=\'0.1\'/><circle cx=\'40\' cy=\'80\' r=\'1\' fill=\'white\' opacity=\'0.1\'/></pattern></defs><rect width=\'100\' height=\'100\' fill=\'url(%23grain)\'/></svg>")',
          opacity: 0.3
        }} />
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="display-4 fw-bold mb-4">
            Admin <span style={{ opacity: 0.9 }}>Command Center</span>
          </h1>
          <p className="lead mb-0" style={{ fontSize: '1.3rem', opacity: 0.9 }}>
            Complete control over your blog platform with powerful admin tools
          </p>
        </Container>
      </div>

      {/* Admin Tools Grid */}
      <Container style={{ padding: '80px 0' }}>
        <Row>
          {/* SEO Management - Highlighted */}
          <Col md={6} lg={4} className="mb-4">
            <Card style={{
              background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100)',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 15px 35px rgba(255, 193, 7, 0.4)',
              transition: 'all 0.3s ease',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 25px 45px rgba(255, 193, 7, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 193, 7, 0.4)';
            }}>
              <Card.Body className="text-center p-5">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#000',
                  fontSize: '2rem'
                }}>
                  🔍
                </div>
                <h4 className="mb-3" style={{ color: '#000' }}>SEO Management System</h4>
                <p className="mb-4" style={{ color: '#444' }}>
                  Complete SEO analysis, meta tag optimization, and sitemap generation.
                </p>
                <Link 
                  href="/admin/seo"
                  style={{
                    background: '#000',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 30px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '14px'
                  }}
                >
                  Access SEO Tools
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Admin Dashboard */}
          <Col md={6} lg={4} className="mb-4">
            <Card style={{
              background: 'white',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}>
              <Card.Body className="text-center p-5">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  📊
                </div>
                <h4 className="mb-3">Admin Dashboard</h4>
                <p className="text-muted mb-4">
                  View statistics, manage content, and access all admin features.
                </p>
                <Link 
                  href="/admin"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 30px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '14px'
                  }}
                >
                  Open Dashboard
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Manage Posts */}
          <Col md={6} lg={4} className="mb-4">
            <Card style={{
              background: 'white',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}>
              <Card.Body className="text-center p-5">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  📝
                </div>
                <h4 className="mb-3">Manage Posts</h4>
                <p className="text-muted mb-4">
                  Create, edit, and manage blog posts with rich content editor.
                </p>
                <Link 
                  href="/admin/posts"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 30px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '14px'
                  }}
                >
                  Manage Posts
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Manage Users */}
          <Col md={6} lg={4} className="mb-4">
            <Card style={{
              background: 'white',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}>
              <Card.Body className="text-center p-5">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  👥
                </div>
                <h4 className="mb-3">Manage Users</h4>
                <p className="text-muted mb-4">
                  Control user accounts, approvals, and administrative privileges.
                </p>
                <Link 
                  href="/admin/users"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 30px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '14px'
                  }}
                >
                  Manage Users
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Manage Comments */}
          <Col md={6} lg={4} className="mb-4">
            <Card style={{
              background: 'white',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}>
              <Card.Body className="text-center p-5">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  💬
                </div>
                <h4 className="mb-3">Manage Comments</h4>
                <p className="text-muted mb-4">
                  Moderate comments, approve or reject user submissions.
                </p>
                <Link 
                  href="/admin/comments"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 30px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '14px'
                  }}
                >
                  Manage Comments
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Back to Home */}
          <Col md={6} lg={4} className="mb-4">
            <Card style={{
              background: 'white',
              border: 'none',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}>
              <Card.Body className="text-center p-5">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  🏠
                </div>
                <h4 className="mb-3">Back to Blog</h4>
                <p className="text-muted mb-4">
                  Return to the main blog homepage and public content.
                </p>
                <Link 
                  href="/"
                  style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 30px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '14px'
                  }}
                >
                  Go Home
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}