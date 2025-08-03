import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { AuthModals } from "@/components/auth-modals";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState<"login" | "register" | null>(null);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleLogout = () => {
    logout();
    if (location.startsWith('/admin')) {
      window.location.href = '/';
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="blog-title text-2xl font-bold text-primary">
              BlogCraft
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link 
                href="/" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === '/' ? 'text-primary' : 'text-gray-700'
                }`}
              >
                Home
              </Link>
              
              {/* Categories dropdown would go here */}
              <div className="relative group">
                <button className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  Categories
                </button>
                {/* Dropdown menu implementation would go here */}
              </div>
              
              <Link 
                href="/about" 
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                About
              </Link>
            </div>

            {/* Search and Auth */}
            <div className="hidden lg:flex items-center space-x-4">
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pr-10"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">Hello, {user?.name}</span>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAuthModal("login")}
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowAuthModal("register")}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="lg:hidden border-t bg-white py-4">
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                  <Input
                    type="search"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                <div className="space-y-2">
                  <Link href="/" className="block py-2 text-gray-700 hover:text-primary">
                    Home
                  </Link>
                  <button className="block py-2 text-gray-700 hover:text-primary">
                    Categories
                  </button>
                  <Link href="/about" className="block py-2 text-gray-700 hover:text-primary">
                    About
                  </Link>
                </div>

                {isAuthenticated ? (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm text-gray-700">Hello, {user?.name}</p>
                    {isAdmin && (
                      <Link href="/admin" className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowAuthModal("login")}
                    >
                      Login
                    </Button>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowAuthModal("register")}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModals
        mode={showAuthModal}
        onClose={() => setShowAuthModal(null)}
        onSuccess={() => setShowAuthModal(null)}
      />
    </>
  );
}
