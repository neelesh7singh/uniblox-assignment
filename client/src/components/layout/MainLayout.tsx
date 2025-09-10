/**
 * MainLayout Component
 * Main layout wrapper with header, footer, and content area
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Main layout component that wraps the entire application
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 w-full transition-all duration-200',
          sidebarOpen && 'md:pl-64', // Sidebar offset when open
          className
        )}
      >
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => useAppStore.getState().setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;
