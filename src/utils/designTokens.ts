/**
 * CLIMB 1600 — Semantic Design Tokens
 * Upgraded vibrant visual identity system inspired by the CLIMB 1600 reference board:
 * Electric blue, cyber purple, ocean breeze cyan, sunset gold, vibrant magenta, and forest green.
 */

export interface ColorToken {
  hex: string;
  rgb: string;
  hsl?: string;
  label: string;
}

export const BRAND_PALETTE = {
  mountainBlue: {
    hex: '#6366f1',
    rgb: '99, 102, 241',
    label: 'Mountain Blue (Indigo)',
    lightHex: '#4f46e5',
    gradient: 'from-indigo-600 via-blue-600 to-cyan-400',
  },
  sunsetGold: {
    hex: '#f59e0b',
    rgb: '245, 158, 11',
    label: 'Sunset Gold (Amber)',
    lightHex: '#d97706',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
  },
  cyberPurple: {
    hex: '#8b5cf6',
    rgb: '139, 92, 246',
    label: 'Cyber Purple (Violet)',
    lightHex: '#7c3aed',
    gradient: 'from-violet-600 via-purple-600 to-pink-500',
  },
  oceanBreeze: {
    hex: '#06b6d4',
    rgb: '6, 182, 212',
    label: 'Ocean Breeze (Cyan)',
    lightHex: '#0891b2',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-400',
  },
  forestGreen: {
    hex: '#10b981',
    rgb: '16, 185, 129',
    label: 'Forest Green (Emerald)',
    lightHex: '#059669',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  vibrantPink: {
    hex: '#ec4899',
    rgb: '236, 72, 153',
    label: 'Vibrant Pink (Magenta)',
    lightHex: '#db2777',
    gradient: 'from-pink-500 via-rose-500 to-purple-600',
  },
} as const;

export const GRADIENTS = {
  mountainBlue: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)',
  sunsetGold: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 50%, #ef4444 100%)',
  cyberPurple: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
  oceanBreeze: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #3b82f6 100%)',
  forestGreen: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
  vibrantPink: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #8b5cf6 100%)',
  summitHero: 'linear-gradient(135deg, #0b0f19 0%, #1a103c 45%, #0e1e38 85%, #061325 100%)',
  summitSunrise: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.12) 50%, rgba(245, 158, 11, 0.08) 100%)',
  glassCard: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
  glassBorder: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 100%)',
} as const;

export const NEON_GLOWS = {
  blue: '0 0 20px rgba(99, 102, 241, 0.35), 0 0 40px rgba(99, 102, 241, 0.15)',
  cyan: '0 0 20px rgba(6, 182, 212, 0.35), 0 0 40px rgba(6, 182, 212, 0.15)',
  purple: '0 0 20px rgba(139, 92, 246, 0.35), 0 0 40px rgba(139, 92, 246, 0.15)',
  amber: '0 0 20px rgba(245, 158, 11, 0.35), 0 0 40px rgba(245, 158, 11, 0.15)',
  pink: '0 0 20px rgba(236, 72, 153, 0.35), 0 0 40px rgba(236, 72, 153, 0.15)',
  emerald: '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',
} as const;

export const SURFACES = {
  dark: {
    app: '#0b0f19',
    surface: '#111827',
    card: '#1e293b',
    cardHover: '#26334a',
    cardElevated: '#1e293b',
    glassBg: 'rgba(17, 24, 39, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    nav: '#0f172a',
    navBorder: 'rgba(255, 255, 255, 0.08)',
  },
  light: {
    app: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    cardHover: '#f1f5f9',
    cardElevated: '#ffffff',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    nav: '#ffffff',
    navBorder: 'rgba(0, 0, 0, 0.06)',
  },
} as const;

export const SEMANTIC_FEEDBACK = {
  success: {
    hex: '#10b981',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  warning: {
    hex: '#f59e0b',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  error: {
    hex: '#ef4444',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  info: {
    hex: '#3b82f6',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
} as const;

export const RATING_TIERS = {
  newbie: {
    name: 'Newbie',
    min: 0,
    max: 1199,
    color: '#94a3b8',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    gradient: 'from-slate-500 to-slate-400',
  },
  pupil: {
    name: 'Pupil',
    min: 1200,
    max: 1399,
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500 to-teal-400',
  },
  specialist: {
    name: 'Specialist',
    min: 1400,
    max: 1599,
    color: '#06b6d4',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-500 to-blue-500',
  },
  expert: {
    name: 'Expert',
    min: 1600,
    max: 1899,
    color: '#6366f1',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
  },
} as const;

export const ACHIEVEMENT_TIERS_DESIGN = {
  bronze: {
    label: 'Bronze',
    hex: '#d97706',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    glow: 'rgba(217, 119, 6, 0.3)',
    border: '#b45309',
    badgeClass: 'from-amber-900/40 via-amber-800/30 to-amber-950/40 border-amber-600/50 text-amber-300',
  },
  silver: {
    label: 'Silver',
    hex: '#cbd5e1',
    gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #e2e8f0 100%)',
    glow: 'rgba(203, 213, 225, 0.3)',
    border: '#94a3b8',
    badgeClass: 'from-slate-700/40 via-slate-600/30 to-slate-800/40 border-slate-400/50 text-slate-200',
  },
  gold: {
    label: 'Gold',
    hex: '#eab308',
    gradient: 'linear-gradient(135deg, #ca8a04 0%, #eab308 50%, #fef08a 100%)',
    glow: 'rgba(234, 179, 8, 0.35)',
    border: '#eab308',
    badgeClass: 'from-yellow-600/30 via-amber-500/20 to-yellow-700/30 border-yellow-400/60 text-yellow-300',
  },
  platinum: {
    label: 'Platinum',
    hex: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #a5f3fc 100%)',
    glow: 'rgba(6, 182, 212, 0.4)',
    border: '#06b6d4',
    badgeClass: 'from-cyan-600/30 via-sky-500/20 to-teal-700/30 border-cyan-400/60 text-cyan-200',
  },
  diamond: {
    label: 'Diamond',
    hex: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #ddd6fe 100%)',
    glow: 'rgba(139, 92, 246, 0.4)',
    border: '#8b5cf6',
    badgeClass: 'from-violet-600/30 via-purple-500/20 to-fuchsia-700/30 border-violet-400/60 text-violet-200',
  },
  master: {
    label: 'Master',
    hex: '#ec4899',
    gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 50%, #fbcfe8 100%)',
    glow: 'rgba(236, 72, 153, 0.45)',
    border: '#ec4899',
    badgeClass: 'from-pink-600/30 via-rose-500/20 to-purple-800/30 border-pink-400/60 text-pink-200',
  },
} as const;
