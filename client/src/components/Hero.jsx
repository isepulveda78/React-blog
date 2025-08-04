const { React } = window;

const Hero = ({ user }) => {
  console.log('Hero component - current user:', user);
  return (
    <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-5 mb-5">
      <div className="container">
        <div className="row align-items-center min-vh-50">
          <div className="col-lg-6">
            <div className="hero-content">
              <h1 className="display-4 fw-bold text-primary mb-4">
                {user ? `Welcome back, ${user.username}!` : "Welcome to Mr. S Teaches"}
              </h1>
              <p className="lead text-muted mb-4">
                Discover amazing content, share your thoughts, and connect with a community of learners and educators.
              </p>
              {!user && (
                <div className="d-flex gap-3">
                  <a
                    href="/api/auth/google"
                    className="btn btn-primary btn-lg px-4 py-2"
                  >
                    Sign In with Google
                  </a>
                  <button
                    className="btn btn-outline-primary btn-lg px-4 py-2"
                    onClick={() => window.showLoginModal && window.showLoginModal()}
                  >
                    Email Login
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-6 text-center">
            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Learning and teaching community"
                className="img-fluid rounded-3 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Export to window for global access
window.Hero = Hero;