// Import React and ReactDOM from CDN (already loaded in HTML)
const { StrictMode, useState, useEffect, createContext, useContext, useRef } =
  React;
const { createRoot } = ReactDOM;

// Simple auth context for inline React app
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated with backend session
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Not authenticated");
      })
      .then((userData) => {
        console.log("User authenticated:", userData);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setIsLoading(false);
      })
      .catch(() => {
        // Not authenticated, check localStorage as fallback
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem("user");
          }
        }
        setIsLoading(false);
      });
  }, []);

  const login = async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const userData = await response.json();
    console.log("Login successful:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const newUser = await response.json();
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    return newUser;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: { user, login, register, logout, isLoading },
    },
    children,
  );
};

const useAuth = () => useContext(AuthContext);

// Blog Posts List Component with Pagination, Filtering, and Search
const BlogPostsList = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(6);
  const [totalPosts, setTotalPosts] = useState(0);

  // Load posts and categories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postsRes, categoriesRes] = await Promise.all([
          fetch("/api/posts/public", { credentials: "include" }),
          fetch("/api/categories", { credentials: "include" }),
        ]);

        const postsData = postsRes.ok ? await postsRes.json() : [];
        const categoriesData = categoriesRes.ok
          ? await categoriesRes.json()
          : [];

        setPosts(Array.isArray(postsData) ? postsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTotalPosts(Array.isArray(postsData) ? postsData.length : 0);
      } catch (error) {
        console.error("Error loading data:", error);
        setPosts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter posts based on search and category
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchTerm ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt &&
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      !selectedCategory || post.categoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handlePostClick = (post) => {
    if (!user) {
      alert("Please sign in to read blog posts.");
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (!user.approved) {
      alert(
        "Your account is pending approval. Please wait for an administrator to approve your account before you can read blog posts.",
      );
    } else {
      window.history.pushState({}, "", `/posts/${post.slug}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setCurrentPage(1);
  };

  const navigateHome = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (loading) {
    return React.createElement(
      "div",
      {
        className: "d-flex justify-content-center align-items-center",
        style: { minHeight: "100vh" },
      },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement("div", {
          className: "spinner-border text-primary mb-3",
        }),
        React.createElement("p", null, "Loading blog posts..."),
      ),
    );
  }

  return React.createElement(
    "div",
    { className: "min-vh-100", style: { backgroundColor: "#f8f9fa" } },
    // Navigation
    React.createElement(
      "nav",
      {
        className: "navbar navbar-expand-lg",
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "a",
          {
            className: "navbar-brand text-white fw-bold fs-3",
            href: "#",
            onClick: (e) => {
              e.preventDefault();
              navigateHome();
            },
          },
          "Mr. S Teaches",
        ),
        React.createElement(
          "div",
          { className: "navbar-nav ms-auto" },
          React.createElement(
            "button",
            {
              className: "btn btn-outline-light",
              onClick: navigateHome,
            },
            "Back to Home",
          ),
        ),
      ),
    ),

    // Header Section
    React.createElement(
      "section",
      {
        className: "py-5",
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        },
      },
      React.createElement(
        "div",
        { className: "container text-center" },
        React.createElement(
          "h1",
          { className: "display-4 fw-bold mb-3" },
          "All Blog Posts",
        ),
        React.createElement(
          "p",
          { className: "lead mb-4" },
          `Explore our collection of ${totalPosts} blog posts`,
        ),
        React.createElement(
          "div",
          { className: "row justify-content-center" },
          React.createElement(
            "div",
            { className: "col-md-8" },
            React.createElement(
              "div",
              { className: "input-group input-group-lg" },
              React.createElement("input", {
                type: "text",
                className: "form-control",
                placeholder: "Search blog posts...",
                value: searchTerm,
                onChange: (e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                },
              }),
              React.createElement(
                "button",
                {
                  className: "btn btn-light",
                  type: "button",
                  onClick: clearFilters,
                },
                React.createElement("i", { className: "bi bi-x-circle me-2" }),
                "Clear",
              ),
            ),
          ),
        ),
      ),
    ),

    // Filters Section
    React.createElement(
      "section",
      { className: "py-4 bg-white border-bottom" },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col-md-6" },
            React.createElement(
              "div",
              { className: "d-flex align-items-center" },
              React.createElement(
                "label",
                { className: "me-3 fw-semibold" },
                "Filter by Category:",
              ),
              React.createElement(
                "select",
                {
                  className: "form-select",
                  style: { maxWidth: "200px" },
                  value: selectedCategory,
                  onChange: (e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  },
                },
                React.createElement("option", { value: "" }, "All Categories"),
                categories.map((category) =>
                  React.createElement(
                    "option",
                    {
                      key: category.id,
                      value: category.name,
                    },
                    category.name,
                  ),
                ),
              ),
            ),
          ),
          React.createElement(
            "div",
            { className: "col-md-6 text-md-end" },
            React.createElement(
              "span",
              { className: "text-muted" },
              `Showing ${currentPosts.length} of ${filteredPosts.length} posts`,
            ),
          ),
        ),
      ),
    ),

    // Posts Grid
    React.createElement(
      "section",
      { className: "py-5" },
      React.createElement(
        "div",
        { className: "container" },
        filteredPosts.length === 0
          ? React.createElement(
              "div",
              { className: "text-center py-5" },
              React.createElement("i", {
                className: "bi bi-search display-1 text-muted mb-3",
              }),
              React.createElement(
                "h3",
                { className: "text-muted" },
                "No posts found",
              ),
              React.createElement(
                "p",
                { className: "text-muted" },
                searchTerm || selectedCategory
                  ? "Try adjusting your search or filter criteria."
                  : "No blog posts available at the moment.",
              ),
              (searchTerm || selectedCategory) &&
                React.createElement(
                  "button",
                  {
                    className: "btn btn-primary mt-3",
                    onClick: clearFilters,
                  },
                  "Clear Filters",
                ),
            )
          : React.createElement(
              "div",
              { className: "row" },
              currentPosts.map((post) =>
                React.createElement(
                  "div",
                  {
                    key: post.id,
                    className: "col-lg-4 col-md-6 mb-4",
                  },
                  React.createElement(
                    "div",
                    {
                      className: "card h-100 shadow-sm card-hover",
                      style: { cursor: "pointer", transition: "all 0.3s ease" },
                      onClick: () => handlePostClick(post),
                    },
                    post.featuredImage &&
                      React.createElement("img", {
                        src: post.featuredImage,
                        className: "card-img-top",
                        alt: post.title,
                        style: {
                          height: "200px",
                          objectFit: "cover",
                        },
                      }),
                    React.createElement(
                      "div",
                      { className: "card-body d-flex flex-column" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        post.title,
                      ),
                      React.createElement(
                        "p",
                        { className: "card-text flex-grow-1 text-muted" },
                        post.excerpt ||
                          post.content
                            .replace(/<[^>]*>/g, "")
                            .substring(0, 120) + "...",
                      ),
                      React.createElement(
                        "div",
                        { className: "mt-auto" },
                        React.createElement(
                          "div",
                          {
                            className:
                              "d-flex justify-content-between align-items-center mb-2",
                          },
                          React.createElement(
                            "small",
                            { className: "text-muted" },
                            `By ${post.authorName}`,
                          ),
                          React.createElement(
                            "small",
                            { className: "text-muted" },
                            new Date(post.publishedAt).toLocaleDateString(),
                          ),
                        ),
                        React.createElement(
                          "div",
                          {
                            className:
                              "d-flex justify-content-between align-items-center",
                          },
                          post.categoryName &&
                            React.createElement(
                              "span",
                              {
                                className: "badge bg-secondary",
                              },
                              post.categoryName,
                            ),
                          React.createElement(
                            "span",
                            {
                              className: `badge ${!user ? "bg-primary" : !user.approved ? "bg-warning" : "bg-success"}`,
                            },
                            !user
                              ? "Sign in to read"
                              : !user.approved
                                ? "Approval needed"
                                : "Click to read",
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
      ),
    ),

    // Pagination
    totalPages > 1 &&
      React.createElement(
        "section",
        { className: "py-4 bg-light" },
        React.createElement(
          "div",
          { className: "container" },
          React.createElement(
            "nav",
            { "aria-label": "Blog posts pagination" },
            React.createElement(
              "ul",
              { className: "pagination justify-content-center mb-0" },
              // Previous button
              React.createElement(
                "li",
                {
                  className: `page-item ${currentPage === 1 ? "disabled" : ""}`,
                },
                React.createElement(
                  "button",
                  {
                    className: "page-link",
                    onClick: () =>
                      currentPage > 1 && handlePageChange(currentPage - 1),
                    disabled: currentPage === 1,
                  },
                  "Previous",
                ),
              ),

              // Page numbers
              Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return React.createElement(
                      "li",
                      {
                        key: page,
                        className: `page-item ${currentPage === page ? "active" : ""}`,
                      },
                      React.createElement(
                        "button",
                        {
                          className: "page-link",
                          onClick: () => handlePageChange(page),
                        },
                        page,
                      ),
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return React.createElement(
                      "li",
                      {
                        key: page,
                        className: "page-item disabled",
                      },
                      React.createElement(
                        "span",
                        { className: "page-link" },
                        "...",
                      ),
                    );
                  }
                  return null;
                },
              ),

              // Next button
              React.createElement(
                "li",
                {
                  className: `page-item ${currentPage === totalPages ? "disabled" : ""}`,
                },
                React.createElement(
                  "button",
                  {
                    className: "page-link",
                    onClick: () =>
                      currentPage < totalPages &&
                      handlePageChange(currentPage + 1),
                    disabled: currentPage === totalPages,
                  },
                  "Next",
                ),
              ),
            ),
          ),
        ),
      ),

    // Footer
    React.createElement(Footer),
  );
};

// Footer Component
const Footer = () => {
  return React.createElement(
    "footer",
    {
      className: "mt-5",
      style: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        paddingTop: "3rem",
        paddingBottom: "2rem",
      },
    },
    React.createElement(
      "div",
      { className: "container" },
      React.createElement(
        "div",
        { className: "row" },
        // About section
        React.createElement(
          "div",
          { className: "col-lg-4 mb-4 footer-section" },
          React.createElement(
            "h5",
            { className: "fw-bold mb-3" },
            "Mr. S Teaches - UPDATED",
          ),
          React.createElement(
            "p",
            { className: "mb-3", style: { opacity: 0.9 } },
            "Discover amazing stories, insights, and ideas from our community of writers. Join us in exploring knowledge and sharing experiences.",
          ),
          React.createElement(
            "div",
            { className: "d-flex gap-3" },
            React.createElement(
              "a",
              {
                href: "#",
                className: "text-white",
                style: { fontSize: "1.5rem", opacity: 0.8 },
                onMouseOver: (e) => (e.target.style.opacity = 1),
                onMouseOut: (e) => (e.target.style.opacity = 0.8),
              },
              React.createElement("i", { className: "bi bi-facebook" }),
            ),
            React.createElement(
              "a",
              {
                href: "#",
                className: "text-white",
                style: { fontSize: "1.5rem", opacity: 0.8 },
                onMouseOver: (e) => (e.target.style.opacity = 1),
                onMouseOut: (e) => (e.target.style.opacity = 0.8),
              },
              React.createElement("i", { className: "bi bi-twitter" }),
            ),
            React.createElement(
              "a",
              {
                href: "#",
                className: "text-white",
                style: { fontSize: "1.5rem", opacity: 0.8 },
                onMouseOver: (e) => (e.target.style.opacity = 1),
                onMouseOut: (e) => (e.target.style.opacity = 0.8),
              },
              React.createElement("i", { className: "bi bi-instagram" }),
            ),
            React.createElement(
              "a",
              {
                href: "#",
                className: "text-white",
                style: { fontSize: "1.5rem", opacity: 0.8 },
                onMouseOver: (e) => (e.target.style.opacity = 1),
                onMouseOut: (e) => (e.target.style.opacity = 0.8),
              },
              React.createElement("i", { className: "bi bi-linkedin" }),
            ),
          ),
        ),

        // Quick Links section
        React.createElement(
          "div",
          { className: "col-lg-2 col-md-6 mb-4" },
          React.createElement(
            "h6",
            { className: "fw-bold mb-3" },
            "Quick Links",
          ),
          React.createElement(
            "ul",
            { className: "list-unstyled" },
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                  onClick: (e) => {
                    e.preventDefault();
                    window.history.pushState({}, "", "/");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  },
                },
                "Home",
              ),
            ),
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                },
                "About Us",
              ),
            ),
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                },
                "Contact",
              ),
            ),
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                },
                "Privacy Policy",
              ),
            ),
          ),
        ),

        // Categories section
        React.createElement(
          "div",
          { className: "col-lg-2 col-md-6 mb-4" },
          React.createElement(
            "h6",
            { className: "fw-bold mb-3" },
            "Categories",
          ),
          React.createElement(
            "ul",
            { className: "list-unstyled" },
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                },
                "Technology",
              ),
            ),
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                },
                "Education",
              ),
            ),
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                },
                "Lifestyle",
              ),
            ),
            React.createElement(
              "li",
              { className: "mb-2" },
              React.createElement(
                "a",
                {
                  href: "#",
                  className: "text-white text-decoration-none",
                  style: { opacity: 0.9 },
                  onMouseOver: (e) => (e.target.style.opacity = 1),
                  onMouseOut: (e) => (e.target.style.opacity = 0.9),
                },
                "Business",
              ),
            ),
          ),),
      ),

      // Copyright section
      React.createElement("hr", {
        style: {
          borderColor: "rgba(255,255,255,0.2)",
          margin: "2rem 0 1rem 0",
        },
      }),
      React.createElement(
        "div",
        { className: "row align-items-center" },
        React.createElement(
          "div",
          { className: "col-md-6" },
          React.createElement(
            "p",
            {
              className: "mb-0",
              style: { opacity: 0.8, fontSize: "0.9rem" },
            },
            `© ${new Date().getFullYear()} Mr. S Teaches. All rights reserved.`,
          ),
        ),
        React.createElement(
          "div",
          { className: "col-md-6 text-md-end" },
          React.createElement(
            "div",
            { className: "d-flex justify-content-md-end gap-3" },
            React.createElement(
              "a",
              {
                href: "#",
                className: "text-white text-decoration-none",
                style: { opacity: 0.8, fontSize: "0.9rem" },
                onMouseOver: (e) => (e.target.style.opacity = 1),
                onMouseOut: (e) => (e.target.style.opacity = 0.8),
              },
              "Terms of Service",
            ),
            React.createElement(
              "a",
              {
                href: "#",
                className: "text-white text-decoration-none",
                style: { opacity: 0.8, fontSize: "0.9rem" },
                onMouseOver: (e) => (e.target.style.opacity = 1),
                onMouseOut: (e) => (e.target.style.opacity = 0.8),
              },
              "Privacy Policy",
            ),
            React.createElement(
              "a",
              {
                href: "#",
                className: "text-white text-decoration-none",
                style: { opacity: 0.8, fontSize: "0.9rem" },
                onMouseOver: (e) => (e.target.style.opacity = 1),
                onMouseOut: (e) => (e.target.style.opacity = 0.8),
              },
              "Cookie Policy",
            ),
          ),
        ),
      ),
    ),
  );
};

// Auth Modal Component
const AuthModal = ({ show, onHide, isLogin, onToggleMode }) => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        setSuccess("Login successful!");
        setTimeout(() => {
          onHide();
          window.location.reload();
        }, 1000);
      } else {
        const result = await register(formData);
        setSuccess(
          result.message ||
            "Registration successful! Please wait for admin approval.",
        );
        setFormData({ name: "", username: "", email: "", password: "" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return React.createElement(
    "div",
    {
      className: "modal fade show",
      style: { display: "block", backgroundColor: "rgba(0,0,0,0.5)" },
    },
    React.createElement(
      "div",
      { className: "modal-dialog" },
      React.createElement(
        "div",
        { className: "modal-content" },
        React.createElement(
          "div",
          { className: "modal-header" },
          React.createElement(
            "h5",
            { className: "modal-title" },
            isLogin ? "Sign In" : "Sign Up",
          ),
          React.createElement("button", {
            type: "button",
            className: "btn-close",
            onClick: onHide,
          }),
        ),
        React.createElement(
          "div",
          { className: "modal-body" },
          error &&
            React.createElement(
              "div",
              { className: "alert alert-danger" },
              error,
            ),
          success &&
            React.createElement(
              "div",
              { className: "alert alert-success" },
              success,
            ),
          React.createElement(
            "form",
            { onSubmit: handleSubmit },
            !isLogin &&
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
                  value: formData.name,
                  onChange: (e) =>
                    setFormData({ ...formData, name: e.target.value }),
                  required: true,
                }),
              ),
            !isLogin &&
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
                  value: formData.username,
                  onChange: (e) =>
                    setFormData({ ...formData, username: e.target.value }),
                  required: true,
                }),
              ),
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
                value: formData.email,
                onChange: (e) =>
                  setFormData({ ...formData, email: e.target.value }),
                required: true,
              }),
            ),
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
                value: formData.password,
                onChange: (e) =>
                  setFormData({ ...formData, password: e.target.value }),
                required: true,
              }),
            ),
            React.createElement(
              "button",
              {
                type: "submit",
                className: "btn btn-primary w-100",
                disabled: isSubmitting,
              },
              isSubmitting ? "Processing..." : isLogin ? "Sign In" : "Sign Up",
            ),
          ),
          React.createElement(
            "div",
            { className: "text-center my-3" },
            React.createElement(
              "span",
              { className: "text-muted" },
              "── OR ──",
            ),
          ),
          React.createElement(
            "a",
            {
              href: "/api/auth/google",
              className:
                "btn btn-outline-danger w-100 mb-3 d-flex align-items-center justify-content-center",
              style: { textDecoration: "none" },
            },
            React.createElement(
              "svg",
              {
                className: "me-2",
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "currentColor",
              },
              React.createElement("path", {
                d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
                fill: "#4285F4",
              }),
              React.createElement("path", {
                d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                fill: "#34A853",
              }),
              React.createElement("path", {
                d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
                fill: "#FBBC05",
              }),
              React.createElement("path", {
                d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
                fill: "#EA4335",
              }),
            ),
            isLogin ? "Sign In with Google" : "Sign Up with Google",
          ),
          React.createElement("hr"),
          React.createElement(
            "p",
            { className: "text-center mb-0" },
            isLogin ? "Don't have an account? " : "Already have an account? ",
            React.createElement(
              "button",
              {
                type: "button",
                className: "btn btn-link p-0",
                onClick: onToggleMode,
              },
              isLogin ? "Sign Up" : "Sign In",
            ),
          ),
        ),
      ),
    ),
  );
};

// Simple router for handling different pages
const Router = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      console.log("Route changed to:", window.location.pathname);
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  console.log("Current path:", currentPath);

  // Protected Route Component - checks authentication and admin status
  const ProtectedAdminRoute = (component) => {
    if (isLoading) {
      return React.createElement(
        "div",
        {
          className: "d-flex justify-content-center align-items-center",
          style: { minHeight: "100vh" },
        },
        React.createElement("div", {
          className: "spinner-border text-primary",
        }),
      );
    }

    if (!user) {
      return React.createElement(
        "div",
        {
          className: "container mt-5 text-center",
        },
        React.createElement("h2", null, "Access Denied"),
        React.createElement(
          "p",
          { className: "text-muted mb-4" },
          "You must be logged in to access this page.",
        ),
        React.createElement(
          "button",
          {
            className: "btn btn-primary",
            onClick: () => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            },
          },
          "Go to Login",
        ),
      );
    }

    if (!user.approved) {
      return React.createElement(
        "div",
        {
          className: "container mt-5 text-center",
        },
        React.createElement("h2", null, "Account Pending Approval"),
        React.createElement(
          "p",
          { className: "text-muted mb-4" },
          "Your account is pending approval. Please wait for an administrator to approve your account.",
        ),
        React.createElement(
          "button",
          {
            className: "btn btn-primary",
            onClick: () => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            },
          },
          "Go Home",
        ),
      );
    }

    if (!user.isAdmin) {
      return React.createElement(
        "div",
        {
          className: "container mt-5 text-center",
        },
        React.createElement("h2", null, "Admin Access Required"),
        React.createElement(
          "p",
          { className: "text-muted mb-4" },
          "You must be an administrator to access this page.",
        ),
        React.createElement(
          "button",
          {
            className: "btn btn-primary",
            onClick: () => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            },
          },
          "Go Home",
        ),
      );
    }

    return component;
  };

  // Handle blog posts route
  if (currentPath === "/blog") {
    console.log("Loading blog posts listing");
    return React.createElement(BlogPostsList);
  }

  // Handle specific admin routes - ALL PROTECTED
  if (currentPath === "/admin" || currentPath === "/admin-access") {
    console.log("Loading admin dashboard for:", currentPath);
    return ProtectedAdminRoute(React.createElement(ModernReactApp));
  } else if (currentPath === "/admin/posts") {
    console.log("Loading posts management");
    return ProtectedAdminRoute(React.createElement(AdminPostsManager));
  } else if (currentPath === "/admin/users") {
    console.log("Loading user management");
    return ProtectedAdminRoute(React.createElement(AdminUsersManager));
  } else if (currentPath === "/admin/comments") {
    console.log("Loading comments management");
    return ProtectedAdminRoute(React.createElement(AdminCommentsManager));
  } else if (currentPath === "/admin/categories") {
    console.log("Loading categories management");
    return ProtectedAdminRoute(React.createElement(AdminCategoriesManager));
  } else if (currentPath === "/admin/posts/new") {
    console.log("Loading post editor");
    return ProtectedAdminRoute(React.createElement(AdminPostEditor));
  } else if (currentPath.startsWith("/admin/posts/edit/")) {
    const postId = currentPath.split("/").pop();
    console.log("Loading post editor for post:", postId);
    return ProtectedAdminRoute(React.createElement(AdminPostEditor, { postId }));
  } else if (currentPath === "/admin/seo") {
    console.log("Loading SEO management");
    return ProtectedAdminRoute(React.createElement(AdminSEOManager));
  } else if (currentPath === "/test-route") {
    return ProtectedAdminRoute(React.createElement(ModernReactApp));
  } else if (currentPath.startsWith("/posts/")) {
    return React.createElement(BlogPostReader);
  }

  return React.createElement(SimpleHome);
};

// Post Editor Component
const PostEditor = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    categoryId: "",
    status: "draft",
    featuredImage: "",
  });

  // Initialize Quill editor after component mounts
  const [quillEditor, setQuillEditor] = useState(null);
  const quillRef = useRef(null);

  // Load post data if editing
  useEffect(() => {
    if (postId) {
      fetch(`/api/posts/${postId}`, { credentials: "include" })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          setPost(data);
          setFormData({
            title: data.title || "",
            content: data.content || "",
            excerpt: data.excerpt || "",
            categoryId: data.categoryId || "",
            status: data.status || "draft",
            featuredImage: data.featuredImage || "",
          });
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load post: " + err.message);
          setLoading(false);
        });
    }
  }, [postId]);

  // Load categories
  useEffect(() => {
    fetch("/api/categories", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      })
      .catch(console.error);
  }, []);

  // Initialize Quill editor
  useEffect(() => {
    if (quillRef.current && !quillEditor) {
      console.log("Initializing Quill editor...");

      // Load Quill from CDN if not already loaded
      if (!window.Quill) {
        console.log("Loading Quill from CDN...");

        const link = document.createElement("link");
        link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://cdn.quilljs.com/1.3.6/quill.min.js";
        script.onload = () => {
          console.log("Quill loaded, initializing...");
          setTimeout(initializeQuill, 100); // Small delay to ensure DOM is ready
        };
        script.onerror = () => {
          console.error("Failed to load Quill");
          setError("Failed to load rich text editor");
        };
        document.head.appendChild(script);
      } else {
        console.log("Quill already loaded, initializing...");
        setTimeout(initializeQuill, 100);
      }
    }
  }, [quillRef.current, quillEditor]);

  const initializeQuill = () => {
    if (quillRef.current && window.Quill && !quillEditor) {
      console.log("Creating Quill instance...");

      try {
        const quill = new window.Quill(quillRef.current, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["blockquote", "code-block"],
              ["link", "image"],
              ["clean"],
            ],
          },
        });

        console.log("Quill instance created successfully");

        // Set initial content if editing
        if (formData.content) {
          console.log("Setting initial content...");
          quill.root.innerHTML = formData.content;
        }

        // Listen for content changes
        quill.on("text-change", () => {
          const content = quill.root.innerHTML;
          setFormData((prev) => ({ ...prev, content }));
        });

        setQuillEditor(quill);
        setError(""); // Clear any previous errors
      } catch (err) {
        console.error("Failed to initialize Quill:", err);
        setError("Failed to initialize rich text editor: " + err.message);
      }
    } else {
      console.log("Quill initialization skipped:", {
        hasRef: !!quillRef.current,
        hasQuill: !!window.Quill,
        hasEditor: !!quillEditor,
      });
    }
  };

  // Update Quill content when formData.content changes (for loading existing posts)
  useEffect(() => {
    if (quillEditor && formData.content !== quillEditor.root.innerHTML) {
      quillEditor.root.innerHTML = formData.content;
    }
  }, [formData.content, quillEditor]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      return result.imageUrl;
    } catch (err) {
      setError("Image upload failed: " + err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = postId ? `/api/posts/${postId}` : "/api/posts";
      const method = postId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          authorId: post?.authorId || "current-user", // You might want to get this from auth context
          authorName: post?.authorName || "Admin User",
        }),
      });

      if (response.ok) {
        // Navigate back to posts list
        window.history.pushState({}, "", "/admin/posts");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        const error = await response.json();
        setError(error.message || "Failed to save post");
      }
    } catch (err) {
      setError("Error saving post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement(
          "div",
          { className: "spinner-border" },
          React.createElement(
            "span",
            { className: "visually-hidden" },
            "Loading...",
          ),
        ),
      ),
    );
  }

  return React.createElement(
    "div",
    { className: "container mt-4" },
    React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "div",
        { className: "col-12" },
        React.createElement(
          "div",
          {
            className: "d-flex justify-content-between align-items-center mb-4",
          },
          React.createElement(
            "h2",
            null,
            postId ? "Edit Post" : "Create New Post",
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "button",
              {
                className: "btn btn-secondary me-2",
                onClick: () => {
                  window.history.pushState({}, "", "/admin/posts");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                },
              },
              "Back to Posts",
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-primary",
                onClick: handleSave,
                disabled: saving,
              },
              saving ? "Saving..." : "Save Post",
            ),
          ),
        ),

        error &&
          React.createElement(
            "div",
            { className: "alert alert-danger" },
            error,
          ),

        React.createElement(
          "div",
          { className: "card" },
          React.createElement(
            "div",
            { className: "card-body" },
            React.createElement(
              "div",
              { className: "row" },
              React.createElement(
                "div",
                { className: "col-md-8" },
                // Title
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Title",
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "form-control",
                    value: formData.title,
                    onChange: (e) => handleInputChange("title", e.target.value),
                    placeholder: "Enter post title...",
                  }),
                ),

                // Content - Rich Text Editor
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Content",
                  ),
                  React.createElement("div", {
                    ref: quillRef,
                    style: { minHeight: "300px", marginBottom: "42px" },
                    className: "border rounded",
                  }),
                  !quillEditor &&
                    React.createElement(
                      "div",
                      { className: "text-muted small" },
                      "Loading rich text editor...",
                    ),
                ),

                // Excerpt
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Excerpt",
                  ),
                  React.createElement("textarea", {
                    className: "form-control",
                    rows: 3,
                    value: formData.excerpt,
                    onChange: (e) =>
                      handleInputChange("excerpt", e.target.value),
                    placeholder: "Brief description or excerpt...",
                  }),
                ),
              ),

              React.createElement(
                "div",
                { className: "col-md-4" },
                // Status
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Status",
                  ),
                  React.createElement(
                    "select",
                    {
                      className: "form-select",
                      value: formData.status,
                      onChange: (e) =>
                        handleInputChange("status", e.target.value),
                    },
                    React.createElement("option", { value: "draft" }, "Draft"),
                    React.createElement(
                      "option",
                      { value: "published" },
                      "Published",
                    ),
                  ),
                ),

                // Category
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Category",
                  ),
                  React.createElement(
                    "select",
                    {
                      className: "form-select",
                      value: formData.categoryId,
                      onChange: (e) =>
                        handleInputChange("categoryId", e.target.value),
                    },
                    React.createElement(
                      "option",
                      { value: "" },
                      "Select category...",
                    ),
                    categories.map((cat) =>
                      React.createElement(
                        "option",
                        { key: cat.id, value: cat.id },
                        cat.name,
                      ),
                    ),
                  ),
                ),

                // Featured Image Upload
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    "Featured Image",
                  ),
                  React.createElement("input", {
                    type: "file",
                    className: "form-control mb-2",
                    accept: "image/*",
                    onChange: async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const imageUrl = await handleImageUpload(file);
                          handleInputChange("featuredImage", imageUrl);
                        } catch (err) {
                          console.error("Upload failed:", err);
                        }
                      }
                    },
                    disabled: uploading,
                  }),
                  React.createElement(
                    "small",
                    { className: "text-muted" },
                    "Upload an image or paste URL below",
                  ),
                ),

                // Featured Image URL (alternative)
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement("input", {
                    type: "url",
                    className: "form-control",
                    value: formData.featuredImage,
                    onChange: (e) =>
                      handleInputChange("featuredImage", e.target.value),
                    placeholder: "Or paste image URL here...",
                  }),
                ),

                uploading &&
                  React.createElement(
                    "div",
                    { className: "mb-3" },
                    React.createElement(
                      "div",
                      { className: "text-center" },
                      React.createElement("div", {
                        className: "spinner-border spinner-border-sm me-2",
                      }),
                      React.createElement("span", null, "Uploading image..."),
                    ),
                  ),

                formData.featuredImage &&
                  React.createElement(
                    "div",
                    { className: "mb-3" },
                    React.createElement("img", {
                      src: formData.featuredImage,
                      alt: "Featured image preview",
                      className: "img-fluid rounded",
                      style: { maxHeight: "200px" },
                    }),
                  ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
};

// Admin Posts Management Component
const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/posts", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Posts API response:", data);
        // Ensure data is an array
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("Expected array, got:", typeof data, data);
          setPosts([]);
          setError("Invalid posts data format");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Posts loading error:", err);
        setError("Failed to load posts: " + err.message);
        setLoading(false);
        setPosts([]);
      });
  }, []);

  const deletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
      } else {
        alert("Failed to delete post");
      }
    } catch (err) {
      alert("Error deleting post");
    }
  };

  const toggleStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setPosts(
          posts.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)),
        );
      }
    } catch (err) {
      alert("Error updating post status");
    }
  };

  if (loading)
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement(
          "div",
          { className: "spinner-border" },
          React.createElement(
            "span",
            { className: "visually-hidden" },
            "Loading...",
          ),
        ),
      ),
    );

  return React.createElement(
    "div",
    { className: "container mt-4" },
    React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "div",
        { className: "col-12" },
        React.createElement(
          "div",
          {
            className: "d-flex justify-content-between align-items-center mb-4",
          },
          React.createElement("h2", null, "Manage Posts"),
          React.createElement(
            "div",
            null,
            React.createElement(
              "button",
              {
                className: "btn btn-secondary me-2",
                onClick: () => {
                  window.history.pushState({}, "", "/admin-access");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                },
              },
              "Back to Dashboard",
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-primary",
                onClick: () => {
                  window.history.pushState({}, "", "/admin/posts/new");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                },
              },
              "New Post",
            ),
          ),
        ),

        error &&
          React.createElement(
            "div",
            { className: "alert alert-danger" },
            error,
          ),

        posts.length === 0
          ? React.createElement(
              "div",
              { className: "text-center py-5" },
              React.createElement(
                "p",
                { className: "text-muted" },
                "No posts found",
              ),
            )
          : React.createElement(
              "div",
              { className: "card" },
              React.createElement(
                "div",
                { className: "card-body p-0" },
                React.createElement(
                  "div",
                  { className: "table-responsive" },
                  React.createElement(
                    "table",
                    { className: "table table-hover mb-0" },
                    React.createElement(
                      "thead",
                      { className: "table-light" },
                      React.createElement(
                        "tr",
                        null,
                        React.createElement("th", null, "Title"),
                        React.createElement("th", null, "Author"),
                        React.createElement("th", null, "Status"),
                        React.createElement("th", null, "Created"),
                        React.createElement("th", null, "Actions"),
                      ),
                    ),
                    React.createElement(
                      "tbody",
                      null,
                      posts.map((post) =>
                        React.createElement(
                          "tr",
                          { key: post.id },
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              null,
                              React.createElement(
                                "h6",
                                { className: "mb-1" },
                                post.title,
                              ),
                              React.createElement(
                                "small",
                                { className: "text-muted" },
                                post.excerpt
                                  ? post.excerpt.substring(0, 80) + "..."
                                  : "",
                              ),
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            post.authorName || "Unknown",
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "span",
                              {
                                className: `badge ${post.status === "published" ? "bg-success" : "bg-warning"}`,
                              },
                              post.status || "draft",
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            new Date(post.createdAt).toLocaleDateString(),
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              { className: "btn-group btn-group-sm" },
                              React.createElement(
                                "button",
                                {
                                  className: "btn btn-outline-primary",
                                  onClick: () => {
                                    window.history.pushState(
                                      {},
                                      "",
                                      `/admin/posts/edit/${post.id}`,
                                    );
                                    window.dispatchEvent(
                                      new PopStateEvent("popstate"),
                                    );
                                  },
                                },
                                "Edit",
                              ),
                              React.createElement(
                                "button",
                                {
                                  className: `btn btn-outline-${post.status === "published" ? "warning" : "success"}`,
                                  onClick: () =>
                                    toggleStatus(post.id, post.status),
                                },
                                post.status === "published"
                                  ? "Unpublish"
                                  : "Publish",
                              ),
                              React.createElement(
                                "button",
                                {
                                  className: "btn btn-outline-danger",
                                  onClick: () => deletePost(post.id),
                                },
                                "Delete",
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
      ),
    ),
  );
};

// Admin Users Management Component
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Users API response:", data);
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error("Expected array, got:", typeof data, data);
          setUsers([]);
          setError("Invalid users data format");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Users loading error:", err);
        setError("Failed to load users: " + err.message);
        setLoading(false);
        setUsers([]);
      });
  }, []);

  const toggleUserApproval = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    console.log(
      `Toggling approval for user ${userId}: ${currentStatus} -> ${newStatus}`,
    );

    try {
      const response = await fetch(`/api/users/${userId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approved: newStatus }),
      });

      console.log("Approval response status:", response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log("User approval updated:", updatedUser);
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, approved: newStatus } : u,
          ),
        );
      } else {
        const errorData = await response.text();
        console.error("Approval failed:", response.status, errorData);
        alert(`Error updating user approval: ${response.status} ${errorData}`);
      }
    } catch (err) {
      console.error("Approval error:", err);
      alert("Error updating user approval: " + err.message);
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = !currentRole;
    console.log(
      `Toggling role for user ${userId}: ${currentRole} -> ${newRole}`,
    );

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAdmin: newRole }),
      });

      console.log("Role response status:", response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log("User role updated:", updatedUser);
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, isAdmin: newRole } : u)),
        );
      } else {
        const errorData = await response.text();
        console.error("Role update failed:", response.status, errorData);
        alert(`Error updating user role: ${response.status} ${errorData}`);
      }
    } catch (err) {
      console.error("Role update error:", err);
      alert("Error updating user role: " + err.message);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    console.log(`Deleting user ${userId}: ${userName}`);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("Delete response status:", response.status);

      if (response.ok) {
        console.log("User deleted successfully");
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        const errorData = await response.text();
        console.error("Delete failed:", response.status, errorData);
        alert(`Error deleting user: ${response.status} ${errorData}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting user: " + err.message);
    }
  };

  if (loading)
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement(
          "div",
          { className: "spinner-border" },
          React.createElement(
            "span",
            { className: "visually-hidden" },
            "Loading...",
          ),
        ),
      ),
    );

  return React.createElement(
    "div",
    { className: "container mt-4" },
    React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "div",
        { className: "col-12" },
        React.createElement(
          "div",
          {
            className: "d-flex justify-content-between align-items-center mb-4",
          },
          React.createElement("h2", null, "Manage Users"),
          React.createElement(
            "button",
            {
              className: "btn btn-secondary",
              onClick: () => {
                window.history.pushState({}, "", "/admin-access");
                window.dispatchEvent(new PopStateEvent("popstate"));
              },
            },
            "Back to Dashboard",
          ),
        ),

        error &&
          React.createElement(
            "div",
            { className: "alert alert-danger" },
            error,
          ),

        users.length === 0
          ? React.createElement(
              "div",
              { className: "text-center py-5" },
              React.createElement(
                "p",
                { className: "text-muted" },
                "No users found",
              ),
            )
          : React.createElement(
              "div",
              { className: "card" },
              React.createElement(
                "div",
                { className: "card-body p-0" },
                React.createElement(
                  "div",
                  { className: "table-responsive" },
                  React.createElement(
                    "table",
                    { className: "table table-hover mb-0" },
                    React.createElement(
                      "thead",
                      { className: "table-light" },
                      React.createElement(
                        "tr",
                        null,
                        React.createElement("th", null, "User"),
                        React.createElement("th", null, "Email"),
                        React.createElement("th", null, "Role"),
                        React.createElement("th", null, "Status"),
                        React.createElement("th", null, "Joined"),
                        React.createElement("th", null, "Actions"),
                      ),
                    ),
                    React.createElement(
                      "tbody",
                      null,
                      users.map((user) =>
                        React.createElement(
                          "tr",
                          { key: user.id },
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              null,
                              React.createElement(
                                "h6",
                                { className: "mb-1" },
                                user.name || "Unknown",
                              ),
                              React.createElement(
                                "small",
                                { className: "text-muted" },
                                `@${user.username}`,
                              ),
                            ),
                          ),
                          React.createElement("td", null, user.email),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "span",
                              {
                                className: `badge ${user.isAdmin ? "bg-danger" : "bg-secondary"}`,
                              },
                              user.isAdmin ? "Admin" : "User",
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "span",
                              {
                                className: `badge ${user.approved ? "bg-success" : "bg-warning"}`,
                              },
                              user.approved ? "Approved" : "Pending",
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            new Date(user.createdAt).toLocaleDateString(),
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              { className: "btn-group btn-group-sm" },
                              React.createElement(
                                "button",
                                {
                                  className: `btn btn-outline-${user.approved ? "warning" : "success"}`,
                                  onClick: () =>
                                    toggleUserApproval(user.id, user.approved),
                                },
                                user.approved ? "Unapprove" : "Approve",
                              ),
                              React.createElement(
                                "button",
                                {
                                  className: `btn btn-outline-${user.isAdmin ? "secondary" : "danger"}`,
                                  onClick: () =>
                                    toggleUserRole(user.id, user.isAdmin),
                                  disabled: user.id === "current-admin", // Prevent admin from removing their own admin status
                                },
                                user.isAdmin ? "Remove Admin" : "Make Admin",
                              ),
                              React.createElement(
                                "button",
                                {
                                  className: "btn btn-outline-danger",
                                  onClick: () =>
                                    deleteUser(
                                      user.id,
                                      user.name || user.username,
                                    ),
                                  disabled: user.email === "admin@example.com", // Prevent deleting the main admin
                                },
                                "Delete",
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
      ),
    ),
  );
};

// Blog Post Reading Component
const BlogPostReader = () => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Get slug from URL
  const slug = window.location.pathname.split("/posts/")[1];

  useEffect(() => {
    if (!slug) return;

    // Load post content (authenticated endpoint)
    fetch(`/api/posts/${slug}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setPost(data);
        return fetch(`/api/posts/${data.id}/comments`, {
          credentials: "include",
        });
      })
      .then((res) => (res.ok ? res.json() : []))
      .then((commentsData) => {
        setComments(Array.isArray(commentsData) ? commentsData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading post:", err);
        setError("Failed to load post: " + err.message);
        setLoading(false);
      });
  }, [slug]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          postId: post.id,
          content: newComment.trim(),
          parentId: replyingTo,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setReplyingTo(null);
        // Refresh comments
        const commentsRes = await fetch(`/api/posts/${post.id}/comments`, {
          credentials: "include",
        });
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(Array.isArray(commentsData) ? commentsData : []);
        }
      } else {
        alert("Failed to post comment");
      }
    } catch (err) {
      alert("Error posting comment");
    }
  };

  if (loading)
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement(
          "div",
          { className: "spinner-border" },
          React.createElement(
            "span",
            { className: "visually-hidden" },
            "Loading...",
          ),
        ),
      ),
    );

  if (error)
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement("div", { className: "alert alert-danger" }, error),
      React.createElement(
        "button",
        {
          className: "btn btn-primary",
          onClick: () => {
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          },
        },
        "Back to Home",
      ),
    );

  if (!post)
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "alert alert-warning" },
        "Post not found",
      ),
      React.createElement(
        "button",
        {
          className: "btn btn-primary",
          onClick: () => {
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          },
        },
        "Back to Home",
      ),
    );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return React.createElement(
    "div",
    { className: "min-vh-100", style: { backgroundColor: "#f8f9fa" } },
    // Navigation with mobile toggle
    React.createElement(
      "nav",
      {
        className: "navbar navbar-expand-lg",
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "a",
          {
            className: "navbar-brand text-white fw-bold fs-3",
            href: "#",
            onClick: (e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
              closeMobileMenu();
            },
            style: { cursor: "pointer" },
          },
          "Mr. S Teaches",
        ),

        // Mobile toggle button
        React.createElement(
          "button",
          {
            className: "navbar-toggler border-0",
            type: "button",
            onClick: toggleMobileMenu,
            style: {
              padding: "0.25rem 0.5rem",
              fontSize: "1.25rem",
              color: "white",
              background: "none",
            },
          },
          React.createElement("span", {
            style: {
              display: "inline-block",
              width: "1.5em",
              height: "1.5em",
              verticalAlign: "middle",
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 1%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='m4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "100%",
            },
          }),
        ),

        // Navigation menu
        React.createElement(
          "div",
          {
            className: `collapse navbar-collapse ${mobileMenuOpen ? "show" : ""}`,
            style: mobileMenuOpen ? { display: "block" } : {},
          },
          React.createElement(
            "div",
            { className: "navbar-nav ms-auto" },
            React.createElement(
              "div",
              {
                className: "d-lg-flex d-block align-items-center gap-3",
              },
              React.createElement(
                "span",
                {
                  className:
                    "text-white navbar-text d-block d-lg-inline mb-2 mb-lg-0",
                },
                `Welcome, ${user.name}`,
              ),

              user.isAdmin &&
                React.createElement(
                  "button",
                  {
                    className:
                      "btn btn-outline-light btn-sm mb-2 mb-lg-0 me-lg-2",
                    onClick: () => {
                      window.history.pushState({}, "", "/admin-access");
                      window.dispatchEvent(new PopStateEvent("popstate"));
                      closeMobileMenu();
                    },
                    style: { width: "100%", maxWidth: "200px" },
                  },
                  "Dashboard",
                ),

              React.createElement(
                "button",
                {
                  className: "btn btn-outline-light btn-sm",
                  onClick: () => {
                    logout();
                    closeMobileMenu();
                  },
                  style: { width: "100%", maxWidth: "200px" },
                },
                "Logout",
              ),
            ),
          ),
        ),
      ),
    ),

    // Post Content
    React.createElement(
      "div",
      { className: "container mt-4" },
      React.createElement(
        "div",
        { className: "row justify-content-center" },
        React.createElement(
          "div",
          { className: "col-lg-8" },

          // Back button
          React.createElement(
            "div",
            { className: "mb-3" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-secondary",
                onClick: () => {
                  window.history.pushState({}, "", "/");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                },
              },
              "← Back to Home",
            ),
          ),

          // Post header
          React.createElement(
            "div",
            { className: "card mb-4" },
            post.featuredImage &&
              React.createElement("img", {
                src: post.featuredImage,
                className: "card-img-top",
                alt: post.title,
                style: { height: "300px", objectFit: "cover" },
              }),
            React.createElement(
              "div",
              { className: "card-body" },
              React.createElement(
                "div",
                { className: "mb-3" },
                post.categoryName &&
                  React.createElement(
                    "span",
                    { className: "badge bg-primary me-2" },
                    post.categoryName,
                  ),
                post.featured &&
                  React.createElement(
                    "span",
                    { className: "badge bg-warning" },
                    "Featured",
                  ),
              ),
              React.createElement(
                "h1",
                { className: "card-title mb-3" },
                post.title,
              ),
              React.createElement(
                "div",
                { className: "text-muted mb-3" },
                React.createElement(
                  "small",
                  null,
                  `By ${post.authorName} • ${new Date(post.publishedAt).toLocaleDateString()}`,
                ),
              ),
              post.excerpt &&
                React.createElement(
                  "p",
                  { className: "lead text-muted" },
                  post.excerpt,
                ),
            ),
          ),

          // Post content
          React.createElement(
            "div",
            { className: "card mb-4" },
            React.createElement("div", {
              className: "card-body",
              dangerouslySetInnerHTML: { __html: post.content },
            }),
          ),

          // Comments section
          React.createElement(
            "div",
            { className: "card" },
            React.createElement(
              "div",
              { className: "card-header" },
              React.createElement(
                "h5",
                { className: "mb-0" },
                `Comments (${comments.length})`,
              ),
            ),
            React.createElement(
              "div",
              { className: "card-body" },

              // Comment form
              React.createElement(
                "form",
                { onSubmit: handleCommentSubmit, className: "mb-4" },
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label" },
                    replyingTo ? "Reply to comment" : "Leave a comment",
                  ),
                  React.createElement("textarea", {
                    className: "form-control",
                    rows: 3,
                    value: newComment,
                    onChange: (e) => setNewComment(e.target.value),
                    placeholder: "Share your thoughts...",
                  }),
                ),
                React.createElement(
                  "div",
                  { className: "d-flex gap-2" },
                  React.createElement(
                    "button",
                    {
                      type: "submit",
                      className: "btn btn-primary",
                    },
                    replyingTo ? "Post Reply" : "Post Comment",
                  ),
                  replyingTo &&
                    React.createElement(
                      "button",
                      {
                        type: "button",
                        className: "btn btn-secondary",
                        onClick: () => setReplyingTo(null),
                      },
                      "Cancel Reply",
                    ),
                ),
              ),

              // Comments list
              comments.length === 0
                ? React.createElement(
                    "p",
                    { className: "text-muted" },
                    "No comments yet. Be the first to share your thoughts!",
                  )
                : React.createElement(
                    "div",
                    null,
                    comments.map((comment) =>
                      React.createElement(
                        "div",
                        {
                          key: comment.id,
                          className: "border-bottom pb-3 mb-3",
                        },
                        React.createElement(
                          "div",
                          { className: "mb-2" },
                          React.createElement(
                            "strong",
                            null,
                            comment.authorName || "Anonymous",
                          ),
                          React.createElement(
                            "small",
                            { className: "text-muted ms-2" },
                            new Date(comment.createdAt).toLocaleDateString(),
                          ),
                        ),
                        React.createElement(
                          "p",
                          { className: "mb-2" },
                          comment.content,
                        ),
                        React.createElement(
                          "button",
                          {
                            className: "btn btn-sm btn-outline-primary",
                            onClick: () => {
                              setReplyingTo(comment.id);
                              document.querySelector("textarea").focus();
                            },
                          },
                          "Reply",
                        ),

                        // Show replies
                        comment.replies &&
                          comment.replies.length > 0 &&
                          React.createElement(
                            "div",
                            {
                              className: "ms-4 mt-3",
                            },
                            comment.replies.map((reply) =>
                              React.createElement(
                                "div",
                                {
                                  key: reply.id,
                                  className:
                                    "border-start border-3 border-light ps-3 mb-3",
                                },
                                React.createElement(
                                  "div",
                                  { className: "mb-1" },
                                  React.createElement(
                                    "strong",
                                    null,
                                    reply.authorName || "Anonymous",
                                  ),
                                  React.createElement(
                                    "small",
                                    { className: "text-muted ms-2" },
                                    new Date(
                                      reply.createdAt,
                                    ).toLocaleDateString(),
                                  ),
                                ),
                                React.createElement(
                                  "p",
                                  { className: "mb-0" },
                                  reply.content,
                                ),
                              ),
                            ),
                          ),
                      ),
                    ),
                  ),
            ),
          ),
        ),
      ),
    ),
  );
};

// Admin Comments Management Component
const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/comments", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Comments API response:", data);
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          console.error("Expected array, got:", typeof data, data);
          setComments([]);
          setError("Invalid comments data format");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Comments loading error:", err);
        setError("Failed to load comments: " + err.message);
        setLoading(false);
        setComments([]);
      });
  }, []);

  const deleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      } else {
        alert("Failed to delete comment");
      }
    } catch (err) {
      alert("Error deleting comment");
    }
  };

  const toggleCommentApproval = async (commentId, currentStatus) => {
    const newStatus = currentStatus === "approved" ? "pending" : "approved";

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, status: newStatus } : c,
          ),
        );
      } else {
        const errorData = await response.json();
        alert(`Failed to ${newStatus} comment: ${errorData.message}`);
      }
    } catch (err) {
      alert("Error updating comment status: " + err.message);
    }
  };

  if (loading)
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement(
          "div",
          { className: "spinner-border" },
          React.createElement(
            "span",
            { className: "visually-hidden" },
            "Loading...",
          ),
        ),
      ),
    );

  return React.createElement(
    "div",
    { className: "container mt-4" },
    React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "div",
        { className: "col-12" },
        React.createElement(
          "div",
          {
            className: "d-flex justify-content-between align-items-center mb-4",
          },
          React.createElement("h2", null, "Manage Comments"),
          React.createElement(
            "button",
            {
              className: "btn btn-secondary",
              onClick: () => {
                window.history.pushState({}, "", "/admin-access");
                window.dispatchEvent(new PopStateEvent("popstate"));
              },
            },
            "Back to Dashboard",
          ),
        ),

        error &&
          React.createElement(
            "div",
            { className: "alert alert-danger" },
            error,
          ),

        comments.length === 0
          ? React.createElement(
              "div",
              { className: "text-center py-5" },
              React.createElement(
                "p",
                { className: "text-muted" },
                "No comments found",
              ),
            )
          : React.createElement(
              "div",
              { className: "card" },
              React.createElement(
                "div",
                { className: "card-body p-0" },
                React.createElement(
                  "div",
                  { className: "table-responsive" },
                  React.createElement(
                    "table",
                    { className: "table table-hover mb-0" },
                    React.createElement(
                      "thead",
                      { className: "table-light" },
                      React.createElement(
                        "tr",
                        null,
                        React.createElement("th", null, "Comment"),
                        React.createElement("th", null, "Author"),
                        React.createElement("th", null, "Post"),
                        React.createElement("th", null, "Status"),
                        React.createElement("th", null, "Date"),
                        React.createElement("th", null, "Actions"),
                      ),
                    ),
                    React.createElement(
                      "tbody",
                      null,
                      comments.map((comment) =>
                        React.createElement(
                          "tr",
                          { key: comment.id },
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              { style: { maxWidth: "300px" } },
                              React.createElement(
                                "p",
                                { className: "mb-1" },
                                comment.content.length > 100
                                  ? comment.content.substring(0, 100) + "..."
                                  : comment.content,
                              ),
                              comment.parentId &&
                                React.createElement(
                                  "small",
                                  { className: "text-muted" },
                                  "↳ Reply to another comment",
                                ),
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              null,
                              React.createElement(
                                "strong",
                                null,
                                comment.authorName || "Anonymous",
                              ),
                              comment.authorEmail && React.createElement("br"),
                              comment.authorEmail &&
                                React.createElement(
                                  "small",
                                  { className: "text-muted" },
                                  comment.authorEmail,
                                ),
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              null,
                              React.createElement(
                                "strong",
                                null,
                                comment.postTitle || "Unknown Post",
                              ),
                              React.createElement("br"),
                              React.createElement(
                                "small",
                                { className: "text-muted" },
                                `Post ID: ${comment.postId}`,
                              ),
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "span",
                              {
                                className: `badge ${comment.status === "approved" ? "bg-success" : "bg-warning"}`,
                              },
                              comment.status || "pending",
                            ),
                          ),
                          React.createElement(
                            "td",
                            null,
                            new Date(comment.createdAt).toLocaleDateString(),
                          ),
                          React.createElement(
                            "td",
                            null,
                            React.createElement(
                              "div",
                              { className: "btn-group btn-group-sm" },
                              React.createElement(
                                "button",
                                {
                                  className: `btn btn-outline-${comment.status === "approved" ? "warning" : "success"}`,
                                  onClick: () =>
                                    toggleCommentApproval(
                                      comment.id,
                                      comment.status,
                                    ),
                                },
                                comment.status === "approved"
                                  ? "Unapprove"
                                  : "Approve",
                              ),
                              React.createElement(
                                "button",
                                {
                                  className: "btn btn-outline-danger",
                                  onClick: () => deleteComment(comment.id),
                                },
                                "Delete",
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
      ),
    ),
  );
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) {
      window.location.href = "/";
      return;
    }

    // Load admin stats
    Promise.all([
      fetch("/api/users", { credentials: "include" }),
      fetch("/api/posts", { credentials: "include" }),
      fetch("/api/categories", { credentials: "include" }),
    ])
      .then(async ([usersRes, postsRes, categoriesRes]) => {
        const users = usersRes.ok ? await usersRes.json() : [];
        const posts = postsRes.ok ? await postsRes.json() : [];
        const categories = categoriesRes.ok ? await categoriesRes.json() : [];

        setStats({
          totalUsers: users.length,
          pendingUsers: users.filter((u) => !u.approved).length,
          totalPosts: posts.length,
          totalCategories: categories.length,
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  if (!user?.isAdmin) {
    return React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "alert alert-danger" },
        "Access denied. Admin privileges required.",
      ),
    );
  }

  return React.createElement(
    "div",
    { className: "min-vh-100", style: { backgroundColor: "#f8f9fa" } },
    // Navigation
    React.createElement(
      "nav",
      { className: "navbar navbar-expand-lg navbar-dark bg-primary" },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "a",
          {
            className: "navbar-brand fw-bold",
            href: "/",
            onClick: (e) => {
              e.preventDefault();
              window.location.href = "/";
            },
          },
          "BlogCraft Admin",
        ),
        React.createElement(
          "div",
          { className: "navbar-nav ms-auto" },
          React.createElement(
            "div",
            { className: "d-flex align-items-center" },
            React.createElement(
              "span",
              { className: "text-light me-3" },
              `Welcome, ${user.name}`,
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light btn-sm",
                onClick: logout,
              },
              "Logout",
            ),
          ),
        ),
      ),
    ),

    // Admin Content
    React.createElement(
      "div",
      { className: "container mt-4" },
      React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "col-12" },
          React.createElement("h1", { className: "mb-4" }, "Admin Dashboard"),

          loading
            ? React.createElement(
                "div",
                { className: "text-center" },
                React.createElement("div", {
                  className: "spinner-border text-primary",
                }),
              )
            : React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                  "div",
                  { className: "col-md-3 mb-4" },
                  React.createElement(
                    "div",
                    { className: "card bg-primary text-white" },
                    React.createElement(
                      "div",
                      { className: "card-body" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        "Total Users",
                      ),
                      React.createElement(
                        "h2",
                        { className: "mb-0" },
                        stats?.totalUsers || 0,
                      ),
                    ),
                  ),
                ),
                React.createElement(
                  "div",
                  { className: "col-md-3 mb-4" },
                  React.createElement(
                    "div",
                    { className: "card bg-warning text-white" },
                    React.createElement(
                      "div",
                      { className: "card-body" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        "Pending Approval",
                      ),
                      React.createElement(
                        "h2",
                        { className: "mb-0" },
                        stats?.pendingUsers || 0,
                      ),
                    ),
                  ),
                ),
                React.createElement(
                  "div",
                  { className: "col-md-3 mb-4" },
                  React.createElement(
                    "div",
                    { className: "card bg-success text-white" },
                    React.createElement(
                      "div",
                      { className: "card-body" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        "Blog Posts",
                      ),
                      React.createElement(
                        "h2",
                        { className: "mb-0" },
                        stats?.totalPosts || 0,
                      ),
                    ),
                  ),
                ),
                React.createElement(
                  "div",
                  { className: "col-md-3 mb-4" },
                  React.createElement(
                    "div",
                    { className: "card bg-info text-white" },
                    React.createElement(
                      "div",
                      { className: "card-body" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        "Categories",
                      ),
                      React.createElement(
                        "h2",
                        { className: "mb-0" },
                        stats?.totalCategories || 0,
                      ),
                    ),
                  ),
                ),
              ),

          // Quick Actions
          React.createElement(
            "div",
            { className: "row mt-4" },
            React.createElement(
              "div",
              { className: "col-12" },
              React.createElement("h3", { className: "mb-3" }, "Quick Actions"),
              React.createElement(
                "div",
                { className: "row" },
                React.createElement(
                  "div",
                  { className: "col-md-4 mb-3" },
                  React.createElement(
                    "div",
                    { className: "card" },
                    React.createElement(
                      "div",
                      { className: "card-body text-center" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        "Manage Users",
                      ),
                      React.createElement(
                        "p",
                        { className: "card-text" },
                        "Approve new users and manage permissions",
                      ),
                      React.createElement(
                        "a",
                        {
                          href: "/admin/users",
                          className: "btn btn-primary",
                        },
                        "View Users",
                      ),
                    ),
                  ),
                ),
                React.createElement(
                  "div",
                  { className: "col-md-4 mb-3" },
                  React.createElement(
                    "div",
                    { className: "card" },
                    React.createElement(
                      "div",
                      { className: "card-body text-center" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        "Manage Posts",
                      ),
                      React.createElement(
                        "p",
                        { className: "card-text" },
                        "Create, edit, and manage blog posts",
                      ),
                      React.createElement(
                        "a",
                        {
                          href: "/admin/posts",
                          className: "btn btn-success",
                        },
                        "View Posts",
                      ),
                    ),
                  ),
                ),
                React.createElement(
                  "div",
                  { className: "col-md-4 mb-3" },
                  React.createElement(
                    "div",
                    { className: "card" },
                    React.createElement(
                      "div",
                      { className: "card-body text-center" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        "Manage Comments",
                      ),
                      React.createElement(
                        "p",
                        { className: "card-text" },
                        "Moderate and manage user comments",
                      ),
                      React.createElement(
                        "a",
                        {
                          href: "/admin/comments",
                          className: "btn btn-warning",
                        },
                        "View Comments",
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
};

// Simple Home Component
const SimpleHome = () => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urlMessage, setUrlMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for URL parameters and load posts
  useEffect(() => {
    // Check for URL message parameter
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get("message");
    if (message === "pending-approval") {
      setUrlMessage(
        "Your Google account registration is pending approval. Please wait for an administrator to approve your account.",
      );
      // Clean URL
      window.history.replaceState({}, "", "/");
    }

    // Always use the public endpoint to show post previews to everyone
    fetch("/api/posts/public", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Failed to fetch posts");
      })
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading posts:", err);
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const handleShowAuth = (isLogin) => {
    setIsLoginMode(isLogin);
    setShowAuthModal(true);
  };

  const handleToggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  const handlePostClick = (post) => {
    if (!user) {
      // Show login modal for unauthenticated users
      setIsLoginMode(true);
      setShowAuthModal(true);
    } else if (!user.approved) {
      // Show message for unapproved users
      alert(
        "Your account is pending approval. Please wait for an administrator to approve your account before you can read blog posts.",
      );
    } else {
      // Approved users can access posts - navigate to post reading page
      window.history.pushState({}, "", `/posts/${post.slug}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return React.createElement(
    "div",
    { className: "min-vh-100", style: { backgroundColor: "#f8f9fa" } },
    // Navigation with mobile toggle
    React.createElement(
      "nav",
      {
        className: "navbar navbar-expand-lg",
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "a",
          {
            className: "navbar-brand text-white fw-bold fs-3",
            href: "#",
            onClick: (e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
              closeMobileMenu();
            },
            style: { cursor: "pointer" },
          },
          "Mr. S Teaches",
        ),

        // Mobile toggle button
        React.createElement(
          "button",
          {
            className: "navbar-toggler border-0",
            type: "button",
            onClick: toggleMobileMenu,
            style: {
              padding: "0.25rem 0.5rem",
              fontSize: "1.25rem",
              color: "white",
              background: "none",
            },
          },
          React.createElement("span", {
            style: {
              display: "inline-block",
              width: "1.5em",
              height: "1.5em",
              verticalAlign: "middle",
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 1%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='m4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "100%",
            },
          }),
        ),

        // Navigation menu
        React.createElement(
          "div",
          {
            className: `collapse navbar-collapse ${mobileMenuOpen ? "show" : ""}`,
            style: mobileMenuOpen ? { display: "block" } : {},
          },
          React.createElement(
            "div",
            { className: "navbar-nav ms-auto" },
            user
              ? React.createElement(
                  "div",
                  {
                    className: "d-lg-flex d-block align-items-center gap-3",
                  },
                  React.createElement(
                    "span",
                    {
                      className:
                        "text-white navbar-text d-block d-lg-inline mb-2 mb-lg-0",
                    },
                    `Welcome, ${user.name}`,
                  ),

                  React.createElement(
                    "button",
                    {
                      className:
                        "btn btn-outline-light btn-sm mb-2 mb-lg-0 me-lg-2",
                      onClick: (e) => {
                        e.preventDefault();
                        window.history.pushState({}, "", "/blog");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                        closeMobileMenu();
                      },
                      style: { width: "100%", maxWidth: "200px" },
                    },
                    "All Posts",
                  ),

                  user.isAdmin &&
                    React.createElement(
                      "button",
                      {
                        className:
                          "btn btn-outline-light btn-sm mb-2 mb-lg-0 me-lg-2",
                        onClick: (e) => {
                          e.preventDefault();
                          console.log("Dashboard clicked, user:", user);
                          window.history.pushState({}, "", "/admin-access");
                          window.dispatchEvent(new PopStateEvent("popstate"));
                          closeMobileMenu();
                        },
                        style: { width: "100%", maxWidth: "200px" },
                      },
                      "Dashboard",
                    ),

                  React.createElement(
                    "button",
                    {
                      className: "btn btn-outline-light btn-sm",
                      onClick: () => {
                        logout();
                        closeMobileMenu();
                      },
                      style: { width: "100%", maxWidth: "200px" },
                    },
                    "Logout",
                  ),
                )
              : React.createElement(
                  "div",
                  {
                    className:
                      "d-flex d-lg-inline-flex flex-column flex-lg-row gap-2",
                  },
                  React.createElement(
                    "button",
                    {
                      className:
                        "btn btn-outline-light btn-sm mb-2 mb-lg-0 me-lg-2",
                      onClick: () => {
                        window.history.pushState({}, "", "/blog");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                        closeMobileMenu();
                      },
                      style: { width: "100%", maxWidth: "200px" },
                    },
                    "All Posts",
                  ),
                  React.createElement(
                    "button",
                    {
                      className: "btn btn-outline-light btn-sm",
                      onClick: () => {
                        handleShowAuth(true);
                        closeMobileMenu();
                      },
                      style: { width: "100%", maxWidth: "200px" },
                    },
                    "Sign In",
                  ),
                  React.createElement(
                    "button",
                    {
                      className: "btn btn-light btn-sm",
                      onClick: () => {
                        handleShowAuth(false);
                        closeMobileMenu();
                      },
                      style: { width: "100%", maxWidth: "200px" },
                    },
                    "Sign Up",
                  ),
                ),
          ),
        ),
      ),
    ),

    // Main Content
    React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "row justify-content-center" },
        React.createElement(
          "div",
          { className: "col-lg-8 text-center" },
          React.createElement(
            "h1",
            { className: "display-4 fw-bold mb-4" },
            "Welcome to BlogCraft",
          ),

          React.createElement(
            "div",
            null,
            React.createElement(
              "p",
              { className: "lead text-muted mb-4" },
              "Discover amazing stories, insights, and ideas from our community of writers.",
            ),

            // URL message for Google OAuth pending approval
            urlMessage &&
              React.createElement(
                "div",
                {
                  className: "alert alert-warning mx-auto mb-4",
                  style: { maxWidth: "500px" },
                },
                React.createElement(
                  "h6",
                  { className: "alert-heading" },
                  "Registration Pending",
                ),
                React.createElement("p", { className: "mb-0" }, urlMessage),
              ),

            // Status message based on user state
            !user
              ? React.createElement(
                  "div",
                  {
                    className: "alert alert-info mx-auto mb-4",
                    style: { maxWidth: "500px" },
                  },
                  React.createElement(
                    "h6",
                    { className: "alert-heading" },
                    "Join Our Community",
                  ),
                  React.createElement(
                    "p",
                    { className: "mb-0" },
                    "Sign up to read full articles and join the discussion!",
                  ),
                )
              : !user.approved
                ? React.createElement(
                    "div",
                    {
                      className: "alert alert-warning mx-auto mb-4",
                      style: { maxWidth: "500px" },
                    },
                    React.createElement(
                      "h6",
                      { className: "alert-heading" },
                      "Account Pending Approval",
                    ),
                    React.createElement(
                      "p",
                      { className: "mb-0" },
                      "Your account is being reviewed. You'll be able to read articles once approved!",
                    ),
                  )
                : React.createElement(
                    "div",
                    {
                      className: "alert alert-success mx-auto mb-4",
                      style: { maxWidth: "500px" },
                    },
                    React.createElement(
                      "h6",
                      { className: "alert-heading" },
                      "Welcome Back!",
                    ),
                    React.createElement(
                      "p",
                      { className: "mb-0" },
                      "You have full access to all our content.",
                    ),
                  ),
          ),
        ),
      ),
    ),

    // Blog Posts Section - Show to everyone
    React.createElement(
      "div",
      { className: "container mt-5" },
      React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "col-12" },
          React.createElement(
            "h2",
            { className: "text-center mb-4" },
            "Latest Articles",
          ),

          loading
            ? React.createElement(
                "div",
                { className: "text-center" },
                React.createElement("div", {
                  className: "spinner-border text-primary",
                }),
              )
            : posts.length === 0
              ? React.createElement(
                  "div",
                  { className: "text-center" },
                  React.createElement(
                    "p",
                    { className: "text-muted" },
                    "No articles available yet.",
                  ),
                )
              : React.createElement(
                  "div",
                  { className: "row" },
                  posts.slice(0, 6).map((post) =>
                    React.createElement(
                      "div",
                      {
                        key: post.id,
                        className: "col-md-6 col-lg-4 mb-4",
                      },
                      React.createElement(
                        "div",
                        {
                          className: "card h-100 shadow-sm",
                          style: { cursor: "pointer" },
                          onClick: () => handlePostClick(post),
                        },
                        post.featuredImage &&
                          React.createElement("img", {
                            src: post.featuredImage,
                            className: "card-img-top",
                            alt: post.title,
                            style: {
                              height: "200px",
                              objectFit: "cover",
                            },
                          }),
                        React.createElement(
                          "div",
                          { className: "card-body d-flex flex-column" },
                          React.createElement(
                            "h5",
                            { className: "card-title" },
                            post.title,
                          ),
                          React.createElement(
                            "p",
                            { className: "card-text flex-grow-1 text-muted" },
                            post.excerpt ||
                              post.content
                                .replace(/<[^>]*>/g, "")
                                .substring(0, 100) + "...",
                          ),
                          React.createElement(
                            "div",
                            { className: "mt-auto" },
                            React.createElement(
                              "div",
                              {
                                className:
                                  "d-flex justify-content-between align-items-center",
                              },
                              React.createElement(
                                "small",
                                { className: "text-muted" },
                                `By ${post.authorName}`,
                              ),
                              React.createElement(
                                "small",
                                { className: "text-muted" },
                                new Date(post.publishedAt).toLocaleDateString(),
                              ),
                            ),
                            post.categoryName &&
                              React.createElement(
                                "div",
                                { className: "mt-2" },
                                React.createElement(
                                  "span",
                                  { className: "badge bg-secondary" },
                                  post.categoryName,
                                ),
                              ),
                            React.createElement(
                              "div",
                              { className: "mt-2" },
                              React.createElement(
                                "span",
                                {
                                  className: `badge ${!user ? "bg-primary" : !user.approved ? "bg-warning" : "bg-success"}`,
                                },
                                !user
                                  ? "Sign in to read"
                                  : !user.approved
                                    ? "Approval needed"
                                    : "Read now",
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
        ),
      ),
    ),

    React.createElement(AuthModal, {
      show: showAuthModal,
      onHide: () => setShowAuthModal(false),
      isLogin: isLoginMode,
      onToggleMode: handleToggleAuthMode,
    }),

    // Footer
    React.createElement(Footer),
  );
};

// Modern React App Component (loads the App.jsx system)
const ModernReactApp = () => {
  const [appLoaded, setAppLoaded] = useState(false);
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    // Dynamically load and render the modern React app
    const loadModernApp = async () => {
      try {
        console.log("Loading modern React app components...");

        // This is a simplified approach - create a basic modern router inline
        // Import would be: import('./App.jsx') but we'll use a simpler approach
        setAppLoaded(true);
      } catch (error) {
        console.error("Failed to load modern React app:", error);
        setAppError(error.message);
      }
    };

    loadModernApp();
  }, []);

  if (appError) {
    return React.createElement(
      "div",
      {
        className: "container mt-5",
      },
      React.createElement(
        "div",
        { className: "alert alert-danger" },
        `Failed to load admin interface: ${appError}`,
      ),
    );
  }

  if (!appLoaded) {
    return React.createElement(
      "div",
      {
        className: "d-flex justify-content-center align-items-center",
        style: { minHeight: "100vh" },
      },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement("div", {
          className: "spinner-border text-primary",
        }),
        React.createElement(
          "p",
          { className: "mt-3" },
          "Loading admin interface...",
        ),
      ),
    );
  }

  // Render the proper admin dashboard
  return React.createElement(AdminDashboardInline);
};

// Admin Dashboard Component
const AdminDashboardInline = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    comments: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dashboard stats
    const loadStats = async () => {
      try {
        const [usersRes, postsRes, commentsRes, categoriesRes] =
          await Promise.all([
            fetch("/api/users", { credentials: "include" }),
            fetch("/api/posts", { credentials: "include" }),
            fetch("/api/comments", { credentials: "include" }),
            fetch("/api/categories", { credentials: "include" }),
          ]);

        const users = usersRes.ok ? await usersRes.json() : [];
        const posts = postsRes.ok ? await postsRes.json() : [];
        const comments = commentsRes.ok ? await commentsRes.json() : [];
        const categories = categoriesRes.ok ? await categoriesRes.json() : [];

        setStats({
          users: Array.isArray(users) ? users.length : 0,
          posts: Array.isArray(posts) ? posts.length : 0,
          comments: Array.isArray(comments) ? comments.length : 0,
          categories: Array.isArray(categories) ? categories.length : 0,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const adminTools = [
    {
      title: "SEO Management",
      description:
        "Optimize meta tags, structured data, and search engine visibility",
      icon: "🔍",
      path: "/admin/seo",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      featured: true,
    },
    {
      title: "Blog Posts",
      description: `Manage ${stats.posts} blog posts and create new content`,
      icon: "📝",
      path: "/admin/posts",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      title: "User Management",
      description: `Manage ${stats.users} users and approval settings`,
      icon: "👥",
      path: "/admin/users",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      title: "Comments",
      description: `Moderate ${stats.comments} comments and discussions`,
      icon: "💬",
      path: "/admin/comments",
      color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
    {
      title: "Categories",
      description: `Organize content with ${stats.categories} categories`,
      icon: "📂",
      path: "/admin/categories",
      color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    },
    {
      title: "Create New Post",
      description: "Write and publish new blog content",
      icon: "✏️",
      path: "/admin/posts/new",
      color: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    },
  ];

  return React.createElement(
    "div",
    {
      style: { backgroundColor: "#f8f9fa", minHeight: "100vh" },
    },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "40px 0",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col" },
            React.createElement(
              "h1",
              { className: "display-5 fw-bold mb-2" },
              "Admin Dashboard",
            ),
            React.createElement(
              "p",
              { className: "lead mb-0" },
              `Welcome back, ${user?.name || user?.email}`,
            ),
          ),
          React.createElement(
            "div",
            { className: "col-auto" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light",
                onClick: () => navigateTo("/"),
              },
              "View Site",
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-light ms-2",
                onClick: logout,
              },
              "Logout",
            ),
          ),
        ),
      ),
    ),

    // Stats Cards
    loading
      ? React.createElement(
          "div",
          {
            className: "container mt-5 text-center",
          },
          React.createElement("div", {
            className: "spinner-border text-primary",
          }),
          React.createElement(
            "p",
            { className: "mt-3" },
            "Loading dashboard...",
          ),
        )
      : React.createElement(
          "div",
          { className: "container mt-5" },
          React.createElement(
            "div",
            { className: "row mb-5" },
            React.createElement(
              "div",
              { className: "col-md-3 mb-3" },
              React.createElement(
                "div",
                { className: "card border-0 shadow-sm h-100" },
                React.createElement(
                  "div",
                  {
                    className: "card-body text-center",
                    style: {
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                    },
                  },
                  React.createElement("h3", { className: "mb-2" }, stats.posts),
                  React.createElement("p", { className: "mb-0" }, "Blog Posts"),
                ),
              ),
            ),
            React.createElement(
              "div",
              { className: "col-md-3 mb-3" },
              React.createElement(
                "div",
                { className: "card border-0 shadow-sm h-100" },
                React.createElement(
                  "div",
                  {
                    className: "card-body text-center",
                    style: {
                      background:
                        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      color: "white",
                    },
                  },
                  React.createElement("h3", { className: "mb-2" }, stats.users),
                  React.createElement("p", { className: "mb-0" }, "Users"),
                ),
              ),
            ),
            React.createElement(
              "div",
              { className: "col-md-3 mb-3" },
              React.createElement(
                "div",
                { className: "card border-0 shadow-sm h-100" },
                React.createElement(
                  "div",
                  {
                    className: "card-body text-center",
                    style: {
                      background:
                        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                      color: "white",
                    },
                  },
                  React.createElement(
                    "h3",
                    { className: "mb-2" },
                    stats.comments,
                  ),
                  React.createElement("p", { className: "mb-0" }, "Comments"),
                ),
              ),
            ),
            React.createElement(
              "div",
              { className: "col-md-3 mb-3" },
              React.createElement(
                "div",
                { className: "card border-0 shadow-sm h-100" },
                React.createElement(
                  "div",
                  {
                    className: "card-body text-center",
                    style: {
                      background:
                        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                      color: "white",
                    },
                  },
                  React.createElement(
                    "h3",
                    { className: "mb-2" },
                    stats.categories,
                  ),
                  React.createElement("p", { className: "mb-0" }, "Categories"),
                ),
              ),
            ),
          ),

          // Admin Tools Grid
          React.createElement("h2", { className: "mb-4" }, "Management Tools"),
          React.createElement(
            "div",
            { className: "row" },
            adminTools.map((tool, index) =>
              React.createElement(
                "div",
                {
                  key: index,
                  className: tool.featured
                    ? "col-lg-6 mb-4"
                    : "col-lg-4 col-md-6 mb-4",
                },
                React.createElement(
                  "div",
                  {
                    className: "card border-0 shadow-sm h-100",
                    style: { cursor: "pointer", transition: "transform 0.2s" },
                    onClick: () => navigateTo(tool.path),
                    onMouseEnter: (e) =>
                      (e.target.style.transform = "translateY(-5px)"),
                    onMouseLeave: (e) =>
                      (e.target.style.transform = "translateY(0)"),
                  },
                  React.createElement(
                    "div",
                    { className: "card-body text-center p-4" },
                    React.createElement(
                      "div",
                      {
                        style: {
                          fontSize: "3rem",
                          background: tool.color,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          marginBottom: "20px",
                        },
                      },
                      tool.icon,
                    ),
                    React.createElement(
                      "h4",
                      { className: "card-title mb-3" },
                      tool.title,
                    ),
                    React.createElement(
                      "p",
                      { className: "card-text text-muted" },
                      tool.description,
                    ),
                    React.createElement(
                      "div",
                      {
                        className: "btn btn-outline-primary",
                        style: { pointerEvents: "none" },
                      },
                      "Manage",
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
  );
};

// Admin Posts Manager
const AdminPostsManager = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletePostId, setDeletePostId] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/posts", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
        setDeletePostId(null);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return React.createElement(
    "div",
    { style: { backgroundColor: "#f8f9fa", minHeight: "100vh" } },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "white",
          padding: "30px 0",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col" },
            React.createElement(
              "h1",
              { className: "h2 fw-bold mb-0" },
              "Blog Posts Management",
            ),
            React.createElement(
              "p",
              { className: "mb-0 opacity-75" },
              `Managing ${posts.length} posts`,
            ),
          ),
          React.createElement(
            "div",
            { className: "col-auto" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light me-2",
                onClick: () => navigateTo("/admin"),
              },
              "Back to Dashboard",
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-light",
                onClick: () => navigateTo("/admin/posts/new"),
              },
              "Create New Post",
            ),
          ),
        ),
      ),
    ),

    React.createElement(
      "div",
      { className: "container mt-4" },
      loading
        ? React.createElement(
            "div",
            { className: "text-center py-5" },
            React.createElement("div", {
              className: "spinner-border text-primary",
            }),
            React.createElement("p", { className: "mt-3" }, "Loading posts..."),
          )
        : posts.length === 0
          ? React.createElement(
              "div",
              { className: "text-center py-5" },
              React.createElement("h3", null, "No Posts Yet"),
              React.createElement(
                "p",
                { className: "text-muted" },
                "Create your first blog post to get started.",
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-primary",
                  onClick: () => navigateTo("/admin/posts/new"),
                },
                "Create First Post",
              ),
            )
          : React.createElement(
              "div",
              { className: "row" },
              posts.map((post) =>
                React.createElement(
                  "div",
                  { key: post.id, className: "col-lg-6 mb-4" },
                  React.createElement(
                    "div",
                    { className: "card border-0 shadow-sm h-100" },
                    post.featuredImage &&
                      React.createElement("img", {
                        src: post.featuredImage,
                        className: "card-img-top",
                        style: { height: "200px", objectFit: "cover" },
                      }),
                    React.createElement(
                      "div",
                      { className: "card-body" },
                      React.createElement(
                        "div",
                        {
                          className:
                            "d-flex justify-content-between align-items-start mb-2",
                        },
                        React.createElement(
                          "span",
                          {
                            className: `badge ${post.status === "published" ? "bg-success" : "bg-warning"}`,
                          },
                          post.status,
                        ),
                        React.createElement(
                          "small",
                          { className: "text-muted" },
                          new Date(post.createdAt).toLocaleDateString(),
                        ),
                      ),
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        post.title,
                      ),
                      React.createElement(
                        "p",
                        { className: "card-text text-muted" },
                        post.excerpt ||
                          (post.content
                            ? post.content
                                .replace(/<[^>]*>/g, "")
                                .substring(0, 100) + "..."
                            : "No content"),
                      ),
                      React.createElement(
                        "div",
                        { className: "mt-3" },
                        React.createElement(
                          "div",
                          { className: "btn-group w-100" },
                          React.createElement(
                            "button",
                            {
                              className: "btn btn-outline-primary",
                              onClick: () =>
                                navigateTo(`/admin/posts/edit/${post.id}`),
                            },
                            "Edit",
                          ),
                          React.createElement(
                            "button",
                            {
                              className: "btn btn-outline-danger",
                              onClick: () => setDeletePostId(post.id),
                            },
                            "Delete",
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
    ),

    // Delete Confirmation Modal
    deletePostId &&
      React.createElement(
        "div",
        {
          className: "modal fade show",
          style: { display: "block", backgroundColor: "rgba(0,0,0,0.5)" },
        },
        React.createElement(
          "div",
          { className: "modal-dialog" },
          React.createElement(
            "div",
            { className: "modal-content" },
            React.createElement(
              "div",
              { className: "modal-header" },
              React.createElement(
                "h5",
                { className: "modal-title" },
                "Confirm Delete",
              ),
              React.createElement("button", {
                type: "button",
                className: "btn-close",
                onClick: () => setDeletePostId(null),
              }),
            ),
            React.createElement(
              "div",
              { className: "modal-body" },
              React.createElement(
                "p",
                null,
                "Are you sure you want to delete this post? This action cannot be undone.",
              ),
            ),
            React.createElement(
              "div",
              { className: "modal-footer" },
              React.createElement(
                "button",
                {
                  className: "btn btn-secondary",
                  onClick: () => setDeletePostId(null),
                },
                "Cancel",
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-danger",
                  onClick: () => deletePost(deletePostId),
                },
                "Delete Post",
              ),
            ),
          ),
        ),
      ),
  );
};

// Admin Users Manager
const AdminUsersManager = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserApproval = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !currentStatus }),
        credentials: "include",
      });
      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, approved: !currentStatus } : u,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !currentStatus }),
        credentials: "include",
      });
      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, isAdmin: !currentStatus } : u,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return React.createElement(
    "div",
    { style: { backgroundColor: "#f8f9fa", minHeight: "100vh" } },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "white",
          padding: "30px 0",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col" },
            React.createElement(
              "h1",
              { className: "h2 fw-bold mb-0" },
              "User Management",
            ),
            React.createElement(
              "p",
              { className: "mb-0 opacity-75" },
              `Managing ${users.length} users`,
            ),
          ),
          React.createElement(
            "div",
            { className: "col-auto" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light",
                onClick: () => navigateTo("/admin"),
              },
              "Back to Dashboard",
            ),
          ),
        ),
      ),
    ),

    React.createElement(
      "div",
      { className: "container mt-4" },
      loading
        ? React.createElement(
            "div",
            { className: "text-center py-5" },
            React.createElement("div", {
              className: "spinner-border text-primary",
            }),
            React.createElement("p", { className: "mt-3" }, "Loading users..."),
          )
        : React.createElement(
            "div",
            { className: "card border-0 shadow-sm" },
            React.createElement(
              "div",
              { className: "card-body p-0" },
              React.createElement(
                "div",
                { className: "table-responsive" },
                React.createElement(
                  "table",
                  { className: "table table-hover mb-0" },
                  React.createElement(
                    "thead",
                    { className: "table-light" },
                    React.createElement(
                      "tr",
                      null,
                      React.createElement("th", null, "User"),
                      React.createElement("th", null, "Email"),
                      React.createElement("th", null, "Status"),
                      React.createElement("th", null, "Role"),
                      React.createElement("th", null, "Joined"),
                      React.createElement("th", null, "Actions"),
                    ),
                  ),
                  React.createElement(
                    "tbody",
                    null,
                    users.map((user) =>
                      React.createElement(
                        "tr",
                        { key: user.id },
                        React.createElement(
                          "td",
                          null,
                          React.createElement(
                            "div",
                            { className: "d-flex align-items-center" },
                            React.createElement(
                              "div",
                              {
                                className:
                                  "rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3",
                                style: {
                                  width: "40px",
                                  height: "40px",
                                  fontSize: "16px",
                                },
                              },
                              (user.name || user.email).charAt(0).toUpperCase(),
                            ),
                            React.createElement(
                              "div",
                              null,
                              React.createElement(
                                "div",
                                { className: "fw-medium" },
                                user.name || "No name",
                              ),
                              React.createElement(
                                "small",
                                { className: "text-muted" },
                                user.username,
                              ),
                            ),
                          ),
                        ),
                        React.createElement("td", null, user.email),
                        React.createElement(
                          "td",
                          null,
                          React.createElement(
                            "span",
                            {
                              className: `badge ${user.approved ? "bg-success" : "bg-warning"}`,
                            },
                            user.approved ? "Approved" : "Pending",
                          ),
                        ),
                        React.createElement(
                          "td",
                          null,
                          React.createElement(
                            "span",
                            {
                              className: `badge ${user.isAdmin ? "bg-primary" : "bg-secondary"}`,
                            },
                            user.isAdmin ? "Admin" : "User",
                          ),
                        ),
                        React.createElement(
                          "td",
                          null,
                          React.createElement(
                            "small",
                            { className: "text-muted" },
                            new Date(user.createdAt).toLocaleDateString(),
                          ),
                        ),
                        React.createElement(
                          "td",
                          null,
                          React.createElement(
                            "div",
                            { className: "btn-group btn-group-sm" },
                            React.createElement(
                              "button",
                              {
                                className: `btn btn-outline-${user.approved ? "warning" : "success"}`,
                                onClick: () =>
                                  toggleUserApproval(user.id, user.approved),
                                disabled: user.id === currentUser?.id,
                              },
                              user.approved ? "Unapprove" : "Approve",
                            ),
                            React.createElement(
                              "button",
                              {
                                className: `btn btn-outline-${user.isAdmin ? "secondary" : "primary"}`,
                                onClick: () =>
                                  toggleAdminStatus(user.id, user.isAdmin),
                                disabled: user.id === currentUser?.id,
                              },
                              user.isAdmin ? "Remove Admin" : "Make Admin",
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
    ),
  );
};

// Admin Comments Manager
const AdminCommentsManager = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const response = await fetch("/api/comments", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentApproval = async (commentId, currentStatus) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus === "approved" ? "pending" : "approved",
        }),
        credentials: "include",
      });
      if (response.ok) {
        setComments(
          comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  status: currentStatus === "approved" ? "pending" : "approved",
                }
              : c,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return React.createElement(
    "div",
    { style: { backgroundColor: "#f8f9fa", minHeight: "100vh" } },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          color: "white",
          padding: "30px 0",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col" },
            React.createElement(
              "h1",
              { className: "h2 fw-bold mb-0" },
              "Comments Management",
            ),
            React.createElement(
              "p",
              { className: "mb-0 opacity-75" },
              `Managing ${comments.length} comments`,
            ),
          ),
          React.createElement(
            "div",
            { className: "col-auto" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light",
                onClick: () => navigateTo("/admin"),
              },
              "Back to Dashboard",
            ),
          ),
        ),
      ),
    ),

    React.createElement(
      "div",
      { className: "container mt-4" },
      loading
        ? React.createElement(
            "div",
            { className: "text-center py-5" },
            React.createElement("div", {
              className: "spinner-border text-primary",
            }),
            React.createElement(
              "p",
              { className: "mt-3" },
              "Loading comments...",
            ),
          )
        : comments.length === 0
          ? React.createElement(
              "div",
              { className: "text-center py-5" },
              React.createElement("h3", null, "No Comments Yet"),
              React.createElement(
                "p",
                { className: "text-muted" },
                "Comments will appear here when users start discussing your posts.",
              ),
            )
          : React.createElement(
              "div",
              { className: "row" },
              comments.map((comment) =>
                React.createElement(
                  "div",
                  { key: comment.id, className: "col-12 mb-3" },
                  React.createElement(
                    "div",
                    { className: "card border-0 shadow-sm" },
                    React.createElement(
                      "div",
                      { className: "card-body" },
                      React.createElement(
                        "div",
                        {
                          className:
                            "d-flex justify-content-between align-items-start mb-3",
                        },
                        React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "h6",
                            { className: "mb-1" },
                            comment.authorName || "Anonymous",
                          ),
                          React.createElement(
                            "small",
                            { className: "text-muted" },
                            `on "${comment.postTitle}" • ${new Date(comment.createdAt).toLocaleDateString()}`,
                          ),
                        ),
                        React.createElement(
                          "span",
                          {
                            className: `badge ${comment.status === "approved" ? "bg-success" : "bg-warning"}`,
                          },
                          comment.status || "pending",
                        ),
                      ),
                      React.createElement(
                        "p",
                        { className: "mb-3" },
                        comment.content,
                      ),
                      React.createElement(
                        "div",
                        { className: "btn-group btn-group-sm" },
                        React.createElement(
                          "button",
                          {
                            className: `btn btn-outline-${comment.status === "approved" ? "warning" : "success"}`,
                            onClick: () =>
                              toggleCommentApproval(comment.id, comment.status),
                          },
                          comment.status === "approved"
                            ? "Unapprove"
                            : "Approve",
                        ),
                        React.createElement(
                          "button",
                          {
                            className: "btn btn-outline-danger",
                            onClick: () => deleteComment(comment.id),
                          },
                          "Delete",
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
    ),
  );
};

// Admin Categories Manager
const AdminCategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async () => {
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const savedCategory = await response.json();
        if (editingCategory) {
          setCategories(
            categories.map((c) =>
              c.id === editingCategory.id ? savedCategory : c,
            ),
          );
        } else {
          setCategories([...categories, savedCategory]);
        }
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: "", description: "" });
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setCategories(categories.filter((c) => c.id !== categoryId));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return React.createElement(
    "div",
    { style: { backgroundColor: "#f8f9fa", minHeight: "100vh" } },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          color: "white",
          padding: "30px 0",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col" },
            React.createElement(
              "h1",
              { className: "h2 fw-bold mb-0" },
              "Categories Management",
            ),
            React.createElement(
              "p",
              { className: "mb-0 opacity-75" },
              `Managing ${categories.length} categories`,
            ),
          ),
          React.createElement(
            "div",
            { className: "col-auto" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light me-2",
                onClick: () => navigateTo("/admin"),
              },
              "Back to Dashboard",
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-light",
                onClick: handleAdd,
              },
              "Add Category",
            ),
          ),
        ),
      ),
    ),

    React.createElement(
      "div",
      { className: "container mt-4" },
      loading
        ? React.createElement(
            "div",
            { className: "text-center py-5" },
            React.createElement("div", {
              className: "spinner-border text-primary",
            }),
            React.createElement(
              "p",
              { className: "mt-3" },
              "Loading categories...",
            ),
          )
        : categories.length === 0
          ? React.createElement(
              "div",
              { className: "text-center py-5" },
              React.createElement("h3", null, "No Categories Yet"),
              React.createElement(
                "p",
                { className: "text-muted" },
                "Create categories to organize your blog posts.",
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-primary",
                  onClick: handleAdd,
                },
                "Create First Category",
              ),
            )
          : React.createElement(
              "div",
              { className: "row" },
              categories.map((category) =>
                React.createElement(
                  "div",
                  { key: category.id, className: "col-lg-4 col-md-6 mb-4" },
                  React.createElement(
                    "div",
                    { className: "card border-0 shadow-sm h-100" },
                    React.createElement(
                      "div",
                      { className: "card-body" },
                      React.createElement(
                        "h5",
                        { className: "card-title" },
                        category.name,
                      ),
                      React.createElement(
                        "p",
                        { className: "card-text text-muted" },
                        category.description || "No description provided",
                      ),
                      React.createElement(
                        "div",
                        { className: "text-muted small mb-3" },
                        `${category.postCount || 0} posts`,
                      ),
                      React.createElement(
                        "div",
                        { className: "btn-group w-100" },
                        React.createElement(
                          "button",
                          {
                            className: "btn btn-outline-primary",
                            onClick: () => handleEdit(category),
                          },
                          "Edit",
                        ),
                        React.createElement(
                          "button",
                          {
                            className: "btn btn-outline-danger",
                            onClick: () => deleteCategory(category.id),
                          },
                          "Delete",
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
    ),

    // Category Modal
    showModal &&
      React.createElement(
        "div",
        {
          className: "modal fade show",
          style: { display: "block", backgroundColor: "rgba(0,0,0,0.5)" },
        },
        React.createElement(
          "div",
          { className: "modal-dialog" },
          React.createElement(
            "div",
            { className: "modal-content" },
            React.createElement(
              "div",
              { className: "modal-header" },
              React.createElement(
                "h5",
                { className: "modal-title" },
                editingCategory ? "Edit Category" : "Add Category",
              ),
              React.createElement("button", {
                type: "button",
                className: "btn-close",
                onClick: () => setShowModal(false),
              }),
            ),
            React.createElement(
              "div",
              { className: "modal-body" },
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Category Name",
                ),
                React.createElement("input", {
                  type: "text",
                  className: "form-control",
                  value: formData.name,
                  onChange: (e) =>
                    setFormData({ ...formData, name: e.target.value }),
                  placeholder: "Enter category name",
                }),
              ),
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Description",
                ),
                React.createElement("textarea", {
                  className: "form-control",
                  rows: 3,
                  value: formData.description,
                  onChange: (e) =>
                    setFormData({ ...formData, description: e.target.value }),
                  placeholder: "Enter category description (optional)",
                }),
              ),
            ),
            React.createElement(
              "div",
              { className: "modal-footer" },
              React.createElement(
                "button",
                {
                  className: "btn btn-secondary",
                  onClick: () => setShowModal(false),
                },
                "Cancel",
              ),
              React.createElement(
                "button",
                {
                  className: "btn btn-primary",
                  onClick: saveCategory,
                  disabled: !formData.name.trim(),
                },
                editingCategory ? "Update Category" : "Create Category",
              ),
            ),
          ),
        ),
      ),
  );
};

// Admin Post Editor
const AdminPostEditor = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    categoryId: "",
    status: "draft",
    featuredImage: "",
  });

  useEffect(() => {
    loadCategories();
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPost(data);
        setFormData({
          title: data.title || "",
          content: data.content || "",
          excerpt: data.excerpt || "",
          categoryId: data.categoryId || "",
          status: data.status || "draft",
          featuredImage: data.featuredImage || "",
        });
      }
    } catch (error) {
      console.error("Error loading post:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const savePost = async () => {
    setSaving(true);
    try {
      const url = postId ? `/api/posts/${postId}` : "/api/posts";
      const method = postId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const savedPost = await response.json();
        // Navigate back to posts list
        window.history.pushState({}, "", "/admin/posts");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setSaving(false);
    }
  };

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, featuredImage: data.url }));
      } else {
        const error = await response.text();
        alert(`Upload failed: ${error}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const insertImageIntoContent = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: uploadFormData,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const imageTag = `<img src="${data.url}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`;
        setFormData((prev) => ({
          ...prev,
          content: prev.content + "\n\n" + imageTag + "\n\n",
        }));
      } else {
        const error = await response.text();
        alert(`Upload failed: ${error}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
      // Reset the file input
      event.target.value = "";
    }
  };

  if (loading) {
    return React.createElement(
      "div",
      {
        className: "d-flex justify-content-center align-items-center",
        style: { minHeight: "100vh" },
      },
      React.createElement(
        "div",
        { className: "text-center" },
        React.createElement("div", {
          className: "spinner-border text-primary",
        }),
        React.createElement("p", { className: "mt-3" }, "Loading post..."),
      ),
    );
  }

  return React.createElement(
    "div",
    { style: { backgroundColor: "#f8f9fa", minHeight: "100vh" } },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
          color: "white",
          padding: "30px 0",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col" },
            React.createElement(
              "h1",
              { className: "h2 fw-bold mb-0" },
              postId ? "Edit Post" : "Create New Post",
            ),
            React.createElement(
              "p",
              { className: "mb-0 opacity-75" },
              postId
                ? `Editing: ${formData.title || "Untitled"}`
                : "Write your next blog post",
            ),
          ),
          React.createElement(
            "div",
            { className: "col-auto" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light me-2",
                onClick: () => navigateTo("/admin/posts"),
              },
              "Back to Posts",
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-light",
                onClick: savePost,
                disabled: saving || !formData.title.trim(),
              },
              saving ? "Saving..." : "Save Post",
            ),
          ),
        ),
      ),
    ),

    React.createElement(
      "div",
      { className: "container mt-4" },
      React.createElement(
        "div",
        { className: "row" },
        React.createElement(
          "div",
          { className: "col-lg-8" },
          React.createElement(
            "div",
            { className: "card border-0 shadow-sm mb-4" },
            React.createElement(
              "div",
              { className: "card-body" },
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label fw-bold" },
                  "Post Title",
                ),
                React.createElement("input", {
                  type: "text",
                  className: "form-control form-control-lg",
                  value: formData.title,
                  onChange: (e) =>
                    setFormData({ ...formData, title: e.target.value }),
                  placeholder: "Enter an engaging title for your post",
                }),
              ),
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label fw-bold" },
                  "Content",
                ),
                React.createElement(RichTextEditor, {
                  value: formData.content,
                  onChange: (content) => setFormData({ ...formData, content }),
                  onImageUpload: insertImageIntoContent,
                  uploadingImage,
                }),
              ),
            ),
          ),
        ),
        React.createElement(
          "div",
          { className: "col-lg-4" },
          React.createElement(
            "div",
            { className: "card border-0 shadow-sm mb-4" },
            React.createElement(
              "div",
              { className: "card-header bg-light" },
              React.createElement(
                "h6",
                { className: "mb-0 fw-bold" },
                "Post Settings",
              ),
            ),
            React.createElement(
              "div",
              { className: "card-body" },
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Status",
                ),
                React.createElement(
                  "select",
                  {
                    className: "form-select",
                    value: formData.status,
                    onChange: (e) =>
                      setFormData({ ...formData, status: e.target.value }),
                  },
                  React.createElement("option", { value: "draft" }, "Draft"),
                  React.createElement(
                    "option",
                    { value: "published" },
                    "Published",
                  ),
                ),
              ),
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Category",
                ),
                React.createElement(
                  "select",
                  {
                    className: "form-select",
                    value: formData.categoryId,
                    onChange: (e) =>
                      setFormData({ ...formData, categoryId: e.target.value }),
                  },
                  React.createElement(
                    "option",
                    { value: "" },
                    "Select category",
                  ),
                  categories.map((cat) =>
                    React.createElement(
                      "option",
                      { key: cat.id, value: cat.id },
                      cat.name,
                    ),
                  ),
                ),
              ),
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Excerpt",
                ),
                React.createElement("textarea", {
                  className: "form-control",
                  rows: 3,
                  value: formData.excerpt,
                  onChange: (e) =>
                    setFormData({ ...formData, excerpt: e.target.value }),
                  placeholder: "Brief description for preview",
                }),
              ),
              React.createElement(
                "div",
                { className: "mb-3" },
                React.createElement(
                  "label",
                  { className: "form-label" },
                  "Featured Image",
                ),
                formData.featuredImage &&
                  React.createElement(
                    "div",
                    { className: "mb-2" },
                    React.createElement("img", {
                      src: formData.featuredImage,
                      alt: "Featured image preview",
                      className: "img-thumbnail",
                      style: {
                        maxWidth: "200px",
                        maxHeight: "120px",
                        objectFit: "cover",
                      },
                    }),
                  ),
                React.createElement(
                  "div",
                  { className: "input-group" },
                  React.createElement("input", {
                    type: "url",
                    className: "form-control",
                    value: formData.featuredImage,
                    onChange: (e) =>
                      setFormData({
                        ...formData,
                        featuredImage: e.target.value,
                      }),
                    placeholder:
                      "https://example.com/image.jpg or upload below",
                  }),
                  React.createElement(
                    "button",
                    {
                      className: "btn btn-outline-secondary",
                      type: "button",
                      onClick: () =>
                        setFormData({ ...formData, featuredImage: "" }),
                    },
                    "Clear",
                  ),
                ),
                React.createElement(
                  "div",
                  { className: "mt-2" },
                  React.createElement("input", {
                    type: "file",
                    id: "featured-image-upload",
                    accept: "image/*",
                    style: { display: "none" },
                    onChange: handleImageUpload,
                  }),
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      className: "btn btn-outline-primary btn-sm w-100",
                      onClick: () =>
                        document
                          .getElementById("featured-image-upload")
                          .click(),
                      disabled: uploadingImage,
                    },
                    uploadingImage
                      ? "Uploading..."
                      : "📷 Upload Featured Image",
                  ),
                ),
                React.createElement(
                  "small",
                  { className: "form-text text-muted mt-1" },
                  "Upload an image or paste a URL. Max file size: 5MB.",
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
};

// Rich Text Editor Component
const RichTextEditor = ({ value, onChange, onImageUpload, uploadingImage }) => {
  const editorRef = useRef(null);
  const [showSourceCode, setShowSourceCode] = useState(false);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const insertLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      execCommand("insertImage", url);
    }
  };

  const formatBlock = (tag) => {
    execCommand("formatBlock", tag);
  };

  const toggleSourceCode = () => {
    if (showSourceCode) {
      // Switch back to visual editor
      editorRef.current.innerHTML = editorRef.current.textContent;
      editorRef.current.contentEditable = true;
      setShowSourceCode(false);
    } else {
      // Switch to source code view
      editorRef.current.textContent = editorRef.current.innerHTML;
      editorRef.current.contentEditable = true;
      setShowSourceCode(true);
    }
  };

  useEffect(() => {
    if (editorRef.current && !showSourceCode) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const toolbarButtons = [
    {
      command: "bold",
      icon: "B",
      title: "Bold",
      style: { fontWeight: "bold" },
    },
    {
      command: "italic",
      icon: "I",
      title: "Italic",
      style: { fontStyle: "italic" },
    },
    {
      command: "underline",
      icon: "U",
      title: "Underline",
      style: { textDecoration: "underline" },
    },
    {
      command: "strikeThrough",
      icon: "S",
      title: "Strikethrough",
      style: { textDecoration: "line-through" },
    },
    null, // separator
    { command: () => formatBlock("h1"), icon: "H1", title: "Heading 1" },
    { command: () => formatBlock("h2"), icon: "H2", title: "Heading 2" },
    { command: () => formatBlock("h3"), icon: "H3", title: "Heading 3" },
    { command: () => formatBlock("p"), icon: "P", title: "Paragraph" },
    null, // separator
    { command: "insertUnorderedList", icon: "•", title: "Bullet List" },
    { command: "insertOrderedList", icon: "1.", title: "Numbered List" },
    { command: "outdent", icon: "←", title: "Decrease Indent" },
    { command: "indent", icon: "→", title: "Increase Indent" },
    null, // separator
    { command: "justifyLeft", icon: "⫷", title: "Align Left" },
    { command: "justifyCenter", icon: "⫸", title: "Align Center" },
    { command: "justifyRight", icon: "⫸", title: "Align Right" },
    null, // separator
    { command: insertLink, icon: "🔗", title: "Insert Link" },
    { command: insertImage, icon: "🖼️", title: "Insert Image URL" },
    { command: "removeFormat", icon: "🧹", title: "Clear Formatting" },
  ];

  return React.createElement(
    "div",
    { className: "rich-text-editor border rounded" },
    // Toolbar
    React.createElement(
      "div",
      {
        className:
          "border-bottom p-2 bg-light d-flex flex-wrap gap-1 align-items-center",
      },
      ...toolbarButtons.map((button, index) => {
        if (button === null) {
          return React.createElement("div", {
            key: index,
            className: "border-end mx-1",
            style: { height: "24px", width: "1px" },
          });
        }

        return React.createElement(
          "button",
          {
            key: index,
            type: "button",
            className: "btn btn-outline-secondary btn-sm",
            style: {
              minWidth: "32px",
              height: "32px",
              padding: "4px",
              fontSize: "12px",
              ...button.style,
            },
            title: button.title,
            onClick: () => {
              if (typeof button.command === "function") {
                button.command();
              } else {
                execCommand(button.command);
              }
            },
          },
          button.icon,
        );
      }),

      // Image Upload Button
      React.createElement(
        "div",
        { className: "ms-auto d-flex gap-2" },
        React.createElement("input", {
          type: "file",
          id: "editor-image-upload",
          accept: "image/*",
          style: { display: "none" },
          onChange: onImageUpload,
        }),
        React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-outline-primary btn-sm",
            onClick: () =>
              document.getElementById("editor-image-upload").click(),
            disabled: uploadingImage,
            title: "Upload Image",
          },
          uploadingImage ? "Uploading..." : "📷",
        ),

        React.createElement(
          "button",
          {
            type: "button",
            className: `btn btn-outline-secondary btn-sm ${showSourceCode ? "active" : ""}`,
            onClick: toggleSourceCode,
            title: "Toggle Source Code",
          },
          showSourceCode ? "Visual" : "HTML",
        ),
      ),
    ),

    // Editor Content
    React.createElement(
      "div",
      {
        ref: editorRef,
        contentEditable: true,
        className: "p-3",
        style: {
          minHeight: "400px",
          outline: "none",
          fontSize: "16px",
          lineHeight: "1.6",
          fontFamily: showSourceCode
            ? "Monaco, Consolas, monospace"
            : "inherit",
          whiteSpace: showSourceCode ? "pre-wrap" : "normal",
        },
        onInput: updateContent,
        onPaste: handlePaste,
        dangerouslySetInnerHTML: showSourceCode
          ? null
          : { __html: value || "" },
      },
      showSourceCode ? value : null,
    ),

    // Help Text
    React.createElement(
      "div",
      { className: "border-top p-2 bg-light" },
      React.createElement(
        "small",
        { className: "text-muted" },
        "Use the toolbar for formatting, upload images, or switch to HTML view for advanced editing.",
      ),
    ),
  );
};

// Admin SEO Manager
const AdminSEOManager = () => {
  const [seoData, setSeoData] = useState({
    siteTitle: "Mr. S Teaches",
    siteDescription:
      "A modern blog platform featuring advanced content management, user authentication, and SEO optimization tools.",
    keywords: "blog, education, teaching, learning, content management",
    googleAnalyticsId: "",
    facebookPixelId: "",
    twitterHandle: "",
    canonicalUrl: "",
    ogImage: "",
    robotsTxt: "User-agent: *\nAllow: /",
    enableSitemap: true,
  });

  const [posts, setPosts] = useState([]);
  const [seoAnalysis, setSeoAnalysis] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    loadSEOData();
    loadPosts();
  }, []);

  const loadSEOData = async () => {
    try {
      const response = await fetch("/api/seo/settings", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSeoData({ ...seoData, ...data });
      }
    } catch (error) {
      console.error("Error loading SEO data:", error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/posts", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const postsArray = Array.isArray(data) ? data : [];
        setPosts(postsArray);

        // Analyze SEO for each post
        const analysis = {};
        postsArray.forEach((post) => {
          analysis[post.id] = analyzeSEO(post);
        });
        setSeoAnalysis(analysis);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSEO = (post) => {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: [],
    };

    // Title analysis
    if (!post.title) {
      analysis.issues.push("Missing title");
    } else if (post.title.length < 30) {
      analysis.issues.push("Title too short (< 30 characters)");
    } else if (post.title.length > 60) {
      analysis.issues.push("Title too long (> 60 characters)");
    } else {
      analysis.score += 25;
    }

    // Description analysis
    if (!post.excerpt) {
      analysis.issues.push("Missing meta description");
      analysis.recommendations.push(
        "Add a compelling meta description (150-160 characters)",
      );
    } else if (post.excerpt.length < 120) {
      analysis.issues.push("Meta description too short");
    } else if (post.excerpt.length > 160) {
      analysis.issues.push("Meta description too long");
    } else {
      analysis.score += 25;
    }

    // Content analysis
    if (!post.content) {
      analysis.issues.push("No content");
    } else {
      const wordCount = post.content
        .replace(/<[^>]*>/g, "")
        .split(/\s+/).length;
      if (wordCount < 300) {
        analysis.issues.push(`Content too short (${wordCount} words)`);
        analysis.recommendations.push(
          "Aim for at least 300 words for better SEO",
        );
      } else {
        analysis.score += 25;
      }

      // Check for headings
      if (!post.content.includes("<h1>") && !post.content.includes("<h2>")) {
        analysis.issues.push("No headings found");
        analysis.recommendations.push(
          "Use headings (H1, H2) to structure your content",
        );
      } else {
        analysis.score += 15;
      }
    }

    // Featured image
    if (!post.featuredImage) {
      analysis.issues.push("No featured image");
      analysis.recommendations.push(
        "Add a featured image for better social sharing",
      );
    } else {
      analysis.score += 10;
    }

    return analysis;
  };

  const saveSEOSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/seo/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seoData),
        credentials: "include",
      });

      if (response.ok) {
        alert("SEO settings saved successfully!");
      } else {
        alert("Error saving SEO settings");
      }
    } catch (error) {
      console.error("Error saving SEO settings:", error);
      alert("Error saving SEO settings");
    } finally {
      setSaving(false);
    }
  };

  const generateSitemap = async () => {
    try {
      const response = await fetch("/api/seo/sitemap/generate", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        alert("Sitemap generated successfully!");
      } else {
        alert("Error generating sitemap");
      }
    } catch (error) {
      console.error("Error generating sitemap:", error);
    }
  };

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "danger";
  };

  return React.createElement(
    "div",
    { style: { backgroundColor: "#f8f9fa", minHeight: "100vh" } },
    // Header
    React.createElement(
      "div",
      {
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "30px 0",
        },
      },
      React.createElement(
        "div",
        { className: "container" },
        React.createElement(
          "div",
          { className: "row align-items-center" },
          React.createElement(
            "div",
            { className: "col" },
            React.createElement(
              "h1",
              { className: "h2 fw-bold mb-0" },
              "SEO Management",
            ),
            React.createElement(
              "p",
              { className: "mb-0 opacity-75" },
              "Optimize your blog for search engines",
            ),
          ),
          React.createElement(
            "div",
            { className: "col-auto" },
            React.createElement(
              "button",
              {
                className: "btn btn-outline-light me-2",
                onClick: () => navigateTo("/admin"),
              },
              "Back to Dashboard",
            ),
            React.createElement(
              "button",
              {
                className: "btn btn-light",
                onClick: saveSEOSettings,
                disabled: saving,
              },
              saving ? "Saving..." : "Save Settings",
            ),
          ),
        ),
      ),
    ),

    React.createElement(
      "div",
      { className: "container mt-4" },
      // Navigation Tabs
      React.createElement(
        "ul",
        { className: "nav nav-tabs mb-4" },
        React.createElement(
          "li",
          { className: "nav-item" },
          React.createElement(
            "button",
            {
              className: `nav-link ${activeTab === "settings" ? "active" : ""}`,
              onClick: () => setActiveTab("settings"),
            },
            "SEO Settings",
          ),
        ),
        React.createElement(
          "li",
          { className: "nav-item" },
          React.createElement(
            "button",
            {
              className: `nav-link ${activeTab === "analysis" ? "active" : ""}`,
              onClick: () => setActiveTab("analysis"),
            },
            "Content Analysis",
          ),
        ),
        React.createElement(
          "li",
          { className: "nav-item" },
          React.createElement(
            "button",
            {
              className: `nav-link ${activeTab === "tools" ? "active" : ""}`,
              onClick: () => setActiveTab("tools"),
            },
            "SEO Tools",
          ),
        ),
      ),

      // SEO Settings Tab
      activeTab === "settings" &&
        React.createElement(
          "div",
          { className: "row" },
          React.createElement(
            "div",
            { className: "col-lg-8" },
            React.createElement(
              "div",
              { className: "card border-0 shadow-sm mb-4" },
              React.createElement(
                "div",
                { className: "card-header bg-light" },
                React.createElement(
                  "h5",
                  { className: "mb-0" },
                  "Basic SEO Settings",
                ),
              ),
              React.createElement(
                "div",
                { className: "card-body" },
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label fw-bold" },
                    "Site Title",
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "form-control",
                    value: seoData.siteTitle,
                    onChange: (e) =>
                      setSeoData({ ...seoData, siteTitle: e.target.value }),
                    placeholder: "Your site title",
                  }),
                ),
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label fw-bold" },
                    "Site Description",
                  ),
                  React.createElement("textarea", {
                    className: "form-control",
                    rows: 3,
                    value: seoData.siteDescription,
                    onChange: (e) =>
                      setSeoData({
                        ...seoData,
                        siteDescription: e.target.value,
                      }),
                    placeholder: "Brief description of your site",
                  }),
                ),
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label fw-bold" },
                    "Keywords",
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "form-control",
                    value: seoData.keywords,
                    onChange: (e) =>
                      setSeoData({ ...seoData, keywords: e.target.value }),
                    placeholder: "keyword1, keyword2, keyword3",
                  }),
                  React.createElement(
                    "small",
                    { className: "form-text text-muted" },
                    "Separate keywords with commas",
                  ),
                ),
              ),
            ),

            React.createElement(
              "div",
              { className: "card border-0 shadow-sm mb-4" },
              React.createElement(
                "div",
                { className: "card-header bg-light" },
                React.createElement(
                  "h5",
                  { className: "mb-0" },
                  "Social Media & Analytics",
                ),
              ),
              React.createElement(
                "div",
                { className: "card-body" },
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label fw-bold" },
                    "Google Analytics ID",
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "form-control",
                    value: seoData.googleAnalyticsId,
                    onChange: (e) =>
                      setSeoData({
                        ...seoData,
                        googleAnalyticsId: e.target.value,
                      }),
                    placeholder: "G-XXXXXXXXXX or UA-XXXXXXXXX",
                  }),
                ),
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label fw-bold" },
                    "Twitter Handle",
                  ),
                  React.createElement("input", {
                    type: "text",
                    className: "form-control",
                    value: seoData.twitterHandle,
                    onChange: (e) =>
                      setSeoData({ ...seoData, twitterHandle: e.target.value }),
                    placeholder: "@yourhandle",
                  }),
                ),
                React.createElement(
                  "div",
                  { className: "mb-3" },
                  React.createElement(
                    "label",
                    { className: "form-label fw-bold" },
                    "Default Open Graph Image",
                  ),
                  React.createElement("input", {
                    type: "url",
                    className: "form-control",
                    value: seoData.ogImage,
                    onChange: (e) =>
                      setSeoData({ ...seoData, ogImage: e.target.value }),
                    placeholder: "https://example.com/og-image.jpg",
                  }),
                ),
              ),
            ),
          ),

          React.createElement(
            "div",
            { className: "col-lg-4" },
            React.createElement(
              "div",
              { className: "card border-0 shadow-sm mb-4" },
              React.createElement(
                "div",
                { className: "card-header bg-light" },
                React.createElement(
                  "h5",
                  { className: "mb-0" },
                  "Quick Actions",
                ),
              ),
              React.createElement(
                "div",
                { className: "card-body" },
                React.createElement(
                  "button",
                  {
                    className: "btn btn-primary w-100 mb-2",
                    onClick: generateSitemap,
                  },
                  "Generate Sitemap",
                ),
                React.createElement(
                  "button",
                  {
                    className: "btn btn-outline-primary w-100 mb-2",
                    onClick: () => window.open("/sitemap.xml", "_blank"),
                  },
                  "View Sitemap",
                ),
                React.createElement(
                  "button",
                  {
                    className: "btn btn-outline-secondary w-100",
                    onClick: () => window.open("/robots.txt", "_blank"),
                  },
                  "View Robots.txt",
                ),
              ),
            ),

            React.createElement(
              "div",
              { className: "card border-0 shadow-sm" },
              React.createElement(
                "div",
                { className: "card-header bg-light" },
                React.createElement("h5", { className: "mb-0" }, "SEO Health"),
              ),
              React.createElement(
                "div",
                { className: "card-body text-center" },
                React.createElement(
                  "div",
                  {
                    className: "display-6 fw-bold text-primary mb-2",
                  },
                  posts.length,
                ),
                React.createElement(
                  "p",
                  { className: "text-muted mb-0" },
                  "Total Posts",
                ),
                React.createElement("hr"),
                React.createElement(
                  "small",
                  { className: "text-muted" },
                  "Monitor your content SEO performance in the Analysis tab",
                ),
              ),
            ),
          ),
        ),

      // Content Analysis Tab
      activeTab === "analysis" &&
        React.createElement(
          "div",
          null,
          loading
            ? React.createElement(
                "div",
                { className: "text-center py-5" },
                React.createElement("div", {
                  className: "spinner-border text-primary",
                }),
                React.createElement(
                  "p",
                  { className: "mt-3" },
                  "Analyzing content...",
                ),
              )
            : posts.length === 0
              ? React.createElement(
                  "div",
                  { className: "text-center py-5" },
                  React.createElement("h3", null, "No Posts to Analyze"),
                  React.createElement(
                    "p",
                    { className: "text-muted" },
                    "Create some blog posts to see SEO analysis.",
                  ),
                )
              : React.createElement(
                  "div",
                  { className: "row" },
                  posts.map((post) => {
                    const analysis = seoAnalysis[post.id] || {
                      score: 0,
                      issues: [],
                      recommendations: [],
                    };
                    return React.createElement(
                      "div",
                      { key: post.id, className: "col-lg-6 mb-4" },
                      React.createElement(
                        "div",
                        { className: "card border-0 shadow-sm h-100" },
                        React.createElement(
                          "div",
                          { className: "card-body" },
                          React.createElement(
                            "div",
                            {
                              className:
                                "d-flex justify-content-between align-items-start mb-3",
                            },
                            React.createElement(
                              "h5",
                              { className: "card-title mb-0" },
                              post.title || "Untitled Post",
                            ),
                            React.createElement(
                              "span",
                              {
                                className: `badge bg-${getScoreColor(analysis.score)} fs-6`,
                              },
                              `${analysis.score}/100`,
                            ),
                          ),

                          analysis.issues.length > 0 &&
                            React.createElement(
                              "div",
                              { className: "mb-3" },
                              React.createElement(
                                "h6",
                                { className: "text-danger" },
                                "Issues Found:",
                              ),
                              React.createElement(
                                "ul",
                                { className: "list-unstyled mb-0" },
                                analysis.issues.map((issue, index) =>
                                  React.createElement(
                                    "li",
                                    {
                                      key: index,
                                      className: "text-danger small",
                                    },
                                    React.createElement(
                                      "span",
                                      null,
                                      "• " + issue,
                                    ),
                                  ),
                                ),
                              ),
                            ),

                          analysis.recommendations.length > 0 &&
                            React.createElement(
                              "div",
                              { className: "mb-3" },
                              React.createElement(
                                "h6",
                                { className: "text-warning" },
                                "Recommendations:",
                              ),
                              React.createElement(
                                "ul",
                                { className: "list-unstyled mb-0" },
                                analysis.recommendations.map((rec, index) =>
                                  React.createElement(
                                    "li",
                                    {
                                      key: index,
                                      className: "text-warning small",
                                    },
                                    React.createElement(
                                      "span",
                                      null,
                                      "• " + rec,
                                    ),
                                  ),
                                ),
                              ),
                            ),

                          React.createElement(
                            "div",
                            { className: "mt-auto" },
                            React.createElement(
                              "button",
                              {
                                className: "btn btn-outline-primary btn-sm",
                                onClick: () =>
                                  navigateTo(`/admin/posts/edit/${post.id}`),
                              },
                              "Edit Post",
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
        ),

      // SEO Tools Tab
      activeTab === "tools" &&
        React.createElement(
          "div",
          { className: "row" },
          React.createElement(
            "div",
            { className: "col-lg-8" },
            React.createElement(
              "div",
              { className: "card border-0 shadow-sm mb-4" },
              React.createElement(
                "div",
                { className: "card-header bg-light" },
                React.createElement(
                  "h5",
                  { className: "mb-0" },
                  "Robots.txt Editor",
                ),
              ),
              React.createElement(
                "div",
                { className: "card-body" },
                React.createElement("textarea", {
                  className: "form-control",
                  rows: 8,
                  value: seoData.robotsTxt,
                  onChange: (e) =>
                    setSeoData({ ...seoData, robotsTxt: e.target.value }),
                  style: { fontFamily: "Monaco, Consolas, monospace" },
                }),
                React.createElement(
                  "small",
                  { className: "form-text text-muted" },
                  "Controls how search engines crawl your site",
                ),
              ),
            ),
          ),

          React.createElement(
            "div",
            { className: "col-lg-4" },
            React.createElement(
              "div",
              { className: "card border-0 shadow-sm mb-4" },
              React.createElement(
                "div",
                { className: "card-header bg-light" },
                React.createElement(
                  "h5",
                  { className: "mb-0" },
                  "SEO Resources",
                ),
              ),
              React.createElement(
                "div",
                { className: "card-body" },
                React.createElement(
                  "div",
                  { className: "list-group list-group-flush" },
                  React.createElement(
                    "a",
                    {
                      href: "https://search.google.com/search-console",
                      target: "_blank",
                      className: "list-group-item list-group-item-action",
                    },
                    "Google Search Console",
                  ),
                  React.createElement(
                    "a",
                    {
                      href: "https://analytics.google.com",
                      target: "_blank",
                      className: "list-group-item list-group-item-action",
                    },
                    "Google Analytics",
                  ),
                  React.createElement(
                    "a",
                    {
                      href: "https://developers.facebook.com/tools/debug/",
                      target: "_blank",
                      className: "list-group-item list-group-item-action",
                    },
                    "Facebook Debugger",
                  ),
                  React.createElement(
                    "a",
                    {
                      href: "https://cards-dev.twitter.com/validator",
                      target: "_blank",
                      className: "list-group-item list-group-item-action",
                    },
                    "Twitter Card Validator",
                  ),
                ),
              ),
            ),

            React.createElement(
              "div",
              { className: "card border-0 shadow-sm" },
              React.createElement(
                "div",
                { className: "card-header bg-light" },
                React.createElement(
                  "h5",
                  { className: "mb-0" },
                  "Sitemap Settings",
                ),
              ),
              React.createElement(
                "div",
                { className: "card-body" },
                React.createElement(
                  "div",
                  { className: "form-check" },
                  React.createElement("input", {
                    className: "form-check-input",
                    type: "checkbox",
                    checked: seoData.enableSitemap,
                    onChange: (e) =>
                      setSeoData({
                        ...seoData,
                        enableSitemap: e.target.checked,
                      }),
                  }),
                  React.createElement(
                    "label",
                    { className: "form-check-label" },
                    "Enable XML Sitemap",
                  ),
                ),
                React.createElement(
                  "small",
                  { className: "form-text text-muted" },
                  "Automatically generate sitemap for search engines",
                ),
              ),
            ),
          ),
        ),
    ),
  );
};

// Main App
const App = () => {
  return React.createElement(AuthProvider, null, React.createElement(Router));
};

// Mount the app
const container = document.getElementById("root");
const root = createRoot(container);
root.render(React.createElement(StrictMode, null, React.createElement(App)));
