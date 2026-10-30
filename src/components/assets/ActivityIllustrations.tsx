import React from 'react';

export interface IllustrationProps {
  className?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
}

// 1. Learning & Study Illustration
export const LearningStudyIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = '100%',
  height = 180,
}) => (
  <svg
    viewBox="0 0 400 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    style={{ width, height }}
  >
    <defs>
      <linearGradient id="learnBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="deskGlow" x1="120" y1="120" x2="280" y2="200" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="lampGrad" x1="320" y1="40" x2="260" y2="180" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Backdrop Card */}
    <rect width="400" height="240" rx="16" fill="url(#learnBg)" />

    {/* Background Grid & Windows */}
    <g opacity="0.15">
      <line x1="40" y1="40" x2="360" y2="40" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="40" y1="80" x2="360" y2="80" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="40" y1="120" x2="360" y2="120" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" />
    </g>

    {/* Algorithm Tree Floating Display */}
    <g transform="translate(60, 45)" opacity="0.85">
      <rect x="0" y="0" width="70" height="50" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.2" />
      <circle cx="35" cy="15" r="4" fill="#38bdf8" />
      <circle cx="20" cy="35" r="3.5" fill="#10b981" />
      <circle cx="50" cy="35" r="3.5" fill="#a855f7" />
      <line x1="35" y1="19" x2="20" y2="32" stroke="#64748b" strokeWidth="1.5" />
      <line x1="35" y1="19" x2="50" y2="32" stroke="#64748b" strokeWidth="1.5" />
    </g>

    {/* Warm Ambient Desk Lamp */}
    <path d="M330 30L300 70H340L330 30Z" fill="#f59e0b" />
    <path d="M330 70V170H340" stroke="#94a3b8" strokeWidth="2.5" />
    <polygon points="300,70 340,70 380,180 240,180" fill="url(#lampGrad)" />

    {/* Desk Surface */}
    <path d="M30 180H370L360 210H40L30 180Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

    {/* Stack of Algorithm Books */}
    <rect x="65" y="162" width="45" height="6" rx="2" fill="#ec4899" />
    <rect x="62" y="168" width="50" height="6" rx="2" fill="#06b6d4" />
    <rect x="60" y="174" width="54" height="6" rx="2" fill="#6366f1" />

    {/* Laptop on Desk */}
    <polygon points="175,178 245,178 250,182 170,182" fill="#94a3b8" />
    <rect x="180" y="132" width="60" height="42" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
    <rect x="184" y="136" width="52" height="34" rx="2" fill="#0284c7" opacity="0.8" />
    {/* Code lines on laptop screen */}
    <line x1="188" y1="144" x2="210" y2="144" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="194" y1="150" x2="226" y2="150" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="194" y1="156" x2="218" y2="156" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="188" y1="162" x2="202" y2="162" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

    {/* Coder Character */}
    <g id="coderStudy" transform="translate(130, 95)">
      {/* Head & Headphone */}
      <circle cx="28" cy="22" r="14" fill="#fcd34d" />
      <path d="M16 16C16 10 24 6 36 10C42 14 40 22 40 22L16 16Z" fill="#1e1b4b" />
      {/* Cyan Headphones */}
      <path d="M14 18C14 8 42 8 42 18" stroke="#06b6d4" strokeWidth="3" fill="none" />
      <rect x="12" y="16" width="5" height="12" rx="2" fill="#06b6d4" />
      <rect x="39" y="16" width="5" height="12" rx="2" fill="#06b6d4" />

      {/* Torso Hoodie */}
      <path d="M10 40C10 32 46 32 46 40L48 85H8L10 40Z" fill="#4f46e5" />
      {/* Arm leaning to type */}
      <path d="M38 52L58 72H72" stroke="#6366f1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Coffee Mug with Steam */}
    <rect x="265" y="164" width="12" height="14" rx="2" fill="#f59e0b" />
    <path d="M277 167C281 167 281 173 277 173" stroke="#f59e0b" strokeWidth="1.5" />
    <path d="M269 158Q272 154 269 150" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// 2. Coding Practice Illustration
export const CodingPracticeIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = '100%',
  height = 180,
}) => (
  <svg
    viewBox="0 0 400 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    style={{ width, height }}
  >
    <defs>
      <linearGradient id="codeBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0b0f19" />
        <stop offset="50%" stopColor="#0d1b33" />
        <stop offset="100%" stopColor="#081426" />
      </linearGradient>
      <linearGradient id="neonCyanPurple" x1="50" y1="50" x2="350" y2="200" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <filter id="codeGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <rect width="400" height="240" rx="16" fill="url(#codeBg)" />

    {/* Floating Terminal Windows */}
    <g id="terminalMain" transform="translate(45, 30)">
      <rect width="310" height="175" rx="10" fill="#111827" stroke="url(#neonCyanPurple)" strokeWidth="1.5" />
      {/* Window Title Bar */}
      <path d="M0 10C0 4.477 4.477 0 10 0H300C305.523 0 310 4.477 310 10V28H0V10Z" fill="#1e293b" />
      <circle cx="16" cy="14" r="4" fill="#ef4444" />
      <circle cx="28" cy="14" r="4" fill="#f59e0b" />
      <circle cx="40" cy="14" r="4" fill="#10b981" />
      <text x="60" y="18" fill="#94a3b8" fontFamily="ui-monospace, monospace" fontSize="10">main.cpp — CLIMB 1600 IDE</text>

      {/* Code Syntax Lines */}
      <g transform="translate(18, 44)" fontFamily="ui-monospace, monospace" fontSize="10">
        <text x="0" y="0" fill="#ec4899">#include &lt;iostream&gt;</text>
        <text x="0" y="16" fill="#ec4899">#include &lt;vector&gt;</text>
        <text x="0" y="32" fill="#38bdf8">using namespace std;</text>
        <text x="0" y="52" fill="#f59e0b">int <tspan fill="#60a5fa">solve</tspan>() &#123;</text>
        <text x="16" y="68" fill="#a7f3d0">int n, k; cin &gt;&gt; n &gt;&gt; k;</text>
        <text x="16" y="84" fill="#c084fc">vector&lt;long long&gt; <tspan fill="#f8fafc">dp(n + 1);</tspan></text>
        <text x="16" y="100" fill="#34d399">// Optimal invariant step</text>
        <text x="16" y="116" fill="#38bdf8">return ans;</text>
        <text x="0" y="132" fill="#f59e0b">&#125;</text>
      </g>
    </g>

    {/* Floating Brackets and Neon Badges */}
    <g filter="url(#codeGlow)">
      <text x="330" y="65" fill="#06b6d4" fontFamily="system-ui" fontSize="32" fontWeight="900" opacity="0.6">&#123;</text>
      <text x="25" y="190" fill="#ec4899" fontFamily="system-ui" fontSize="32" fontWeight="900" opacity="0.6">&#125;</text>
    </g>

    {/* Fast Cursor Pulse */}
    <rect x="180" y="160" width="8" height="14" fill="#38bdf8" className="animate-pulse" />
  </svg>
);

// 3. Contest Arena Illustration
export const ContestArenaIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = '100%',
  height = 180,
}) => (
  <svg
    viewBox="0 0 400 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    style={{ width, height }}
  >
    <defs>
      <linearGradient id="arenaBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#110b24" />
        <stop offset="50%" stopColor="#1e1035" />
        <stop offset="100%" stopColor="#080c18" />
      </linearGradient>
      <linearGradient id="trophyGold" x1="170" y1="40" x2="230" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="timerBorder" x1="140" y1="20" x2="260" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>

    <rect width="400" height="240" rx="16" fill="url(#arenaBg)" />

    {/* Stadium Arena Beams */}
    <polygon points="200,0 260,240 140,240" fill="#6366f1" opacity="0.12" />
    <polygon points="50,0 120,240 0,240" fill="#06b6d4" opacity="0.08" />
    <polygon points="350,0 400,240 280,240" fill="#ec4899" opacity="0.08" />

    {/* Contest Timer Board at Top */}
    <g transform="translate(130, 20)">
      <rect width="140" height="34" rx="17" fill="#0f172a" stroke="url(#timerBorder)" strokeWidth="2" />
      <circle cx="20" cy="17" r="5" fill="#ef4444" className="animate-ping" />
      <text
        x="78"
        y="23"
        textAnchor="middle"
        fill="#f8fafc"
        fontFamily="ui-monospace, monospace"
        fontSize="14"
        fontWeight="bold"
      >
        01:45:28
      </text>
    </g>

    {/* Central Golden Trophy */}
    <g transform="translate(165, 75)">
      {/* Trophy Cup */}
      <path d="M20 10H50V35C50 48 35 55 35 55C35 55 20 48 20 35V10Z" fill="url(#trophyGold)" />
      {/* Handles */}
      <path d="M20 18H10C6 18 6 32 18 32H20" stroke="#facc15" strokeWidth="2.5" fill="none" />
      <path d="M50 18H60C64 18 64 32 52 32H50" stroke="#facc15" strokeWidth="2.5" fill="none" />
      {/* Stem & Base */}
      <rect x="31" y="55" width="8" height="15" fill="#ca8a04" />
      <rect x="22" y="70" width="26" height="8" rx="2" fill="#854d0e" />
      <circle cx="35" cy="30" r="6" fill="#fef08a" />
    </g>

    {/* Dual Competitive Screens (Left & Right) */}
    {/* Left Station (Cyan) */}
    <g transform="translate(50, 110)">
      <rect width="80" height="60" rx="6" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
      <rect x="6" y="6" width="68" height="42" rx="3" fill="#0f172a" />
      <line x1="12" y1="16" x2="40" y2="16" stroke="#38bdf8" strokeWidth="2" />
      <line x1="12" y1="24" x2="55" y2="24" stroke="#10b981" strokeWidth="2" />
      <rect x="30" y="60" width="20" height="15" fill="#334155" />
      <rect x="20" y="75" width="40" height="4" rx="2" fill="#475569" />
    </g>

    {/* Right Station (Magenta) */}
    <g transform="translate(270, 110)">
      <rect width="80" height="60" rx="6" fill="#1e293b" stroke="#ec4899" strokeWidth="2" />
      <rect x="6" y="6" width="68" height="42" rx="3" fill="#0f172a" />
      <line x1="12" y1="16" x2="50" y2="16" stroke="#f472b6" strokeWidth="2" />
      <line x1="12" y1="24" x2="35" y2="24" stroke="#fbbf24" strokeWidth="2" />
      <rect x="30" y="60" width="20" height="15" fill="#334155" />
      <rect x="20" y="75" width="40" height="4" rx="2" fill="#475569" />
    </g>

    {/* Status Pill */}
    <rect x="150" y="195" width="100" height="24" rx="12" fill="#1e293b" stroke="#6366f1" strokeWidth="1.2" />
    <text x="200" y="211" textAnchor="middle" fill="#a5f3fc" fontFamily="system-ui" fontSize="10" fontWeight="bold">
      DIV. 2 LIVE ROUND
    </text>
  </svg>
);

// 4. Focus & Discipline Illustration
export const FocusDisciplineIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = '100%',
  height = 180,
}) => (
  <svg
    viewBox="0 0 400 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    style={{ width, height }}
  >
    <defs>
      <linearGradient id="focusBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#07191e" />
        <stop offset="50%" stopColor="#0b292e" />
        <stop offset="100%" stopColor="#07131b" />
      </linearGradient>
      <linearGradient id="zenRings" x1="120" y1="40" x2="280" y2="200" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>

    <rect width="400" height="240" rx="16" fill="url(#focusBg)" />

    {/* Concentric Flow Energy Rings */}
    <circle cx="200" cy="120" r="90" stroke="url(#zenRings)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.3" />
    <circle cx="200" cy="120" r="65" stroke="url(#zenRings)" strokeWidth="2" strokeDasharray="8 4" opacity="0.5" />
    <circle cx="200" cy="120" r="40" stroke="url(#zenRings)" strokeWidth="2" opacity="0.7" />

    {/* Floating Mind Nodes */}
    <circle cx="130" cy="80" r="4" fill="#38bdf8" />
    <line x1="130" y1="80" x2="175" y2="105" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
    <circle cx="270" cy="80" r="4" fill="#34d399" />
    <line x1="270" y1="80" x2="225" y2="105" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
    <circle cx="200" cy="45" r="5" fill="#facc15" />
    <line x1="200" y1="45" x2="200" y2="85" stroke="#facc15" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

    {/* Silhouette of Focused Developer in Flow */}
    <g transform="translate(180, 85)">
      {/* Head with Calm Glow */}
      <circle cx="20" cy="20" r="14" fill="#14b8a6" />
      <circle cx="20" cy="20" r="8" fill="#ffffff" />
      {/* Torso */}
      <path d="M5 44C5 34 35 34 35 44L40 75H0L5 44Z" fill="#0f766e" />
      {/* Cross-legged Base */}
      <ellipse cx="20" cy="78" rx="35" ry="10" fill="#064e3b" />
    </g>

    <text x="200" y="210" textAnchor="middle" fill="#6ee7b7" fontFamily="system-ui" fontSize="11" fontWeight="bold" letterSpacing="0.08em">
      DEEP FOCUS &bull; FLOW STATE
    </text>
  </svg>
);

// 5. Progress & Growth Illustration
export const ProgressGrowthIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = '100%',
  height = 180,
}) => (
  <svg
    viewBox="0 0 400 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    style={{ width, height }}
  >
    <defs>
      <linearGradient id="growBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0b0f19" />
        <stop offset="60%" stopColor="#141738" />
        <stop offset="100%" stopColor="#091829" />
      </linearGradient>
      <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="bar4" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="arrowGrad" x1="60" y1="180" x2="340" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>

    <rect width="400" height="240" rx="16" fill="url(#growBg)" />

    {/* Ascending Milestone Bar Columns */}
    {/* Newbie Bar (800) */}
    <rect x="70" y="150" width="45" height="50" rx="6" fill="url(#bar1)" />
    <text x="92" y="142" textAnchor="middle" fill="#94a3b8" fontFamily="system-ui" fontSize="10" fontWeight="bold">800</text>

    {/* Pupil Bar (1200) */}
    <rect x="140" y="120" width="45" height="80" rx="6" fill="url(#bar2)" />
    <text x="162" y="112" textAnchor="middle" fill="#34d399" fontFamily="system-ui" fontSize="10" fontWeight="bold">1200</text>

    {/* Specialist Bar (1400) */}
    <rect x="210" y="90" width="45" height="110" rx="6" fill="url(#bar3)" />
    <text x="232" y="82" textAnchor="middle" fill="#38bdf8" fontFamily="system-ui" fontSize="10" fontWeight="bold">1400</text>

    {/* Target Specialist Flag Bar (1600) */}
    <rect x="280" y="55" width="45" height="145" rx="6" fill="url(#bar4)" stroke="#ec4899" strokeWidth="1.5" />
    <text x="302" y="47" textAnchor="middle" fill="#f472b6" fontFamily="system-ui" fontSize="11" fontWeight="extrabold">1600</text>

    {/* Trajectory Growth Line */}
    <path
      d="M92 135L162 105L232 75L302 40"
      stroke="url(#arrowGrad)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="302" cy="40" r="6" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
  </svg>
);
