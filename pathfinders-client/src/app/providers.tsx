'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { CounselorAuthProvider } from '@/contexts/counselor-auth-context';
import { MobileMenuProvider } from '@/contexts/mobile-menu-context';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CounselorAuthProvider>
          <MobileMenuProvider>
            <ToastProvider />
            {children}
          </MobileMenuProvider>
        </CounselorAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
