'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

type MobileMenuContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  isMobile: boolean;
};

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // Check if screen is mobile size
    const checkMobileSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkMobileSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobileSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobileSize);
  }, []);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && isMobile && sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, isMobile]);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <MobileMenuContext.Provider 
      value={{ sidebarOpen, toggleSidebar, closeSidebar, isMobile }}
    >
      <div ref={sidebarRef}>
        {children}
      </div>
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  
  if (context === undefined) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider');
  }
  
  return context;
} 