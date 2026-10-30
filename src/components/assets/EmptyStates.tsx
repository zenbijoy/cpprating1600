import React from 'react';
import {
  SearchIcon as Search,
  TrophyIcon as Trophy,
  BookmarkIcon as Bookmark,
  OfflineStatusIcon as WifiOff,
  RefreshIcon as RefreshCw,
} from '../icons';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

// 1. Empty Problems State
export const EmptyProblemsState: React.FC<EmptyStateProps> = ({
  title = 'No Problems Found',
  description = 'Try adjusting your search query, difficulty filters, or tags.',
  actionText,
  actionLabel,
  onAction,
  className = '',
}) => {
  const effectiveAction = actionLabel || actionText || 'Reset Filters';
  return (
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
    <div className="relative mb-5 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-cyan-950 p-1 border border-cyan-500/20 shadow-xl shadow-cyan-500/10">
      <svg viewBox="0 0 100 100" fill="none" className="w-20 h-20 select-none">
        <circle cx="45" cy="45" r="28" stroke="#38bdf8" strokeWidth="4" opacity="0.6" />
        <circle cx="45" cy="45" r="20" fill="#0f172a" />
        {/* Looking glass handle */}
        <path d="M66 66L86 86" stroke="#818cf8" strokeWidth="6" strokeLinecap="round" />
        {/* Floating Code Question */}
        <text x="45" y="52" textAnchor="middle" fill="#38bdf8" fontFamily="system-ui" fontSize="22" fontWeight="bold">?</text>
        {/* Sparkle */}
        <circle cx="28" cy="28" r="2.5" fill="#fef08a" />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
    {effectiveAction && onAction && (
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-500/20 active:scale-95"
      >
        <Search className="w-3.5 h-3.5" />
        {effectiveAction}
      </button>
    )}
  </div>
  );
};

// 2. Empty Contests State
export const EmptyContestsState: React.FC<EmptyStateProps> = ({
  title = 'No Contests Yet',
  description = 'Stay tuned! New competitive rounds and community events will appear here soon.',
  actionText = 'Refresh Feed',
  onAction,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
    <div className="relative mb-5 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-950 via-slate-900 to-purple-950 p-1 border border-amber-500/20 shadow-xl shadow-amber-500/10">
      <svg viewBox="0 0 100 100" fill="none" className="w-20 h-20 select-none">
        <defs>
          <linearGradient id="empTrophy" x1="30" y1="20" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path d="M35 24H65V46C65 56 50 62 50 62C50 62 35 56 35 46V24Z" fill="url(#empTrophy)" />
        <path d="M35 30H24C20 30 20 42 32 42H35" stroke="#facc15" strokeWidth="2.5" fill="none" />
        <path d="M65 30H76C80 30 80 42 68 42H65" stroke="#facc15" strokeWidth="2.5" fill="none" />
        <rect x="46" y="62" width="8" height="12" fill="#ca8a04" />
        <rect x="36" y="74" width="28" height="6" rx="2" fill="#854d0e" />
        <circle cx="50" cy="38" r="4" fill="#fef08a" />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-amber-500/20 active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {actionText}
      </button>
    )}
  </div>
);

// 3. Empty Saved Snippets State
export const EmptySavedState: React.FC<EmptyStateProps> = ({
  title = 'No Saved Snippets',
  description = 'Bookmark your favorite templates, custom algorithms, and solutions for fast offline access.',
  actionText,
  actionLabel,
  onAction,
  className = '',
}) => {
  const effectiveAction = actionLabel || actionText || 'Explore Problem Arena';
  return (
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
    <div className="relative mb-5 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-indigo-950 p-1 border border-cyan-500/20 shadow-xl shadow-cyan-500/10">
      <svg viewBox="0 0 100 100" fill="none" className="w-20 h-20 select-none">
        <rect x="25" y="20" width="50" height="65" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        <rect x="36" y="14" width="28" height="10" rx="3" fill="#06b6d4" />
        <line x1="34" y1="38" x2="66" y2="38" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="48" x2="56" y2="48" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="58" x2="62" y2="58" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
        {/* Bookmark ribbon */}
        <polygon points="56,20 66,20 66,36 61,32 56,36" fill="#facc15" />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
    {effectiveAction && onAction && (
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600/80 hover:bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-cyan-500/20 active:scale-95"
      >
        <Bookmark className="w-3.5 h-3.5" />
        {effectiveAction}
      </button>
    )}
  </div>
  );
};

// 4. Offline Connection State
export const EmptyOfflineState: React.FC<EmptyStateProps> = ({
  title = 'Offline Connection',
  description = 'You are currently disconnected from Codeforces. Cached practice problems and local editor remain functional.',
  actionText = 'Retry Connection',
  onAction,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
    <div className="relative mb-5 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-950 via-slate-900 to-indigo-950 p-1 border border-rose-500/20 shadow-xl shadow-rose-500/10">
      <svg viewBox="0 0 100 100" fill="none" className="w-20 h-20 select-none">
        <path d="M22 36C40 22 60 22 78 36" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
        <path d="M32 48C44 38 56 38 68 48" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
        <path d="M42 60C47 55 53 55 58 60" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="74" r="5" fill="#f43f5e" />
        {/* Red Disconnect Slash */}
        <line x1="20" y1="20" x2="80" y2="80" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-rose-500/20 active:scale-95"
      >
        <WifiOff className="w-3.5 h-3.5" />
        {actionText}
      </button>
    )}
  </div>
);
