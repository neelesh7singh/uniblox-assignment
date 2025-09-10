/**
 * AdminNavigation Component
 * Navigation sidebar for admin dashboard
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Package, ShoppingCart, BarChart3, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useAuthStore } from '@/store/auth';

interface AdminNavigationProps {
  className?: string;
}

/**
 * Admin navigation items
 */
const navigationItems = [
  {
    title: 'Users',
    href: '/admin',
    icon: Users,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
];

/**
 * AdminNavigation component for admin dashboard sidebar
 */
export const AdminNavigation: React.FC<AdminNavigationProps> = ({ className }) => {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Logo/Brand */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Uniblox E-commerce</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'} // Only match exactly for dashboard
            className={({ isActive }: { isActive: boolean }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminNavigation;
