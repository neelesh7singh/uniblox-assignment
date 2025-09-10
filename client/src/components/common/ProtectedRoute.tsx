/**
 * ProtectedRoute Component
 * Handles authentication and authorization for protected routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that handles authentication and authorization
 *
 * @param children - The components to render if authorized
 * @param adminOnly - Whether the route requires admin privileges
 * @param redirectTo - Custom redirect path (defaults to login)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  redirectTo,
}) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const addNotification = useAppStore((state) => state.addNotification);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Check if user has admin privileges
  const isAdmin = user?.isAdmin || false;

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    addNotification({
      type: 'info',
      title: 'Authentication Required',
      message: 'Please log in to access this page.',
      duration: 4000,
    });

    return <Navigate to={redirectTo || ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If admin-only route but user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    addNotification({
      type: 'error',
      title: 'Access Denied',
      message: 'You do not have permission to access this page.',
      duration: 4000,
    });

    return <Navigate to={ROUTES.HOME} replace />;
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
