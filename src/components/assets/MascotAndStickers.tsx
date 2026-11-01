import React from 'react';
import { soundEffects } from '../../utils/soundEffects';

// ============================================================================
// 1. MASCOT CHARACTERS (Scalable Vector Graphics)
// ============================================================================

interface MascotProps {
  size?: number | string;
  className?: string;
  mood?: 'happy' | 'coding' | 'celebrating' | 'thinking' | 'zen' | 'excited';
}

// 🐾 Climby the Code Yeti: Friendly furry mountain climber with laptop
export const MascotClimby: React.FC<MascotProps> = ({
  size = 120,
  className = '',
  mood = 'happy',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="yetiFur" x1="80" y1="20" x2="80" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e0e7ff" />
        <stop offset="100%" stopColor="#c7d2fe" />
      </linearGradient>
      <linearGradient id="beanieGrad" x1="40" y1="20" x2="120" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="laptopGrad" x1="45" y1="110" x2="115" y2="145" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
      </filter>
    </defs>

    {/* Fluffy Yeti Body */}
    <ellipse cx="80" cy="98" rx="52" ry="46" fill="url(#yetiFur)" filter="url(#softShadow)" />

    {/* Yeti Ears */}
    <circle cx="34" cy="65" r="14" fill="#a5b4fc" />
    <circle cx="34" cy="65" r="8" fill="#fda4af" />
    <circle cx="126" cy="65" r="14" fill="#a5b4fc" />
    <circle cx="126" cy="65" r="8" fill="#fda4af" />

    {/* Yeti Face */}
    <circle cx="80" cy="74" r="38" fill="url(#yetiFur)" />

    {/* Cheerful Beanie Cap */}
    <path
      d="M48 55C48 30 62 20 80 20C98 20 112 30 112 55Z"
      fill="url(#beanieGrad)"
    />
    <rect x="42" y="50" width="76" height="12" rx="6" fill="#4f46e5" />
    {/* Beanie Pom-Pom */}
    <circle cx="80" cy="16" r="10" fill="#facc15" />

    {/* Big Joyful Eyes */}
    <ellipse cx="68" cy="72" rx="6" ry="7" fill="#0f172a" />
    <circle cx="70" cy="70" r="2.5" fill="#ffffff" />
    <ellipse cx="92" cy="72" rx="6" ry="7" fill="#0f172a" />
    <circle cx="94" cy="70" r="2.5" fill="#ffffff" />

    {/* Rosy Cheeks */}
    <ellipse cx="58" cy="80" rx="6" ry="3.5" fill="#f43f5e" opacity="0.4" />
    <ellipse cx="102" cy="80" rx="6" ry="3.5" fill="#f43f5e" opacity="0.4" />

    {/* Cute Mouth & Little Yeti Fang */}
    <path
      d="M72 84Q80 92 88 84"
      stroke="#0f172a"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <polygon points="74,84 78,84 76,88" fill="#ffffff" />

    {/* Fluffy Arms holding mini laptop */}
    <ellipse cx="48" cy="115" rx="12" ry="16" fill="#c7d2fe" transform="rotate(-15 48 115)" />
    <ellipse cx="112" cy="115" rx="12" ry="16" fill="#c7d2fe" transform="rotate(15 112 115)" />

    {/* Mini Laptop */}
    <rect x="52" y="108" width="56" height="34" rx="4" fill="url(#laptopGrad)" stroke="#6366f1" strokeWidth="1.5" />
    <rect x="56" y="112" width="48" height="24" rx="2" fill="#1e1b4b" />
    {/* Screen Code Glow */}
    <path d="M60 118L64 122L60 126" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="68" y1="122" x2="84" y2="122" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="60" y1="130" x2="98" y2="130" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />

    {/* Sparkle badge */}
    <circle cx="132" cy="40" r="4" fill="#facc15" />
    <circle cx="28" cy="95" r="3" fill="#38bdf8" />
  </svg>
);

// 🐱 Byte the Cyber Cat: Wearing hacker sunglasses & hoodie
export const MascotByteCat: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="hoodieGrad" x1="40" y1="50" x2="120" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="glassesGrad" x1="50" y1="65" x2="110" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
    </defs>

    {/* Pointy Cat Ears */}
    <polygon points="45,60 30,22 65,42" fill="#334155" />
    <polygon points="46,55 36,30 58,45" fill="#fda4af" />
    <polygon points="115,60 130,22 95,42" fill="#334155" />
    <polygon points="114,55 124,30 102,45" fill="#fda4af" />

    {/* Hoodie Body */}
    <path
      d="M40 145C40 95 120 95 120 145Z"
      fill="url(#hoodieGrad)"
    />

    {/* Cat Face */}
    <circle cx="80" cy="74" r="36" fill="#1e293b" />

    {/* Cool Sunglasses */}
    <rect x="48" y="66" width="30" height="16" rx="4" fill="url(#glassesGrad)" stroke="#000000" strokeWidth="1.5" />
    <rect x="82" y="66" width="30" height="16" rx="4" fill="url(#glassesGrad)" stroke="#000000" strokeWidth="1.5" />
    <line x1="78" y1="74" x2="82" y2="74" stroke="#000000" strokeWidth="2" />
    {/* Sunglasses Gloss */}
    <line x1="52" y1="70" x2="60" y2="70" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
    <line x1="86" y1="70" x2="94" y2="70" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />

    {/* Cat Nose & Mouth */}
    <polygon points="78,88 82,88 80,91" fill="#fda4af" />
    <path d="M76 93Q80 96 84 93" stroke="#94a3b8" strokeWidth="1.5" fill="none" />

    {/* Whiskers */}
    <line x1="38" y1="84" x2="22" y2="80" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="90" x2="20" y2="92" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="122" y1="84" x2="138" y2="80" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="122" y1="90" x2="140" y2="92" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />

    {/* Green terminal badge on chest */}
    <rect x="68" y="120" width="24" height="12" rx="3" fill="#040d06" stroke="#00ff66" strokeWidth="1" />
    <text x="80" y="129" fill="#00ff66" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">1337</text>
  </svg>
);

// ☕ Coffee Sloth: "Compiling... chill out!"
export const MascotCoffeeSloth: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="slothFur" x1="40" y1="30" x2="120" y2="130" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a8825c" />
        <stop offset="100%" stopColor="#785638" />
      </linearGradient>
      <linearGradient id="mugGrad" x1="90" y1="90" x2="130" y2="130" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>

    {/* Sloth Body */}
    <ellipse cx="80" cy="95" rx="46" ry="42" fill="url(#slothFur)" />

    {/* Sloth Face Mask */}
    <ellipse cx="80" cy="72" rx="36" ry="30" fill="#fdfbf7" />
    {/* Dark Eye Patches */}
    <ellipse cx="62" cy="74" rx="12" ry="8" fill="#583c24" transform="rotate(-15 62 74)" />
    <ellipse cx="98" cy="74" rx="12" ry="8" fill="#583c24" transform="rotate(15 98 74)" />

    {/* Peaceful Smiling Eyes */}
    <path d="M57 74Q62 70 67 74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M93 74Q98 70 103 74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Nose and Gentle Smile */}
    <ellipse cx="80" cy="80" rx="5" ry="4" fill="#382414" />
    <path d="M74 86Q80 91 86 86" stroke="#382414" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Coffee Mug */}
    <rect x="94" y="96" width="28" height="32" rx="4" fill="url(#mugGrad)" stroke="#451a03" strokeWidth="1.5" />
    <path d="M122 102C128 102 130 118 122 118" stroke="#f59e0b" strokeWidth="3" fill="none" />
    {/* Steam wisps */}
    <path d="M102 90Q100 84 104 78" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
    <path d="M112 90Q114 84 110 78" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
  </svg>
);

// 🦖 Big Brain Dino: "Rawr! Solved with Dynamic Programming!"
export const MascotBigBrain: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="dinoBody" x1="40" y1="30" x2="120" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>

    {/* Dino Body */}
    <ellipse cx="80" cy="100" rx="46" ry="42" fill="url(#dinoBody)" />
    {/* Dino Back Spikes */}
    <polygon points="40,90 30,80 44,76" fill="#facc15" />
    <polygon points="34,106 22,100 38,94" fill="#facc15" />
    <polygon points="32,122 20,118 36,112" fill="#facc15" />

    {/* Big Brain Head */}
    <circle cx="80" cy="65" r="34" fill="url(#dinoBody)" />

    {/* Floating Lightbulb Idea */}
    <circle cx="80" cy="18" r="9" fill="#fde047" stroke="#eab308" strokeWidth="1.5" />
    <line x1="80" y1="27" x2="80" y2="30" stroke="#ca8a04" strokeWidth="2" />
    {/* Glow rays */}
    <line x1="68" y1="12" x2="64" y2="8" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="92" y1="12" x2="96" y2="8" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />

    {/* Big Curious Eyes with glasses */}
    <circle cx="68" cy="62" r="11" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
    <circle cx="92" cy="62" r="11" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
    <line x1="79" y1="62" x2="81" y2="62" stroke="#0f172a" strokeWidth="2" />
    <circle cx="70" cy="62" r="5" fill="#0f172a" />
    <circle cx="94" cy="62" r="5" fill="#0f172a" />
    <circle cx="72" cy="60" r="1.5" fill="#ffffff" />
    <circle cx="96" cy="60" r="1.5" fill="#ffffff" />

    {/* Wide Dino Smile */}
    <path d="M68 80Q80 90 92 80" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Rosy blush */}
    <ellipse cx="58" cy="74" rx="5" ry="3" fill="#f43f5e" opacity="0.3" />
    <ellipse cx="102" cy="74" rx="5" ry="3" fill="#f43f5e" opacity="0.3" />
  </svg>
);

// 🥷 Shinobi Sasuke: Agile anime ninja with forehead protector & kunai stylus
export const MascotShinobiSasuke: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="ninjaHair" x1="40" y1="20" x2="120" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="ninjaScarf" x1="50" y1="90" x2="140" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>

    {/* Flowing Red Scarf Tails */}
    <path d="M100 95C125 105 145 130 135 155C125 140 115 125 95 110Z" fill="url(#ninjaScarf)" />
    <path d="M92 100C110 115 125 145 115 160C108 145 100 130 88 115Z" fill="#dc2626" opacity="0.85" />

    {/* Ninja Gi Body */}
    <ellipse cx="80" cy="115" rx="38" ry="36" fill="#1e293b" />
    <polygon points="80,105 70,128 90,128" fill="#475569" />

    {/* Chibi Head */}
    <circle cx="80" cy="70" r="34" fill="#fed7aa" />

    {/* Spiky Anime Hair Behind */}
    <polygon points="40,65 24,50 48,45" fill="url(#ninjaHair)" />
    <polygon points="120,65 136,50 112,45" fill="url(#ninjaHair)" />

    {/* Ninja Forehead Protector (Hitai-ate) */}
    <rect x="48" y="44" width="64" height="15" rx="3" fill="#334155" />
    <rect x="62" y="46" width="36" height="11" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
    {/* Metal emblem */}
    <circle cx="80" cy="51.5" r="3" fill="#475569" />
    <line x1="74" y1="51.5" x2="86" y2="51.5" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />

    {/* Spiky Bangs */}
    <polygon points="46,45 55,60 62,48" fill="url(#ninjaHair)" />
    <polygon points="60,46 72,62 80,48" fill="url(#ninjaHair)" />
    <polygon points="78,48 88,62 98,46" fill="url(#ninjaHair)" />
    <polygon points="96,48 106,60 114,45" fill="url(#ninjaHair)" />

    {/* Determined Anime Eyes */}
    <path d="M60 68L72 70" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <path d="M100 68L88 70" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <circle cx="67" cy="73" r="5" fill="#ef4444" />
    <circle cx="93" cy="73" r="5" fill="#ef4444" />
    <circle cx="68" cy="72" r="2" fill="#ffffff" />
    <circle cx="94" cy="72" r="2" fill="#ffffff" />

    {/* Lower Face Mask */}
    <path d="M58 78C58 78 70 82 80 82C90 82 102 78 102 78L96 95L64 95Z" fill="#0f172a" />

    {/* Red Scarf Wrapped Neck */}
    <rect x="54" y="90" width="52" height="14" rx="7" fill="url(#ninjaScarf)" />

    {/* Kunai Code Stylus in Hand */}
    <ellipse cx="44" cy="115" rx="8" ry="8" fill="#fed7aa" />
    <line x1="42" y1="115" x2="26" y2="95" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
    <polygon points="26,95 20,86 32,92" fill="#cbd5e1" />
  </svg>
);

// 🤖 Mecha Pilot Aoi: Sci-Fi cyberpunk heroine with holo-visor & mecha ears
export const MascotMechaAoi: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="aoiHair" x1="40" y1="20" x2="120" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="aoiVisor" x1="50" y1="60" x2="110" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00f0ff" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
    </defs>

    {/* Sci-Fi Mecha Armor Body */}
    <ellipse cx="80" cy="118" rx="38" ry="34" fill="#0f172a" />
    <path d="M54 110L80 135L106 110" stroke="#00f0ff" strokeWidth="2" fill="none" />
    <circle cx="80" cy="122" r="6" fill="#00f0ff" />

    {/* Chibi Head */}
    <circle cx="80" cy="70" r="34" fill="#fde68a" />

    {/* Cyan Cyber Hair & Twintails */}
    <path d="M46 60C30 75 22 110 32 135C40 125 45 95 52 75Z" fill="url(#aoiHair)" />
    <path d="M114 60C130 75 138 110 128 135C120 125 115 95 108 75Z" fill="url(#aoiHair)" />
    <path d="M46 65C46 36 62 25 80 25C98 25 114 36 114 65Z" fill="url(#aoiHair)" />

    {/* Mecha Headset / Antenna Ears */}
    <rect x="40" y="55" width="10" height="22" rx="4" fill="#334155" stroke="#00f0ff" strokeWidth="1.5" />
    <circle cx="45" cy="66" r="3" fill="#00f0ff" />
    <rect x="110" y="55" width="10" height="22" rx="4" fill="#334155" stroke="#00f0ff" strokeWidth="1.5" />
    <circle cx="115" cy="66" r="3" fill="#00f0ff" />

    {/* Holographic Cyber Visor */}
    <rect x="52" y="62" width="56" height="18" rx="6" fill="url(#aoiVisor)" opacity="0.85" />
    {/* Visor Data Lines */}
    <line x1="58" y1="68" x2="74" y2="68" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="94" cy="71" r="2.5" fill="#ffffff" />
    <line x1="82" y1="74" x2="100" y2="74" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

    {/* Cheerful Smile */}
    <path d="M74 88Q80 94 86 88" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
    <ellipse cx="62" cy="86" rx="4" ry="2.5" fill="#f43f5e" opacity="0.4" />
    <ellipse cx="98" cy="86" rx="4" ry="2.5" fill="#f43f5e" opacity="0.4" />
  </svg>
);

// 🔥 Flame Fighter Ren: Super Saiyan anime warrior with spiky golden flame hair
export const MascotFlameRen: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="fireHair" x1="40" y1="10" x2="120" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <radialGradient id="fireAura" cx="80" cy="80" r="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0.45" />
        <stop offset="70%" stopColor="#f97316" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Burning Ki Aura */}
    <circle cx="80" cy="80" r="72" fill="url(#fireAura)" />

    {/* Martial Gi Body */}
    <ellipse cx="80" cy="118" rx="38" ry="34" fill="#ea580c" />
    <polygon points="80,105 68,135 92,135" fill="#1e293b" />
    <rect x="64" y="124" width="32" height="6" rx="2" fill="#1e1b4b" />

    {/* Wild Spiky Flame Hair (Behind) */}
    <polygon points="80,8 60,35 95,30" fill="url(#fireHair)" />
    <polygon points="45,18 42,48 70,36" fill="url(#fireHair)" />
    <polygon points="115,18 90,36 118,48" fill="url(#fireHair)" />
    <polygon points="26,35 34,60 55,48" fill="url(#fireHair)" />
    <polygon points="134,35 105,48 126,60" fill="url(#fireHair)" />

    {/* Chibi Face */}
    <circle cx="80" cy="72" r="32" fill="#fed7aa" />

    {/* Front Hair Spikes */}
    <polygon points="56,48 66,66 74,52" fill="url(#fireHair)" />
    <polygon points="70,50 82,68 90,52" fill="url(#fireHair)" />
    <polygon points="88,52 98,66 106,48" fill="url(#fireHair)" />

    {/* Fierce Confident Anime Eyes */}
    <path d="M58 70L72 73" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M102 70L88 73" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="66" cy="76" r="4.5" fill="#0284c7" />
    <circle cx="94" cy="76" r="4.5" fill="#0284c7" />
    <circle cx="67" cy="75" r="1.8" fill="#ffffff" />
    <circle cx="95" cy="75" r="1.8" fill="#ffffff" />

    {/* Smug Champion Grin */}
    <path d="M72 88C76 94 86 94 90 88" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <line x1="88" y1="89" x2="92" y2="87" stroke="#0f172a" strokeWidth="2" />
  </svg>
);

// 🌸 Magical Girl Sakura: Anime magical girl with star wand & compiler sparkles
export const MascotMagicalSakura: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="sakuraHair" x1="40" y1="20" x2="120" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="starWand" x1="110" y1="40" x2="140" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Twin-tails behind */}
    <path d="M42 55C18 70 12 110 24 135C35 125 40 90 48 70Z" fill="url(#sakuraHair)" />
    <path d="M118 55C142 70 148 110 136 135C125 125 120 90 112 70Z" fill="url(#sakuraHair)" />

    {/* Frilly Magical Dress */}
    <ellipse cx="80" cy="120" rx="36" ry="32" fill="#fce7f3" stroke="#f472b6" strokeWidth="2" />
    <polygon points="80,105 72,118 88,118" fill="#ec4899" />

    {/* Chibi Head */}
    <circle cx="80" cy="70" r="33" fill="#fdf2f8" />

    {/* Pink Bangs & Twintail Ribbons */}
    <circle cx="42" cy="55" r="8" fill="#fb7185" />
    <circle cx="118" cy="55" r="8" fill="#fb7185" />
    <path d="M48 60C48 35 62 24 80 24C98 24 112 35 112 60Z" fill="url(#sakuraHair)" />
    <path d="M60 48Q70 65 80 50Q90 65 100 48" fill="url(#sakuraHair)" />

    {/* Sparkly Big Anime Eyes */}
    <ellipse cx="66" cy="72" rx="6.5" ry="8" fill="#831843" />
    <circle cx="68" cy="69" r="3" fill="#ffffff" />
    <circle cx="65" cy="76" r="1.5" fill="#ffffff" />
    <ellipse cx="94" cy="72" rx="6.5" ry="8" fill="#831843" />
    <circle cx="96" cy="69" r="3" fill="#ffffff" />
    <circle cx="93" cy="76" r="1.5" fill="#ffffff" />

    {/* Cute Heart Smile & Blush */}
    <path d="M75 84Q80 88 85 84" stroke="#be185d" strokeWidth="2" strokeLinecap="round" fill="none" />
    <ellipse cx="58" cy="78" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />
    <ellipse cx="102" cy="78" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />

    {/* Star Wand */}
    <line x1="110" y1="120" x2="135" y2="70" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
    <polygon points="135,60 142,75 125,68 145,68 128,75" fill="url(#starWand)" />
    {/* Wand Sparkles */}
    <circle cx="145" cy="55" r="2.5" fill="#fde047" />
    <circle cx="125" cy="50" r="2" fill="#38bdf8" />
  </svg>
);

// 🗡️ Samurai Kenshi: Anime Ronin swordsman with straw hat & cherry blossom katana
export const MascotSamuraiKenshi: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="hatGrad" x1="20" y1="35" x2="140" y2="65" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>

    {/* Ronin Haori Body */}
    <ellipse cx="80" cy="118" rx="38" ry="34" fill="#1e293b" />
    <polygon points="80,105 70,135 90,135" fill="#475569" />

    {/* Katana Scabbard on Waist */}
    <line x1="42" y1="125" x2="120" y2="105" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
    <rect x="36" y="122" width="10" height="7" rx="2" fill="#d97706" transform="rotate(-15 36 122)" />

    {/* Chibi Face */}
    <circle cx="80" cy="76" r="32" fill="#fed7aa" />

    {/* Bamboo Ronin Straw Hat (Kasa) */}
    <polygon points="80,22 18,58 142,58" fill="url(#hatGrad)" />
    <line x1="80" y1="22" x2="80" y2="58" stroke="#78350f" strokeWidth="1.5" />
    <line x1="80" y1="22" x2="45" y2="58" stroke="#78350f" strokeWidth="1" />
    <line x1="80" y1="22" x2="115" y2="58" stroke="#78350f" strokeWidth="1" />

    {/* Calm Master Eyes */}
    <path d="M60 78Q68 74 74 78" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M86 78Q92 74 100 78" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

    {/* Gentle Sensei Smile */}
    <path d="M74 92Q80 96 86 92" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Floating Sakura Petal on cheek */}
    <path d="M98 86C98 82 106 82 106 86C106 90 98 90 98 86Z" fill="#f472b6" opacity="0.85" />
  </svg>
);

// 🚀 Astronaut Astro: Cute chibi space explorer floating in zero-G bubble helmet
export const MascotAstroPup: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="astroVisor" x1="45" y1="40" x2="115" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>

    {/* Astronaut Jetpack */}
    <rect x="36" y="90" width="16" height="35" rx="5" fill="#94a3b8" />
    <rect x="108" y="90" width="16" height="35" rx="5" fill="#94a3b8" />
    {/* Thruster Plume */}
    <polygon points="44,125 38,142 50,142" fill="#f59e0b" />
    <polygon points="116,125 110,142 122,142" fill="#f59e0b" />

    {/* Spacesuit Body */}
    <ellipse cx="80" cy="116" rx="38" ry="32" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
    <rect x="68" y="108" width="24" height="14" rx="3" fill="#0284c7" />
    <circle cx="75" cy="115" r="2" fill="#4ade80" />
    <circle cx="85" cy="115" r="2" fill="#ef4444" />

    {/* Bubble Space Helmet */}
    <circle cx="80" cy="65" r="38" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
    {/* Gold / Blue Visor Shield */}
    <ellipse cx="80" cy="65" rx="30" ry="24" fill="url(#astroVisor)" />
    {/* Helmet Glass Reflection */}
    <ellipse cx="70" cy="56" rx="14" ry="7" fill="#ffffff" opacity="0.65" transform="rotate(-15 70 56)" />

    {/* Cute Puppy Face Seen Inside Visor */}
    <circle cx="70" cy="66" r="3.5" fill="#ffffff" />
    <circle cx="90" cy="66" r="3.5" fill="#ffffff" />
    <ellipse cx="80" cy="72" rx="3" ry="2" fill="#0f172a" />
    <path d="M76 75Q80 78 84 75" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

// 🛡️ Arthur the 8-Bit Pixel Knight: Retro RPG knight with sword of logic
export const MascotPixelKnight: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="shieldGrad" x1="100" y1="90" x2="135" y2="135" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>

    {/* Knight Armor Body */}
    <rect x="52" y="98" width="56" height="42" rx="6" fill="#475569" stroke="#334155" strokeWidth="2" />
    <line x1="80" y1="102" x2="80" y2="136" stroke="#94a3b8" strokeWidth="2" />

    {/* Shining Knight Shield */}
    <path d="M108 100L135 100L130 135L120 145L110 135Z" fill="url(#shieldGrad)" stroke="#fde68a" strokeWidth="1.5" />
    <circle cx="122" cy="118" r="4" fill="#ffffff" />

    {/* Chibi Greathelm */}
    <rect x="46" y="42" width="68" height="54" rx="14" fill="#64748b" stroke="#334155" strokeWidth="2" />
    {/* Golden Plume / Crest */}
    <path d="M80 18C70 25 72 40 80 42C88 40 90 25 80 18Z" fill="#ef4444" />
    <circle cx="80" cy="42" r="5" fill="#f59e0b" />

    {/* Helm Visor Slit */}
    <rect x="54" y="60" width="52" height="12" rx="3" fill="#0f172a" />
    {/* Glowing Courageous Eyes */}
    <circle cx="68" cy="66" r="3" fill="#38bdf8" />
    <circle cx="92" cy="66" r="3" fill="#38bdf8" />

    {/* Pixel Sword of Algorithm Truth */}
    <line x1="36" y1="135" x2="36" y2="82" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
    <line x1="28" y1="110" x2="44" y2="110" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    <circle cx="36" cy="137" r="3" fill="#f59e0b" />
  </svg>
);

// 🔮 Luna the Starlight Witch: Anime sorceress with big floppy hat & arcane grimoire
export const MascotArchmageLuna: React.FC<MascotProps> = ({
  size = 120,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="witchHat" x1="40" y1="15" x2="120" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
    </defs>

    {/* Sorceress Robe Body */}
    <ellipse cx="80" cy="118" rx="38" ry="34" fill="#3b0764" />
    <circle cx="80" cy="112" r="4" fill="#fde047" />

    {/* Levitating Grimoire Code Spellbook */}
    <rect x="24" y="105" width="28" height="34" rx="4" fill="#6d28d9" stroke="#a78bfa" strokeWidth="1.5" transform="rotate(-15 24 105)" />
    <line x1="28" y1="115" x2="42" y2="111" stroke="#fde047" strokeWidth="1.5" />
    <line x1="27" y1="122" x2="44" y2="118" stroke="#38bdf8" strokeWidth="1.5" />

    {/* Chibi Face */}
    <circle cx="80" cy="74" r="32" fill="#faf5ff" />

    {/* Floppy Witch Hat */}
    <ellipse cx="80" cy="62" rx="55" ry="14" fill="#4c1d95" stroke="#7c3aed" strokeWidth="2" />
    <polygon points="80,14 55,60 105,60" fill="url(#witchHat)" />
    <rect x="58" y="54" width="44" height="6" fill="#f59e0b" />
    <polygon points="80,54 82,60 78,60" fill="#fef08a" />

    {/* Silver Anime Hair */}
    <path d="M50 68Q58 84 62 74" fill="#e9d5ff" />
    <path d="M110 68Q102 84 98 74" fill="#e9d5ff" />

    {/* Deep Amethyst Eyes */}
    <ellipse cx="68" cy="76" rx="5" ry="6.5" fill="#581c87" />
    <circle cx="70" cy="73" r="2.2" fill="#ffffff" />
    <ellipse cx="92" cy="76" rx="5" ry="6.5" fill="#581c87" />
    <circle cx="94" cy="73" r="2.2" fill="#ffffff" />

    {/* Mysterious Smile */}
    <path d="M75 88Q80 92 85 88" stroke="#581c87" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Floating Arcane Rune Sparkles */}
    <circle cx="120" cy="95" r="3" fill="#c084fc" />
    <circle cx="132" cy="115" r="2" fill="#38bdf8" />
  </svg>
);

// 🐰 Mochi Bunny: Ultra-cute fluffy bunny hacker with pastel hoodie, boba & carrot stylus
export const MascotMochiBunny: React.FC<MascotProps> = ({
  size = 120,
  className = '',
  mood = 'happy',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="bunnyFur" x1="80" y1="20" x2="80" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#fdf2f8" />
      </linearGradient>
      <linearGradient id="bunnyHoodie" x1="40" y1="90" x2="120" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="50%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
      <linearGradient id="bobaGrad" x1="110" y1="105" x2="135" y2="145" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#fb7185" />
      </linearGradient>
      <filter id="softGlowMochi" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#f472b6" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Bunny Ears */}
    {/* Left Ear */}
    <path
      d="M50 68C36 44 42 14 58 17C73 20 68 48 62 68Z"
      fill="url(#bunnyFur)"
      stroke="#fbcfe8"
      strokeWidth="2"
    />
    <path
      d="M51 60C41 40 46 22 57 24C68 26 62 48 59 60Z"
      fill="#f472b6"
      opacity="0.6"
    />

    {/* Right Ear - with cute floppy bend */}
    <path
      d="M102 68C108 48 114 18 128 22C140 26 132 50 114 70Z"
      fill="url(#bunnyFur)"
      stroke="#fbcfe8"
      strokeWidth="2"
    />
    <path
      d="M107 62C112 44 117 27 126 30C134 34 125 50 112 64Z"
      fill="#f472b6"
      opacity="0.6"
    />

    {/* Fluffy Round Bunny Body / Hoodie */}
    <ellipse cx="80" cy="118" rx="44" ry="34" fill="url(#bunnyHoodie)" filter="url(#softGlowMochi)" />

    {/* Hoodie Kangaroo Pocket */}
    <path d="M62 120C62 114 98 114 98 120L94 136H66Z" fill="#ffffff" opacity="0.3" />
    <path d="M78 124L82 124L80 132Z" fill="#fb923c" />
    <circle cx="80" cy="123" r="1.5" fill="#22c55e" />

    {/* Cute Fluffy Round Head */}
    <ellipse cx="80" cy="78" rx="38" ry="34" fill="url(#bunnyFur)" stroke="#fbcfe8" strokeWidth="1.5" />

    {/* Chubby Rosy Cheeks */}
    <ellipse cx="56" cy="86" rx="7" ry="4" fill="#f43f5e" opacity="0.5" />
    <line x1="53" y1="86" x2="59" y2="86" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="104" cy="86" rx="7" ry="4" fill="#f43f5e" opacity="0.5" />
    <line x1="101" y1="86" x2="107" y2="86" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

    {/* Kawaii Anime Eyes */}
    {mood === 'coding' ? (
      <>
        <text x="59" y="80" fontSize="13" fontWeight="bold" fill="#0f172a" fontFamily="monospace">&gt;</text>
        <text x="91" y="80" fontSize="13" fontWeight="bold" fill="#0f172a" fontFamily="monospace">&lt;</text>
      </>
    ) : mood === 'zen' ? (
      <>
        <path d="M60 76Q67 82 74 76" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M86 76Q93 82 100 76" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        {/* Left Big Sparkly Eye */}
        <ellipse cx="66" cy="76" rx="7" ry="9" fill="#1e1b4b" />
        <ellipse cx="64" cy="73" rx="3" ry="4" fill="#ffffff" />
        <circle cx="69" cy="80" r="1.5" fill="#ffffff" />
        <polygon points="68,74 69,76 71,76 70,77 70,79 69,78 67,79 68,77 66,76 68,76" fill="#f472b6" />

        {/* Right Big Sparkly Eye */}
        <ellipse cx="94" cy="76" rx="7" ry="9" fill="#1e1b4b" />
        <ellipse cx="92" cy="73" rx="3" ry="4" fill="#ffffff" />
        <circle cx="97" cy="80" r="1.5" fill="#ffffff" />
        <polygon points="96,74 97,76 99,76 98,77 98,79 97,78 95,79 96,77 94,76 96,76" fill="#f472b6" />
      </>
    )}

    {/* Cute Bunny Nose and Mouth: :3 */}
    <ellipse cx="80" cy="83" rx="2" ry="1.5" fill="#fb7185" />
    <path
      d="M74 86C76 89 79 89 80 87C81 89 84 89 86 86"
      stroke="#1e1b4b"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />

    {/* Holding Carrot Stylus Pen */}
    <g transform="rotate(-25 45 110)">
      <polygon points="40,105 44,95 48,105" fill="#22c55e" />
      <path d="M41 105L44 125L47 105Z" fill="#f97316" stroke="#ea580c" strokeWidth="1" />
      <line x1="42" y1="110" x2="46" y2="110" stroke="#ffedd5" strokeWidth="1" />
      <line x1="43" y1="116" x2="45" y2="116" stroke="#ffedd5" strokeWidth="1" />
    </g>

    {/* Holding Strawberry Boba Cup */}
    <g transform="translate(106, 100)">
      <rect x="0" y="8" width="22" height="28" rx="4" fill="url(#bobaGrad)" stroke="#f43f5e" strokeWidth="1" />
      <rect x="-2" y="5" width="26" height="4" rx="2" fill="#ffffff" />
      {/* Straw */}
      <line x1="11" y1="0" x2="11" y2="8" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
      {/* Boba pearls */}
      <circle cx="6" cy="28" r="2.5" fill="#4c0519" />
      <circle cx="12" cy="30" r="2.5" fill="#4c0519" />
      <circle cx="17" cy="28" r="2.5" fill="#4c0519" />
      <circle cx="9" cy="23" r="2" fill="#4c0519" />
      <circle cx="15" cy="23" r="2" fill="#4c0519" />
      {/* Heart on Cup */}
      <path d="M11 15C11 13 8 13 8 16C8 18 11 20 11 20C11 20 14 18 14 16C14 13 11 13 11 15Z" fill="#ffffff" opacity="0.8" />
    </g>

    {/* Cute Floating Sparkles */}
    <path d="M26 48L28 42L30 48L36 50L30 52L28 58L26 52L20 50Z" fill="#facc15" />
    <circle cx="138" cy="72" r="3" fill="#38bdf8" />
    <circle cx="24" cy="98" r="2.5" fill="#ec4899" />
  </svg>
);

// 🐧 Pip the Cozy Penguin: Chubby baby penguin in knit scarf & pom-pom beanie with hot cocoa
export const MascotPipPenguin: React.FC<MascotProps> = ({
  size = 120,
  className = '',
  mood = 'happy',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="penguinBody" x1="80" y1="35" x2="80" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="penguinBelly" x1="80" y1="65" x2="80" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f1f5f9" />
      </linearGradient>
      <linearGradient id="beanieYellow" x1="45" y1="20" x2="115" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="scarfRed" x1="40" y1="85" x2="120" y2="105" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>

    {/* Little Orange Webbed Feet */}
    <ellipse cx="62" cy="148" rx="14" ry="7" fill="#f97316" />
    <ellipse cx="98" cy="148" rx="14" ry="7" fill="#f97316" />

    {/* Penguin Wings */}
    {mood === 'celebrating' ? (
      <>
        {/* Wings waving high! */}
        <ellipse cx="28" cy="90" rx="10" ry="24" fill="#1e293b" transform="rotate(-35 28 90)" />
        <ellipse cx="132" cy="90" rx="10" ry="24" fill="#1e293b" transform="rotate(35 132 90)" />
      </>
    ) : (
      <>
        {/* Cozy flippers resting */}
        <ellipse cx="32" cy="115" rx="10" ry="22" fill="#1e293b" transform="rotate(20 32 115)" />
        <ellipse cx="128" cy="115" rx="10" ry="18" fill="#1e293b" transform="rotate(-25 128 115)" />
      </>
    )}

    {/* Chubby Penguin Body */}
    <ellipse cx="80" cy="104" rx="46" ry="44" fill="url(#penguinBody)" />

    {/* Fluffy White Belly */}
    <ellipse cx="80" cy="112" rx="32" ry="32" fill="url(#penguinBelly)" />

    {/* Warm Knitted Beanie */}
    <path
      d="M52 48C52 24 64 16 80 16C96 16 108 24 108 48Z"
      fill="url(#beanieYellow)"
    />
    <rect x="48" y="44" width="64" height="12" rx="6" fill="#d97706" />
    {/* Beanie texture stripes */}
    <line x1="68" y1="22" x2="68" y2="44" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
    <line x1="80" y1="18" x2="80" y2="44" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
    <line x1="92" y1="22" x2="92" y2="44" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
    {/* Soft Pom-Pom */}
    <circle cx="80" cy="12" r="10" fill="#ffffff" />
    <circle cx="80" cy="12" r="8" fill="#f8fafc" />

    {/* Penguin Face Mask */}
    <ellipse cx="64" cy="68" rx="16" ry="15" fill="#ffffff" />
    <ellipse cx="96" cy="68" rx="16" ry="15" fill="#ffffff" />

    {/* Sparkly Eyes */}
    {mood === 'zen' ? (
      <>
        <path d="M57 68Q64 74 71 68" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M89 68Q96 74 103 68" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <ellipse cx="64" cy="67" rx="5.5" ry="7.5" fill="#0f172a" />
        <circle cx="62" cy="64" r="2.5" fill="#ffffff" />
        <circle cx="66" cy="70" r="1.2" fill="#ffffff" />

        <ellipse cx="96" cy="67" rx="5.5" ry="7.5" fill="#0f172a" />
        <circle cx="94" cy="64" r="2.5" fill="#ffffff" />
        <circle cx="98" cy="70" r="1.2" fill="#ffffff" />
      </>
    )}

    {/* Chubby Rosy Cheeks */}
    <ellipse cx="52" cy="74" rx="6" ry="3.5" fill="#fb923c" opacity="0.6" />
    <ellipse cx="108" cy="74" rx="6" ry="3.5" fill="#fb923c" opacity="0.6" />

    {/* Golden Beak */}
    <polygon points="73,72 87,72 80,82" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
    <polygon points="76,72 84,72 80,78" fill="#fbbf24" />

    {/* Cozy Striped Winter Scarf */}
    <path
      d="M48 84C60 92 100 92 112 84C114 96 46 96 48 84Z"
      fill="url(#scarfRed)"
    />
    <rect x="52" y="86" width="56" height="11" rx="5.5" fill="url(#scarfRed)" />
    {/* Scarf white stripes */}
    <line x1="64" y1="86" x2="64" y2="97" stroke="#ffffff" strokeWidth="3" />
    <line x1="76" y1="86" x2="76" y2="97" stroke="#ffffff" strokeWidth="3" />
    <line x1="88" y1="86" x2="88" y2="97" stroke="#ffffff" strokeWidth="3" />
    <line x1="100" y1="86" x2="100" y2="97" stroke="#ffffff" strokeWidth="3" />
    {/* Trailing scarf tail */}
    <path d="M96 95L106 130L92 133L84 97Z" fill="url(#scarfRed)" />
    <line x1="94" y1="105" x2="104" y2="107" stroke="#ffffff" strokeWidth="3" />
    <line x1="91" y1="117" x2="101" y2="119" stroke="#ffffff" strokeWidth="3" />
    {/* Scarf tassels */}
    <line x1="93" y1="133" x2="93" y2="139" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    <line x1="98" y1="132" x2="99" y2="138" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <line x1="104" y1="131" x2="105" y2="137" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />

    {/* Holding Cocoa Mug with Steam */}
    <g transform="translate(42, 106)">
      <rect x="0" y="4" width="22" height="18" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      <path d="M22 8C26 8 26 16 22 16" stroke="#0284c7" strokeWidth="2.5" fill="none" />
      {/* Marshmallow */}
      <circle cx="8" cy="5" r="3" fill="#ffffff" />
      <circle cx="14" cy="6" r="2.5" fill="#ffffff" />
      {/* Curly Steam Brackets: { } */}
      <path d="M6 -2Q4 -6 7 -8Q10 -10 8 -14" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d="M14 -2Q16 -6 13 -8Q10 -10 12 -14" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.75" />
    </g>

    {/* Snow Sparkles */}
    <circle cx="28" cy="45" r="3" fill="#38bdf8" opacity="0.8" />
    <circle cx="135" cy="40" r="2.5" fill="#facc15" opacity="0.8" />
    <path d="M128 78L130 74L132 78L136 80L132 82L130 86L128 82L124 80Z" fill="#38bdf8" />
  </svg>
);

// 🦦 Boba Otter: Cheerful river otter floating on back with aviator goggles & giant boba tea
export const MascotBobaOtter: React.FC<MascotProps> = ({
  size = 120,
  className = '',
  mood = 'happy',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="otterFur" x1="80" y1="30" x2="80" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="50%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="otterMuzzle" x1="80" y1="60" x2="80" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
      <linearGradient id="gogglesLens" x1="45" y1="40" x2="115" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="waterRipple" x1="20" y1="140" x2="140" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
        <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* Water ripples under floating otter */}
    <ellipse cx="80" cy="142" rx="64" ry="12" fill="url(#waterRipple)" />
    <path d="M30 144Q80 152 130 144" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M45 150Q80 156 115 150" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

    {/* Otter Tail resting in water */}
    <path d="M120 120C138 126 148 136 142 144C136 148 122 142 110 134Z" fill="url(#otterFur)" />

    {/* Otter Body */}
    <ellipse cx="80" cy="108" rx="44" ry="36" fill="url(#otterFur)" />
    <ellipse cx="80" cy="115" rx="28" ry="24" fill="url(#otterMuzzle)" opacity="0.8" />

    {/* Otter Ears */}
    <circle cx="44" cy="56" r="9" fill="#78350f" />
    <circle cx="44" cy="56" r="5" fill="#fde68a" />
    <circle cx="116" cy="56" r="9" fill="#78350f" />
    <circle cx="116" cy="56" r="5" fill="#fde68a" />

    {/* Otter Head */}
    <circle cx="80" cy="68" r="34" fill="url(#otterFur)" />

    {/* Aviator Swim Goggles on Forehead */}
    <path d="M48 48C48 40 112 40 112 48" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="62" cy="46" rx="13" ry="9" fill="url(#gogglesLens)" stroke="#334155" strokeWidth="2" />
    <line x1="56" y1="42" x2="64" y2="42" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <ellipse cx="98" cy="46" rx="13" ry="9" fill="url(#gogglesLens)" stroke="#334155" strokeWidth="2" />
    <line x1="92" y1="42" x2="100" y2="42" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <line x1="75" y1="46" x2="85" y2="46" stroke="#334155" strokeWidth="2.5" />

    {/* Cream Muzzle */}
    <ellipse cx="80" cy="78" rx="20" ry="14" fill="url(#otterMuzzle)" />

    {/* Joyful Eyes */}
    {mood === 'coding' ? (
      <>
        <ellipse cx="64" cy="68" rx="5" ry="6" fill="#0f172a" />
        <circle cx="62" cy="66" r="2" fill="#ffffff" />
        <ellipse cx="96" cy="68" rx="5" ry="6" fill="#0f172a" />
        <circle cx="94" cy="66" r="2" fill="#ffffff" />
      </>
    ) : (
      <>
        {/* Adorable happy curved eyes ^ ^ */}
        <path d="M58 67Q65 60 72 67" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M88 67Q95 60 102 67" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    )}

    {/* Rosy Cheeks */}
    <ellipse cx="54" cy="76" rx="6" ry="3.5" fill="#f43f5e" opacity="0.5" />
    <ellipse cx="106" cy="76" rx="6" ry="3.5" fill="#f43f5e" opacity="0.5" />

    {/* Cute Dark Nose & Smiling Whiskers */}
    <path d="M75 74C75 71 85 71 85 74C85 78 80 81 80 81C80 81 75 78 75 74Z" fill="#1e293b" />
    <path d="M74 81C76 84 79 84 80 82C81 84 84 84 86 81" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Whiskers */}
    <line x1="56" y1="78" x2="42" y2="76" stroke="#a16207" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="56" y1="83" x2="40" y2="84" stroke="#a16207" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="104" y1="78" x2="118" y2="76" stroke="#a16207" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="104" y1="83" x2="120" y2="84" stroke="#a16207" strokeWidth="1.5" strokeLinecap="round" />

    {/* Giant Boba Cup clutched on otter's tummy */}
    <g transform="translate(64, 96)">
      {/* Cup Body */}
      <path d="M4 10L7 40C7 44 25 44 25 40L28 10Z" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
      {/* Milk Cap Layer */}
      <rect x="3" y="8" width="26" height="6" rx="2" fill="#ffffff" opacity="0.9" />
      {/* Cup Lid */}
      <rect x="2" y="5" width="28" height="4" rx="2" fill="#f43f5e" />
      {/* Purple Diagonal Straw */}
      <line x1="16" y1="-2" x2="16" y2="8" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
      {/* Smiling Tapioca Pearls */}
      <circle cx="11" cy="36" r="3" fill="#431407" />
      <circle cx="16" cy="38" r="3" fill="#431407" />
      <circle cx="21" cy="36" r="3" fill="#431407" />
      <circle cx="14" cy="31" r="2.5" fill="#431407" />
      <circle cx="19" cy="31" r="2.5" fill="#431407" />
    </g>

    {/* Cute Paws hugging the boba cup */}
    <ellipse cx="60" cy="112" rx="7" ry="9" fill="url(#otterFur)" transform="rotate(30 60 112)" />
    <ellipse cx="100" cy="112" rx="7" ry="9" fill="url(#otterFur)" transform="rotate(-30 100 112)" />

    {/* Floating Bubble Sparkles */}
    <circle cx="24" cy="130" r="4" fill="#38bdf8" opacity="0.7" />
    <circle cx="28" cy="122" r="2" fill="#38bdf8" opacity="0.5" />
    <circle cx="138" cy="110" r="3.5" fill="#facc15" opacity="0.8" />
  </svg>
);

// 🦊 Kitsu Ember Fox: Playful little fire fox cub with giant fluffy ember tail & lucky bell
export const MascotKitsuFox: React.FC<MascotProps> = ({
  size = 120,
  className = '',
  mood = 'happy',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="foxOrange" x1="80" y1="20" x2="80" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="50%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="flameTail" x1="110" y1="60" x2="160" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="30%" stopColor="#facc15" />
        <stop offset="70%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
      <linearGradient id="foxCream" x1="80" y1="60" x2="80" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ffedd5" />
      </linearGradient>
      <filter id="flameGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#f97316" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Giant Fluffy Flame Tail curling up */}
    <path
      d="M95 125C125 135 155 120 152 82C150 56 126 50 114 62C122 75 124 95 105 110Z"
      fill="url(#flameTail)"
      filter="url(#flameGlow)"
    />
    {/* Tail Flame Tip Sparkles */}
    <path
      d="M142 66C148 55 138 48 132 54C136 60 134 66 142 66Z"
      fill="#fef08a"
    />
    <circle cx="148" cy="50" r="2.5" fill="#facc15" />
    <circle cx="156" cy="74" r="2" fill="#fb923c" />

    {/* Pointy Fox Ears */}
    <polygon points="46,58 30,18 70,36" fill="url(#foxOrange)" stroke="#c2410c" strokeWidth="1" />
    <polygon points="48,54 38,26 64,40" fill="url(#foxCream)" />
    <polygon points="114,58 130,18 90,36" fill="url(#foxOrange)" stroke="#c2410c" strokeWidth="1" />
    <polygon points="112,54 122,26 96,40" fill="url(#foxCream)" />

    {/* Fox Body */}
    <ellipse cx="80" cy="116" rx="42" ry="34" fill="url(#foxOrange)" />
    {/* Fluffy White Chest */}
    <ellipse cx="80" cy="122" rx="24" ry="24" fill="url(#foxCream)" />

    {/* Red Braided Collar with Gold Bell */}
    <path d="M56 100C68 108 92 108 104 100" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
    <circle cx="80" cy="107" r="5" fill="#facc15" stroke="#b45309" strokeWidth="1" />
    <circle cx="80" cy="108" r="1.5" fill="#78350f" />

    {/* Fox Head */}
    <circle cx="80" cy="74" r="34" fill="url(#foxOrange)" />
    {/* Fluffy Cheek Tufts */}
    <polygon points="46,78 32,82 48,88" fill="url(#foxOrange)" />
    <polygon points="114,78 128,82 112,88" fill="url(#foxOrange)" />

    {/* Cream Muzzle Cheeks */}
    <ellipse cx="64" cy="80" rx="15" ry="12" fill="url(#foxCream)" />
    <ellipse cx="96" cy="80" rx="15" ry="12" fill="url(#foxCream)" />

    {/* Bright Fox Eyes */}
    {mood === 'excited' || mood === 'celebrating' ? (
      <>
        {/* Playful Wink */}
        <ellipse cx="65" cy="70" rx="6" ry="8" fill="#1e1b4b" />
        <circle cx="63" cy="67" r="2.5" fill="#ffffff" />
        <path d="M88 71Q96 64 104 71" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    ) : mood === 'zen' ? (
      <>
        <path d="M57 70Q65 76 73 70" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M87 70Q95 76 103 70" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <ellipse cx="65" cy="70" rx="6" ry="8" fill="#1e1b4b" />
        <circle cx="63" cy="67" r="2.5" fill="#ffffff" />
        <circle cx="67" cy="74" r="1.2" fill="#ffffff" />

        <ellipse cx="95" cy="70" rx="6" ry="8" fill="#1e1b4b" />
        <circle cx="93" cy="67" r="2.5" fill="#ffffff" />
        <circle cx="97" cy="74" r="1.2" fill="#ffffff" />
      </>
    )}

    {/* Rosy Cheeks */}
    <ellipse cx="52" cy="79" rx="6" ry="3.5" fill="#f43f5e" opacity="0.55" />
    <ellipse cx="108" cy="79" rx="6" ry="3.5" fill="#f43f5e" opacity="0.55" />

    {/* Tiny Cute Black Fox Nose & Smirk */}
    <ellipse cx="80" cy="78" rx="3" ry="2" fill="#0f172a" />
    <path
      d="M74 83C77 86 80 86 80 84C80 86 83 86 86 83"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Tiny Cheeky Fang */}
    <polygon points="76,83 79,83 77.5,86" fill="#ffffff" />

    {/* Little Front Paws */}
    <ellipse cx="64" cy="138" rx="8" ry="11" fill="url(#foxCream)" stroke="#ea580c" strokeWidth="1" />
    <ellipse cx="96" cy="138" rx="8" ry="11" fill="url(#foxCream)" stroke="#ea580c" strokeWidth="1" />

    {/* Floating Ember Sparks */}
    <circle cx="28" cy="56" r="3" fill="#facc15" />
    <circle cx="20" cy="80" r="2" fill="#f97316" />
    <circle cx="132" cy="36" r="2.5" fill="#fef08a" />
  </svg>
);

// 🐼 Bao the Zen Panda: Super round squishy baby panda with golden glasses & lucky bamboo sprout
export const MascotBaoPanda: React.FC<MascotProps> = ({
  size = 120,
  className = '',
  mood = 'happy',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="pandaFur" x1="80" y1="20" x2="80" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f8fafc" />
      </linearGradient>
      <linearGradient id="pandaBlack" x1="80" y1="20" x2="80" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="acCrystal" x1="60" y1="105" x2="100" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="50%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <filter id="pandaGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#22c55e" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Panda Black Ears */}
    <circle cx="44" cy="46" r="15" fill="url(#pandaBlack)" />
    <circle cx="44" cy="46" r="8" fill="#334155" />
    <circle cx="116" cy="46" r="15" fill="url(#pandaBlack)" />
    <circle cx="116" cy="46" r="8" fill="#334155" />

    {/* Chubby Round Bao Panda Body */}
    <ellipse cx="80" cy="112" rx="48" ry="40" fill="url(#pandaFur)" stroke="#e2e8f0" strokeWidth="1.5" />

    {/* Black Shoulders & Arms */}
    <path
      d="M34 116C34 94 126 94 126 116C126 126 34 126 34 116Z"
      fill="url(#pandaBlack)"
    />
    <ellipse cx="40" cy="122" rx="12" ry="16" fill="url(#pandaBlack)" transform="rotate(20 40 122)" />
    <ellipse cx="120" cy="122" rx="12" ry="16" fill="url(#pandaBlack)" transform="rotate(-20 120 122)" />

    {/* Round Fluffy Head */}
    <circle cx="80" cy="74" r="38" fill="url(#pandaFur)" stroke="#e2e8f0" strokeWidth="1" />

    {/* Lucky Bamboo Sprout on Head */}
    <g transform="translate(76, 24)">
      <path d="M4 14C4 8 1 4 4 0C7 4 4 8 4 14Z" fill="#22c55e" />
      {/* Leaves */}
      <path d="M4 6C-2 4 -3 1 1 2C4 3 4 5 4 6Z" fill="#4ade80" />
      <path d="M4 8C10 6 11 3 7 4C4 5 4 7 4 8Z" fill="#4ade80" />
    </g>

    {/* Signature Black Eye Patches (tilted inward) */}
    <ellipse cx="62" cy="73" rx="13" ry="11" fill="url(#pandaBlack)" transform="rotate(-15 62 73)" />
    <ellipse cx="98" cy="73" rx="13" ry="11" fill="url(#pandaBlack)" transform="rotate(15 98 73)" />

    {/* Sparkling Eyes inside Patches */}
    {mood === 'zen' ? (
      <>
        <path d="M57 73Q62 78 67 73" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M93 73Q98 78 103 73" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <ellipse cx="63" cy="72" rx="5" ry="6" fill="#ffffff" />
        <circle cx="64" cy="73" r="3" fill="#0f172a" />
        <circle cx="62" cy="70" r="1.5" fill="#ffffff" />

        <ellipse cx="97" cy="72" rx="5" ry="6" fill="#ffffff" />
        <circle cx="96" cy="73" r="3" fill="#0f172a" />
        <circle cx="98" cy="70" r="1.5" fill="#ffffff" />
      </>
    )}

    {/* Golden Wire-Rim Round Spectacles */}
    <circle cx="62" cy="73" r="15" stroke="#facc15" strokeWidth="2" fill="none" opacity="0.9" />
    <circle cx="98" cy="73" r="15" stroke="#facc15" strokeWidth="2" fill="none" opacity="0.9" />
    <line x1="77" y1="73" x2="83" y2="73" stroke="#facc15" strokeWidth="2" />

    {/* Rosy Pink Cheeks */}
    <ellipse cx="50" cy="84" rx="7" ry="4" fill="#f43f5e" opacity="0.45" />
    <ellipse cx="110" cy="84" rx="7" ry="4" fill="#f43f5e" opacity="0.45" />

    {/* Cute Triangular Panda Nose & Warm Smile */}
    <polygon points="76,82 84,82 80,87" fill="#0f172a" />
    <path
      d="M75 90Q80 94 85 90"
      stroke="#0f172a"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />

    {/* Holding Glowing 'AC' (Accepted) Crystal */}
    <g transform="translate(68, 108)" filter="url(#pandaGlow)">
      <polygon points="12,0 24,10 18,26 6,26 0,10" fill="url(#acCrystal)" stroke="#86efac" strokeWidth="1.5" />
      <text x="5.5" y="18" fontSize="10" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">AC</text>
    </g>

    {/* Soft Feet */}
    <ellipse cx="56" cy="148" rx="12" ry="8" fill="url(#pandaBlack)" />
    <ellipse cx="104" cy="148" rx="12" ry="8" fill="url(#pandaBlack)" />

    {/* Zen Sparkles */}
    <circle cx="28" cy="68" r="3" fill="#4ade80" opacity="0.8" />
    <circle cx="132" cy="62" r="2.5" fill="#facc15" opacity="0.8" />
  </svg>
);

// ============================================================================
// 1.5 CHARACTER METADATA & UNIFIED COMPONENT
// ============================================================================

export type AnimeCharacterId =
  | 'climby'
  | 'byte-cat'
  | 'shinobi-sasuke'
  | 'mecha-aoi'
  | 'flame-ren'
  | 'magical-sakura'
  | 'samurai-kenshi'
  | 'astro-pup'
  | 'pixel-knight'
  | 'coffee-sloth'
  | 'big-brain-dino'
  | 'archmage-luna'
  | 'mochi-bunny'
  | 'pip-penguin'
  | 'boba-otter'
  | 'kitsu-fox'
  | 'bao-panda';

export interface AnimeCharacterMeta {
  id: AnimeCharacterId;
  name: string;
  title: string;
  quote: string;
  animeGenre: string;
  avatarEmoji: string;
  component: React.FC<MascotProps>;
  dialogues: string[];
  image?: string;
}

export const ANIME_CHARACTERS: AnimeCharacterMeta[] = [
  {
    id: 'climby',
    name: 'Climby Yeti',
    title: 'The Mountain Climber',
    quote: 'Every rating point is a step up the summit!',
    animeGenre: 'Adventure Shonen',
    avatarEmoji: '🏔️',
    component: MascotClimby,
    dialogues: [
      "Let's conquer today's problems together, climber!",
      "The view from 1600 Specialist is magnificent!",
      "Warm up your fingers, high altitudes need speed!",
      "I brought hot cocoa and O(1) data structures!",
    ],
  },
  {
    id: 'byte-cat',
    name: 'Byte the Neko Hacker',
    title: 'Cyber Security Shinobi',
    quote: '0x1337 logic detected. AC guaranteed, nya!',
    animeGenre: 'Cyberpunk Mecha',
    avatarEmoji: '🐱',
    component: MascotByteCat,
    dialogues: [
      "I hacked the test cases! Just kidding, write clean code, nya!",
      "Time Limit Exceeded? Not on my terminal!",
      "Put your hoodie on, we're speedrunning Div 2!",
      "My paws compile in 0.02 seconds!",
    ],
  },
  {
    id: 'shinobi-sasuke',
    name: 'Sasuke the Shinobi',
    title: 'Leaf Village Code Ninja',
    quote: 'My ninja way is never giving up on a WA!',
    animeGenre: 'Shonen Action',
    avatarEmoji: '🥷',
    component: MascotShinobiSasuke,
    dialogues: [
      "Dattebayo! Today we break through the 1400 barrier!",
      "Shadow Clone Technique: Solve 4 problems simultaneously!",
      "A true shinobi inspects constraints before writing loops!",
      "Sharpen your kunai, contest starts soon!",
    ],
  },
  {
    id: 'mecha-aoi',
    name: 'Mecha Pilot Aoi',
    title: 'Orbital Core Navigator',
    quote: 'System synchronised. All test suites green!',
    animeGenre: 'Sci-Fi Mecha',
    avatarEmoji: '🤖',
    component: MascotMechaAoi,
    dialogues: [
      "Holographic diagnostic confirms: O(N log N) is optimal!",
      "Warp drive initialized! Destination: Specialist Rating!",
      "Warning: Corner cases detected on N=0. Deploy defensive check!",
      "Reactor output at 100%! Let's code!",
    ],
  },
  {
    id: 'flame-ren',
    name: 'Flame Fighter Ren',
    title: 'Super Saiyan Champion',
    quote: 'My algorithmic power level is over 9000!',
    animeGenre: 'Tournament Battle',
    avatarEmoji: '🔥',
    component: MascotFlameRen,
    dialogues: [
      "Is that all the contest can throw at us?! MORE GRIT!",
      "FEEL THE RUSH OF AN INSTANT ACCEPTED VERDICT!",
      "Push beyond your limits! That's how legends hit 1600!",
      "My aura burns away all edge cases!",
    ],
  },
  {
    id: 'magical-sakura',
    name: 'Magical Girl Sakura',
    title: 'Starlight Prism Coder',
    quote: 'By the power of logic and dreams, Accepted!',
    animeGenre: 'Magical Girl',
    avatarEmoji: '🌸',
    component: MascotMagicalSakura,
    dialogues: [
      "Sparkle and shine! Every bug vanishes in starlight!",
      "Let's weave beautiful clean code together, Senpai!",
      "Your rating is blossoming like springtime cherry petals!",
      "Believe in your algorithm, it believes in you!",
    ],
  },
  {
    id: 'samurai-kenshi',
    name: 'Samurai Kenshi',
    title: 'The Wandering Ronin',
    quote: 'A single strike of binary search cuts all doubt.',
    animeGenre: 'Historical Samurai',
    avatarEmoji: '🗡️',
    component: MascotSamuraiKenshi,
    dialogues: [
      "Still your mind. The problem reveals its solution in silence.",
      "The sword needs polish, as the mind needs daily practice.",
      "Defeat in one contest is but a lesson for the next battle.",
      "Walk the path of the code with honor and calm precision.",
    ],
  },
  {
    id: 'astro-pup',
    name: 'Astronaut Astro',
    title: 'Galactic Voyager',
    quote: 'To infinity and 1600 rating, woof!',
    animeGenre: 'Space Sci-Fi',
    avatarEmoji: '🚀',
    component: MascotAstroPup,
    dialogues: [
      "Zero-gravity algorithms have zero overhead!",
      "Houston, we have an Accepted verdict!",
      "Floating through the stars to find the cleanest DP solution!",
      "Check your oxygen and compile your code, space cadet!",
    ],
  },
  {
    id: 'pixel-knight',
    name: 'Knight Arthur',
    title: 'Defender of the Realm',
    quote: 'My shield blocks TLE, my blade slays bugs!',
    animeGenre: 'Classic RPG Fantasy',
    avatarEmoji: '🛡️',
    component: MascotPixelKnight,
    dialogues: [
      "For glory, honor, and Codeforces rating points!",
      "We shall storm the Specialist dungeon together!",
      "Take this potion: it restores focus and memory limits!",
      "A knight never retreats from a 1500 difficulty boss!",
    ],
  },
  {
    id: 'coffee-sloth',
    name: 'Boba the Sloth',
    title: 'Lofi Coffee Guru',
    quote: 'Slow is smooth, smooth is fast. Chill & code.',
    animeGenre: 'Slice of Life Lofi',
    avatarEmoji: '☕',
    component: MascotCoffeeSloth,
    dialogues: [
      "Sip some warm coffee... now read the problem statement slowly.",
      "No rush, great algorithms are brewed with patience.",
      "Take a deep breath. You're doing wonderful today.",
      "Coffee refill done. Let's solve one more before nap time.",
    ],
  },
  {
    id: 'big-brain-dino',
    name: 'Rex Big Brain',
    title: 'Prehistoric Math Master',
    quote: 'Rawr! Dynamic programming is elementary!',
    animeGenre: 'Comedy / School Life',
    avatarEmoji: '🦖',
    component: MascotBigBrain,
    dialogues: [
      "Aha! Look at the recurrence relation, it's trivial!",
      "My brain is huge, but your determination is even bigger!",
      "Eureka! Notice that N is only 20, bitmask DP works!",
      "Extinction? Impossible when you know Dijkstra's algorithm!",
    ],
  },
  {
    id: 'archmage-luna',
    name: 'Archmage Luna',
    title: 'Mistress of Arcane Logic',
    quote: 'Behold the ancient grimoire of graph algorithms!',
    animeGenre: 'Fantasy Academy',
    avatarEmoji: '🔮',
    component: MascotArchmageLuna,
    dialogues: [
      "I cast Topological Sort upon this dependency graph!",
      "The celestial stars align for a high rating gain tonight!",
      "Arcane runes dictate: always use 64-bit integers for sums!",
      "Drink from the fountain of knowledge and climb higher!",
    ],
  },
  {
    id: 'mochi-bunny',
    name: 'Mochi Bunny',
    title: 'Fluffy Kawaii Coder',
    quote: "Boba in one hand, carrot stylus in the other! Let's debug with joy!",
    animeGenre: 'Kawaii Cartoon',
    avatarEmoji: '🐰',
    component: MascotMochiBunny,
    image: '/assets/characters/mochi-bunny.jpg',
    dialogues: [
      "Carrot boost activated! Your code looks extra sweet today!",
      "Found the bug! It was hiding under my floppy ears!",
      "Sip some strawberry boba and keep climbing toward 1600!",
      "O(1) time complexity? That's bunny speed!",
    ],
  },
  {
    id: 'pip-penguin',
    name: 'Pip Penguin',
    title: 'Cozy Winter Logician',
    quote: 'Warm cocoa, cozy scarf, and ice-cool binary search.',
    animeGenre: 'Cozy Cartoon',
    avatarEmoji: '🐧',
    component: MascotPipPenguin,
    image: '/assets/characters/pip-penguin.jpg',
    dialogues: [
      "Cold weather can't freeze our problem-solving streak!",
      "Here is a cup of hot cocoa with steam shaped like { brackets }!",
      "Waddle waddle... Step by step, our rating climbs!",
      "Stay warm, breathe deep, and double check the array bounds!",
    ],
  },
  {
    id: 'boba-otter',
    name: 'Boba Otter',
    title: 'Algorithmic Streamer',
    quote: 'Float like a river otter, solve like a Grandmaster!',
    animeGenre: 'Chill Lofi Cartoon',
    avatarEmoji: '🦦',
    component: MascotBobaOtter,
    image: '/assets/characters/boba-otter.jpg',
    dialogues: [
      "Just floating by with extra tapioca pearls for you!",
      "Smooth data streams and zero segfaults today!",
      "Slide your goggles on, we're diving into graph theory!",
      "When in doubt, relax on your back and let the solution flow.",
    ],
  },
  {
    id: 'kitsu-fox',
    name: 'Kitsu Ember Fox',
    title: 'Sparks of Speed',
    quote: 'Ignite your contest speed with the warm flame of 1600!',
    animeGenre: 'Mythical Cartoon',
    avatarEmoji: '🦊',
    component: MascotKitsuFox,
    image: '/assets/characters/kitsu-fox.jpg',
    dialogues: [
      "Ding-dong! The bell rings for our next Accepted verdict!",
      "My ember tail burns away Time Limit Exceeded!",
      "Fast fingers, sharp logic, let's speedrun this contest!",
      "Catch me if you can! Specialist rating is right ahead!",
    ],
  },
  {
    id: 'bao-panda',
    name: 'Bao the Zen Panda',
    title: 'Dumpling Sage of Code',
    quote: 'Peaceful mind, green AC crystal, infinite patience.',
    animeGenre: 'Zen Cartoon',
    avatarEmoji: '🐼',
    component: MascotBaoPanda,
    image: '/assets/characters/bao-panda.jpg',
    dialogues: [
      "A bamboo shoot grows node by node, like a balanced binary tree.",
      "Hold the green Accepted crystal close—clarity arrives.",
      "Chew on the problem statement before writing a single loop.",
      "Calm breathes in, Wrong Answer breathes out. Peace.",
    ],
  },
];

export interface AnimeCharacterSpriteProps extends MascotProps {
  characterId?: AnimeCharacterId;
  interactive?: boolean;
  showQuote?: boolean;
  onCharacterClick?: () => void;
}

export const AnimeCharacterSprite: React.FC<AnimeCharacterSpriteProps> = ({
  characterId = 'climby',
  size = 120,
  className = '',
  mood = 'happy',
  interactive = true,
  showQuote = false,
  onCharacterClick,
}) => {
  const meta = ANIME_CHARACTERS.find((c) => c.id === characterId) || ANIME_CHARACTERS[0];
  const CharacterComponent = meta.component;
  const [activeDialogueIndex, setActiveDialogueIndex] = React.useState(0);
  const [showSpeechBubble, setShowSpeechBubble] = React.useState(showQuote);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playPop();
    setActiveDialogueIndex((prev) => (prev + 1) % meta.dialogues.length);
    setShowSpeechBubble(true);
    if (onCharacterClick) {
      onCharacterClick();
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center group ${className}`}>
      {/* Interactive Speech Bubble */}
      {showSpeechBubble && (
        <div
          onClick={() => setShowSpeechBubble(false)}
          className="absolute -top-12 sm:-top-14 left-1/2 transform -translate-x-1/2 z-30 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950/95 text-slate-900 dark:text-white text-[11px] font-bold border border-indigo-200 dark:border-indigo-500/50 shadow-xl shadow-indigo-500/15 whitespace-nowrap animate-bounce-subtle cursor-pointer select-none"
        >
          <span>{meta.dialogues[activeDialogueIndex]}</span>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white dark:border-t-slate-950" />
        </div>
      )}

      {/* Render Character SVG */}
      <div
        onClick={interactive ? handleClick : undefined}
        className={`transition-all duration-300 ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
        title={`${meta.name} • ${meta.title} (Click to speak)`}
      >
        <CharacterComponent size={size} mood={mood} />
      </div>
    </div>
  );
};

// ============================================================================
// 2. FUNNY STICKER BADGES
// ============================================================================

export type StickerType =
  | '1000_iq'
  | 'zero_bugs'
  | 'coffee_power'
  | 'coffee_code'
  | 'speed_demon'
  | 'brute_force'
  | 'speedrun_1600'
  | 'ac_first_try'
  | 'climb_champ'
  | 'level_up';

interface StickerProps {
  type: StickerType;
  className?: string;
  tilt?: number; // e.g. -3, 4 deg
  onClick?: () => void;
}

const STICKER_CONFIGS: Record<
  StickerType,
  {
    emoji: string;
    text: string;
    bgGrad: string;
    borderColor: string;
    textColor: string;
  }
> = {
  '1000_iq': {
    emoji: '🧠',
    text: '1000 IQ PLAY',
    bgGrad: 'from-purple-500 via-indigo-500 to-cyan-500',
    borderColor: 'border-purple-300',
    textColor: 'text-white',
  },
  zero_bugs: {
    emoji: '🛡️',
    text: 'ZERO BUG ENERGY',
    bgGrad: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-300',
    textColor: 'text-white',
  },
  coffee_power: {
    emoji: '☕',
    text: 'COFFEE IN • RATING UP',
    bgGrad: 'from-amber-600 to-orange-600',
    borderColor: 'border-amber-300',
    textColor: 'text-white',
  },
  coffee_code: {
    emoji: '☕',
    text: 'COFFEE & CODE',
    bgGrad: 'from-amber-600 to-orange-600',
    borderColor: 'border-amber-300',
    textColor: 'text-white',
  },
  speed_demon: {
    emoji: '⚡',
    text: 'O(1) SPEED DEMON',
    bgGrad: 'from-yellow-400 via-amber-500 to-rose-500',
    borderColor: 'border-yellow-200',
    textColor: 'text-slate-950',
  },
  brute_force: {
    emoji: '🔨',
    text: 'BRUTE FORCE ENJOYER',
    bgGrad: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-300',
    textColor: 'text-white',
  },
  speedrun_1600: {
    emoji: '🚀',
    text: '1600 SPEEDRUN',
    bgGrad: 'from-cyan-500 via-blue-600 to-indigo-600',
    borderColor: 'border-cyan-300',
    textColor: 'text-white',
  },
  ac_first_try: {
    emoji: '🎯',
    text: 'ACCEPTED ON TRY 1',
    bgGrad: 'from-emerald-400 to-green-600',
    borderColor: 'border-green-200',
    textColor: 'text-slate-950',
  },
  climb_champ: {
    emoji: '👑',
    text: 'CLIMB CHAMPION',
    bgGrad: 'from-amber-400 via-amber-500 to-yellow-500',
    borderColor: 'border-amber-300',
    textColor: 'text-slate-950',
  },
  level_up: {
    emoji: '⭐',
    text: 'LEVEL UP',
    bgGrad: 'from-indigo-500 via-purple-500 to-pink-500',
    borderColor: 'border-indigo-300',
    textColor: 'text-white',
  },
};

export const FunnyStickerBadge: React.FC<StickerProps> = ({
  type,
  className = '',
  tilt = 0,
  onClick,
}) => {
  const config = STICKER_CONFIGS[type] || STICKER_CONFIGS['1000_iq'];

  return (
    <div
      onClick={onClick}
      style={{ transform: `rotate(${tilt}deg)` }}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${config.bgGrad} ${config.textColor} ${config.textColor === 'text-white' ? 'keep-white' : ''} border-2 ${config.borderColor} shadow-md shadow-black/15 font-black text-[11px] tracking-wide uppercase select-none transition-all hover:scale-110 hover:shadow-lg active:scale-95 cursor-pointer ${className}`}
    >
      {/* Tape on top corner */}
      <span className="absolute -top-1.5 left-2 w-5 h-2 bg-white/40 rounded-[2px] transform -rotate-12 backdrop-blur-xs" />
      <span>{config.emoji}</span>
      <span>{config.text}</span>
    </div>
  );
};

// ============================================================================
// 3. FUNNY DEVELOPER JOKES & MOTIVATION QUIPS
// ============================================================================

export const FUNNY_QUOTES: {
  quote: string;
  author: string;
  moodEmoji: string;
}[] = [
  {
    quote: "There are 10 types of people: those who get Accepted, and those who TLE.",
    author: "Climby the Yeti",
    moodEmoji: "🚀",
  },
  {
    quote: "Why do programmers wear glasses? Because they don't C#!",
    author: "Byte the Cat",
    moodEmoji: "🤓",
  },
  {
    quote: "A binary search a day keeps the Time Limit Exceeded away.",
    author: "Algorithm Guru",
    moodEmoji: "⚡",
  },
  {
    quote: "My code worked on the first try and now I'm terrified something is deeply wrong.",
    author: "Relatable Coder",
    moodEmoji: "😱",
  },
  {
    quote: "Converting 4 shots of espresso into clean linear time algorithms.",
    author: "Coffee Sloth",
    moodEmoji: "☕",
  },
  {
    quote: "Codeforces Specialist rating is just 800 rating with 800 points of pure grit.",
    author: "Climb 1600 Wisdom",
    moodEmoji: "🏔️",
  },
  {
    quote: "Bugs fear you. Compilers obey you. Specialist title awaits you!",
    author: "Big Brain Dino",
    moodEmoji: "🦖",
  },
  {
    quote: "If brute force doesn't work, you're just not using enough CPU cycles.",
    author: "Hackerman",
    moodEmoji: "🔨",
  },
];
