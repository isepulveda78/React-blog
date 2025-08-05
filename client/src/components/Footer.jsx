import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5 className="text-white ama-font shadow-for-ama" style={{ fontFamily: 'ama !important', textShadow: '2px 2px 2px #000000' }}>Mr. S Teaches</h5>
            <p className="mb-0">Educational tools and interactive learning experiences.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="mb-2">
              <a href="/" className="text-light text-decoration-none me-3">Home</a>
              <a href="/blog" className="text-light text-decoration-none me-3">Blog</a>
              <a href="/educational-tools" className="text-light text-decoration-none">Tools</a>
            </div>
            <small className="text-muted">
              © {new Date().getFullYear()} Mr. S Teaches. All rights reserved.
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;