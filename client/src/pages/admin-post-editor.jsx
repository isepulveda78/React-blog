import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from "react-bootstrap";
import { useAuth } from "../hooks/use-auth";
import { queryClient, apiRequest } from "../lib/queryClient";

function AdminSidebar() {
  return (
    <div className="bg-dark text-light p-3" style={{ minHeight: '100vh', width: '250px' }}>
      <h4 className="mb-4">Admin Panel</h4>
      <nav>
        <ul className="list-unstyled">
          <li className="mb-2">
            <Link href="/admin-access" className="text-light text-decoration-none d-block p-2 rounded">
              📊 Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/posts" className="text-light text-decoration-none d-block p-2 rounded bg-primary">
              📝 Posts
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/categories" className="text-light text-decoration-none d-block p-2 rounded">
              🏷️ Categories
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/comments" className="text-light text-decoration-none d-block p-2 rounded">
              💬 Comments
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/seo" className="text-light text-decoration-none d-block p-2 rounded">
              🔍 SEO Management
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/admin/users" className="text-light text-decoration-none d-block p-2 rounded">
              👥 Users
            </Link>
          </li>
          <li className="mt-4">
            <Link href="/" className="text-light text-decoration-none d-block p-2 rounded">
              ← Back to Blog
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default function AdminPostEditor() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/posts/edit/:id");
  const postId = params?.id;
  const isEditing = !!postId;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    categoryId: "",
    featured: false,
    status: "draft",
    tags: "",
    // SEO fields
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    canonicalUrl: "",
    focusKeyword: "",
    seoTitle: ""
  });
  const [error, setError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAdmin,
  });

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["/api/posts", postId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json();
    },
    enabled: isEditing && isAdmin,
  });

  useEffect(() => {
    if (post && isEditing) {
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        categoryId: post.categoryId || "",
        featured: post.featured || false,
        status: post.status || "draft",
        tags: post.tags ? post.tags.join(", ") : "",
        // SEO fields
        metaDescription: post.metaDescription || "",
        metaKeywords: Array.isArray(post.metaKeywords) ? post.metaKeywords.join(", ") : post.metaKeywords || "",
        ogTitle: post.ogTitle || "",
        ogDescription: post.ogDescription || "",
        ogImage: post.ogImage || "",
        canonicalUrl: post.canonicalUrl || "",
        focusKeyword: post.focusKeyword || "",
        seoTitle: post.seoTitle || ""
      });
    }
  }, [post, isEditing]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: !isEditing ? generateSlug(title) : prev.slug
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const postData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        metaKeywords: data.metaKeywords ? data.metaKeywords.split(',').map(keyword => keyword.trim()) : [],
        authorId: user.id,
        authorName: user.name
      };
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLocation("/admin/posts");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data) => {
      const postData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        metaKeywords: data.metaKeywords ? data.metaKeywords.split(',').map(keyword => keyword.trim()) : []
      };
      const response = await apiRequest("PUT", `/api/posts/${postId}`, postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      setLocation("/admin/posts");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (isEditing) {
      updatePostMutation.mutate(formData);
    } else {
      createPostMutation.mutate(formData);
    }
  };

  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={6}>
            <Alert variant="warning">
              <h4>Access Denied</h4>
              <p>You don't have permission to access the admin area.</p>
              <Link href="/">
                <Button variant="primary">Return to Blog</Button>
              </Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  if (postLoading) {
    return (
      <div className="d-flex">
        <AdminSidebar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <AdminSidebar />
      
      <div className="flex-grow-1">
        {/* Header */}
        <div className="bg-white shadow-sm p-4">
          <h1 className="h3 mb-0">{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
          <p className="text-muted mb-0">
            {isEditing ? 'Update your blog post' : 'Write and publish your blog post'}
          </p>
        </div>

        <Container fluid className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col lg={8}>
                <Card className="mb-4">
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Post Title *</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="Enter post title..."
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>URL Slug *</Form.Label>
                      <Form.Control
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="url-friendly-slug"
                        required
                      />
                      <Form.Text className="text-muted">
                        This will be the URL for your post: /posts/{formData.slug}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Excerpt</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleChange}
                        placeholder="Brief description of your post..."
                      />
                      <Form.Text className="text-muted">
                        Optional summary that appears in post previews
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Content *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={15}
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Write your blog post content here..."
                        required
                      />
                      <Form.Text className="text-muted">
                        You can use HTML tags for formatting
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Tags</Form.Label>
                      <Form.Control
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="technology, web development, tutorial"
                      />
                      <Form.Text className="text-muted">
                        Separate multiple tags with commas
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* SEO Settings Card */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">🔍 SEO Settings</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>SEO Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="seoTitle"
                        value={formData.seoTitle}
                        onChange={handleChange}
                        placeholder="Custom SEO title (defaults to post title)"
                        maxLength="60"
                      />
                      <Form.Text className="text-muted">
                        {formData.seoTitle.length}/60 characters - Appears in search results
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Meta Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleChange}
                        placeholder="Describe your post for search engines..."
                        maxLength="160"
                      />
                      <Form.Text className="text-muted">
                        {formData.metaDescription.length}/160 characters - Appears in search results
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Focus Keyword</Form.Label>
                      <Form.Control
                        type="text"
                        name="focusKeyword"
                        value={formData.focusKeyword}
                        onChange={handleChange}
                        placeholder="main keyword to focus on"
                      />
                      <Form.Text className="text-muted">
                        Primary keyword you want to rank for
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Meta Keywords</Form.Label>
                      <Form.Control
                        type="text"
                        name="metaKeywords"
                        value={formData.metaKeywords}
                        onChange={handleChange}
                        placeholder="seo, optimization, keywords"
                      />
                      <Form.Text className="text-muted">
                        Separate multiple keywords with commas
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Open Graph Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="ogTitle"
                        value={formData.ogTitle}
                        onChange={handleChange}
                        placeholder="Title for social media sharing"
                        maxLength="95"
                      />
                      <Form.Text className="text-muted">
                        {formData.ogTitle.length}/95 characters - Used when shared on social media
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Open Graph Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="ogDescription"
                        value={formData.ogDescription}
                        onChange={handleChange}
                        placeholder="Description for social media sharing"
                        maxLength="300"
                      />
                      <Form.Text className="text-muted">
                        {formData.ogDescription.length}/300 characters - Used when shared on social media
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Open Graph Image</Form.Label>
                      <Form.Control
                        type="url"
                        name="ogImage"
                        value={formData.ogImage}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                      />
                      <Form.Text className="text-muted">
                        Image URL for social media sharing (1200x630px recommended)
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-0">
                      <Form.Label>Canonical URL</Form.Label>
                      <Form.Control
                        type="url"
                        name="canonicalUrl"
                        value={formData.canonicalUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/original-url"
                      />
                      <Form.Text className="text-muted">
                        Optional - Set if this content was originally published elsewhere
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Post Settings</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        label="Featured Post"
                      />
                      <Form.Text className="text-muted">
                        Featured posts appear prominently on the homepage
                      </Form.Text>
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={createPostMutation.isPending || updatePostMutation.isPending}
                      >
                        {createPostMutation.isPending || updatePostMutation.isPending ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            {isEditing ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          isEditing ? 'Update Post' : 'Create Post'
                        )}
                      </Button>
                      
                      <Button
                        variant="outline-secondary"
                        onClick={() => setLocation("/admin/posts")}
                        type="button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                {/* Preview */}
                {formData.title && (
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Preview</h5>
                    </Card.Header>
                    <Card.Body>
                      <h6>{formData.title}</h6>
                      {formData.excerpt && (
                        <p className="text-muted small">{formData.excerpt}</p>
                      )}
                      <div className="d-flex flex-wrap gap-1">
                        {formData.status === 'published' ? (
                          <Badge bg="success">Published</Badge>
                        ) : (
                          <Badge bg="warning">Draft</Badge>
                        )}
                        {formData.featured && <Badge bg="info">Featured</Badge>}
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
    </div>
  );
}