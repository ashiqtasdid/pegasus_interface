'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Plus, 
  MessageSquare, 
  FolderOpen, 
  Heart,
  Code,
  Zap,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  BarChart3,
  Shield
} from 'lucide-react';
import { useSession, signOut, ExtendedUser } from '@/lib/auth-client';
import { useUserContext } from '@/hooks/useUserContext';

interface NavigationProps {
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { userContext } = useUserContext();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Dynamic navigation based on user role and authentication
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Create Plugin', href: '/create', icon: Plus },
      { name: 'Chat with AI', href: '/chat', icon: MessageSquare },
      { name: 'My Plugins', href: '/plugins', icon: FolderOpen },
      { name: 'Health Status', href: '/health', icon: Heart },
    ];

    // Add admin-only navigation items
    if (userContext?.role === 'admin') {
      baseNavigation.splice(5, 0, {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart3
      });
    }

    return baseNavigation;
  };

  const navigation = getNavigationItems();

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-filter backdrop-blur-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-xl shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  Pegasus Nest
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  AI Minecraft Plugin Generator
                </p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary)]/25'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)] hover:backdrop-blur-20'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : ''
                    }`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] opacity-20 blur-sm"></div>
                    )}
                  </Link>
                );
              })}
              
              {/* Enhanced User Menu */}
              <div className="relative ml-6" ref={userMenuRef}>
                {session?.user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="group flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] hover:border-[var(--primary)] transition-all duration-300 backdrop-blur-20"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        {userContext?.role === 'admin' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--accent-light)] rounded-full border-2 border-[var(--background)]"></div>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{(session.user as ExtendedUser).displayName || session.user.name || session.user.email}</div>
                        <div className="text-xs text-[var(--muted-foreground)] capitalize">{userContext?.role || 'user'}</div>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform group-hover:scale-110 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-3 w-56 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl shadow-2xl backdrop-blur-20 z-50 overflow-hidden">
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] rounded-lg transition-all duration-200"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile Settings</span>
                          </Link>
                          {userContext?.role === 'admin' && (
                            <Link
                              href="/admin"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center space-x-3 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] rounded-lg transition-all duration-200"
                            >
                              <Shield className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                          <hr className="my-2 border-[var(--glass-border)]" />
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-200"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="group flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white hover:shadow-lg hover:shadow-[var(--primary)]/25 transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Navigation */}
      <div className="md:hidden border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-20">
        <div className="px-4 py-4">
          <nav className="flex space-x-2 overflow-x-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content with enhanced spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-20 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-6 md:mb-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-lg">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-[var(--muted-foreground)] font-medium">
                Powered by AI • Built with Next.js • Enhanced with Love
              </span>
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              © 2025 Pegasus Nest. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
