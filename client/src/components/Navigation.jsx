const { React } = window;

const Navigation = ({ user, onLogout }) => {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const isActive = (path) => currentPath === path;

  return React.createElement(
    "nav",
    { className: "navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top" },
    React.createElement(
      "div",
      { className: "container" },
      React.createElement(
        "a",
        { 
          className: "navbar-brand fw-bold text-primary",
          href: "/",
          onClick: (e) => {
            e.preventDefault();
            window.navigateTo('/');
          }
        },
        "Mr. S Teaches"
      ),
      React.createElement(
        "button",
        {
          className: "navbar-toggler",
          type: "button",
          "data-bs-toggle": "collapse",
          "data-bs-target": "#navbarNav"
        },
        React.createElement("span", { className: "navbar-toggler-icon" })
      ),
      React.createElement(
        "div",
        { className: "collapse navbar-collapse", id: "navbarNav" },
        React.createElement(
          "ul",
          { className: "navbar-nav me-auto" },
          React.createElement(
            "li",
            { className: "nav-item" },
            React.createElement(
              "a",
              {
                className: `nav-link ${isActive('/') ? 'active' : ''}`,
                href: "/",
                onClick: (e) => {
                  e.preventDefault();
                  window.navigateTo('/');
                }
              },
              "Home"
            )
          ),
          React.createElement(
            "li",
            { className: "nav-item" },
            React.createElement(
              "a",
              {
                className: `nav-link ${isActive('/blog') ? 'active' : ''}`,
                href: "/blog",
                onClick: (e) => {
                  e.preventDefault();
                  window.navigateTo('/blog');
                }
              },
              "All Posts"
            )
          ),
          user && user.isAdmin && React.createElement(
            "li",
            { className: "nav-item dropdown" },
            React.createElement(
              "a",
              {
                className: "nav-link dropdown-toggle",
                href: "#",
                role: "button",
                "data-bs-toggle": "dropdown"
              },
              "Admin"
            ),
            React.createElement(
              "ul",
              { className: "dropdown-menu" },
              React.createElement(
                "li",
                null,
                React.createElement(
                  "a",
                  {
                    className: "dropdown-item",
                    href: "/admin",
                    onClick: (e) => {
                      e.preventDefault();
                      window.navigateTo('/admin');
                    }
                  },
                  "Dashboard"
                )
              ),
              React.createElement(
                "li",
                null,
                React.createElement(
                  "a",
                  {
                    className: "dropdown-item",
                    href: "/admin/posts",
                    onClick: (e) => {
                      e.preventDefault();
                      window.navigateTo('/admin/posts');
                    }
                  },
                  "Manage Posts"
                )
              ),
              React.createElement(
                "li",
                null,
                React.createElement(
                  "a",
                  {
                    className: "dropdown-item",
                    href: "/admin/users",
                    onClick: (e) => {
                      e.preventDefault();
                      window.navigateTo('/admin/users');
                    }
                  },
                  "Manage Users"
                )
              ),
              React.createElement(
                "li",
                null,
                React.createElement(
                  "a",
                  {
                    className: "dropdown-item",
                    href: "/seo-management",
                    onClick: (e) => {
                      e.preventDefault();
                      window.navigateTo('/seo-management');
                    }
                  },
                  "SEO Management"
                )
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "navbar-nav" },
          user ? React.createElement(
            "div",
            { className: "nav-item dropdown" },
            React.createElement(
              "a",
              {
                className: "nav-link dropdown-toggle d-flex align-items-center",
                href: "#",
                role: "button",
                "data-bs-toggle": "dropdown"
              },
              user.profileImage && React.createElement("img", {
                src: user.profileImage,
                alt: user.username,
                className: "rounded-circle me-2",
                style: { width: "32px", height: "32px", objectFit: "cover" }
              }),
              user.username
            ),
            React.createElement(
              "ul",
              { className: "dropdown-menu dropdown-menu-end" },
              React.createElement(
                "li",
                null,
                React.createElement(
                  "button",
                  {
                    className: "dropdown-item",
                    onClick: onLogout
                  },
                  "Logout"
                )
              )
            )
          ) : React.createElement(
            "div",
            { className: "d-flex gap-2" },
            React.createElement(
              "a",
              {
                href: "/api/auth/google",
                className: "btn btn-outline-primary"
              },
              "Sign In"
            )
          )
        )
      )
    )
  );
};

// Export for use in main.jsx
window.Navigation = Navigation;