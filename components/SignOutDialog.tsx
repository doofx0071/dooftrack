import React, { useState } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Button } from './Common';

interface SignOutDialogProps {
  onConfirm: () => void;
}

export default function SignOutDialog({ onConfirm }: SignOutDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="ml-1 md:ml-2 hover:bg-secondary transition-colors cursor-pointer"
        title="Sign Out"
      >
        <LogOut className="w-5 h-5" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="fixed left-1/2 top-32 -translate-x-1/2 z-[101] w-full max-w-md p-6 bg-card border border-border shadow-2xl mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                  Sign Out?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to sign out? You'll need to log in again to access your library.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                className="gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
