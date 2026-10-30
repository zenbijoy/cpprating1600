import React from 'react';
import { CheckIcon } from './icons';

interface CircularProgressRingProps {
  currentMinutes: number;
  goalMinutes: number;
  percent: number;
  clampedPercent: number;
  size?: number;
  strokeWidth?: number;
  showCenterText?: boolean;
  className?: string;
  glow?: boolean;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  currentMinutes,
  goalMinutes,
  percent,
  clampedPercent,
  size = 84,
  strokeWidth = 7,
  showCenterText = true,
  className = '',
  glow = true,
}) => {
  const isGoalMet = currentMinutes >= goalMinutes && goalMinutes > 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Unique IDs for SVG gradient definitions
  const gradientId = `progress-ring-grad-${size}-${strokeWidth}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Daily minutes goal progress: ${currentMinutes} of ${goalMinutes} minutes completed (${percent}%)`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 origin-center"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {isGoalMet ? (
              <>
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </>
            ) : percent >= 50 ? (
              <>
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </>
            )}
          </linearGradient>

          {/* Optional glow filter */}
          {glow && (
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur
                stdDeviation="2.5"
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Ambient Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-800/80 fill-transparent"
        />

        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter={glow ? `url(#glow-${gradientId})` : undefined}
          className="fill-transparent transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Value Content */}
      {showCenterText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
          {isGoalMet ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-emerald-400 font-black text-sm tracking-tight font-mono">
                {currentMinutes}m
              </span>
              <span className="text-[9px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-0.5">
                <CheckIcon size={10} strokeWidth={3} />
                <span>DONE</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-white font-black text-sm tracking-tight font-mono">
                {currentMinutes}m
              </span>
              <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                /{goalMinutes}m
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
