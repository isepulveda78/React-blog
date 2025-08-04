const { React } = window;

const Hero = ({ user }) => {
  return React.createElement(
    "section",
    { className: "bg-gradient-to-br from-blue-50 to-purple-50 py-5 mb-5" },
    React.createElement(
      "div",
      { className: "container" },
      React.createElement(
        "div",
        { className: "row align-items-center min-vh-50" },
        React.createElement(
          "div",
          { className: "col-lg-6" },
          React.createElement(
            "div",
            { className: "hero-content" },
            React.createElement(
              "h1",
              { className: "display-4 fw-bold text-primary mb-4" },
              user ? `Welcome back, ${user.username}!` : "Welcome to Mr. S Teaches"
            ),
            React.createElement(
              "p",
              { className: "lead text-muted mb-4" },
              "Discover amazing content, share your thoughts, and connect with a community of learners and educators."
            ),
            !user && React.createElement(
              "div",
              { className: "d-flex gap-3" },
              React.createElement(
                "a",
                { 
                  href: "/api/auth/google",
                  className: "btn btn-primary btn-lg px-4 py-2"
                },
                "Sign In with Google"
              ),
              React.createElement(
                "button",
                { 
                  className: "btn btn-outline-primary btn-lg px-4 py-2",
                  onClick: () => window.showLoginModal && window.showLoginModal()
                },
                "Email Login"
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "col-lg-6 text-center" },
          React.createElement(
            "div",
            { className: "hero-image" },
            React.createElement("img", {
              src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
              alt: "Learning and teaching community",
              className: "img-fluid rounded-3 shadow-lg"
            })
          )
        )
      )
    )
  );
};

// Export for use in main.jsx
window.Hero = Hero;