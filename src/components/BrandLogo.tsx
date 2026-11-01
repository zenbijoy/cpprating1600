import React from 'react';

export interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  variant?: 'full' | 'compact' | 'monochrome' | 'icon-only';
  animated?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
  variant = 'full',
  animated = true,
}) => {
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const taglineSizes = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-xs',
  };

  const isMono = variant === 'monochrome';

  // Authentic Geometric Mountain & "C" Symbol
  const mountainIcon = (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl ${
        isMono
          ? 'bg-current text-current'
          : 'bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-purple-600/30 p-[1px] shadow-md shadow-blue-500/10'
      } ${iconSizes[size]} ${animated ? 'transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/20' : ''}`}
    >
      <div
        className={`flex h-full w-full items-center justify-center rounded-[11px] ${
          isMono ? 'bg-transparent text-current' : 'bg-slate-950/80 backdrop-blur-md'
        } p-1`}
      >
        <svg
          viewBox="90 160 830 510"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="blLeftGrad" x1="116" y1="646" x2="526" y2="334" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00C0FF" />
              <stop offset="50%" stopColor="#007CF0" />
              <stop offset="100%" stopColor="#0051FF" />
            </linearGradient>
            <linearGradient id="blRightGrad" x1="479" y1="418" x2="892" y2="646" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0051FF" />
              <stop offset="45%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <filter id="blGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left Stylized 'C' Emblem */}
          <path
            d="M526 334H334L116 646H444L494 575H268L380 405H479L526 334Z"
            fill={isMono ? 'currentColor' : 'url(#blLeftGrad)'}
          />

          {/* Right Mountain Peak with Inward Step */}
          <path
            d="M667 191L817 410H715L667 320L524 570H729L684 492H786L892 646H479L667 191Z"
            fill={isMono ? 'currentColor' : 'url(#blRightGrad)'}
            opacity={isMono ? 0.9 : 1}
          />
        </svg>
      </div>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{mountainIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {mountainIcon}

      {variant !== 'compact' && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${
                isMono ? 'text-current' : 'text-slate-950 dark:text-white'
              } ${textSizes[size]}`}
            >
              CLIMB
            </span>
            <span
              className={`font-black tracking-tight ${
                isMono
                  ? 'text-current opacity-90'
                  : 'bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 bg-clip-text text-transparent'
              } ${textSizes[size]}`}
            >
              1600
            </span>
          </div>
          {showTagline && (
            <span
              className={`font-bold tracking-wider uppercase mt-1 ${
                isMono ? 'text-current opacity-70' : 'text-slate-600 dark:text-slate-400'
              } ${taglineSizes[size]}`}
            >
              Build Better. Code Smarter. Reach 1600.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
