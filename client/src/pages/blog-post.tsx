import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Calendar, User, Eye, Share2, Twitter, Linkedin, Copy } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { CommentSection } from "@/components/comment-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function BlogPost() {
  const { slug } = useParams();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery({
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

  const shareMutation = useMutation({
    mutationFn: async (platform: string) => {
      // In a real app, you might track social shares
      return platform;
    },
    onSuccess: () => {
      toast({
        title: "Shared!",
        description: "Post shared successfully.",
      });
    },
  });

  const handleShare = (platform: 'twitter' | 'linkedin' | 'copy') => {
    if (!post) return;
    
    const url = window.location.href;
    const title = post.title;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Post link copied to clipboard.",
        });
        break;
    }
    
    shareMutation.mutate(platform);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-64 w-full mb-6" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const readTime = Math.max(1, Math.ceil((post.content?.length || 0) / 1000)) + " min read";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('twitter')}
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('linkedin')}
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('copy')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <article className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8">
                    {/* Article Header */}
                    <div className="mb-8">
                      {post.category && (
                        <span className="badge bg-primary text-white text-sm px-3 py-1 rounded-full mb-4 inline-block">
                          {post.category.name}
                        </span>
                      )}
                      
                      <h1 className="blog-title text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        {post.title}
                      </h1>

                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {post.author?.name}
                            </p>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <span>•</span>
                              <span>{readTime}</span>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{post.viewCount || 0} views</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-64 object-cover rounded-lg mb-8"
                        />
                      )}
                    </div>

                    {/* Article Content */}
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-8 pt-6 border-t">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="badge bg-light text-dark text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Share Section */}
                    <div className="mt-8 pt-6 border-t">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Share this article</h3>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('twitter')}
                          >
                            <Twitter className="mr-2 h-4 w-4" />
                            Twitter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('linkedin')}
                          >
                            <Linkedin className="mr-2 h-4 w-4" />
                            LinkedIn
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('copy')}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <div className="mt-8">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8">
                      <CommentSection postId={post.id} />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Author Info */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {post.author?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          @{post.author?.username}
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          Follow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Table of Contents (if we had headings extracted) */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">In this article</h3>
                      <div className="space-y-2 text-sm">
                        <div className="text-muted-foreground">
                          Table of contents would be generated from headings in the article content.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
