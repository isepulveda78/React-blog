import { Link } from "wouter";
import { Clock, MessageCircle, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BlogCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  category?: {
    name: string;
    slug: string;
  };
  author?: {
    name: string;
    username: string;
  };
  createdAt: Date;
  viewCount?: number;
  commentCount?: number;
}

export function BlogCard({
  title,
  slug,
  excerpt,
  featuredImage,
  category,
  author,
  createdAt,
  viewCount = 0,
  commentCount = 0,
}: BlogCardProps) {
  const readTime = Math.max(1, Math.ceil((excerpt?.length || 0) / 200)) + " min read";
  
  const getCategoryColor = (categoryName?: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'technology':
        return 'bg-primary text-white';
      case 'design':
        return 'bg-success text-white';
      case 'business':
        return 'bg-warning text-dark';
      case 'lifestyle':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="blog-card h-full border-0 shadow-sm hover:shadow-lg transition-all duration-200">
      <Link href={`/posts/${slug}`} className="block">
        {featuredImage && (
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}
        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-3">
            {category && (
              <span className={`badge text-xs px-2 py-1 rounded ${getCategoryColor(category.name)}`}>
                {category.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <h3 className="blog-title text-lg font-semibold mb-2 line-clamp-2 text-gray-900 hover:text-primary transition-colors">
            {title}
          </h3>

          {excerpt && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-grow">
              {excerpt}
            </p>
          )}

          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                {author && (
                  <span className="text-sm font-medium text-gray-900">
                    {author.name}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{readTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{commentCount}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
