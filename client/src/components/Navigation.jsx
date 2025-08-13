import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'wouter';

const Navigation = ({ user, onLogout }) => {
  const [location, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const isActive = (path) => location === path;

  const navigateTo = (path) => {
    navigate(path);
    setIsNavOpen(false); // Close mobile nav when navigating
  };

  const handleAuthModalToggle = () => {
    setIsLoginMode(!isLoginMode);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    // Call the parent logout function to update state
    if (onLogout) {
      onLogout();
    }
    // Navigate to home without hard reload
    navigate('/');
  };

  // Simple inline AuthModal since window.AuthModal might not load properly
  const AuthModalComponent = () => {
    if (!showAuthModal) return null;

    const [formData, setFormData] = useState({
      email: "",
      password: "",
      username: "",
      name: "",
      role: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      // Simple sound function without hooks
      const playSound = (type) => {
        try {
          if (window.useSound) {
            const { sounds } = window.useSound();
            if (type === 'success') sounds.success();
            else if (type === 'error') sounds.error();
            else sounds.buttonClick();
          }
        } catch (e) {
          // Ignore sound errors
        }
      };

      try {
        const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          playSound('error'); // Play error sound
          throw new Error(error.message || "Authentication failed");
        }

        const userData = await response.json();
        console.log("Authentication successful:", userData);
        playSound('success'); // Play success sound

        // Update global user state and refresh without hard reload
        window.currentUser = userData;
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Show success toast
        if (window.toast) {
          window.toast({
            title: "Success",
            description: isLoginMode ? "Successfully logged in!" : "Account created successfully!",
            variant: "default"
          });
        }
        
        // Trigger auth state update instead of page reload
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: userData }));

        setShowAuthModal(false);
        setFormData({ email: "", password: "", username: "", name: "", role: "" });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    return React.createElement(
      "div",
      {
        className: "modal show d-block",
        style: { backgroundColor: "rgba(0,0,0,0.5)" },
        onClick: (e) => {
          if (e.target === e.currentTarget) setShowAuthModal(false);
        },
      },
      React.createElement(
        "div",
        {
          className: "modal-dialog modal-dialog-centered",
          onClick: (e) => e.stopPropagation(),
        },
        React.createElement(
          "div",
          { className: "modal-content" },
          React.createElement(
            "div",
            { className: "modal-header" },
            React.createElement(
              "h5",
              { className: "modal-title" },
              isLoginMode ? "Sign In" : "Create Account",
            ),
            React.createElement("button", {
              type: "button",
              className: "btn-close",
              onClick: () => setShowAuthModal(false),
            }),
          ),
          React.createElement(
            "form",
            { onSubmit: handleSubmit },
            React.createElement(
              "div",
              { className: "modal-body" },
              error &&
                React.createElement(
                  "div",
                  { className: "alert alert-danger" },
                  error,
                ),

              // Google Sign-In Button
              React.createElement(
                "div",
                { className: "d-grid gap-2 mb-3" },
                React.createElement(
                  "a",
                  {
                    href: "/api/auth/google",
                    className: "btn btn-outline-danger",
                  },
                  React.createElement("i", { className: "fab fa-google me-2" }),
                  isLoginMode ? "Sign in with Google" : "Sign up with Google",
                ),
              ),

              React.createElement(
                "div",
                { className: "text-center mb-3" },
                React.createElement("span", { className: "text-muted" }, "or"),
              ),

              // Quick Login for Israel


              React.createElement(
                "div",
                { className: "text-center mb-3" },
                React.createElement("span", { className: "text-muted" }, "or use regular login"),
              ),

              // Name field for registration
              !isLoginMode &&
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Full Name",
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "form-control",
                    name: "name",
                    value: formData.name,
                    onChange: handleChange,
                    required: true,
                  }),
                ),

              // Username field for registration
              !isLoginMode &&
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Username",
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "form-control",
                    name: "username",
                    value: formData.username,
                    onChange: handleChange,
                    required: true,
                  }),
                ),

              // Role selection for registration
              !isLoginMode &&
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "I am a:",
                  ),
                  React.createElement(
                    "select",
                    {
                      className: "form-select",
                      name: "role",
                      value: formData.role,
                      onChange: handleChange,
                      required: true,
                    },
                    React.createElement("option", { value: "" }, "Select your role"),
                    React.createElement("option", { value: "teacher" }, "Teacher"),
                    React.createElement("option", { value: "student" }, "Student"),
                  ),
                ),

              // Email field
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Email",
                ),
                React.createElement("input", {
                  type: "email",
                  className: "form-control",
                  name: "email",
                  value: formData.email,
                  onChange: handleChange,
                  required: true,
                }),
              ),

              // Password field
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Password",
                ),
                React.createElement("input", {
                  type: "password",
                  className: "form-control",
                  name: "password",
                  value: formData.password,
                  onChange: handleChange,
                  required: true,
                }),
              ),
            ),
            React.createElement(
              "div",
              { className: "modal-footer" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn btn-outline-secondary",
                  onClick: handleAuthModalToggle,
                },
                isLoginMode
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in",
              ),
              React.createElement(
                "button",
                {
                  type: "submit",
                  className: "btn btn-primary",
                  disabled: isLoading,
                },
                isLoading
                  ? React.createElement("span", {
                      className: "spinner-border spinner-border-sm me-2",
                    })
                  : null,
                isLoginMode ? "Sign In" : "Create Account",
              ),
            ),
          ),
        ),
      ),
    );
  };

  return (
    <>
      {/* Inline AuthModal */}
      {React.createElement(AuthModalComponent)}

      {/* Navigation */}
      <nav className="navbar navbar-expand-lg bg-danger shadow-sm sticky-top">
        <div className="container">
          <Link
            href="/"
            className="navbar-brand fw-bold text-white ama-font shadow-for-ama text-decoration-none fs-1"
          >
            Mr. S Teaches 
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsNavOpen(!isNavOpen)}
            aria-controls="navbarNav"
            aria-expanded={isNavOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse ${isNavOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav me-auto">

              <li className="nav-item">
                <Link
                  href="/blog"
                  className={`nav-link ${isActive("/blog") ? "active" : ""}`}
                >
                 Lessons
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  href="/educational-tools"
                  className={`nav-link ${isActive("/educational-tools") ? "active" : ""}`}
                >
                  Tools
                </Link>
              </li>

              {user && user.approved && (
                <li className="nav-item">
                  <Link
                    href="/profile"
                    className={`nav-link ${isActive("/profile") ? "active" : ""}`}
                  >
                    My Profile
                  </Link>
                </li>
              )}

              {user && user.approved && (
                <li className="nav-item">
                  <Link
                    href="/listen-to-type"
                    className={`nav-link ${isActive("/listen-to-type") ? "active" : ""}`}
                  >
                    Chatroom
                  </Link>
                </li>
              )}
            </ul>

            <div className="navbar-nav">
              {/* Quick admin access button - only show if user is authenticated admin */}
              {user && user.isAdmin && (
                <Link
                  href="/admin"
                  className="btn btn-info btn-sm me-2"
                >
                  Admin Dashboard
                </Link>
              )}
              {/* Always visible logout button for testing */}

              {user ? (
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "#ffc107",
                    border: "2px solid #000",
                  }}
                >
                  LOGOUT NOW
                </button>
              ) : null}

              {!user ? (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setIsLoginMode(true);
                      setShowAuthModal(true);
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setIsLoginMode(false);
                      setShowAuthModal(true);
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
