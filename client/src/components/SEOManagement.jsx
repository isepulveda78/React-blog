import React, { useState, useEffect } from 'react';

const { toast } = window;

const SEOManagement = ({ user }) => {
  const [seoSettings, setSeoSettings] = useState({
    siteName: 'Mr. S Teaches',
    siteDescription: 'Educational content and insights',
    defaultMetaKeywords: [],
    googleAnalyticsId: '',
    googleSearchConsoleId: '',
    robotsTxt: '',
    sitemapEnabled: true
  });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user || !user.isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchSEOSettings();
    fetchPosts();
  }, []);

  const fetchSEOSettings = async () => {
    try {
      const response = await fetch('/api/seo/settings', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSeoSettings({ ...seoSettings, ...data });
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };

  const saveSEOSettings = async () => {
    try {
      const response = await fetch('/api/seo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(seoSettings)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "SEO settings saved successfully",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save SEO settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error saving SEO settings",
        variant: "destructive"
      });
    }
  };

  const generateSitemap = async () => {
    try {
      const response = await fetch('/api/seo/sitemap/generate', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Sitemap generated successfully",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate sitemap",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error generating sitemap",
        variant: "destructive"
      });
    }
  };

  const analyzeSEO = (post) => {
    const issues = [];
    
    if (!post.seoTitle || post.seoTitle.length < 30 || post.seoTitle.length > 60) {
      issues.push('SEO title should be 30-60 characters');
    }
    
    if (!post.metaDescription || post.metaDescription.length < 120 || post.metaDescription.length > 160) {
      issues.push('Meta description should be 120-160 characters');
    }
    
    if (!post.focusKeyword) {
      issues.push('No focus keyword set');
    }
    
    if (!post.metaKeywords || post.metaKeywords.length === 0) {
      issues.push('No meta keywords set');
    }
    
    return issues;
  };

  const handleSettingChange = (field, value) => {
    setSeoSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleKeywordsChange = (value) => {
    const keywords = value.split(',').map(kw => kw.trim()).filter(kw => kw);
    handleSettingChange('defaultMetaKeywords', keywords);
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="display-4 fw-bold text-primary mb-4">SEO Management</h1>

      <div className="row">
        <div className="col-lg-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">SEO Settings</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Site Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={seoSettings.siteName}
                  onChange={(e) => handleSettingChange('siteName', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Site Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={seoSettings.siteDescription}
                  onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Default Meta Keywords</label>
                <input
                  type="text"
                  className="form-control"
                  value={seoSettings.defaultMetaKeywords.join(', ')}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Google Analytics ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={seoSettings.googleAnalyticsId}
                  onChange={(e) => handleSettingChange('googleAnalyticsId', e.target.value)}
                  placeholder="GA-XXXXXXXXX"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Google Search Console ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={seoSettings.googleSearchConsoleId}
                  onChange={(e) => handleSettingChange('googleSearchConsoleId', e.target.value)}
                  placeholder="google-site-verification=..."
                />
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={seoSettings.sitemapEnabled}
                    onChange={(e) => handleSettingChange('sitemapEnabled', e.target.checked)}
                  />
                  <label className="form-check-label">
                    Enable XML Sitemap
                  </label>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={saveSEOSettings}>
                  Save Settings
                </button>
                <button className="btn btn-outline-primary" onClick={generateSitemap}>
                  Generate Sitemap
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">SEO Analysis</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">SEO analysis for your posts:</p>
              
              {posts.map(post => {
                const issues = analyzeSEO(post);
                return (
                  <div key={post.id} className="border rounded p-3 mb-3">
                    <h6>{post.title}</h6>
                    {issues.length === 0 ? (
                      <span className="badge bg-success">SEO Optimized</span>
                    ) : (
                      <div>
                        <span className="badge bg-warning me-2">{issues.length} Issues</span>
                        <ul className="list-unstyled mt-2 mb-0">
                          {issues.map((issue, index) => (
                            <li key={index} className="text-warning small">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {posts.length === 0 && (
                <p className="text-muted">No posts to analyze</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOManagement;