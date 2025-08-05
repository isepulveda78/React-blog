const { React, useState, useEffect } = window;

const SimpleNavigation = ({ user, onLogout }) => {
  console.log("SimpleNavigation component - current user:", user);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePathChange);
    return () => window.removeEventListener("popstate", handlePathChange);
  }, []);

  const isActive = (path) => currentPath === path;

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setCurrentPath(path);
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
    window.currentUser = null;
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return React.createElement(
    "nav",
    { 
      className: "navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top",
      style: { minHeight: "70px" }
    },
    React.createElement(
      "div",
      { className: "container" },
      React.createElement(
        "a",
        {
          className: "navbar-brand fw-bold text-primary fs-3",
          href: "/",
          style: { textDecoration: "none" },
          onClick: (e) => {
            e.preventDefault();
            navigateTo("/");
          },
        },
        "Mr. S Teaches"
      ),
      React.createElement(
        "button",
        {
          className: "navbar-toggler",
          type: "button",
          "data-bs-toggle": "collapse",
          "data-bs-target": "#navbarNav",
          "aria-controls": "navbarNav",
          "aria-expanded": "false",
          "aria-label": "Toggle navigation",
        },
        React.createElement("span", { className: "navbar-toggler-icon" })
      ),
      React.createElement(
        "div",
        { className: "collapse navbar-collapse", id: "navbarNav" },
        React.createElement(
          "ul",
          { className: "navbar-nav me-auto mb-2 mb-lg-0" },
          React.createElement(
            "li",
            { className: "nav-item" },
            React.createElement(
              "a",
              {
                className: `nav-link ${isActive("/") ? "active fw-bold" : ""}`,
                href: "/",
                onClick: (e) => {
                  e.preventDefault();
                  navigateTo("/");
                },
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
                className: `nav-link ${isActive("/blog") ? "active fw-bold" : ""}`,
                href: "/blog",
                onClick: (e) => {
                  e.preventDefault();
                  navigateTo("/blog");
                },
              },
              "Blog & Resources"
            )
          ),
          React.createElement(
            "li",
            { className: "nav-item" },
            React.createElement(
              "a",
              {
                className: `nav-link ${isActive("/educational-tools") ? "active fw-bold" : ""}`,
                href: "/educational-tools",
                onClick: (e) => {
                  e.preventDefault();
                  navigateTo("/educational-tools");
                },
              },
              "Educational Tools"
            )
          ),
          React.createElement(
            "li",
            { className: "nav-item" },
            React.createElement(
              "a",
              {
                className: `nav-link ${isActive("/city-builder") ? "active fw-bold" : ""}`,
                href: "/city-builder",
                onClick: (e) => {
                  e.preventDefault();
                  navigateTo("/city-builder");
                },
              },
              "City Builder"
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
                "data-bs-toggle": "dropdown",
                "aria-expanded": "false",
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
                      navigateTo("/admin");
                    },
                  },
                  "Dashboard"
                )
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "d-flex align-items-center gap-3" },
          user ? React.createElement(
            "span",
            { className: "navbar-text me-3" },
            `Welcome, ${user.name || user.username}!`
          ) : null,
          user ? React.createElement(
            "button",
            {
              className: "btn btn-outline-danger",
              onClick: handleLogout,
            },
            "Logout"
          ) : React.createElement(
            "div",
            { className: "d-flex gap-2" },
            React.createElement(
              "a",
              {
                href: "/api/auth/google",
                className: "btn btn-primary",
              },
              "Sign In with Google"
            )
          )
        )
      )
    )
  );
};

window.SimpleNavigation = SimpleNavigation;
console.log("SimpleNavigation component exported to window:", !!window.SimpleNavigation);