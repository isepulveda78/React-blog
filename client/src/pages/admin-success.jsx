import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'wouter';

export default function AdminSuccess() {
  return (
    <div className="min-vh-100" style={{ backgroundColor: '#fafbfc' }}>
      {/* Success Hero Section */}
      <div className="text-center" style={{ 
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
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
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '4rem'
          }}>
            ✅
          </div>
          <h1 className="display-4 fw-bold mb-4">
            Admin Access <span style={{ opacity: 0.9 }}>Granted</span>
          </h1>
          <p className="lead mb-0" style={{ fontSize: '1.3rem', opacity: 0.9 }}>
            Quick access to SEO settings and administrative tools
          </p>
        </Container>
      </div>

      {/* Quick Access Tools */}
      <Container style={{ padding: '80px 0' }}>
        <Row className="justify-content-center">
          {/* SEO Settings - Priority Access */}
          <Col md={6} lg={5} className="mb-4">
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
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 25px',
                  color: '#000',
                  fontSize: '3rem'
                }}>
                  🔍
                </div>
                <h3 className="mb-3" style={{ color: '#000', fontWeight: 'bold' }}>SEO Settings</h3>
                <p className="mb-4" style={{ color: '#444', fontSize: '1.1rem' }}>
                  Comprehensive SEO management, meta tags, analytics, and optimization tools.
                </p>
                <Link 
                  href="/admin/seo"
                  style={{
                    background: '#000',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '18px 40px',
                    fontWeight: '700',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '16px'
                  }}
                >
                  Access SEO Tools
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* Admin Dashboard */}
          <Col md={6} lg={5} className="mb-4">
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
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 25px',
                  color: 'white',
                  fontSize: '3rem'
                }}>
                  📊
                </div>
                <h3 className="mb-3" style={{ fontWeight: 'bold' }}>Admin Dashboard</h3>
                <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                  Complete administrative control with posts, users, comments, and analytics.
                </p>
                <Link 
                  href="/admin"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '18px 40px',
                    fontWeight: '700',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '16px'
                  }}
                >
                  Open Dashboard
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Links Row */}
        <Row className="justify-content-center mt-5">
          <Col lg={10}>
            <div className="text-center mb-4">
              <h4 style={{ color: '#6c757d', fontWeight: '600' }}>Quick Access Links</h4>
            </div>
            <Row>
              <Col md={3} className="mb-3">
                <Link 
                  href="/admin/posts"
                  style={{
                    display: 'block',
                    background: 'white',
                    borderRadius: '15px',
                    padding: '20px',
                    textDecoration: 'none',
                    color: '#495057',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
                  <div style={{ fontWeight: '600' }}>Manage Posts</div>
                </Link>
              </Col>
              <Col md={3} className="mb-3">
                <Link 
                  href="/admin/users"
                  style={{
                    display: 'block',
                    background: 'white',
                    borderRadius: '15px',
                    padding: '20px',
                    textDecoration: 'none',
                    color: '#495057',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                  <div style={{ fontWeight: '600' }}>Manage Users</div>
                </Link>
              </Col>
              <Col md={3} className="mb-3">
                <Link 
                  href="/admin/comments"
                  style={{
                    display: 'block',
                    background: 'white',
                    borderRadius: '15px',
                    padding: '20px',
                    textDecoration: 'none',
                    color: '#495057',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</div>
                  <div style={{ fontWeight: '600' }}>Moderate Comments</div>
                </Link>
              </Col>
              <Col md={3} className="mb-3">
                <Link 
                  href="/"
                  style={{
                    display: 'block',
                    background: 'white',
                    borderRadius: '15px',
                    padding: '20px',
                    textDecoration: 'none',
                    color: '#495057',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏠</div>
                  <div style={{ fontWeight: '600' }}>Back to Blog</div>
                </Link>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}