import React, { useState, useEffect } from 'react';
import {
  CloseIcon,
  ShieldIcon,
  WarningStatusIcon,
  SearchIcon,
  TimerIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ZapIcon,
  RefreshCwIcon,
} from './icons';
import { authService, UserCfAccount } from '../services/supabase';
import { codeforcesService, convertCfSubmissionsToAttempts } from '../services/codeforces';
import { storageService } from '../services/storage';
import { CF_HANDLE_REGEX } from '../utils/codeforcesValidation';
import { ProblemAttempt } from '../types';

interface CodeforcesVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (account: Partial<UserCfAccount>, attempts?: ProblemAttempt[]) => void;
  onSkip?: () => void;
  initialHandle?: string;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
}

export const CodeforcesVerificationModal: React.FC<CodeforcesVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  onSkip,
  initialHandle = '',
  isAuthenticated = false,
  onOpenAuthModal,
}) => {
  const [handleInput, setHandleInput] = useState<string>(initialHandle);
  const [step, setStep] = useState<'input' | 'challenge' | 'success'>('input');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('Connecting...');
  const [error, setError] = useState<string | null>(null);

  // Challenge details
  const [challengeId, setChallengeId] = useState<string>('');
  const [challengeCode, setChallengeCode] = useState<string>('');
  const [targetHandle, setTargetHandle] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(900); // 15 mins default
  const [copied, setCopied] = useState<boolean>(false);

  // Success details
  const [verifiedDetails, setVerifiedDetails] = useState<{
    handle: string;
    rating?: number;
    rank?: string;
    avatar?: string;
    submissionCount?: number;
  } | null>(null);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      if (initialHandle) setHandleInput(initialHandle);
      setError(null);
      setStep('input');
    }
  }, [isOpen, initialHandle]);

  // Countdown timer for challenge expiry
  useEffect(() => {
    if (step !== 'challenge' || !expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) {
        clearInterval(interval);
        setError('Verification challenge has expired. Please initiate a new code.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, expiresAt]);

  if (!isOpen) return null;

  const validateHandle = (handle: string): string | null => {
    const trimmed = handle.trim();
    if (!trimmed) {
      return 'Please enter a Codeforces handle.';
    }
    if (trimmed.length < 3 || trimmed.length > 24) {
      return 'Codeforces handle must be between 3 and 24 characters.';
    }
    if (!CF_HANDLE_REGEX.test(trimmed)) {
      return 'Codeforces handle may only contain letters, digits, underscores, hyphens, and dots.';
    }
    return null;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(challengeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Instant Connect & Sync live telemetry
  const handleInstantConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = handleInput.trim();
    const validationError = validateHandle(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setLoadingText('Connecting to Codeforces API...');
    setError(null);

    try {
      // 1. Fetch live profile info
      const userInfo = await codeforcesService.getUserInfo(trimmed);
      setLoadingText(`Found ${userInfo.handle} (${userInfo.rank || 'Unrated'}). Fetching submissions...`);

      // 2. Fetch live submissions
      const submissions = await codeforcesService.getUserSubmissions(trimmed, 500).catch(() => []);
      const liveAttempts = convertCfSubmissionsToAttempts(submissions);

      // 3. Persist attempts
      if (liveAttempts.length > 0) {
        storageService.saveAttempts(liveAttempts);
      }

      // 4. Update profile in storage
      const currentProfile = storageService.getProfile();
      const updatedProfile = {
        ...currentProfile,
        cfHandle: userInfo.handle,
        verifiedCfRating: userInfo.rating,
        maxCfRating: userInfo.maxRating,
        rank: userInfo.rank,
        avatar: userInfo.avatar || currentProfile.avatar,
      };
      storageService.saveProfile(updatedProfile);

      const verifiedObj: Partial<UserCfAccount> = {
        cf_handle: userInfo.handle,
        normalized_handle: userInfo.handle.toLowerCase(),
        verification_status: 'verified',
        cf_rating: userInfo.rating,
        cf_rank: userInfo.rank,
        cf_avatar: userInfo.avatar,
        verified_at: new Date().toISOString(),
      };

      setVerifiedDetails({
        handle: userInfo.handle,
        rating: userInfo.rating,
        rank: userInfo.rank,
        avatar: userInfo.avatar,
        submissionCount: submissions.length,
      });

      onVerified(verifiedObj, liveAttempts);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user from Codeforces. Please verify your handle.');
    } finally {
      setLoading(false);
    }
  };

  // Cryptographic token challenge for cloud accounts
  const handleInitiateTokenChallenge = async () => {
    const trimmed = handleInput.trim();
    const validationError = validateHandle(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isAuthenticated) {
      setError('You must be signed in to generate an official Codeforces verification token. Please sign in or use "Connect & Sync Live Data" for guest practice.');
      return;
    }

    setLoading(true);
    setLoadingText('Generating cryptographic token challenge...');
    setError(null);

    try {
      const res = await authService.initiateCfVerification(trimmed);
      setChallengeId(res.challengeId);
      setChallengeCode(res.challengeCode);
      setTargetHandle(res.handle);
      setExpiresAt(res.expiresAt);
      setRemainingSeconds(Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000)));
      setStep('challenge');
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('signed in'))) {
        setError('You must be signed in to verify Codeforces account ownership. Please sign in or click "Connect & Sync Live Data" to link your handle directly.');
      } else {
        setError(err.message || 'Failed to initiate verification with Codeforces.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmToken = async () => {
    if (!challengeId) return;
    setLoading(true);
    setLoadingText('Verifying token on Codeforces...');
    setError(null);

    try {
      const res = await authService.confirmCfVerification(challengeId);
      if (res.verified) {
        // Fetch live submissions
        const submissions = await codeforcesService.getUserSubmissions(res.handle, 500).catch(() => []);
        const liveAttempts = convertCfSubmissionsToAttempts(submissions);
        if (liveAttempts.length > 0) {
          storageService.saveAttempts(liveAttempts);
        }

        const currentProfile = storageService.getProfile();
        const updatedProfile = {
          ...currentProfile,
          cfHandle: res.handle,
          verifiedCfRating: res.rating,
          maxCfRating: res.rating,
          rank: res.rank,
          avatar: res.avatar || currentProfile.avatar,
        };
        storageService.saveProfile(updatedProfile);

        const verifiedObj: Partial<UserCfAccount> = {
          cf_handle: res.handle,
          normalized_handle: res.handle.toLowerCase(),
          verification_status: 'verified',
          cf_rating: res.rating,
          cf_rank: res.rank,
          cf_avatar: res.avatar,
          verified_at: new Date().toISOString(),
        };

        setVerifiedDetails({
          handle: res.handle,
          rating: res.rating,
          rank: res.rank,
          avatar: res.avatar,
          submissionCount: submissions.length,
        });

        onVerified(verifiedObj, liveAttempts);
        setStep('success');
      }
    } catch (err: any) {
      setError(err.message || 'Verification check failed. Please ensure the token is saved on Codeforces.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 safe-area-overlay">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <CloseIcon size={20} />
        </button>

        {/* STEP 1: Enter Handle */}
        {step === 'input' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldIcon size={20} semantic="primary" />
                <h3 className="text-xl font-bold text-white">Connect Codeforces Account</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your real Codeforces profile to synchronize your rating, submissions, solve streaks, and 1600-climb metrics in real time.
              </p>
            </div>

            {!isAuthenticated && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-900/50 bg-indigo-950/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-white">Guest Mode:</strong> Connect instantly without password, or sign in to verify ownership.
                  </span>
                </div>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer shrink-0 ml-2"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 space-y-2">
                <div className="flex items-start gap-2.5">
                  <WarningStatusIcon size={16} className="shrink-0 mt-0.5 text-rose-400" />
                  <div className="space-y-1">
                    <p className="font-semibold text-rose-200">
                      {error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized')
                        ? 'Sign-In Required for Token Verification'
                        : 'Notice'}
                    </p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{error}</p>
                  </div>
                </div>
                {(error.toLowerCase().includes('sign in') || error.toLowerCase().includes('unauthorized')) && onOpenAuthModal && (
                  <div className="flex items-center gap-2 pt-1 pl-6">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Sign In to Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInstantConnect()}
                      disabled={loading || !handleInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors cursor-pointer"
                    >
                      Connect in Guest Mode
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleInstantConnect} className="space-y-4">
              <div>
                <label htmlFor="cfHandleModalInput" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Codeforces Handle
                </label>
                <div className="relative">
                  <input
                    id="cfHandleModalInput"
                    type="text"
                    placeholder="e.g. Zen_BijoySaha, tourist, Petr"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Must be an active public Codeforces handle. No password needed.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Primary: 1-Click Instant Connect & Live Sync */}
                <button
                  type="submit"
                  disabled={loading || !handleInput.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  {loading && !loadingText.includes('token') ? (
                    <span className="flex items-center gap-2">
                      <RefreshCwIcon size={16} className="animate-spin" />
                      <span>{loadingText}</span>
                    </span>
                  ) : (
                    <>
                      <ZapIcon size={16} className="text-amber-300" />
                      <span>Connect &amp; Sync Live Data</span>
                    </>
                  )}
                </button>

                {/* Secondary: Cryptographic Token Challenge */}
                <button
                  type="button"
                  onClick={handleInitiateTokenChallenge}
                  disabled={loading || !handleInput.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white px-4 py-2.5 text-xs font-medium transition-all cursor-pointer"
                >
                  {loading && loadingText.includes('token') ? (
                    <span className="flex items-center gap-2">
                      <RefreshCwIcon size={14} className="animate-spin text-indigo-400" />
                      <span>{loadingText}</span>
                    </span>
                  ) : (
                    <>
                      <ShieldIcon size={14} className="text-indigo-400" />
                      <span>
                        {isAuthenticated
                          ? 'Generate Ownership Token (Verified Owner Badge)'
                          : 'Verify with Profile Token (Requires Sign-In)'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                {onSkip ? (
                  <button
                    type="button"
                    onClick={onSkip}
                    disabled={loading}
                    className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 cursor-pointer"
                  >
                    Skip for Now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Challenge Code & Verification Instructions */}
        {step === 'challenge' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Ownership Verification
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  <TimerIcon size={14} />
                  <span>Expires in {formatTimer(remainingSeconds)}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                Verify Handle: <span className="text-cyan-400 font-mono">{targetHandle}</span>
              </h3>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
                <WarningStatusIcon size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Verification Check Notice</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Challenge Token Display Card */}
            <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/40 p-4 space-y-2">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                Your Single-Use Verification Token
              </span>
              <div className="flex items-center justify-between gap-3 bg-slate-950 border border-indigo-700/50 rounded-xl p-3">
                <code className="text-lg font-mono font-bold tracking-wider text-amber-300">
                  {challengeCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckIcon size={14} className="text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={14} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Verification Instructions */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5 text-xs text-slate-300">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <span>Follow these 3 quick steps:</span>
              </h4>
              <ol className="space-y-2 list-decimal pl-4 text-slate-300">
                <li>
                  Open your Codeforces profile settings:{' '}
                  <a
                    href="https://codeforces.com/settings/social"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-1 font-semibold"
                  >
                    <span>codeforces.com/settings/social</span>
                    <ExternalLinkIcon size={12} />
                  </a>
                </li>
                <li>
                  Temporarily paste <code className="text-amber-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">{challengeCode}</code> into your{' '}
                  <strong className="text-white">First Name</strong>, <strong className="text-white">Last Name</strong>, or <strong className="text-white">Organization</strong> field.
                </li>
                <li>
                  Click the blue <strong className="text-white">"Save changes"</strong> button on Codeforces, then return here.
                </li>
              </ol>
              <p className="text-[11px] text-slate-500 italic pt-1">
                Note: Once verified, you may immediately revert your Codeforces name or organization back to normal.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setError(null);
                }}
                disabled={loading}
                className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 cursor-pointer"
              >
                Change Handle
              </button>

              <button
                type="button"
                onClick={handleConfirmToken}
                disabled={loading || remainingSeconds <= 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Checking Codeforces...
                  </span>
                ) : (
                  <>
                    <CheckCircleIcon size={16} />
                    <span>Verify Ownership Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Verification Success */}
        {step === 'success' && verifiedDetails && (
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-950/70 border border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircleIcon size={40} semantic="success" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white">Codeforces Connected!</h3>
              <p className="text-xs text-slate-400">
                Live Codeforces telemetry synchronized. Your rating, rank, and {verifiedDetails.submissionCount || 0} submissions are now live.
              </p>
            </div>

            {/* Verified Profile Card */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/80 text-left">
              <div className="flex items-center gap-3">
                {verifiedDetails.avatar ? (
                  <img
                    src={verifiedDetails.avatar}
                    alt={verifiedDetails.handle}
                    className="w-11 h-11 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center font-bold text-indigo-300">
                    {verifiedDetails.handle[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-base">{verifiedDetails.handle}</span>
                    <span className="rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                      Connected
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {verifiedDetails.rank || 'Unrated'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-mono font-bold text-cyan-400">
                  {verifiedDetails.rating ? verifiedDetails.rating : '—'}
                </span>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">CF Rating</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Explore Live Telemetry Dashboard</span>
              <ChevronRightIcon size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
