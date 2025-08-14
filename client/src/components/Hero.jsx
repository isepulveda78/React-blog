import React, { useState } from 'react';

const Hero = ({ user }) => {
  console.log('Hero component - current user:', user);
  
  // Available hero images - add more images here as needed
  const heroImages = [
    {
      src: '/img/day_of_the_dead.jpg',
      alt: 'Day of the Dead celebration',
      name: 'Day of the Dead'
    },
    {
      src: '/img/day_of_the_dead.jpeg', 
      alt: 'Day of the Dead artwork',
      name: 'Day of the Dead Art'
    },
    {
      src: 'https://images.unsplash.com/photo-1667090762902-bd8ee938d3d5?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      alt: 'Learning and teaching community',
      name: 'Education'
    }
  ];
  
  // Store selected image in localStorage so it persists
  const [currentImageIndex, setCurrentImageIndex] = useState(() => {
    const saved = localStorage.getItem('heroImageIndex');
    return saved !== null ? parseInt(saved) : 0;
  });
  
  const currentImage = heroImages[currentImageIndex] || heroImages[0];
  
  const changeImage = (index) => {
    setCurrentImageIndex(index);
    localStorage.setItem('heroImageIndex', index.toString());
  };

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
              
              {/* Image selector - only show if user is admin/teacher */}
              {user && (user.isAdmin || user.role === 'teacher') && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-2">Change Hero Image:</small>
                  <div className="btn-group" role="group">
                    {heroImages.map((img, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`btn ${currentImageIndex === index ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                        onClick={() => changeImage(index)}
                        title={img.name}
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-6 text-center">
            <div className="hero-image">
              <img
                src={`${currentImage.src}${currentImage.src.startsWith('/') ? '?v=' + Date.now() : ''}`}
                alt={currentImage.alt}
                className="img-fluid rounded-3 shadow-lg"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
                onError={(e) => {
                  console.error('Hero image failed to load:', e.target.src);
                  // Fallback to next image in the list
                  const nextIndex = (currentImageIndex + 1) % heroImages.length;
                  if (nextIndex !== currentImageIndex) {
                    changeImage(nextIndex);
                  }
                }}
                onLoad={() => console.log('Hero image loaded successfully:', currentImage.name)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;