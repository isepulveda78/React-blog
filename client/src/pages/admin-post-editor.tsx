import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Eye, Globe, Upload, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertBlogPostSchema, type InsertBlogPost } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

const postSchema = insertBlogPostSchema.extend({
  tags: insertBlogPostSchema.shape.tags.optional(),
});

export default function AdminPostEditor() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>("");

  const isEditing = !!id;

  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ["/api/posts", id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json();
    },
    enabled: isEditing && isAdmin,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    enabled: isAdmin,
  });

  const form = useForm<InsertBlogPost>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      categoryId: "",
      authorId: user?.id || "",
      status: "draft",
      allowComments: true,
      metaTitle: "",
      metaDescription: "",
      tags: [],
      publishedAt: null,
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (post && isEditing) {
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content,
        featuredImage: post.featuredImage || "",
        categoryId: post.categoryId || "",
        authorId: post.authorId,
        status: post.status,
        allowComments: post.allowComments,
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        tags: post.tags || [],
        publishedAt: post.publishedAt,
      });
      if (post.featuredImage) {
        setFeaturedImagePreview(post.featuredImage);
      }
    }
  }, [post, isEditing, form]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const title = form.watch("title");
  useEffect(() => {
    if (title && !isEditing) {
      const slug = generateSlug(title);
      form.setValue("slug", slug);
    }
  }, [title, isEditing, form]);

  const createPostMutation = useMutation({
    mutationFn: async (data: InsertBlogPost) => {
      const response = await apiRequest("POST", "/api/posts", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Post created successfully.",
      });
      setLocation(`/admin/posts/edit/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: Partial<InsertBlogPost>) => {
      const response = await apiRequest("PUT", `/api/posts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
      toast({
        title: "Success",
        description: "Post updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBlogPost) => {
    // Convert tags string to array
    const formattedData = {
      ...data,
      tags: typeof data.tags === 'string' 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : data.tags || [],
      publishedAt: data.status === 'published' && !data.publishedAt ? new Date() : data.publishedAt,
    };

    if (isEditing) {
      updatePostMutation.mutate(formattedData);
    } else {
      createPostMutation.mutate(formattedData);
    }
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    onSubmit({ ...data, status: "draft" });
  };

  const handlePublish = () => {
    const data = form.getValues();
    onSubmit({ ...data, status: "published" });
  };

  const handleImageUpload = (url: string) => {
    form.setValue("featuredImage", url);
    setFeaturedImagePreview(url);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin area.</p>
          <Link href="/">
            <Button>Return to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isEditing && isLoadingPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/posts">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Posts
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Edit Post" : "Create New Post"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing ? "Update your blog post" : "Write and publish your blog content"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createPostMutation.isPending || updatePostMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              {form.watch("slug") && (
                <Link href={`/posts/${form.watch("slug")}`}>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </Link>
              )}
              <Button
                onClick={handlePublish}
                disabled={createPostMutation.isPending || updatePostMutation.isPending}
              >
                <Globe className="mr-2 h-4 w-4" />
                {form.watch("status") === "published" ? "Update" : "Publish"}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Post Title</Label>
                        <Input
                          id="title"
                          {...form.register("title")}
                          placeholder="Enter your blog post title..."
                          className="text-lg"
                        />
                        {form.formState.errors.title && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="slug">URL Slug</Label>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">blogcraft.com/posts/</span>
                          <Input
                            id="slug"
                            {...form.register("slug")}
                            placeholder="url-friendly-title"
                          />
                        </div>
                        {form.formState.errors.slug && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.slug.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          {...form.register("excerpt")}
                          placeholder="Brief description of your post..."
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be shown in post previews and search results
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      value={form.watch("content")}
                      onChange={(value) => form.setValue("content", value)}
                      placeholder="Start writing your blog post here..."
                    />
                    {form.formState.errors.content && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.content.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Featured Image */}
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {featuredImagePreview ? (
                      <div className="relative">
                        <img
                          src={featuredImagePreview}
                          alt="Featured"
                          className="w-full h-48 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFeaturedImagePreview("");
                            form.setValue("featuredImage", "");
                          }}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload or enter URL</p>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleImageUpload(e.target.value);
                            }
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Post Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={form.watch("categoryId") || ""} 
                        onValueChange={(value) => form.setValue("categoryId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        {...form.register("tags")}
                        placeholder="react, javascript, web development"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate tags with commas
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allowComments"
                        checked={form.watch("allowComments")}
                        onCheckedChange={(checked) => form.setValue("allowComments", !!checked)}
                      />
                      <Label htmlFor="allowComments">Allow comments</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        {...form.register("metaTitle")}
                        placeholder="SEO title for search engines"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended: 50-60 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        {...form.register("metaDescription")}
                        placeholder="SEO description for search engines"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended: 150-160 characters
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
