// BlogPost component using window-based exports for browser compatibility
const { useState, useEffect } = React;

function CommentForm({ postId, parentId, onSuccess, onCancel }) {
  const user = window.currentUser;
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
          status: 'approved', // Auto-approve for testing
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
      <div className="alert alert-info mt-3">
        Please sign in and get your account approved to leave comments.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="mb-3">
        <label className="form-label">
          {parentId ? "Reply to comment" : "Leave a comment"}
        </label>
        <textarea
          className="form-control"
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
      </div>
      <div className="mt-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Submitting...
            </>
          ) : parentId ? (
            "Post Reply"
          ) : (
            "Post Comment"
          )}
        </button>
        {parentId && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm ms-2"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({ comment, postId, onReply }) {
  const user = window.currentUser;
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onReply();
  };

  const isApproved = comment.status === "approved";

  return (
    <div className={`comment-item ${comment.parentId ? "ms-4" : ""}`}>
      <div
        className={`card mb-3 ${isApproved ? "" : "border-warning"} ${
          comment.parentId ? "border-start border-3" : ""
        }`}
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <strong>{comment.authorName}</strong>
              <small className="text-muted ms-2">
                {new Date(comment.createdAt).toLocaleDateString()}{" "}
                {new Date(comment.createdAt).toLocaleTimeString()}
              </small>
            </div>
            {!isApproved && (
              <span className="badge bg-warning text-dark">
                Pending Approval
              </span>
            )}
          </div>

          <div
            className="comment-content"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {isApproved && user?.approved && !comment.parentId && (
            <div className="mt-2">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                {showReplyForm ? "Cancel Reply" : "Reply"}
              </button>
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
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Debug logging
  console.log('CommentsSection - postId:', postId, 'user:', user);
  
  // Also set default comment status for auto-approval in development
  const defaultCommentStatus = 'approved'; // For testing - in production this should be 'pending'

  const fetchComments = async () => {
    console.log('fetchComments called - postId:', postId);
    if (!postId) {
      console.log('Skipping comment fetch - no postId');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching comments from:', `/api/posts/${postId}/comments`);
      const response = await fetch(`/api/posts/${postId}/comments`, {
        credentials: "include",
      });
      
      console.log('Comments response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Comments received:', data.length, 'comments');
        console.log('First comment:', data[0]);
        setComments(data);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch comments:', response.status, errorText);
        throw new Error("Failed to fetch comments");
      }
    } catch (err) {
      console.error('Error in fetchComments:', err);
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

  // Handle both flat and nested comment structures
  let parentComments = [];
  let allCommentsFlat = [];

  if (Array.isArray(comments) && comments.length > 0) {
    // Check if comments have embedded replies (nested structure from MongoDB)
    if (comments[0] && comments[0].replies && Array.isArray(comments[0].replies)) {
      console.log('Processing nested comment structure');
      parentComments = comments;
      // Flatten all comments for reply lookup
      comments.forEach(comment => {
        allCommentsFlat.push(comment);
        if (comment.replies) {
          comment.replies.forEach(reply => allCommentsFlat.push(reply));
        }
      });
    } else {
      console.log('Processing flat comment structure');
      // Flat structure - separate parent and child comments
      parentComments = comments.filter((comment) => !comment.parentId);
      allCommentsFlat = comments;
    }
  }

  console.log('parentComments:', parentComments.length);
  console.log('allCommentsFlat:', allCommentsFlat.length);
  console.log('comments state:', comments);

  // Function to get replies for a specific comment
  const getReplies = (commentId) => {
    const comment = parentComments.find(c => c.id === commentId);
    if (comment && comment.replies) {
      return comment.replies; // Use embedded replies
    }
    return allCommentsFlat.filter((reply) => reply.parentId === commentId);
  };

  if (isLoading) {
    return (
      <div className="comments-section mt-5">
        <h3>Comments</h3>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comments-section mt-5">
        <h3>Comments</h3>
        <div className="alert alert-danger">
          Failed to load comments. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="comments-section mt-5">
      <h3>
        Comments ({allCommentsFlat.length})
      </h3>

      {/* Comment Form - only show if user is approved */}
      {user?.approved && <CommentForm postId={postId} onSuccess={handleCommentAdded} />}

      {/* Comments List */}
      <div className="comments-list mt-4">
        {parentComments.length === 0 ? (
          <div className="alert alert-light text-center">
            <h5>No comments yet</h5>
            <p className="mb-0">Be the first to share your thoughts!</p>
          </div>
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
      <div className="container py-5">
        <div className="alert alert-info text-center">
          <h4>Authentication Required</h4>
          <p>Please sign in to view this blog post.</p>
        </div>
      </div>
    );
  }

  if (!user.approved) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning text-center">
          <h4>Account Pending Approval</h4>
          <p>Your account needs to be approved before you can view blog posts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">
          <h4>Post Not Found</h4>
          <p>The blog post you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
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