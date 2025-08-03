import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  MessageCircle, 
  Tags, 
  Users, 
  Settings, 
  Eye,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function AdminSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Blog Posts', href: '/admin/posts', icon: FileText },
    { name: 'Comments', href: '/admin/comments', icon: MessageCircle },
    { name: 'Categories', href: '/admin/categories', icon: Tags },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="admin-sidebar text-white" style={{ width: '260px', minHeight: '100vh' }}>
      <div className="p-6">
        <h2 className="blog-title text-xl font-bold">BlogCraft Admin</h2>
        <p className="text-white/70 text-sm mt-1">Content Management</p>
      </div>

      <nav className="flex-1">
        <div className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`admin-nav-link flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-white/70">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full text-white border-white/20 hover:bg-white/10">
              <Eye className="mr-2 h-4 w-4" />
              View Blog
            </Button>
          </Link>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm" 
            className="w-full text-white border-white/20 hover:bg-white/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
