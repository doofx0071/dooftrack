import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { SessionTimeout } from './utils/sessionTimeout';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { AppLayout } from './components/AppLayout';
import AuthModal from './components/AuthModal';
import { OfflineBanner, ReconnectionToast } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorFallback } from './components/ErrorFallback';
import { Button } from './components/Common';
import { AlertTriangle } from 'lucide-react';
import Loader from './components/Loader';

// Lazy load pages
const Library = lazy(() => import('./pages/Library'));
const Search = lazy(() => import('./pages/Search'));
const Details = lazy(() => import('./pages/Details'));
const Account = lazy(() => import('./pages/Account'));
const Goals = lazy(() => import('./pages/Goals'));

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [sessionWarning, setSessionWarning] = React.useState(false);
  const sessionTimeoutRef = React.useRef<SessionTimeout | null>(null);
  const isOnline = useOnlineStatus();

  React.useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // Setup session timeout for logged in users
      if (newUser && !sessionTimeoutRef.current) {
        sessionTimeoutRef.current = new SessionTimeout(
          () => {
            setSessionWarning(true);
          },
          () => {
            handleSignOut();
          }
        );
      } else if (!newUser && sessionTimeoutRef.current) {
        sessionTimeoutRef.current.destroy();
        sessionTimeoutRef.current = null;
        setSessionWarning(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (sessionTimeoutRef.current) {
        sessionTimeoutRef.current.destroy();
      }
    };
  }, []);

  const handleSignOut = async () => {
    if (sessionTimeoutRef.current) {
      sessionTimeoutRef.current.destroy();
      sessionTimeoutRef.current = null;
    }
    setSessionWarning(false);
    await supabase.auth.signOut();
  };
  
  const extendSession = () => {
    if (sessionTimeoutRef.current) {
      sessionTimeoutRef.current.resetActivity();
      setSessionWarning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ErrorBoundary 
        fallback={(error, errorInfo, reset) => (
          <ErrorFallback error={error} errorInfo={errorInfo} reset={reset} />
        )}
      >
          <AppLayout user={user} onSignOut={handleSignOut}>
             <OfflineBanner isOffline={!isOnline} />
             <ReconnectionToast />
             
             {!user && <AuthModal onAuthSuccess={() => {}} />}

             <Suspense fallback={<Loader />}>
               <Routes>
                 <Route path="/" element={<Navigate to="/library" replace />} />
                 <Route path="/library" element={user ? <Library /> : <div className="h-[60vh] flex items-center justify-center text-muted-foreground">Please sign in to view your library</div>} />
                 <Route path="/search" element={<Search />} />
                 <Route path="/manhwa/:id" element={<Details />} />
                 <Route path="/goals" element={user ? <Goals /> : <Navigate to="/" replace />} />
                 <Route path="/account" element={user ? <Account /> : <Navigate to="/" replace />} />
                 <Route path="*" element={<Navigate to="/library" replace />} />
               </Routes>
             </Suspense>

             {/* Session Timeout Warning */}
             {sessionWarning && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                  <div className="w-full max-w-md p-6 bg-card border-2 border-yellow-500/50 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h2 className="text-xl font-heading font-bold text-foreground">
                          Session About to Expire
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          You've been inactive for a while. Your session will expire in 5 minutes due to inactivity.
                        </p>
                        <div className="flex gap-3 pt-2">
                          <Button 
                            onClick={extendSession}
                            className="flex-1 font-semibold cursor-pointer"
                          >
                            Stay Logged In
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={handleSignOut}
                            className="flex-1 font-semibold cursor-pointer"
                          >
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
             )}
          </AppLayout>
      </ErrorBoundary>
    </Router>
  );
}
