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
} from './icons';
import { authService, UserCfAccount } from '../services/supabase';
import { CF_HANDLE_REGEX } from '../utils/codeforcesValidation';

interface CodeforcesVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (account: Partial<UserCfAccount>) => void;
  onSkip?: () => void;
  initialHandle?: string;
}

export const CodeforcesVerificationModal: React.FC<CodeforcesVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  onSkip,
  initialHandle = '',
}) => {
  const [handleInput, setHandleInput] = useState<string>(initialHandle);
  const [step, setStep] = useState<'input' | 'challenge' | 'success'>('input');
  const [loading, setLoading] = useState<boolean>(false);
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
  } | null>(null);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      if (initialHandle) setHandleInput(initialHandle);
      setError(null);
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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(challengeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleInitiate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = handleInput.trim();

    // Client-side validations
    if (!trimmed) {
      setError('Please enter a Codeforces handle.');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 24) {
      setError('Codeforces handle must be between 3 and 24 characters.');
      return;
    }
    if (!CF_HANDLE_REGEX.test(trimmed)) {
      setError('Codeforces handle may only contain letters, digits, underscores, hyphens, and dots.');
      return;
    }

    setLoading(true);
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
      setError(err.message || 'Failed to initiate verification with Codeforces.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!challengeId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await authService.confirmCfVerification(challengeId);
      if (res.verified) {
        setVerifiedDetails({
          handle: res.handle,
          rating: res.rating,
          rank: res.rank,
          avatar: res.avatar,
        });
        setStep('success');
        onVerified({
          cf_handle: res.handle,
          normalized_handle: res.handle.toLowerCase(),
          verification_status: 'verified',
          cf_rating: res.rating,
          cf_rank: res.rank,
          cf_avatar: res.avatar,
          verified_at: new Date().toISOString(),
        });
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
              <p className="text-xs text-slate-400">
                To prevent impersonation and verify genuine ownership of your competitive programming rating, we use a single-use verification token. No password or session cookies needed.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
                <WarningStatusIcon size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitiate} className="space-y-4">
              <div>
                <label htmlFor="cfHandleModalInput" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Codeforces Handle
                </label>
                <div className="relative">
                  <input
                    id="cfHandleModalInput"
                    type="text"
                    placeholder="e.g. tourist, Petr, or your handle"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Must be an existing public Codeforces profile. Characters: a-z, 0-9, _, -, .
                </p>
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

                <button
                  type="submit"
                  disabled={loading || !handleInput.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-all cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Checking Profile...
                    </span>
                  ) : (
                    <>
                      <SearchIcon size={16} />
                      <span>Generate Verification Code</span>
                    </>
                  )}
                </button>
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
                onClick={handleConfirm}
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
              <h3 className="text-2xl font-bold text-white">Ownership Verified!</h3>
              <p className="text-xs text-slate-400">
                Your Codeforces account is now officially verified and permanently linked.
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
                      Verified
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
              <span>Open Personalized Dashboard</span>
              <ChevronRightIcon size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
