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

  // Calculate tip beacon coordinate in non-rotated coordinate space (for the progress head dot)
  // The svg progress circle is rotated -90deg, so angle 0 starts at 12 o'clock
  const angleRad = (clampedPercent / 100) * 2 * Math.PI - Math.PI / 2;
  const tipX = size / 2 + radius * Math.cos(angleRad);
  const tipY = size / 2 + radius * Math.sin(angleRad);

  // Unique IDs for SVG gradient definitions
  const gradientId = `progress-ring-grad-${size}-${strokeWidth}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Daily minutes goal progress: ${currentMinutes} of ${goalMinutes} minutes completed (${percent}%)`}
    >
      {/* Outer ambient decorative rotating radar halo */}
      <svg
        width={size + 14}
        height={size + 14}
        viewBox={`0 0 ${size + 14} ${size + 14}`}
        className="absolute inset-[-7px] pointer-events-none animate-spin-slow opacity-25"
      >
        <circle
          cx={(size + 14) / 2}
          cy={(size + 14) / 2}
          r={radius + 4}
          fill="none"
          stroke={isGoalMet ? '#10b981' : percent >= 50 ? '#06b6d4' : '#6366f1'}
          strokeWidth={1}
          strokeDasharray="3 7"
        />
      </svg>

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
          className="stroke-slate-200/80 dark:stroke-slate-800/80 fill-transparent"
        />

        {/* Animated Progress Circle with fluid transition */}
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
          className="fill-transparent transition-all duration-800 cubic-bezier(0.16, 1, 0.3, 1)"
        />
      </svg>

      {/* Leading Tip Beacon Particle (dynamic glow dot at the progress head) */}
      {clampedPercent > 3 && clampedPercent < 100 && (
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: tipX, top: tipY }}
        >
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                percent >= 50 ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 shadow-sm ${
                percent >= 50 ? 'bg-emerald-300' : 'bg-cyan-300'
              }`}
            />
          </span>
        </div>
      )}

      {/* Center Value Content with dynamic pop and pulse */}
      {showCenterText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
          {isGoalMet ? (
            <div className="flex flex-col items-center justify-center animate-pop-spring">
              <span className="text-emerald-500 dark:text-emerald-400 font-black text-sm tracking-tight font-mono">
                {currentMinutes}m
              </span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5 animate-pulse-subtle">
                <CheckIcon size={10} strokeWidth={3} />
                <span>DONE</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center transition-transform duration-200">
              <span className="text-slate-900 dark:text-white font-black text-sm tracking-tight font-mono">
                {currentMinutes}m
              </span>
              <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                /{goalMinutes}m
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
