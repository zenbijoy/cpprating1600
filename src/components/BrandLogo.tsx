import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Original mountain/bracket upward climbing motif */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 ${iconSizes[size]}`}>
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4/5 h-4/5 text-cyan-400"
          >
            {/* Left bracket */}
            <path d="M7 5L3 12L7 19" stroke="url(#bracketGrad)" />
            {/* Upward climbing stepped arrows / mountain ridge */}
            <path d="M10 16L13 11L16 13L21 6" stroke="#818CF8" />
            <path d="M18 6H21V9" stroke="#38BDF8" />
            <defs>
              <linearGradient id="bracketGrad" x1="3" y1="5" x2="7" y2="19" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-white ${textSizes[size]}`}>
            CLIMB
          </span>
          <span className={`font-extrabold tracking-tight text-cyan-400 ${textSizes[size]}`}>
            1600
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase mt-0.5">
            From Zero to Strong Problem Solver
          </span>
        )}
      </div>
    </div>
  );
};
