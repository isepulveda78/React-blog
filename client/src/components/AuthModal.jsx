// AuthModal component using window-based exports for browser compatibility
const { useState } = React;

function AuthModal({ show, onHide, isLogin, onToggleMode }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Authentication failed");
      }

      const userData = await response.json();
      console.log("Authentication successful:", userData);
      
      // Update global user state
      window.currentUser = userData;
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Refresh the page to update components
      window.location.reload();
      
      onHide();
      setFormData({ email: "", password: "", username: "", name: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  if (!show) return null;

  return React.createElement("div", {
    className: "modal show d-block",
    style: { backgroundColor: "rgba(0,0,0,0.5)" },
    onClick: (e) => {
      if (e.target === e.currentTarget) onHide();
    }
  },
    React.createElement("div", {
      className: "modal-dialog modal-dialog-centered",
      onClick: (e) => e.stopPropagation()
    },
      React.createElement("div", { className: "modal-content" },
        React.createElement("div", { className: "modal-header" },
          React.createElement("h5", { className: "modal-title" },
            isLogin ? "Sign In" : "Create Account"
          ),
          React.createElement("button", {
            type: "button",
            className: "btn-close",
            onClick: onHide
          })
        ),
        React.createElement("form", { onSubmit: handleEmailSubmit },
          React.createElement("div", { className: "modal-body" },
            error && React.createElement("div", { className: "alert alert-danger" }, error),
            
            // Google Sign-In Button
            React.createElement("div", { className: "d-grid gap-2 mb-3" },
              React.createElement("button", {
                type: "button",
                className: "btn btn-outline-danger",
                onClick: handleGoogleLogin
              },
                React.createElement("i", { className: "fab fa-google me-2" }),
                isLogin ? "Sign in with Google" : "Sign up with Google"
              )
            ),
            
            React.createElement("div", { className: "text-center mb-3" },
              React.createElement("span", { className: "text-muted" }, "or")
            ),

            // Name field for registration
            !isLogin && React.createElement("div", { className: "mb-3" },
              React.createElement("label", { className: "form-label" }, "Full Name"),
              React.createElement("input", {
                type: "text",
                className: "form-control",
                name: "name",
                value: formData.name,
                onChange: handleChange,
                required: true
              })
            ),

            // Username field for registration
            !isLogin && React.createElement("div", { className: "mb-3" },
              React.createElement("label", { className: "form-label" }, "Username"),
              React.createElement("input", {
                type: "text",
                className: "form-control",
                name: "username",
                value: formData.username,
                onChange: handleChange,
                required: true
              })
            ),

            // Email field
            React.createElement("div", { className: "mb-3" },
              React.createElement("label", { className: "form-label" }, "Email"),
              React.createElement("input", {
                type: "email",
                className: "form-control",
                name: "email",
                value: formData.email,
                onChange: handleChange,
                required: true
              })
            ),

            // Password field
            React.createElement("div", { className: "mb-3" },
              React.createElement("label", { className: "form-label" }, "Password"),
              React.createElement("input", {
                type: "password",
                className: "form-control",
                name: "password",
                value: formData.password,
                onChange: handleChange,
                required: true
              })
            )
          ),
          React.createElement("div", { className: "modal-footer" },
            React.createElement("button", {
              type: "button",
              className: "btn btn-outline-secondary",
              onClick: onToggleMode
            },
              isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"
            ),
            React.createElement("button", {
              type: "submit",
              className: "btn btn-primary",
              disabled: isLoading
            },
              isLoading
                ? React.createElement("span", { className: "spinner-border spinner-border-sm me-2" })
                : null,
              isLogin ? "Sign In" : "Create Account"
            )
          )
        )
      )
    )
  );
}

// Export to window for global access
window.AuthModal = AuthModal;