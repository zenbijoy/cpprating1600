import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  LockIcon,
  ShieldIcon,
  AISparkleIcon,
  ErrorStatusIcon,
  SuccessStatusIcon,
  CloseIcon,
  GoogleIntegrationIcon,
  ChevronRightIcon,
} from './icons';
import { BrandLogo } from './BrandLogo';
import { authService } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  initialMode?: 'signin' | 'guest_upgrade';
  guestAttemptCount?: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onContinueAsGuest,
  initialMode = 'signin',
  guestAttemptCount = 0,
}) => {
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('email');
  const [isSignUp, setIsSignUp] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parse error parameters if redirected back with OAuth error
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const urlParams = new URLSearchParams(window.location.search);
      const errDesc = hashParams.get('error_description') || urlParams.get('error_description');
      const errCode = hashParams.get('error_code') || urlParams.get('error_code');

      if (errDesc || errCode) {
        if (errDesc?.includes('provider is not enabled') || errCode === 'validation_failed') {
          setError(
            'Google Sign-In is not enabled yet in your Supabase backend. Please use Email Sign-Up below or enable Google in your Supabase dashboard.'
          );
        } else {
          setError(errDesc || 'Authentication failed. Please try again.');
        }
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error: signInError } = await authService.signInWithGoogle();
      if (signInError) {
        if (
          signInError.message?.toLowerCase().includes('not enabled') ||
          signInError.message?.toLowerCase().includes('unsupported provider')
        ) {
          setError(
            'Google Sign-In is not yet enabled in your Supabase dashboard. You can sign up with Email & Password below in seconds!'
          );
          setAuthMethod('email');
        } else {
          setError(signInError.message || 'Failed to initialize Google Sign-In.');
        }
        setLoading(false);
      }
      // Browser will redirect to Google OAuth
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign-in.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { user, session, error: signUpError } = await authService.signUpWithEmail(
          trimmedEmail,
          password,
          displayName.trim() || undefined
        );
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (session) {
          setSuccessMsg('Account created successfully! Welcome to CLIMB 1600.');
          setTimeout(() => {
            onClose();
          }, 1000);
        } else if (user) {
          setSuccessMsg('Account registered! You can now sign in.');
          setIsSignUp(false);
          setLoading(false);
        }
      } else {
        const { session, error: signInError } = await authService.signInWithEmail(
          trimmedEmail,
          password
        );
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        if (session) {
          setSuccessMsg('Signed in successfully! Loading your dashboard...');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 safe-area-overlay">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <CloseIcon size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {initialMode === 'guest_upgrade' ? 'Preserve Your Progress' : 'Welcome to CLIMB 1600'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {initialMode === 'guest_upgrade'
              ? `You have ${guestAttemptCount} practice action(s) stored locally. Sign in to synchronize your practice history to the cloud.`
              : 'Master competitive programming algorithms and climb to Codeforces Specialist (1600).'}
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 text-xs animate-in fade-in">
            <SuccessStatusIcon size={16} semantic="success" className="shrink-0 mt-0.5" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
            <ErrorStatusIcon size={16} semantic="error" className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Authentication Notice</p>
              <p className="text-slate-300">{error}</p>
            </div>
          </div>
        )}

        {/* Auth Method Selector (Tabs) */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'email' && isSignUp
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'email' && !isSignUp
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Email Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              authMethod === 'google'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google
          </button>
        </div>

        {/* EMAIL & PASSWORD FORM */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <UserIcon size={16} className="text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Tourist"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <UserIcon size={16} className="text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <LockIcon size={16} className="text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-60 cursor-pointer mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Free Account' : 'Sign In with Email'}</span>
                  <ChevronRightIcon size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* GOOGLE SIGN-IN TAB */}
        {authMethod === 'google' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Connecting to Google...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Requires Google OAuth to be enabled in your Supabase project dashboard.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            or
          </span>
        </div>

        {/* Guest Practice Button */}
        <button
          type="button"
          onClick={onContinueAsGuest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 font-medium text-xs transition-all cursor-pointer"
        >
          <UserIcon size={14} semantic="primary" />
          <span>Explore Practice as Guest</span>
        </button>

        {/* Guest limitations callout */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldIcon size={14} semantic="primary" />
            <span>Account Benefits</span>
          </div>
          <ul className="space-y-1 list-disc pl-4 text-slate-400">
            <li>
              <strong className="text-slate-300">Free Account:</strong> Cloud synchronization, verified Codeforces rating, and multi-device access.
            </li>
            <li>
              <strong className="text-slate-300">Guest Mode:</strong> Solve problems offline/locally in this browser without an account.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
