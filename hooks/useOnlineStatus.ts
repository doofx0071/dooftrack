import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * 
 * Listens to browser online/offline events and returns current status.
 * Useful for showing offline banners or disabling network-dependent features.
 * 
 * @returns boolean - true if online, false if offline
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus();
 *   
 *   return (
 *     <div>
 *       {!isOnline && <OfflineBanner />}
 *       <YourContent />
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  // Initialize with current status
  const [isOnline, setIsOnline] = useState(() => {
    // Server-side rendering safety
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    // Event handlers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen to online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
