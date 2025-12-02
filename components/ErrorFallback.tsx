import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './Common';

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  reset?: () => void;
  showDetails?: boolean;
}

/**
 * Error Fallback UI Component
 * 
 * Displays a user-friendly error screen with options to:
 * - Try again (reset error boundary)
 * - Go home (navigate to library)
 * - View error details (in development)
 * 
 * Usage with ErrorBoundary:
 * ```tsx
 * <ErrorBoundary fallback={(error, errorInfo, reset) => 
 *   <ErrorFallback error={error} errorInfo={errorInfo} reset={reset} />
 * }>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export function ErrorFallback({ error, errorInfo, reset, showDetails = false }: ErrorFallbackProps) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(showDetails);
  const isDevelopment = import.meta.env.DEV;

  const handleGoHome = () => {
    window.location.href = '#/library';
    if (reset) reset();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Error Icon & Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground text-lg">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
          </div>
        </div>

        {/* Error Message (non-technical) */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground font-mono">
            {error.message || 'An unknown error occurred'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {reset && (
            <Button
              onClick={reset}
              className="flex items-center gap-2 font-semibold cursor-pointer"
              size="lg"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex items-center gap-2 font-semibold cursor-pointer"
            size="lg"
          >
            <Home className="w-4 h-4" />
            Go to Library
          </Button>
          
          <Button
            onClick={handleRefresh}
            variant="ghost"
            className="flex items-center gap-2 font-semibold cursor-pointer"
            size="lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </Button>
        </div>

        {/* Developer Details Toggle */}
        {isDevelopment && (
          <div className="space-y-3">
            <Button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              variant="ghost"
              className="w-full flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Bug className="w-4 h-4" />
              {showErrorDetails ? 'Hide' : 'Show'} Error Details
            </Button>

            {showErrorDetails && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-4 text-left">
                {/* Error Stack */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Error Stack:</h3>
                  <pre className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                    {error.stack || 'No stack trace available'}
                  </pre>
                </div>

                {/* Component Stack */}
                {errorInfo?.componentStack && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Component Stack:</h3>
                    <pre className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            If this problem persists, try clearing your browser cache or{' '}
            <button
              onClick={() => {
                if (confirm('This will clear all app data. Continue?')) {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              reset app data
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Smaller error fallback for inline errors (e.g., in cards or sections)
 */
export function InlineErrorFallback({ error, reset }: { error: Error; reset?: () => void }) {
  return (
    <div className="w-full p-6 bg-card border border-destructive/20 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">Failed to load content</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
          {reset && (
            <Button
              onClick={reset}
              size="sm"
              variant="outline"
              className="mt-2 cursor-pointer"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
