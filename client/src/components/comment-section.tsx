import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, ThumbsUp, Reply, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCommentSchema, type InsertComment } from "@shared/schema";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  parentId?: string;
  likes: number;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  const commentForm = useForm<InsertComment>({
    resolver: zodResolver(insertCommentSchema.omit({ postId: true })),
    defaultValues: {
      content: "",
      authorName: "",
      authorEmail: "",
      parentId: undefined,
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: InsertComment) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/comments`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      commentForm.reset();
      setReplyingTo(null);
      toast({
        title: "Comment submitted",
        description: "Your comment has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertComment) => {
    createCommentMutation.mutate({
      ...data,
      parentId: replyingTo || undefined,
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const topLevelComments = comments.filter((comment: Comment) => !comment.parentId);
  const getReplies = (commentId: string) => 
    comments.filter((comment: Comment) => comment.parentId === commentId);

  if (isLoading) {
    return <div className="space-y-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="blog-title text-xl font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave a Comment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={commentForm.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="content">Comment</Label>
              <Textarea
                id="content"
                placeholder="Write your comment..."
                {...commentForm.register("content")}
                className="mt-1"
                rows={4}
              />
              {commentForm.formState.errors.content && (
                <p className="text-sm text-destructive mt-1">
                  {commentForm.formState.errors.content.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorName">Your Name</Label>
                <Input
                  id="authorName"
                  {...commentForm.register("authorName")}
                  className="mt-1"
                />
                {commentForm.formState.errors.authorName && (
                  <p className="text-sm text-destructive mt-1">
                    {commentForm.formState.errors.authorName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="authorEmail">Your Email</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  {...commentForm.register("authorEmail")}
                  className="mt-1"
                />
                {commentForm.formState.errors.authorEmail && (
                  <p className="text-sm text-destructive mt-1">
                    {commentForm.formState.errors.authorEmail.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {replyingTo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel Reply
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={createCommentMutation.isPending}
                className="ml-auto"
              >
                {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.map((comment: Comment) => (
          <div key={comment.id} className="space-y-4">
            {/* Main Comment */}
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="font-semibold text-gray-900">{comment.authorName}</h6>
                    <span className="text-sm text-muted-foreground">
                      {getTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Like ({comment.likes})
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>

            {/* Replies */}
            {getReplies(comment.id).map((reply: Comment) => (
              <div key={reply.id} className="ml-14">
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-semibold text-gray-900 text-sm">
                          {reply.authorName}
                        </h6>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
            <p className="text-gray-500">Be the first to leave a comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}
