/**
 * Header Component
 * Main navigation header with logo, navigation menu, and user controls
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import ThemeToggle from '@/components/common/ThemeToggle';
import UserMenu from '@/components/common/UserMenu';

import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useAppStore } from '@/store/app';
import { ROUTES, MAIN_NAVIGATION } from '@/constants/routes';

interface HeaderProps {
  className?: string;
}

/**
 * Main application header component
 */
export const Header: React.FC<HeaderProps> = ({ className }) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const cartCount = useCartStore((state) => state.cart?.totalItems || 0);
  const { toggleSidebar } = useAppStore();

  // Check if current route is active
  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left side - Logo and Mobile menu */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>

          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl">Uniblox</span>
          </Link>
        </div>

        {/* Center - Main Navigation (Desktop) */}
        <nav className="hidden md:flex items-center space-x-6">
          {MAIN_NAVIGATION.map((item) => {
            // Skip navigation items that require auth if user is not logged in
            if (item.requiresAuth && !user) {
              return null;
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActiveRoute(item.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right side - Cart, Theme Toggle, User Menu */}
        <div className="flex items-center gap-2">
          {/* Shopping Cart Button (only show if authenticated) */}
          {user && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to={ROUTES.CART}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    variant="destructive"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
                <span className="sr-only">Shopping cart</span>
              </Link>
            </Button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
