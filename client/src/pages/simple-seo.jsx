import { useState } from "react";

export default function SimpleSEO() {
  const [message, setMessage] = useState('');

  const handleClick = () => {
    setMessage('SEO Management System is Working!');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
      <h1 style={{ color: '#198754' }}>✅ SEO Management System</h1>
      <p style={{ fontSize: '18px', margin: '20px 0' }}>
        This page confirms that client-side routing is working properly.
      </p>
      
      <button 
        onClick={handleClick}
        style={{
          backgroundColor: '#ffc107',
          border: 'none',
          padding: '15px 30px',
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '10px'
        }}
      >
        🔍 Test SEO Functionality
      </button>
      
      {message && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '5px',
          color: '#0c5460'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h3>Available SEO Features:</h3>
        <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
          <li>Real-time SEO scoring and analysis</li>
          <li>Global SEO settings configuration</li>
          <li>Meta tag and Open Graph optimization</li>
          <li>Sitemap and robots.txt generation</li>
          <li>SEO recommendations and content analysis</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <a href="/admin" style={{ 
          backgroundColor: '#0d6efd', 
          color: 'white', 
          padding: '10px 20px', 
          textDecoration: 'none', 
          borderRadius: '5px',
          margin: '5px'
        }}>
          Back to Admin Dashboard
        </a>
        <a href="/admin/seo" style={{ 
          backgroundColor: '#fd7e14', 
          color: 'white', 
          padding: '10px 20px', 
          textDecoration: 'none', 
          borderRadius: '5px',
          margin: '5px'
        }}>
          Full SEO Management
        </a>
      </div>
    </div>
  );
}