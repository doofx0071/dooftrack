import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Library from './pages/Library';
import Search from './pages/Search';
import Details from './pages/Details';
import Account from './pages/Account';
import Goals from './pages/Goals';
import AuthModal from './components/AuthModal';
import SignOutDialog from './components/SignOutDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorFallback } from './components/ErrorFallback';
import { OfflineBanner, ReconnectionToast } from './components/OfflineBanner';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { LayoutGrid, Search as SearchIcon, Sun, Moon, AlertTriangle, UserCircle, Target } from 'lucide-react';
import { cn, Button } from './components/Common';
import { supabase } from './services/supabase';
import { SessionTimeout } from './utils/sessionTimeout';

// Desktop navigation item
function NavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 px-4 py-2 transition-all duration-300 border-b-2 text-base font-medium cursor-pointer",
        isActive 
          ? "border-primary text-primary bg-secondary/20" 
          : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <Icon className={cn("w-4 h-4", isActive && "fill-current")} />
      <span>{label}</span>
    </Link>
  );
}

// Mobile bottom navigation item
function MobileNavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 px-4 transition-all duration-300 cursor-pointer",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    // Sync with initial HTML state
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      className="ml-1 md:ml-2 hover:bg-secondary transition-colors cursor-pointer"
      title="Toggle Theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
}

function Layout({ children, user, onSignOut }: { children?: React.ReactNode, user?: any, onSignOut?: () => void }) {
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    // Sync with initial HTML state
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Desktop Header - hidden on mobile */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/library" className="flex items-center gap-2 tracking-tight group cursor-pointer">
             <img 
               src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
               alt="doofTrack Logo" 
               className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
             />
             <span className="font-heading font-bold text-xl tracking-tighter">dooF<span className="text-primary">-_-</span>Track</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 h-full">
              <NavItem to="/library" icon={LayoutGrid} label="Library" />
              <NavItem to="/search" icon={SearchIcon} label="Browse" />
              <NavItem to="/goals" icon={Target} label="Goals" />
              <NavItem to="/account" icon={UserCircle} label="Account" />
            </nav>
            <div className="h-6 w-px bg-border/50"></div>
            <ThemeToggle />
            {user && onSignOut && <SignOutDialog onConfirm={onSignOut} />}
          </div>
        </div>
      </header>

      {/* Mobile Header - only logo */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center">
          <Link to="/library" className="flex items-center gap-2 tracking-tight group cursor-pointer">
            <img 
              src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
              alt="doofTrack Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="font-heading font-bold text-lg tracking-tighter">dooF<span className="text-primary">-_-</span>Track</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Desktop Footer - hidden on mobile */}
      <footer className="hidden md:block border-t border-border/40 mt-auto">
        <div className="container mx-auto px-4 flex items-center justify-between h-16 text-sm text-muted-foreground">
           <p className="font-heading font-medium">dooF<span className="text-primary">-_-</span>Track</p>
           <p className="text-xs">
             Powered by{' '}
             <a 
               href="https://api.mangadex.org/docs/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-primary hover:underline transition-colors cursor-pointer"
             >
               MangaDex API
             </a>
           </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around h-16">
          <MobileNavItem to="/library" icon={LayoutGrid} label="Library" />
          <MobileNavItem to="/search" icon={SearchIcon} label="Browse" />
          <MobileNavItem to="/goals" icon={Target} label="Goals" />
          <MobileNavItem to="/account" icon={UserCircle} label="Account" />
        </div>
      </nav>
    </div>
  );
}

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
            // Warning: 5 minutes until auto-logout
            setSessionWarning(true);
          },
          () => {
            // Timeout: auto-logout inactive user
            handleSignOut();
          }
        );
      } else if (!newUser && sessionTimeoutRef.current) {
        // Cleanup on logout
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
    // Cleanup session timeout
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
    <>
      {!user && <AuthModal onAuthSuccess={() => {}} />}
      
      {/* Offline Banner */}
      <OfflineBanner isOffline={!isOnline} />
      <ReconnectionToast />
      
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
                    Sign Out Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ErrorBoundary 
        fallback={(error, errorInfo, reset) => (
          <ErrorFallback error={error} errorInfo={errorInfo} reset={reset} />
        )}
      >
        <Router>
          <Layout user={user} onSignOut={handleSignOut}>
            <Routes>
              <Route path="/" element={<Library />} />
              <Route path="/library" element={<Library />} />
              <Route path="/search" element={<Search />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/manhwa/:id" element={<Details />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </Layout>
        </Router>
      </ErrorBoundary>
    </>
  );
}
