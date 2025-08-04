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
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="floating-shapes"></div>
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={8} className="mx-auto text-center hero-content">
              <h1 className="display-2 fw-bold mb-4">
                Award winning <span className="gradient-text">Blog Platform</span><br />
                with stunning <span className="gradient-text">Ideas</span>
              </h1>
              <p className="lead mb-5" style={{ fontSize: '1.3rem', opacity: 0.9 }}>
                We shape the future of digital storytelling through craft and curiosity
              </p>
            
              {!user ? (
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <button className="assan-btn">
                    Get Started
                  </button>
                  <button className="assan-btn-outline">
                    Learn More
                  </button>
                </div>
              ) : !user.approved ? (
                <div className="assan-card p-5 mx-auto" style={{ maxWidth: '600px' }}>
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-clock-history" style={{ fontSize: '4rem', color: '#ffc107' }}></i>
                    </div>
                    <h3 className="mb-3" style={{ color: '#1a202c' }}>Account Pending Review</h3>
                    <p className="mb-0" style={{ color: '#718096' }}>
                      Your account has been created successfully! Our team is reviewing your registration 
                      and will approve your access shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="assan-card p-5 mx-auto mb-5" style={{ maxWidth: '600px' }}>
                    <div className="text-center">
                      <div className="mb-4">
                        <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem', color: '#28a745' }}></i>
                      </div>
                      <h3 className="mb-3" style={{ color: '#1a202c' }}>Welcome Back!</h3>
                      <p className="mb-0" style={{ color: '#718096' }}>
                        Your account is active. Explore our latest content, engage with the community, 
                        and share your thoughts.
                      </p>
                    </div>
                  </div>
                  
                  {user?.isAdmin && (
                    <div className="text-center">
                      <h4 className="mb-4">Admin Dashboard</h4>
                      <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <button 
                          className="assan-btn"
                          onClick={() => window.location.href = '/admin'}
                        >
                          Dashboard
                        </button>
                        <a href="/admin-access" className="assan-btn" style={{ textDecoration: 'none' }}>
                          Admin Tools
                        </a>
                        <a href="/seo-management" target="_blank" className="assan-btn" style={{ textDecoration: 'none' }}>
                          SEO Management
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="section-padding">
        <Container>
          <Row className="text-center mb-5">
            <Col lg={8} className="mx-auto">
              <h2 className="section-title">Who we are</h2>
              <h3 className="display-5 fw-bold mb-4">
                We're a <span className="gradient-text">digital content</span> platform
              </h3>
              <p className="section-subtitle">
                Connecting writers, readers, and content creators in a modern, 
                SEO-optimized environment built for the future of digital storytelling.
              </p>
            </Col>
          </Row>

          <Row className="g-4">
            <Col lg={4} md={6}>
              <div className="assan-card p-4 h-100">
                <div className="text-center mb-4">
                  <i className="bi bi-pencil-square" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                </div>
                <h5 className="mb-3">Content Creation</h5>
                <p className="text-muted mb-0">
                  Advanced WYSIWYG editor with image uploads, rich formatting, 
                  and SEO optimization tools for professional content creation.
                </p>
              </div>
            </Col>
            
            <Col lg={4} md={6}>
              <div className="assan-card p-4 h-100">
                <div className="text-center mb-4">
                  <i className="bi bi-people" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                </div>
                <h5 className="mb-3">Community Engagement</h5>
                <p className="text-muted mb-0">
                  Threaded comment system with user authentication, 
                  moderation tools, and social features for meaningful discussions.
                </p>
              </div>
            </Col>
            
            <Col lg={4} md={6}>
              <div className="assan-card p-4 h-100">
                <div className="text-center mb-4">
                  <i className="bi bi-search" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                </div>
                <h5 className="mb-3">SEO Optimization</h5>
                <p className="text-muted mb-0">
                  Built-in SEO analysis, meta tag management, 
                  sitemap generation, and Google Analytics integration.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="section-padding" style={{ background: 'var(--light-bg)' }}>
        <Container>
          <Row className="text-center">
            <Col lg={3} md={6} className="mb-4">
              <div className="stats-card">
                <div className="stats-number">500+</div>
                <h6>Blog Posts</h6>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <div className="stats-card">
                <div className="stats-number">1K+</div>
                <h6>Active Users</h6>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <div className="stats-card">
                <div className="stats-number">50+</div>
                <h6>Categories</h6>
              </div>
            </Col>
            <Col lg={3} md={6} className="mb-4">
              <div className="stats-card">
                <div className="stats-number">24/7</div>
                <h6>Support</h6>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}