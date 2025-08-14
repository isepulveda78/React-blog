import React from 'react';

const Hero = ({ user }) => {
  console.log('Hero component - current user:', user);
  
  // CHANGE THIS LINE to switch hero images:
  // Option 1: '/img/day_of_the_dead.jpg' - Day of the Dead celebration
  // Option 2: '/img/day_of_the_dead.jpeg' - Day of the Dead artwork  
  // Option 3: External stock photo (always works)
  const heroImageSrc = '/img/day_of_the_dead.jpg';
  
  return (
    <section className="py-5 mb-5 bg-light">
      <div className="container">
        <div className="row align-items-center min-vh-50">
          <div className="col-lg-6">
            <div className="hero-content">
              <h1 className="display-4 fw-bold text-primary mb-4">
                Welcome to Mr. S Teaches!
              </h1>
              <p className="lead text-muted mb-4">
                Discover amazing content, share your thoughts, and connect with a community of learners and educators.
              </p>
            </div>
          </div>
          <div className="col-lg-6 text-center">
            <div className="hero-image">
              <img
                src={`${heroImageSrc}?v=${Date.now()}`}
                alt="Learning and teaching community"
                className="img-fluid rounded-3 shadow-lg"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
                onError={(e) => {
                  console.error('Hero image failed to load:', e.target.src);
                  // Fallback to external image if local image fails
                  e.target.src = 'https://images.unsplash.com/photo-1667090762902-bd8ee938d3d5?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
                }}
                onLoad={() => console.log('Hero image loaded successfully')}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;