// BlogPost component using window-based exports for browser compatibility
const { useState, useEffect } = React;

function CommentForm({ postId, parentId, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use simple fetch for API calls

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      setContent("");
      onSuccess();
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?.approved) {
    return (
      <Alert variant="info" className="mt-3">
        Please sign in and get your account approved to leave comments.
      </Alert>
    );
  }

  return (
    <Form onSubmit={handleSubmit} className="mt-3">
      <Form.Group>
        <Form.Label>
          {parentId ? "Reply to comment" : "Leave a comment"}
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            parentId
              ? "Write your reply..."
              : "Share your thoughts about this post..."
          }
          required
        />
      </Form.Group>
      <div className="mt-2">
        <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="me-2" />
              Submitting...
            </>
          ) : parentId ? (
            "Post Reply"
          ) : (
            "Post Comment"
          )}
        </Button>
        {parentId && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="ms-2"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </Form>
  );
}

function CommentItem({ comment, postId, onReply }) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onReply();
  };

  const isApproved = comment.status === "approved";

  return (
    <div className={`comment-item ${comment.parentId ? "ms-4" : ""}`}>
      <Card
        className={`mb-3 ${isApproved ? "" : "border-warning"} ${
          comment.parentId ? "border-start border-3" : ""
        }`}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <strong>{comment.authorName}</strong>
              <small className="text-muted ms-2">
                {new Date(comment.createdAt).toLocaleDateString()}{" "}
                {new Date(comment.createdAt).toLocaleTimeString()}
              </small>
            </div>
            {!isApproved && (
              <Badge bg="warning" text="dark">
                Pending Approval
              </Badge>
            )}
          </div>

          <div
            className="comment-content"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {isApproved && user?.approved && !comment.parentId && (
            <div className="mt-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                {showReplyForm ? "Cancel Reply" : "Reply"}
              </Button>
            </div>
          )}

          {showReplyForm && (
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

function CommentsSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    if (!user?.approved || !postId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/posts/${postId}/comments`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        setError(null);
      } else {
        throw new Error("Failed to fetch comments");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, user]);

  const handleCommentAdded = () => {
    fetchComments(); // Refresh comments
  };

  // Group comments by parent/child relationship
  const parentComments = Array.isArray(comments)
    ? comments.filter((comment) => !comment.parentId)
    : [];
  const childComments = Array.isArray(comments)
    ? comments.filter((comment) => comment.parentId)
    : [];

  // Function to get replies for a specific comment
  const getReplies = (commentId) => {
    return childComments.filter((reply) => reply.parentId === commentId);
  };

  if (!user?.approved) {
    return (
      <div className="comments-section mt-5">
        <h3>Comments</h3>
        <Alert variant="info">
          Please sign in and get your account approved to view and post comments.
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="comments-section mt-5">
        <h3>Comments</h3>
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comments-section mt-5">
        <h3>Comments</h3>
        <Alert variant="danger">
          Failed to load comments. Please try refreshing the page.
        </Alert>
      </div>
    );
  }

  return (
    <div className="comments-section mt-5">
      <h3>
        Comments ({Array.isArray(comments) ? comments.length : 0})
      </h3>

      {/* Comment Form */}
      <CommentForm postId={postId} onSuccess={handleCommentAdded} />

      {/* Comments List */}
      <div className="comments-list mt-4">
        {parentComments.length === 0 ? (
          <Alert variant="light" className="text-center">
            <h5>No comments yet</h5>
            <p className="mb-0">Be the first to share your thoughts!</p>
          </Alert>
        ) : (
          parentComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                onReply={handleCommentAdded}
              />
              
              {/* Render replies */}
              {getReplies(comment.id).map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReply={handleCommentAdded}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BlogPost() {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get slug from URL
  const slug = window.location.pathname.split('/').pop();
  
  // Get user from auth context
  const user = window.currentUser;

  useEffect(() => {
    const fetchPost = async () => {
      if (!user?.approved || !slug) return;
      
      try {
        const response = await fetch(`/api/posts/${slug}`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setPost(data);
          setError(null);
        } else {
          throw new Error("Post not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug, user]);

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="info" className="text-center">
          <h4>Authentication Required</h4>
          <p>Please sign in to view this blog post.</p>
        </Alert>
      </Container>
    );
  }

  if (!user.approved) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <h4>Account Pending Approval</h4>
          <p>Your account needs to be approved before you can view blog posts.</p>
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h4>Post Not Found</h4>
          <p>The blog post you're looking for doesn't exist or has been removed.</p>
        </Alert>
      </Container>
    );
  }

  return React.createElement("div", { className: "container py-5" },
    React.createElement("div", { className: "row" },
      React.createElement("div", { className: "col-lg-8 mx-auto" },
        React.createElement("article", null,
          // Post Header
          React.createElement("div", { className: "text-center mb-5" },
            post.categoryName && React.createElement("span", { 
              className: "badge bg-primary mb-3" 
            }, post.categoryName),
            React.createElement("h1", { className: "display-5 fw-bold mb-3" }, post.title),
            post.excerpt && React.createElement("p", { 
              className: "lead text-muted mb-4" 
            }, post.excerpt),
            React.createElement("div", { 
              className: "d-flex justify-content-center align-items-center text-muted mb-4" 
            },
              React.createElement("span", null, "By ", post.authorName),
              React.createElement("span", { className: "mx-2" }, "•"),
              React.createElement("span", null, new Date(post.publishedAt).toLocaleDateString()),
              React.createElement("span", { className: "mx-2" }, "•"),
              React.createElement("span", null, Math.ceil(post.content.replace(/<[^>]*>/g, '').length / 200), " min read")
            ),
            post.featuredImage && React.createElement("img", {
              src: post.featuredImage,
              alt: post.title,
              className: "img-fluid rounded shadow-sm mb-4",
              style: { maxHeight: "400px", width: "100%", objectFit: "cover" }
            })
          ),
          // Post Content
          React.createElement("div", {
            className: "post-content mb-5",
            dangerouslySetInnerHTML: { __html: post.content },
            style: { lineHeight: "1.7", fontSize: "1.1rem" }
          }),
          // Tags
          post.tags && post.tags.length > 0 && React.createElement("div", { className: "mb-5" },
            React.createElement("h6", { className: "text-muted mb-2" }, "Tags:"),
            post.tags.map((tag, index) => 
              React.createElement("span", { 
                key: index, 
                className: "badge bg-secondary me-2" 
              }, tag)
            )
          )
        ),
        // Comments Section
        React.createElement(CommentsSection, { postId: post.id, user: user })
      )
    )
  );
}

// Export to window for global access
window.BlogPost = BlogPost;