/**
 * NotFoundPage Component
 * 404 error page with navigation options
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/**
 * NotFoundPage component for 404 errors
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-8 max-w-md">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl md:text-9xl font-bold text-primary/20">404</div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-lg text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted,
            or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild className="w-full sm:w-auto">
            <Link to={ROUTES.HOME}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to={ROUTES.PRODUCTS}>
              <Search className="w-4 h-4 mr-2" />
              Browse Products
            </Link>
          </Button>
        </div>

        {/* Go Back Button */}
        <div className="pt-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help Text */}
        <div className="pt-8 text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please{' '}
            <Link to="#" className="text-primary hover:underline">
              contact support
            </Link>{' '}
            and we'll help you find what you're looking for.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
