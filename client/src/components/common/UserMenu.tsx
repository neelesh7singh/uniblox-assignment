/**
 * UserMenu Component
 * Displays user avatar and dropdown menu with user options
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ShoppingBag, Shield, UserCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { ROUTES } from '@/constants/routes';

interface UserMenuProps {
  className?: string;
}

/**
 * UserMenu component with user avatar and dropdown options
 */
export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const addNotification = useAppStore((state) => state.addNotification);

  const handleLogout = () => {
    logout();
    addNotification({
      type: 'success',
      title: 'Logged Out',
      message: 'You have been logged out successfully.',
      duration: 3000,
    });
    navigate(ROUTES.HOME);
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.LOGIN}>Login</Link>
        </Button>
        <Button asChild size="sm">
          <Link to={ROUTES.REGISTER}>Sign Up</Link>
        </Button>
      </div>
    );
  }

  // Generate user initials for avatar fallback
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative h-8 w-8 rounded-full ${className}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials || <UserCircle className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={ROUTES.PROFILE} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to={ROUTES.ORDERS} className="cursor-pointer">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>Orders</span>
          </Link>
        </DropdownMenuItem>

        {/* Admin menu item */}
        {user.isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={ROUTES.ADMIN} className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
