/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  errorInfo?: React.ErrorInfo | null;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, errorInfo }) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>

          <p className="text-muted-foreground mb-8">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-8 p-4 bg-muted rounded-lg text-left">
              <h3 className="font-semibold text-sm text-foreground mb-2">Error Details:</h3>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto">
                {error.message}
                {errorInfo?.componentStack}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={resetError} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>

            <Button onClick={handleReload} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>

            <Button onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Error Boundary Class Component
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log errors to a service like Sentry
    // logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
