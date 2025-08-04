import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Book, BookOpen, Home, UserCircle, ClipboardCheck, Target, X, Heart, History } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useMobileMenu } from '@/contexts/mobile-menu-context';
import { useEffect } from 'react';

// Helper function to extract book ID from pathname
const getBookId = (pathname: string) => {
  const match = pathname.match(/\/dashboard\/books\/(\d+)/);
  return match ? match[1] : null;
};

export function Sidebar() {
  const pathname = usePathname();
  const bookId = getBookId(pathname);
  const { user } = useAuth();
  const { sidebarOpen, closeSidebar, isMobile } = useMobileMenu();
  
  // Close sidebar on navigation on mobile
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [pathname, isMobile, closeSidebar]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { 
      name: 'Books', 
      href: '/dashboard/books',
      icon: BookOpen,
      subItems: [
        { 
          name: 'My Library', 
          href: '/dashboard/books',
          icon: Book 
        },
        // Only show Career Planning when viewing a book
        ...(bookId ? [
          { 
            name: 'Career Planning', 
            href: `/dashboard/books/${bookId}/career-planning`,
            icon: Target
          }
        ] : [])
      ]
    },
    { name: 'Assessments', href: '/dashboard/assessments', icon: ClipboardCheck },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircle },
    { name: 'Donate', href: '/dashboard/donate', icon: Heart },
    { name: 'My Donations', href: '/dashboard/donations', icon: History },
  ];

  if (isMobile && !sidebarOpen) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed z-40 bg-white border-r border-slate-200 overflow-y-auto",
        "scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300",
        "transition-all duration-300 ease-in-out",
        isMobile 
          ? "top-0 left-0 bottom-0 w-64 shadow-lg" 
          : "top-16 left-0 bottom-0 w-64"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {isMobile && (
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <Link 
            href="/dashboard" 
            className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 
              text-transparent bg-clip-text"
          >
            Pathfinders
          </Link>
          <button 
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <nav className="p-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <div key={item.name} className="mb-2">
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl',
                  'transition-all duration-200 ease-in-out',
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? item.name === 'Donate' 
                      ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700'
                      : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {item.icon && (
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 transition-transform duration-200",
                    "group-hover:scale-110"
                  )} />
                )}
                {item.name}
              </Link>

              {/* Sub-items with improved styling */}
              {item.subItems && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={cn(
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-lg',
                        'transition-all duration-200 ease-in-out',
                        pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      {subItem.icon && (
                        <subItem.icon className={cn(
                          "mr-3 h-4 w-4 transition-transform duration-200",
                          "group-hover:scale-110"
                        )} />
                      )}
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Section at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-slate-50">
          <Link
            href="/dashboard/profile"
            className="flex items-center px-3 py-3 rounded-xl hover:bg-white 
              transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 
              flex items-center justify-center text-white font-medium text-sm mr-3
              group-hover:shadow-md transition-all duration-200">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">
                {user?.username}
              </div>
              <div className="text-xs text-slate-500">
                View Profile
              </div>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
} 