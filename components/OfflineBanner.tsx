import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from './Common';

interface OfflineBannerProps {
  /** Whether the user is currently offline */
  isOffline: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Offline Banner Component
 * 
 * Displays a banner at the top of the page when the user loses internet connection.
 * Auto-hides with animation when connection is restored.
 * 
 * Features:
 * - Slide-in/out animation
 * - Clear offline indicator
 * - Reassuring message about service worker cache
 * - Auto-dismiss on reconnection
 * 
 * @example
 * ```tsx
 * function App() {
 *   const isOnline = useOnlineStatus();
 *   
 *   return (
 *     <>
 *       <OfflineBanner isOffline={!isOnline} />
 *       <YourContent />
 *     </>
 *   );
 * }
 * ```
 */
export function OfflineBanner({ isOffline, className }: OfflineBannerProps) {
  // Don't render if online
  if (!isOffline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[60] bg-destructive text-destructive-foreground shadow-lg',
        'animate-in slide-in-from-top duration-300',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <WifiOff className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold">
              No Internet Connection
            </p>
            <p className="text-xs opacity-90 hidden sm:block">
              You can still browse your library offline. New content requires internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reconnection Toast Component
 * 
 * Shows a temporary success message when connection is restored.
 * Auto-dismisses after 3 seconds.
 */
export function ReconnectionToast() {
  const [show, setShow] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      // Only show toast if we were previously offline
      if (wasOffline) {
        setShow(true);
        setTimeout(() => setShow(false), 3000);
      }
    };

    const handleOffline = () => {
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Wifi className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-semibold">Back Online!</span>
      </div>
    </div>
  );
}
