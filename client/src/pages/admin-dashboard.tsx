import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  MessageCircle, 
  Users, 
  TrendingUp,
  Eye,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboard() {
  const { isAdmin } = useAuth();

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: isAdmin,
  });

  const { data: recentPosts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts", { limit: 5 }],
    queryFn: async () => {
      const response = await fetch("/api/posts?limit=5");
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    enabled: isAdmin,
  });

  const { data: recentComments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ["/api/comments", { status: "pending", limit: 5 }],
    queryFn: async () => {
      const response = await fetch("/api/comments?status=pending&limit=5");
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: isAdmin,
  });

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 mt-1">Manage your blog content and user interactions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View Blog
                </Button>
              </Link>
              <Link href="/admin/posts/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Posts</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalPosts || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                {!isLoadingStats && (
                  <p className="text-xs text-green-600 mt-2">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    12% from last month
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Comments</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalComments || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                {!isLoadingStats && (
                  <p className="text-xs text-green-600 mt-2">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    8% from last month
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalViews || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                {!isLoadingStats && (
                  <p className="text-xs text-green-600 mt-2">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    18% from last month
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Comments</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.pendingComments || 0}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                {stats?.pendingComments > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Requires attention
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Posts</CardTitle>
                    <Link href="/admin/posts">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPosts ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-16 w-16 rounded" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-500 mb-4">Get started by creating your first blog post.</p>
                      <Link href="/admin/posts/new">
                        <Button>Create Post</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentPosts.map((post: any) => (
                        <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {post.featuredImage ? (
                              <img
                                src={post.featuredImage}
                                alt={post.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <FileText className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-gray-900 line-clamp-1">
                                {post.title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                {post.category && (
                                  <span className="badge bg-primary text-white text-xs px-2 py-1 rounded">
                                    {post.category.name}
                                  </span>
                                )}
                                <span className={`badge text-xs px-2 py-1 rounded ${
                                  post.status === 'published' 
                                    ? 'bg-success text-white' 
                                    : 'bg-warning text-dark'
                                }`}>
                                  {post.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/posts/${post.slug}`}>View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/posts/edit/${post.id}`}>Edit</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Comments */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending Comments</CardTitle>
                    {recentComments.length > 0 && (
                      <span className="badge bg-danger text-white">
                        {recentComments.length}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingComments ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : recentComments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No pending comments</h3>
                      <p className="text-gray-500">All comments have been moderated.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentComments.map((comment: any) => (
                        <div key={comment.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h6 className="font-medium text-sm text-gray-900">
                                {comment.authorName}
                              </h6>
                              <p className="text-xs text-gray-500">
                                on "{comment.post?.title}"
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {comment.content}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
