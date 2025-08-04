import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Spinner } from "react-bootstrap";
import { useAuth } from "../hooks/use-auth";
import { queryClient, apiRequest } from "../lib/queryClient";
import { updateMetaTags } from "../utils/seo.js";

function CommentSection({ postId }) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/comments`, commentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      setNewComment("");
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      content: newComment,
      authorName: user?.name || "Anonymous",
      authorEmail: user?.email || "",
    });
  };

  return (
    <div className="mt-5">
      <h4 className="mb-4">Comments ({comments.length})</h4>
      
      {user && (
        <Card className="mb-4">
          <Card.Body>
            <h6>Leave a Comment</h6>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" disabled={addCommentMutation.isPending}>
                {addCommentMutation.isPending ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <Alert variant="info">
          <h6>No comments yet</h6>
          <p className="mb-0">Be the first to share your thoughts!</p>
        </Alert>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{comment.authorName}</h6>
                    <small className="text-muted">
                      {new Date(comment.createdAt).toLocaleDateString()} at{" "}
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                  {comment.status === 'pending' && (
                    <Badge bg="warning">Pending Approval</Badge>
                  )}
                </div>
                <p className="mt-2 mb-0">{comment.content}</p>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BlogPost() {
  const [, params] = useRoute("/posts/:slug");
  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["/api/posts", slug],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error('Failed to fetch post');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <div className="text-center">
              <Spinner animation="border" />
              <p className="mt-2">Loading post...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Alert variant="danger">
              <h4>Error</h4>
              <p>{error.message}</p>
              <Link href="/">
                <Button variant="primary">Back to Home</Button>
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Alert variant="warning">
              <h4>Post Not Found</h4>
              <p>The post you're looking for doesn't exist or has been removed.</p>
              <Link href="/">
                <Button variant="primary">Back to Home</Button>
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Update SEO meta tags when post loads
  useEffect(() => {
    if (post) {
      updateMetaTags({
        title: post.seoTitle || post.title,
        description: post.metaDescription || post.excerpt || 'Read this blog post on Mr. S Teaches',
        keywords: post.metaKeywords || post.tags || [],
        ogTitle: post.ogTitle || post.title,
        ogDescription: post.ogDescription || post.excerpt || post.metaDescription,
        ogImage: post.ogImage || post.featuredImage || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630',
        canonicalUrl: post.canonicalUrl || window.location.href,
        seoTitle: post.seoTitle || post.title,
        focusKeyword: post.focusKeyword,
        type: 'article',
        authorName: post.authorName,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt
      });
    }
  }, [post]);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <Container>
          <Link href="/" className="navbar-brand fw-bold text-primary fs-3">
            Mr. S Teaches
          </Link>
          <Link href="/" className="btn btn-outline-primary">
            ← Back to Blog
          </Link>
        </Container>
      </nav>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Post Header */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                {post.categoryName && (
                  <Badge bg="primary">{post.categoryName}</Badge>
                )}
                {post.featured && <Badge bg="warning">Featured</Badge>}
              </div>
              
              <h1 className="display-5 fw-bold mb-3">{post.title}</h1>
              
              <div className="d-flex align-items-center text-muted mb-4">
                <span>By <strong>{post.authorName}</strong></span>
                <span className="mx-2">•</span>
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                {post.readingTime && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{post.readingTime} min read</span>
                  </>
                )}
              </div>

              {post.excerpt && (
                <div className="lead text-muted mb-4">
                  {post.excerpt}
                </div>
              )}
            </div>

            {/* Post Content */}
            <Card className="shadow-sm">
              <Card.Body className="p-4">
                <div 
                  className="post-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  style={{
                    lineHeight: '1.7',
                    fontSize: '1.1rem'
                  }}
                />
              </Card.Body>
            </Card>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4">
                <h6 className="text-muted mb-2">Tags:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} bg="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CommentSection postId={post.id} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}