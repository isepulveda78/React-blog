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
  const [resetMode, setResetMode] = useState(""); // "", "request", "confirm"
  const [resetToken, setResetToken] = useState("");
  const [resetMessage, setResetMessage] = useState("");

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

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        setResetMessage(data.message);
        setError("");
      } else {
        throw new Error(data.message || "Password reset request failed");
      }
    } catch (err) {
      setError(err.message);
      setResetMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: resetToken, 
          newPassword: formData.password 
        }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        setResetMessage(data.message);
        setError("");
        // Clear form and return to login after success
        setTimeout(() => {
          setResetMode("");
          setResetToken("");
          setFormData({ email: "", password: "", username: "", name: "" });
        }, 2000);
      } else {
        throw new Error(data.message || "Password reset failed");
      }
    } catch (err) {
      setError(err.message);
      setResetMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL for reset token when modal opens
  React.useEffect(() => {
    if (show) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        setResetToken(token);
        setResetMode("confirm");
      }
    }
  }, [show]);

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
            resetMode === "request" ? "Reset Password" :
            resetMode === "confirm" ? "Set New Password" :
            isLogin ? "Sign In" : "Create Account"
          ),
          React.createElement("button", {
            type: "button",
            className: "btn-close",
            onClick: onHide
          })
        ),
        React.createElement("form", { 
          onSubmit: resetMode === "request" ? handlePasswordResetRequest : 
                   resetMode === "confirm" ? handlePasswordResetConfirm : 
                   handleEmailSubmit 
        },
          React.createElement("div", { className: "modal-body" },
            error && React.createElement("div", { className: "alert alert-danger" }, error),
            resetMessage && React.createElement("div", { className: "alert alert-success" }, resetMessage),
            
            // Password Reset Request Form
            resetMode === "request" ? [
              React.createElement("div", { key: "reset-info", className: "mb-3" },
                React.createElement("p", { className: "text-muted" },
                  "Enter your email address and we'll send you a link to reset your password."
                )
              ),
              React.createElement("div", { key: "reset-email", className: "mb-3" },
                React.createElement("label", { className: "form-label" }, "Email Address"),
                React.createElement("input", {
                  type: "email",
                  className: "form-control",
                  name: "email",
                  value: formData.email,
                  onChange: handleChange,
                  required: true,
                  placeholder: "Enter your email address"
                })
              )
            ] : 
            
            // Password Reset Confirm Form
            resetMode === "confirm" ? [
              React.createElement("div", { key: "confirm-info", className: "mb-3" },
                React.createElement("p", { className: "text-muted" },
                  "Enter your new password below."
                )
              ),
              React.createElement("div", { key: "new-password", className: "mb-3" },
                React.createElement("label", { className: "form-label" }, "New Password"),
                React.createElement("input", {
                  type: "password",
                  className: "form-control",
                  name: "password",
                  value: formData.password,
                  onChange: handleChange,
                  required: true,
                  placeholder: "Enter your new password"
                })
              ),
              React.createElement("div", { key: "password-requirements", className: "mb-3" },
                React.createElement("small", { className: "text-muted" },
                  "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character."
                )
              )
            ] :
            
            // Normal Login/Register Form
            [
              // Google Sign-In Button
              React.createElement("div", { key: "google-signin", className: "d-grid gap-2 mb-3" },
                React.createElement("button", {
                  type: "button",
                  className: "btn btn-outline-danger",
                  onClick: handleGoogleLogin
                },
                  React.createElement("i", { className: "fab fa-google me-2" }),
                  isLogin ? "Sign in with Google" : "Sign up with Google"
                )
              ),
              
              React.createElement("div", { key: "divider", className: "text-center mb-3" },
                React.createElement("span", { className: "text-muted" }, "or")
              ),

              // Name field for registration
              !isLogin && React.createElement("div", { key: "name", className: "mb-3" },
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
              !isLogin && React.createElement("div", { key: "username", className: "mb-3" },
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
              React.createElement("div", { key: "email", className: "mb-3" },
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
              React.createElement("div", { key: "password", className: "mb-3" },
                React.createElement("label", { className: "form-label" }, "Password"),
                React.createElement("input", {
                  type: "password",
                  className: "form-control",
                  name: "password",
                  value: formData.password,
                  onChange: handleChange,
                  required: true
                })
              ),

              // Forgot Password Link (only show on login)
              isLogin && React.createElement("div", { key: "forgot-password", className: "text-end mb-3" },
                React.createElement("button", {
                  type: "button",
                  className: "btn btn-link btn-sm p-0",
                  onClick: () => setResetMode("request"),
                  "data-testid": "link-forgot-password"
                },
                  "Forgot Password?"
                )
              )
            ]
          ),
          React.createElement("div", { className: "modal-footer" },
            // Back to login button for password reset modes
            (resetMode === "request" || resetMode === "confirm") ? 
              React.createElement("button", {
                type: "button",
                className: "btn btn-outline-secondary",
                onClick: () => {
                  setResetMode("");
                  setResetToken("");
                  setError("");
                  setResetMessage("");
                  setFormData({ email: "", password: "", username: "", name: "" });
                }
              },
                "Back to Sign In"
              ) :
              // Normal mode toggle button
              React.createElement("button", {
                type: "button",
                className: "btn btn-outline-secondary",
                onClick: onToggleMode
              },
                isLogin
                  ? "Need an account? Sign up"
                  : "Already have an account? Sign in"
              ),
            
            // Submit button with appropriate text based on mode
            React.createElement("button", {
              type: "submit",
              className: "btn btn-primary",
              disabled: isLoading,
              "data-testid": resetMode === "request" ? "button-send-reset" : 
                           resetMode === "confirm" ? "button-confirm-reset" : 
                           isLogin ? "button-sign-in" : "button-sign-up"
            },
              isLoading
                ? React.createElement("span", { className: "spinner-border spinner-border-sm me-2" })
                : null,
              resetMode === "request" ? "Send Reset Link" :
              resetMode === "confirm" ? "Reset Password" :
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