const { React } = window;

const BlogCard = ({ post, onReadMore }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return React.createElement(
    "div",
    { className: "col-md-6 col-lg-4 mb-4" },
    React.createElement(
      "div",
      { className: "card h-100 shadow-sm hover-shadow-lg transition-all" },
      post.featuredImage && React.createElement("img", {
        src: post.featuredImage,
        className: "card-img-top",
        alt: post.title,
        style: { height: "200px", objectFit: "cover" }
      }),
      React.createElement(
        "div",
        { className: "card-body d-flex flex-column" },
        React.createElement(
          "div",
          { className: "mb-2" },
          React.createElement(
            "span",
            { className: "badge bg-primary me-2" },
            post.category || "General"
          ),
          React.createElement(
            "small",
            { className: "text-muted" },
            formatDate(post.createdAt)
          )
        ),
        React.createElement(
          "h5",
          { className: "card-title" },
          post.title
        ),
        React.createElement(
          "p",
          { className: "card-text flex-grow-1" },
          getExcerpt(post.content)
        ),
        React.createElement(
          "div",
          { className: "mt-auto" },
          React.createElement(
            "button",
            {
              className: "btn btn-outline-primary",
              onClick: () => onReadMore && onReadMore(post)
            },
            "Read More"
          )
        )
      )
    )
  );
};

// Export for use in main.jsx
window.BlogCard = BlogCard;