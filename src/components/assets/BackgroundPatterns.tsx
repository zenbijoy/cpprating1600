import React from 'react';

export interface PatternProps {
  className?: string;
  opacity?: number;
}

// 1. Tech Grid Pattern: Glowing matrix with circuit nodes
export const TechGridPattern: React.FC<PatternProps> = ({
  className = '',
  opacity = 0.15,
}) => (
  <svg
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none ${className}`}
    style={{ opacity }}
  >
    <defs>
      <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="40" cy="0" r="1.5" fill="#06b6d4" />
        <circle cx="0" cy="40" r="1.5" fill="#ec4899" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#techGrid)" />
  </svg>
);

// 2. Wave Pattern: Smooth flowing neon curves
export const WavePattern: React.FC<PatternProps> = ({
  className = '',
  opacity = 0.12,
}) => (
  <svg
    viewBox="0 0 1000 300"
    preserveAspectRatio="none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none ${className}`}
    style={{ opacity }}
  >
    <defs>
      <linearGradient id="waveGrad1" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="waveGrad2" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <path
      d="M0 120C200 40 400 200 600 100C800 0 900 160 1000 80V300H0V120Z"
      fill="url(#waveGrad1)"
    />
    <path
      d="M0 180C250 100 450 250 700 150C850 80 950 220 1000 160V300H0V180Z"
      fill="url(#waveGrad2)"
      opacity="0.6"
    />
  </svg>
);

// 3. Stars / Cosmic Dust Pattern
export const StarsPattern: React.FC<PatternProps> = ({
  className = '',
  opacity = 0.35,
}) => (
  <svg
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none ${className}`}
    style={{ opacity }}
  >
    <defs>
      <pattern id="starDust" width="120" height="120" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="30" r="1.2" fill="#ffffff" />
        <circle cx="85" cy="15" r="1.5" fill="#38bdf8" />
        <circle cx="110" cy="70" r="1" fill="#f472b6" />
        <circle cx="45" cy="95" r="1.4" fill="#ffffff" />
        <circle cx="70" cy="65" r="2" fill="#facc15" opacity="0.8" />
        <circle cx="15" cy="80" r="0.8" fill="#a5f3fc" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#starDust)" />
  </svg>
);
