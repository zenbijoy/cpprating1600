import React from 'react';

export type BadgeId =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'first_solve'
  | 'contest_hero'
  | 'top_10'
  | 'rising_star'
  | 'consistency'
  | 'master';

export interface BadgeProps {
  id?: BadgeId;
  size?: number | string;
  className?: string;
  unlocked?: boolean;
  showGlow?: boolean;
  title?: string;
  onClick?: () => void;
}

// 1. Beginner: Emerald Shield with upwards chevron and golden rim
export const BeginnerBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="bgShield" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#065f46" />
        <stop offset="50%" stopColor="#047857" />
        <stop offset="100%" stopColor="#022c22" />
      </linearGradient>
      <linearGradient id="goldRim" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
      <linearGradient id="emeraldChevron" x1="50" y1="35" x2="50" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      {showGlow && (
        <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      )}
    </defs>
    {/* Outer Gold Shield Rim */}
    <path
      d="M50 8L82 22V52C82 72 50 92 50 92C50 92 18 72 18 52V22L50 8Z"
      fill="url(#goldRim)"
      stroke="#ca8a04"
      strokeWidth="1.5"
    />
    {/* Inner Emerald Body */}
    <path
      d="M50 14L76 26V51C76 68 50 85 50 85C50 85 24 68 24 51V26L50 14Z"
      fill="url(#bgShield)"
    />
    {/* Central Ascending Chevron */}
    <path
      d="M50 30L68 46L62 52L50 42L38 52L32 46L50 30Z"
      fill="url(#emeraldChevron)"
      filter={showGlow ? 'url(#emeraldGlow)' : undefined}
    />
    <path
      d="M50 48L64 60L59 65L50 58L41 65L36 60L50 48Z"
      fill="url(#emeraldChevron)"
      opacity="0.85"
    />
    {/* Summit Sparkle */}
    <circle cx="50" cy="22" r="2.5" fill="#fef08a" />
  </svg>
);

// 2. Intermediate: Sapphire Blue Hexagon with Golden Rim and Wings
export const IntermediateBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="hexBlue" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="50%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="goldBorder" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="cyanStar" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      {showGlow && (
        <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      )}
    </defs>
    {/* Outer Hexagon Gold Frame */}
    <polygon
      points="50,6 88,28 88,72 50,94 12,72 12,28"
      fill="url(#goldBorder)"
      stroke="#b45309"
      strokeWidth="1.5"
    />
    {/* Inner Deep Blue Facet */}
    <polygon
      points="50,12 82,31 82,69 50,88 18,69 18,31"
      fill="url(#hexBlue)"
    />
    {/* Cyan Faceted Core */}
    <polygon
      points="50,22 74,36 74,64 50,78 26,64 26,36"
      fill="#0284c7"
      opacity="0.3"
    />
    {/* Five-point Star Emblem */}
    <polygon
      points="50,28 55,42 70,42 58,51 62,66 50,56 38,66 42,51 30,42 45,42"
      fill="url(#cyanStar)"
      filter={showGlow ? 'url(#blueGlow)' : undefined}
    />
    <circle cx="50" cy="50" r="3" fill="#ffffff" />
  </svg>
);

// 3. Advanced: Magenta/Violet Crystal Rocket with Golden Crest
export const AdvancedBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="magBg" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4c1d95" />
        <stop offset="50%" stopColor="#831843" />
        <stop offset="100%" stopColor="#18181b" />
      </linearGradient>
      <linearGradient id="rocketGrad" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <linearGradient id="goldWing" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    {/* Shield Base */}
    <path
      d="M50 8C74 8 88 18 88 44C88 68 62 86 50 94C38 86 12 68 12 44C12 18 26 8 50 8Z"
      fill="url(#goldWing)"
      stroke="#ca8a04"
      strokeWidth="1.5"
    />
    <path
      d="M50 14C70 14 82 22 82 44C82 65 59 81 50 88C41 81 18 65 18 44C18 22 30 14 50 14Z"
      fill="url(#magBg)"
    />
    {/* Rocket Body */}
    <path
      d="M50 24C44 34 42 46 42 58L50 54L58 58C58 46 56 34 50 24Z"
      fill="url(#rocketGrad)"
    />
    {/* Rocket Wings */}
    <path d="M42 50L30 62L40 64L42 54Z" fill="url(#goldWing)" />
    <path d="M58 50L70 62L60 64L58 54Z" fill="url(#goldWing)" />
    {/* Rocket Thruster Flame */}
    <path d="M46 58L50 74L54 58Z" fill="#facc15" />
    <circle cx="50" cy="40" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

// 4. Streak 7: Golden Flame Medallion with Amber Fire Core
export const Streak7Badge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="goldMedal" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="fireCore" x1="50" y1="25" x2="50" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    {/* Laurel Ring */}
    <circle cx="50" cy="50" r="42" fill="url(#goldMedal)" stroke="#ca8a04" strokeWidth="2" />
    <circle cx="50" cy="50" r="35" fill="#181512" stroke="#d97706" strokeWidth="1" />
    {/* Laurel Leaves around edges */}
    <path d="M22 45C20 40 22 34 27 34C28 39 26 44 22 45Z" fill="#fbbf24" />
    <path d="M20 56C18 51 21 46 26 47C26 52 23 56 20 56Z" fill="#fbbf24" />
    <path d="M78 45C80 40 78 34 73 34C72 39 74 44 78 45Z" fill="#fbbf24" />
    <path d="M80 56C82 51 79 46 74 47C74 52 77 56 80 56Z" fill="#fbbf24" />
    {/* Burning Flame Motif */}
    <path
      d="M50 24C46 36 34 44 34 56C34 66 41 72 50 72C59 72 66 66 66 56C66 46 58 38 56 32C54 40 50 44 47 44C49 38 52 32 50 24Z"
      fill="url(#fireCore)"
    />
    <path
      d="M50 48C46 54 44 58 44 62C44 66 47 69 50 69C53 69 56 66 56 62C56 58 52 54 50 48Z"
      fill="#fef08a"
    />
  </svg>
);

// 5. Streak 30: Royal Laurel Crown Star Emblem
export const Streak30Badge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="goldCrown" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="40%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="royalTeal" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="50%" stopColor="#0f766e" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
    </defs>
    {/* Laurel Wreath Crown */}
    <circle cx="50" cy="50" r="44" fill="url(#goldCrown)" />
    <circle cx="50" cy="50" r="36" fill="url(#royalTeal)" stroke="#fef08a" strokeWidth="2" />
    {/* Central Golden Star */}
    <polygon
      points="50,26 56,42 72,42 59,52 64,68 50,58 36,68 41,52 28,42 44,42"
      fill="url(#goldCrown)"
      stroke="#ca8a04"
      strokeWidth="1"
    />
    <circle cx="50" cy="50" r="4" fill="#ffffff" />
  </svg>
);

// 6. Streak 100: Winged Golden Crest with Blazing Core
export const Streak100Badge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="wingedGold" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="blazeRed" x1="50" y1="20" x2="50" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#facc15" />
        <stop offset="50%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
    {/* Wings */}
    <path
      d="M10 38C18 30 30 28 42 36L44 48C32 44 20 48 10 58V38Z"
      fill="url(#wingedGold)"
    />
    <path
      d="M90 38C82 30 70 28 58 36L56 48C68 44 80 48 90 58V38Z"
      fill="url(#wingedGold)"
    />
    {/* Central Shield */}
    <path
      d="M50 16L74 28V54C74 72 50 88 50 88C50 88 26 72 26 54V28L50 16Z"
      fill="url(#wingedGold)"
      stroke="#b45309"
      strokeWidth="2"
    />
    <path
      d="M50 22L68 32V53C68 67 50 80 50 80C50 80 32 67 32 53V32L50 22Z"
      fill="#1c1917"
    />
    {/* Blazing Flame Core */}
    <path
      d="M50 30C46 40 38 46 38 56C38 64 43 69 50 69C57 69 62 64 62 56C62 48 56 42 54 36C52 42 50 44 47 44C49 39 52 35 50 30Z"
      fill="url(#blazeRed)"
    />
  </svg>
);

// 7. First Solve: Cyan Glowing Diamond with Violet Rim
export const FirstSolveBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="diamondCyan" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a5f3fc" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
      <linearGradient id="diamondRim" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#312e81" />
      </linearGradient>
      {showGlow && (
        <filter id="cyanSpark" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      )}
    </defs>
    {/* Outer Diamond */}
    <polygon
      points="50,10 90,50 50,90 10,50"
      fill="url(#diamondRim)"
      stroke="#c084fc"
      strokeWidth="2"
    />
    {/* Inner Diamond */}
    <polygon
      points="50,18 82,50 50,82 18,50"
      fill="#0c1022"
    />
    {/* Speed Lines / Solve Stripes */}
    <rect x="32" y="38" width="36" height="4" rx="2" fill="url(#diamondCyan)" />
    <rect x="38" y="48" width="24" height="4" rx="2" fill="url(#diamondCyan)" />
    <rect x="44" y="58" width="12" height="4" rx="2" fill="url(#diamondCyan)" />
    {/* Top Sparkle */}
    <circle cx="50" cy="18" r="3" fill="#ffffff" filter={showGlow ? 'url(#cyanSpark)' : undefined} />
  </svg>
);

// 8. Contest Hero: Golden Gear Border with Glowing Cyber Eye
export const ContestHeroBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="gearGold" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <radialGradient id="cyberIris" cx="50" cy="50" r="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="40%" stopColor="#8b5cf6" />
        <stop offset="80%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#0b0f19" />
      </radialGradient>
    </defs>
    {/* Cog/Gear Outer Teeth (12 points) */}
    <circle cx="50" cy="50" r="42" fill="url(#gearGold)" stroke="#ca8a04" strokeWidth="2" />
    <circle cx="50" cy="50" r="34" fill="#111827" stroke="#fbbf24" strokeWidth="1.5" />
    {/* Glowing Cyber Iris */}
    <circle cx="50" cy="50" r="26" fill="url(#cyberIris)" />
    <circle cx="50" cy="50" r="16" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
    <circle cx="50" cy="50" r="7" fill="#ffffff" />
    {/* Target Crosshairs */}
    <path d="M50 14V22 M50 78V86 M14 50H22 M78 50H86" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 9. Top 10%: Emerald Ribbon / Double Wheat Stalk
export const Top10Badge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="wheatGold" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="emeraldLeaf" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="60%" stopColor="#059669" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
    </defs>
    {/* Central Stem */}
    <path d="M50 20V80" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
    {/* Left Foliage */}
    <path d="M50 30C40 25 32 30 36 40C42 42 48 36 50 30Z" fill="url(#emeraldLeaf)" />
    <path d="M50 44C38 38 30 46 34 56C42 58 48 50 50 44Z" fill="url(#wheatGold)" />
    <path d="M50 58C38 52 32 60 36 68C42 70 48 64 50 58Z" fill="url(#emeraldLeaf)" />
    {/* Right Foliage */}
    <path d="M50 30C60 25 68 30 64 40C58 42 52 36 50 30Z" fill="url(#emeraldLeaf)" />
    <path d="M50 44C62 38 70 46 66 56C58 58 52 50 50 44Z" fill="url(#wheatGold)" />
    <path d="M50 58C62 52 68 60 64 68C58 70 52 64 50 58Z" fill="url(#emeraldLeaf)" />
    {/* Crown Spire */}
    <polygon points="50,14 55,24 45,24" fill="#fef08a" />
  </svg>
);

// 10. Rising Star: 3D Golden Faceted Chevron Star
export const RisingStarBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="starFacetL" x1="20" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="50%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
      <linearGradient id="starFacetR" x1="50" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="50%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
    </defs>
    {/* Left Wing / Chevron */}
    <polygon points="50,16 20,70 34,78 50,56" fill="url(#starFacetL)" />
    {/* Right Wing / Chevron */}
    <polygon points="50,16 50,56 66,78 80,70" fill="url(#starFacetR)" />
    {/* Bottom Tail */}
    <polygon points="50,56 40,84 50,78 60,84" fill="#b45309" />
    {/* Apex Core Highlight */}
    <circle cx="50" cy="18" r="3" fill="#ffffff" />
  </svg>
);

// 11. Consistency: Interlocking Cyan-Emerald Shield Knot
export const ConsistencyBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="conRim" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
      <linearGradient id="conCyan" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="conEmerald" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Outer Shield Rim */}
    <path
      d="M50 10L84 26V54C84 74 50 90 50 90C50 90 16 74 16 54V26L50 10Z"
      fill="url(#conRim)"
      stroke="#b45309"
      strokeWidth="2"
    />
    <path
      d="M50 16L78 30V53C78 69 50 83 50 83C50 83 22 69 22 53V30L50 16Z"
      fill="#0b0f19"
    />
    {/* Interlocking Chevrons */}
    <path
      d="M50 28L68 44L58 52L50 44L42 52L32 44L50 28Z"
      fill="url(#conEmerald)"
    />
    <path
      d="M50 46L66 60L58 66L50 58L42 66L34 60L50 46Z"
      fill="url(#conCyan)"
    />
  </svg>
);

// 12. Master: Regal Purple Diamond Crest with Golden Wings
export const MasterBadge: React.FC<Omit<BadgeProps, 'id'>> = ({
  size = 64,
  className = '',
  unlocked = true,
  showGlow = true,
  onClick,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={`inline-block select-none transition-transform duration-300 hover:scale-110 ${
      !unlocked ? 'opacity-40 grayscale' : ''
    } ${className}`}
    onClick={onClick}
  >
    <defs>
      <linearGradient id="royalPurple" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
      <linearGradient id="royalGoldWings" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      {showGlow && (
        <filter id="masterGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      )}
    </defs>
    {/* Golden Wing Tips */}
    <path d="M14 36L30 30L34 44L18 46Z" fill="url(#royalGoldWings)" />
    <path d="M86 36L70 30L66 44L82 46Z" fill="url(#royalGoldWings)" />
    {/* Central Crown Diamond */}
    <polygon
      points="50,8 86,50 50,92 14,50"
      fill="url(#royalGoldWings)"
      stroke="#b45309"
      strokeWidth="2"
    />
    <polygon
      points="50,15 80,50 50,85 20,50"
      fill="url(#royalPurple)"
      filter={showGlow ? 'url(#masterGlow)' : undefined}
    />
    {/* Inner Diamond Core Facet */}
    <polygon
      points="50,26 70,50 50,74 30,50"
      fill="#fae8ff"
      opacity="0.4"
    />
    <circle cx="50" cy="50" r="5" fill="#ffffff" />
  </svg>
);

// Unified Badge Renderer
export const ClimbBadge: React.FC<BadgeProps> = ({ id = 'beginner', ...props }) => {
  switch (id) {
    case 'beginner':
      return <BeginnerBadge {...props} />;
    case 'intermediate':
      return <IntermediateBadge {...props} />;
    case 'advanced':
      return <AdvancedBadge {...props} />;
    case 'streak_7':
      return <Streak7Badge {...props} />;
    case 'streak_30':
      return <Streak30Badge {...props} />;
    case 'streak_100':
      return <Streak100Badge {...props} />;
    case 'first_solve':
      return <FirstSolveBadge {...props} />;
    case 'contest_hero':
      return <ContestHeroBadge {...props} />;
    case 'top_10':
      return <Top10Badge {...props} />;
    case 'rising_star':
      return <RisingStarBadge {...props} />;
    case 'consistency':
      return <ConsistencyBadge {...props} />;
    case 'master':
      return <MasterBadge {...props} />;
    default:
      return <BeginnerBadge {...props} />;
  }
};
