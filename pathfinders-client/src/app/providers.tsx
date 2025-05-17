'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { MobileMenuProvider } from '@/contexts/mobile-menu-context';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <MobileMenuProvider>
          <ToastProvider />
          {children}
        </MobileMenuProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
