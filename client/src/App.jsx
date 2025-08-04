import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from "./hooks/use-auth";

import Home from "./pages/home-simple";
import BlogPost from "./pages/blog-post";
import AdminDashboard from "./pages/admin-dashboard";
import AdminPosts from "./pages/admin-posts";
import AdminPostEditor from "./pages/admin-post-editor";
import AdminComments from "./pages/admin-comments";
import AdminCategories from "./pages/admin-categories";
import AdminSEO from "./pages/admin-seo";
import AdminUsers from "./pages/admin-users";
import DebugDashboard from "./pages/debug-dashboard";
import TestSEO from "./pages/test-seo";
import SimpleSEO from "./pages/simple-seo";
import NotFound from "./pages/not-found";
import AdminAccess from "./pages/admin-access";
import AdminSuccess from "./pages/admin-success";

function Router() {
  return (
    <Switch>
      <Route path="/test-seo" component={TestSEO} />
      <Route path="/simple-seo" component={SimpleSEO} />
      <Route path="/debug" component={DebugDashboard} />
      <Route path="/" component={Home} />
      <Route path="/posts/:slug" component={BlogPost} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-access" component={AdminAccess} />
      <Route path="/admin-success" component={AdminSuccess} />
      <Route path="/admin/posts" component={AdminPosts} />
      <Route path="/admin/posts/new" component={AdminPostEditor} />
      <Route path="/admin/posts/edit/:id" component={AdminPostEditor} />
      <Route path="/admin/comments" component={AdminComments} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/seo" component={AdminSEO} />
      <Route path="/admin/users" component={AdminUsers} />
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