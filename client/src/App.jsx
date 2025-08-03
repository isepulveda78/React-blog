import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from "./hooks/use-auth";

import Home from "./pages/home";
import BlogPost from "./pages/blog-post";
import AdminDashboard from "./pages/admin-dashboard";
import AdminPosts from "./pages/admin-posts";
import AdminPostEditor from "./pages/admin-post-editor";
import AdminComments from "./pages/admin-comments";
import AdminCategories from "./pages/admin-categories";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/posts/:slug" component={BlogPost} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/posts" component={AdminPosts} />
      <Route path="/admin/posts/new" component={AdminPostEditor} />
      <Route path="/admin/posts/edit/:id" component={AdminPostEditor} />
      <Route path="/admin/comments" component={AdminComments} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;