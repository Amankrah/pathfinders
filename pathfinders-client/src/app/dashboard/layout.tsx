'use client';

import { useAuth } from '@/contexts/auth-context';
import { useMobileMenu } from '@/contexts/mobile-menu-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/dashboard/navbar';
import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { isMobile, sidebarOpen } = useMobileMenu();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <Sidebar />
      <main 
        className={isMobile 
          ? "pt-16 px-4"
          : "pl-64 pt-16"
        }
      >
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-slate-50/50">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 transition-opacity duration-300 ease-in-out"
          aria-hidden="true"
        />
      )}
    </div>
  );
} 