import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Button } from './Common';
import { Lock, Mail, User, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onAuthSuccess: () => void;
}

export default function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login - support both email and username
        let loginEmail = email;
        
        // Check if input is username (doesn't contain @)
        if (!email.includes('@')) {
          // Call database function to get email from username
          const { data, error: queryError } = await supabase
            .rpc('get_email_from_username', { input_username: email.trim() });

          // Use generic error message to prevent username enumeration
          if (queryError || !data) {
            throw new Error('Invalid credentials');
          }
          
          loginEmail = data;
        }

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (loginError) throw loginError;
        
        if (data.user) {
          onAuthSuccess();
        }
      } else {
        // Register
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Check if email confirmation is required
          if (data.user.confirmed_at) {
            onAuthSuccess();
          } else {
            setError('Please check your email to confirm your account.');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md p-6 md:p-8 bg-card border border-border/50 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 border border-primary/20 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Sign in to continue to doofTrack' : 'Start tracking your manhwa collection'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username (Register only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="johndoe"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          {/* Email or Username (Login) / Email (Register) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              {isLogin ? <User className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
              {isLogin ? 'Email or Username' : 'Email'}
            </label>
            <input
              type={isLogin ? "text" : "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder={isLogin ? "username or email" : "you@example.com"}
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={loading}
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground">Minimum 8 characters (mix of letters and numbers recommended)</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-3 font-bold tracking-wide"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            disabled={loading}
          >
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <span className="font-semibold text-primary">Sign up</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span className="font-semibold text-primary">Sign in</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
