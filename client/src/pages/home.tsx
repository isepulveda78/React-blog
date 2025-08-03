import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Clock, Star } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { BlogCard } from "@/components/blog-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts", { search: searchQuery || undefined }],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/posts?search=${encodeURIComponent(searchQuery)}`
        : "/api/posts";
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (isLoadingPosts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onSearch={handleSearch} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={handleSearch} />

      {/* Hero Section */}
      {!searchQuery && featuredPost && (
        <section className="bg-light py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg overflow-hidden">
                  {featuredPost.featuredImage && (
                    <img
                      src={featuredPost.featuredImage}
                      alt={featuredPost.title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <CardContent className="p-6">
                    {featuredPost.category && (
                      <span className="badge bg-primary text-white text-sm px-3 py-1 rounded-full mb-3 inline-block">
                        {featuredPost.category.name}
                      </span>
                    )}
                    <h1 className="blog-title text-3xl font-bold mb-4 text-gray-900">
                      {featuredPost.title}
                    </h1>
                    {featuredPost.excerpt && (
                      <p className="text-muted-foreground text-lg mb-4">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {featuredPost.author?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(featuredPost.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>8 min read</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{featuredPost.viewCount || 0} views</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCategories ? (
                      <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-6 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((category: any) => (
                          <div 
                            key={category.id}
                            className="flex items-center justify-between text-sm hover:text-primary cursor-pointer transition-colors"
                          >
                            <span>{category.name}</span>
                            <span className="badge bg-light text-dark">
                              {category.postCount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {posts.slice(1, 4).map((post: any) => (
                        <div key={post.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <h4 className="font-medium text-sm text-gray-900 hover:text-primary cursor-pointer transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="blog-title text-2xl font-bold text-gray-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : "Latest Articles"}
            </h2>
            {!searchQuery && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Sort by: Newest
                </Button>
              </div>
            )}
          </div>

          {searchQuery && posts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or browse our categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchQuery ? posts : regularPosts).map((post: any) => (
                <BlogCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  featuredImage={post.featuredImage}
                  category={post.category}
                  author={post.author}
                  createdAt={new Date(post.createdAt)}
                  viewCount={post.viewCount}
                  commentCount={0} // TODO: Add comment count to API
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!searchQuery && posts.length > 6 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <Button variant="outline" disabled>
                  Previous
                </Button>
                <Button variant="outline" className="bg-primary text-white">
                  1
                </Button>
                <Button variant="outline">2</Button>
                <Button variant="outline">3</Button>
                <Button variant="outline">Next</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
