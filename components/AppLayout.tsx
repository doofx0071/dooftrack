import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Search as SearchIcon, UserCircle, Target } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import SignOutDialog from './SignOutDialog';
import { cn } from './Common';

// Desktop navigation item
export function NavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 px-4 py-2 transition-all duration-300 border-b-2 text-base font-medium cursor-pointer rounded-t",
        isActive 
          ? "border-primary text-primary bg-primary/10" 
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
      <span>{label}</span>
    </Link>
  );
}

// Mobile bottom navigation item
export function MobileNavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
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
      <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

export function AppLayout({ children, user, onSignOut }: { children?: React.ReactNode, user?: any, onSignOut?: () => void }) {
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
               src={isDark ? "/logo/dark-mode.svg" : "/logo/light-mode-transparent.svg"} 
               alt="doofTrack Logo" 
               className="h-10 w-10 object-contain group-hover:scale-105 transition-transform duration-300"
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
              src={isDark ? "/logo/dark-mode.svg" : "/logo/light-mode-transparent.svg"} 
              alt="doofTrack Logo" 
              className="h-8 w-8 object-contain"
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
