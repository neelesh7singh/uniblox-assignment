/**
 * AdminLayout Component
 * Layout wrapper for admin dashboard pages
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

import AdminNavigation from './AdminNavigation';

interface AdminLayoutProps {
  className?: string;
}

/**
 * AdminLayout component for admin dashboard layout
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ className }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card">
          <AdminNavigation />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Admin Dashboard</h2>
              <div className="flex items-center gap-4">{/* Add any header actions here */}</div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className={className}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
