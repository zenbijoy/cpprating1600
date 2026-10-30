import React from 'react';
import {
  AISparkleIcon as Sparkles,
  TrophyIcon as Trophy,
  CheckIcon as Check,
  ForwardIcon as ArrowRight,
} from '../icons';
import { ClimbBadge, BadgeId } from './Badges';

export interface VisualFeedbackProps {
  className?: string;
  size?: number | string;
  label?: string;
}

// 1. Loading Animation: Rocket Blastoff into Orbit
export const RocketLoading: React.FC<VisualFeedbackProps> = ({
  className = '',
  size = 140,
  label = 'Launching test runner...',
}) => (
  <div className={`flex flex-col items-center justify-center p-4 text-center ${className}`}>
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="select-none animate-levitate"
      >
        <defs>
          <linearGradient id="orbitGrad" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="rocketBodyGrad" x1="60" y1="30" x2="110" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="flameGrad" x1="60" y1="100" x2="40" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="rocketGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Orbit Ring */}
        <ellipse
          cx="80"
          cy="80"
          rx="68"
          ry="30"
          transform="rotate(-25 80 80)"
          stroke="url(#orbitGrad)"
          strokeWidth="2"
          strokeDasharray="6 8"
          opacity="0.6"
        />

        {/* Rocket Thruster Smoke & Fire */}
        <path
          d="M62 96L44 122C42 126 48 130 52 126L70 102Z"
          fill="url(#flameGrad)"
          filter="url(#rocketGlow)"
        />
        <circle cx="48" cy="126" r="4" fill="#38bdf8" opacity="0.8" />
        <circle cx="36" cy="136" r="3" fill="#ec4899" opacity="0.6" />

        {/* Rocket Wings */}
        <polygon points="56,80 42,98 62,96" fill="#0284c7" />
        <polygon points="84,52 102,66 88,72" fill="#0284c7" />

        {/* Rocket Main Hull */}
        <path
          d="M98 32C86 36 64 62 60 88L78 100C96 90 114 62 110 44L98 32Z"
          fill="url(#rocketBodyGrad)"
          stroke="#38bdf8"
          strokeWidth="1.5"
        />

        {/* Porthole Window */}
        <circle cx="85" cy="62" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="83" cy="60" r="2.5" fill="#ffffff" />
      </svg>
    </div>
    {label && (
      <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-cyan-400 animate-pulse">
        {label}
      </span>
    )}
  </div>
);

// 2. Processing Spinner: Circular Neon Particle Spinner
export const NeonProcessingSpinner: React.FC<VisualFeedbackProps> = ({
  className = '',
  size = 56,
}) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none animate-spin"
      style={{ animationDuration: '1.2s' }}
    >
      <defs>
        <linearGradient id="spinGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="38"
        stroke="url(#spinGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="50" cy="12" r="5" fill="#facc15" filter="drop-shadow(0 0 6px #facc15)" />
    </svg>
  </div>
);

// 3. Goal Complete: Bullseye Target with Radiant Bursts
export const GoalCompleteTarget: React.FC<VisualFeedbackProps & { label?: string }> = ({
  className = '',
  size = 140,
  label = 'Goal Accomplished!',
}) => (
  <div className={`flex flex-col items-center justify-center p-4 text-center ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      <defs>
        <radialGradient id="targetGrad" cx="80" cy="80" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0b0f19" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="70" fill="url(#targetGrad)" />
      {/* Target Concentric Rings */}
      <circle cx="80" cy="80" r="60" stroke="#06b6d4" strokeWidth="3" opacity="0.4" strokeDasharray="6 4" />
      <circle cx="80" cy="80" r="42" stroke="#6366f1" strokeWidth="4" opacity="0.7" />
      <circle cx="80" cy="80" r="24" stroke="#ec4899" strokeWidth="5" />
      <circle cx="80" cy="80" r="10" fill="#facc15" />
      {/* Arrow Hitting Bullseye */}
      <g transform="translate(80, 80) rotate(-35) translate(-80, -80)">
        <line x1="20" y1="80" x2="80" y2="80" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <polygon points="76,74 86,80 76,86" fill="#facc15" />
        <path d="M22 72L14 80L22 88" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
    {label && (
      <span className="mt-2 text-sm font-bold text-amber-300 tracking-wide">
        {label}
      </span>
    )}
  </div>
);

// 4. Achievement Unlock Celebration Modal / Popup
export interface AchievementUnlockModalProps {
  badgeId: BadgeId;
  title: string;
  description: string;
  tier: string;
  onClose: () => void;
}

export const AchievementUnlockCelebration: React.FC<AchievementUnlockModalProps> = ({
  badgeId,
  title,
  description,
  tier,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
    <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-[#13112c] to-slate-950 p-6 text-center border border-violet-500/30 shadow-2xl shadow-indigo-500/20">
      {/* Ambient Sparkles */}
      <div className="absolute top-4 left-6 text-yellow-400 animate-pulse">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="absolute top-6 right-6 text-cyan-400 animate-pulse">
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Pill Header */}
      <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 px-3.5 py-1 border border-amber-400/30 text-xs font-extrabold uppercase tracking-widest text-amber-300">
        <Trophy className="w-3.5 h-3.5" />
        Achievement Unlocked!
      </div>

      {/* Badge Presentation with Glowing Ring */}
      <div className="my-5 flex justify-center">
        <div className="relative flex items-center justify-center p-3 rounded-2xl bg-slate-950/60 border border-white/10 glow-purple">
          <ClimbBadge id={badgeId} size={96} showGlow={true} />
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
      <div className="mt-1 inline-block rounded-md bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-bold text-violet-300 uppercase tracking-wider">
        {tier} Tier
      </div>
      <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">{description}</p>

      {/* Action Button */}
      <button
        onClick={onClose}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95"
      >
        <Check className="w-4 h-4" />
        Claim & Keep Climbing
      </button>
    </div>
  </div>
);
