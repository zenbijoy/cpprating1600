import {
  AppearanceMode,
  BorderRadiusOption,
  FontFamilyOption,
  FontScaleOption,
  InterfaceDensity,
  ThemeColors,
  ThemeConfig,
  ThemePresetId,
} from '../types/settings';

export const THEME_PRESETS: Record<
  ThemePresetId,
  {
    name: string;
    description: string;
    dark: ThemeColors;
    light: ThemeColors;
  }
> = {
  'climb-default': {
    name: 'CLIMB Default',
    description: 'The signature CLIMB 1600 slate & electric indigo CP theme.',
    dark: {
      bgApp: '#0b0f19',
      bgSurface: '#111827',
      bgCard: '#1e293b',
      bgNav: '#0f172a',
      border: '#334155',
      borderSubtle: '#1e293b',
      borderFocus: '#6366f1',
      primary: '#6366f1',
      secondary: '#06b6d4',
      textMain: '#f8fafc',
      textMuted: '#94a3b8',
      textSubtle: '#64748b',
      accentGlow: 'rgba(99, 102, 241, 0.25)',
    },
    light: {
      bgApp: '#f8fafc',
      bgSurface: '#ffffff',
      bgCard: '#f1f5f9',
      bgNav: '#ffffff',
      border: '#e2e8f0',
      borderSubtle: '#cbd5e1',
      borderFocus: '#4f46e5',
      primary: '#4f46e5',
      secondary: '#0891b2',
      textMain: '#0f172a',
      textMuted: '#64748b',
      textSubtle: '#94a3b8',
      accentGlow: 'rgba(79, 70, 229, 0.15)',
    },
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep sapphire and obsidian black for intense late-night coding.',
    dark: {
      bgApp: '#070913',
      bgSurface: '#0c1022',
      bgCard: '#151c36',
      bgNav: '#090d1f',
      border: '#1e294b',
      borderSubtle: '#141d38',
      borderFocus: '#3b82f6',
      primary: '#3b82f6',
      secondary: '#60a5fa',
      textMain: '#f8fafc',
      textMuted: '#94a3b8',
      textSubtle: '#64748b',
      accentGlow: 'rgba(59, 130, 246, 0.25)',
    },
    light: {
      bgApp: '#f0f4ff',
      bgSurface: '#ffffff',
      bgCard: '#e6edfc',
      bgNav: '#ffffff',
      border: '#c7d7f7',
      borderSubtle: '#dbeafe',
      borderFocus: '#2563eb',
      primary: '#2563eb',
      secondary: '#0284c7',
      textMain: '#09142e',
      textMuted: '#475569',
      textSubtle: '#94a3b8',
      accentGlow: 'rgba(37, 99, 235, 0.15)',
    },
  },
  'cyber-matrix': {
    name: '👾 Cyber Hacker 1337',
    description: "I'm in! Phosphor neon green terminal matrix glow.",
    dark: {
      bgApp: '#040d06',
      bgSurface: '#08170c',
      bgCard: '#0d2212',
      bgNav: '#051208',
      border: '#104d22',
      borderSubtle: '#092b13',
      borderFocus: '#00ff66',
      primary: '#00ff66',
      secondary: '#00e5ff',
      textMain: '#f0fff4',
      textMuted: '#86efac',
      textSubtle: '#4ade80',
      accentGlow: 'rgba(0, 255, 102, 0.35)',
    },
    light: {
      bgApp: '#f0fdf4',
      bgSurface: '#ffffff',
      bgCard: '#dcfce7',
      bgNav: '#ffffff',
      border: '#86efac',
      borderSubtle: '#bbf7d0',
      borderFocus: '#16a34a',
      primary: '#16a34a',
      secondary: '#0284c7',
      textMain: '#052e16',
      textMuted: '#166534',
      textSubtle: '#15803d',
      accentGlow: 'rgba(22, 163, 74, 0.2)',
    },
  },
  'candy-pop': {
    name: '🍭 Bubblegum Candy Pop',
    description: 'Sweet sugar-rush algorithms with marshmallow pink & cyan.',
    dark: {
      bgApp: '#190a16',
      bgSurface: '#260f22',
      bgCard: '#381632',
      bgNav: '#1e0c1a',
      border: '#6b1d5c',
      borderSubtle: '#4a1440',
      borderFocus: '#f472b6',
      primary: '#f472b6',
      secondary: '#38bdf8',
      textMain: '#fdf2f8',
      textMuted: '#fbcfe8',
      textSubtle: '#f472b6',
      accentGlow: 'rgba(244, 114, 182, 0.35)',
    },
    light: {
      bgApp: '#fff1f2',
      bgSurface: '#ffffff',
      bgCard: '#ffe4e6',
      bgNav: '#ffffff',
      border: '#fecdd3',
      borderSubtle: '#ffe4e6',
      borderFocus: '#e11d48',
      primary: '#e11d48',
      secondary: '#0284c7',
      textMain: '#4c0519',
      textMuted: '#9f1239',
      textSubtle: '#be123c',
      accentGlow: 'rgba(225, 29, 72, 0.15)',
    },
  },
  'kawaii-anime': {
    name: '🌸 Kawaii Anime Chibi',
    description: 'Cute anime aesthetics, sakura lavender, and cat-ear coding energy.',
    dark: {
      bgApp: '#150d24',
      bgSurface: '#201336',
      bgCard: '#2d1b4c',
      bgNav: '#190e2b',
      border: '#532b85',
      borderSubtle: '#371c59',
      borderFocus: '#c084fc',
      primary: '#c084fc',
      secondary: '#fb7185',
      textMain: '#faf5ff',
      textMuted: '#e9d5ff',
      textSubtle: '#d8b4fe',
      accentGlow: 'rgba(192, 132, 252, 0.35)',
    },
    light: {
      bgApp: '#faf5ff',
      bgSurface: '#ffffff',
      bgCard: '#f3e8ff',
      bgNav: '#ffffff',
      border: '#e9d5ff',
      borderSubtle: '#f5d0fe',
      borderFocus: '#9333ea',
      primary: '#9333ea',
      secondary: '#e11d48',
      textMain: '#3b0764',
      textMuted: '#7e22ce',
      textSubtle: '#a855f7',
      accentGlow: 'rgba(147, 51, 234, 0.15)',
    },
  },
  'retro-arcade': {
    name: '🕹️ 80s Synthwave Arcade',
    description: 'Neon laser grids, sunset magenta, and 8-bit coin-op retro vibes.',
    dark: {
      bgApp: '#12071f',
      bgSurface: '#1e0b33',
      bgCard: '#2c104a',
      bgNav: '#160826',
      border: '#6b1b7b',
      borderSubtle: '#451050',
      borderFocus: '#f43f5e',
      primary: '#f43f5e',
      secondary: '#fbbf24',
      textMain: '#fff1f2',
      textMuted: '#fbcfe8',
      textSubtle: '#fda4af',
      accentGlow: 'rgba(244, 63, 94, 0.35)',
    },
    light: {
      bgApp: '#fff7ed',
      bgSurface: '#ffffff',
      bgCard: '#ffedd5',
      bgNav: '#ffffff',
      border: '#fed7aa',
      borderSubtle: '#ffedd5',
      borderFocus: '#ea580c',
      primary: '#ea580c',
      secondary: '#8b5cf6',
      textMain: '#431407',
      textMuted: '#9a3412',
      textSubtle: '#c2410c',
      accentGlow: 'rgba(234, 88, 12, 0.15)',
    },
  },
  'galaxy-space': {
    name: '🚀 Cosmic Galaxy Cadet',
    description: 'Deep space nebula, twinkling constellations, and rocket to 1600.',
    dark: {
      bgApp: '#09081a',
      bgSurface: '#100f2e',
      bgCard: '#181745',
      bgNav: '#0c0b22',
      border: '#2f2c73',
      borderSubtle: '#1f1d4f',
      borderFocus: '#38bdf8',
      primary: '#38bdf8',
      secondary: '#a855f7',
      textMain: '#f0f9ff',
      textMuted: '#bae6fd',
      textSubtle: '#7dd3fc',
      accentGlow: 'rgba(56, 189, 248, 0.35)',
    },
    light: {
      bgApp: '#f0f9ff',
      bgSurface: '#ffffff',
      bgCard: '#e0f2fe',
      bgNav: '#ffffff',
      border: '#bae6fd',
      borderSubtle: '#e0f2fe',
      borderFocus: '#0284c7',
      primary: '#0284c7',
      secondary: '#7c3aed',
      textMain: '#082f49',
      textMuted: '#0369a1',
      textSubtle: '#0284c7',
      accentGlow: 'rgba(2, 132, 199, 0.15)',
    },
  },
  'jungle-safari': {
    name: '🌴 Jungle Safari Explorer',
    description: 'Dense rainforest bamboo, tropical mango, and wild bug hunting.',
    dark: {
      bgApp: '#06170d',
      bgSurface: '#0b2615',
      bgCard: '#113820',
      bgNav: '#081e11',
      border: '#1f5934',
      borderSubtle: '#143d23',
      borderFocus: '#10b981',
      primary: '#10b981',
      secondary: '#f59e0b',
      textMain: '#ecfdf5',
      textMuted: '#a7f3d0',
      textSubtle: '#6ee7b7',
      accentGlow: 'rgba(16, 185, 129, 0.35)',
    },
    light: {
      bgApp: '#f0fdf4',
      bgSurface: '#ffffff',
      bgCard: '#dcfce7',
      bgNav: '#ffffff',
      border: '#bbf7d0',
      borderSubtle: '#dcfce7',
      borderFocus: '#059669',
      primary: '#059669',
      secondary: '#d97706',
      textMain: '#064e3b',
      textMuted: '#15803d',
      textSubtle: '#16a34a',
      accentGlow: 'rgba(5, 150, 105, 0.15)',
    },
  },
  'coffee-overdrive': {
    name: '☕ Caffeine Overdrive',
    description: 'Triple espresso fuel, dark roasted mocha, and caramel code speed.',
    dark: {
      bgApp: '#160d08',
      bgSurface: '#24150d',
      bgCard: '#331e13',
      bgNav: '#1c100a',
      border: '#5c331d',
      borderSubtle: '#3e2213',
      borderFocus: '#f59e0b',
      primary: '#f59e0b',
      secondary: '#fb923c',
      textMain: '#fffbeb',
      textMuted: '#fed7aa',
      textSubtle: '#fcd34d',
      accentGlow: 'rgba(245, 158, 11, 0.35)',
    },
    light: {
      bgApp: '#fffbeb',
      bgSurface: '#ffffff',
      bgCard: '#fef3c7',
      bgNav: '#ffffff',
      border: '#fde68a',
      borderSubtle: '#fef3c7',
      borderFocus: '#b45309',
      primary: '#b45309',
      secondary: '#ea580c',
      textMain: '#451a03',
      textMuted: '#78350f',
      textSubtle: '#92400e',
      accentGlow: 'rgba(180, 83, 9, 0.15)',
    },
  },
  'dragon-fire': {
    name: '🔥 Dragon Slayer Beast',
    description: 'Blazing volcanic magma, molten crimson, and unstoppable fire.',
    dark: {
      bgApp: '#180707',
      bgSurface: '#270c0c',
      bgCard: '#3a1111',
      bgNav: '#1f0909',
      border: '#691c1c',
      borderSubtle: '#471313',
      borderFocus: '#ef4444',
      primary: '#ef4444',
      secondary: '#f97316',
      textMain: '#fef2f2',
      textMuted: '#fecaca',
      textSubtle: '#f87171',
      accentGlow: 'rgba(239, 68, 68, 0.35)',
    },
    light: {
      bgApp: '#fff1f2',
      bgSurface: '#ffffff',
      bgCard: '#ffe4e6',
      bgNav: '#ffffff',
      border: '#fecdd3',
      borderSubtle: '#ffe4e6',
      borderFocus: '#dc2626',
      primary: '#dc2626',
      secondary: '#ea580c',
      textMain: '#450a0a',
      textMuted: '#991b1b',
      textSubtle: '#b91c1c',
      accentGlow: 'rgba(220, 38, 38, 0.15)',
    },
  },
  amoled: {
    name: 'AMOLED Black',
    description: 'Pure 0% luminance true black for OLED displays and battery savings.',
    dark: {
      bgApp: '#000000',
      bgSurface: '#09090b',
      bgCard: '#121215',
      bgNav: '#000000',
      border: '#27272a',
      borderSubtle: '#18181b',
      borderFocus: '#38bdf8',
      primary: '#38bdf8',
      secondary: '#818cf8',
      textMain: '#ffffff',
      textMuted: '#a1a1aa',
      textSubtle: '#71717a',
      accentGlow: 'rgba(56, 189, 248, 0.2)',
    },
    light: {
      bgApp: '#ffffff',
      bgSurface: '#fafafa',
      bgCard: '#f4f4f5',
      bgNav: '#ffffff',
      border: '#d4d4d8',
      borderSubtle: '#e4e4e7',
      borderFocus: '#0284c7',
      primary: '#0284c7',
      secondary: '#4f46e5',
      textMain: '#09090b',
      textMuted: '#52525b',
      textSubtle: '#a1a1aa',
      accentGlow: 'rgba(2, 132, 199, 0.15)',
    },
  },
  ocean: {
    name: 'Ocean',
    description: 'Refreshing cyan and deep nautical teal tones.',
    dark: {
      bgApp: '#061325',
      bgSurface: '#0a1c36',
      bgCard: '#102a4e',
      bgNav: '#07162b',
      border: '#1e3e6b',
      borderSubtle: '#142d4f',
      borderFocus: '#06b6d4',
      primary: '#06b6d4',
      secondary: '#14b8a6',
      textMain: '#f0fdfa',
      textMuted: '#99f6e4',
      textSubtle: '#5eead4',
      accentGlow: 'rgba(6, 182, 212, 0.25)',
    },
    light: {
      bgApp: '#f0fdfa',
      bgSurface: '#ffffff',
      bgCard: '#ccfbf1',
      bgNav: '#ffffff',
      border: '#99f6e4',
      borderSubtle: '#e0f2fe',
      borderFocus: '#0891b2',
      primary: '#0891b2',
      secondary: '#0d9488',
      textMain: '#134e4a',
      textMuted: '#115e59',
      textSubtle: '#2dd4bf',
      accentGlow: 'rgba(8, 145, 178, 0.15)',
    },
  },
  forest: {
    name: 'Forest',
    description: 'Calm evergreen pines, botanical jade, and mint highlights.',
    dark: {
      bgApp: '#051a12',
      bgSurface: '#09261b',
      bgCard: '#0f3828',
      bgNav: '#071f16',
      border: '#1a4f3a',
      borderSubtle: '#123929',
      borderFocus: '#10b981',
      primary: '#10b981',
      secondary: '#34d399',
      textMain: '#f0fdf4',
      textMuted: '#a7f3d0',
      textSubtle: '#6ee7b7',
      accentGlow: 'rgba(16, 185, 129, 0.25)',
    },
    light: {
      bgApp: '#f0fdf4',
      bgSurface: '#ffffff',
      bgCard: '#dcfce7',
      bgNav: '#ffffff',
      border: '#bbf7d0',
      borderSubtle: '#d1fae5',
      borderFocus: '#059669',
      primary: '#059669',
      secondary: '#10b981',
      textMain: '#064e3b',
      textMuted: '#166534',
      textSubtle: '#15803d',
      accentGlow: 'rgba(5, 150, 105, 0.15)',
    },
  },
  violet: {
    name: 'Violet',
    description: 'Cosmic purple, royal amethyst, and glowing fuchsia accents.',
    dark: {
      bgApp: '#110b24',
      bgSurface: '#1a1236',
      bgCard: '#281b52',
      bgNav: '#140c2b',
      border: '#3b2975',
      borderSubtle: '#2b1b57',
      borderFocus: '#8b5cf6',
      primary: '#8b5cf6',
      secondary: '#ec4899',
      textMain: '#faf5ff',
      textMuted: '#d8b4fe',
      textSubtle: '#c084fc',
      accentGlow: 'rgba(139, 92, 246, 0.25)',
    },
    light: {
      bgApp: '#faf5ff',
      bgSurface: '#ffffff',
      bgCard: '#f3e8ff',
      bgNav: '#ffffff',
      border: '#e9d5ff',
      borderSubtle: '#f5d0fe',
      borderFocus: '#7c3aed',
      primary: '#7c3aed',
      secondary: '#db2777',
      textMain: '#3b0764',
      textMuted: '#6b21a8',
      textSubtle: '#a855f7',
      accentGlow: 'rgba(124, 58, 237, 0.15)',
    },
  },
  'warm-neutral': {
    name: 'Warm Neutral',
    description: 'Cozy dark earth, warm graphite, and amber bronze tones.',
    dark: {
      bgApp: '#181512',
      bgSurface: '#221e1a',
      bgCard: '#302b25',
      bgNav: '#1d1915',
      border: '#443d35',
      borderSubtle: '#332d26',
      borderFocus: '#f59e0b',
      primary: '#f59e0b',
      secondary: '#fb923c',
      textMain: '#fef3c7',
      textMuted: '#d97706',
      textSubtle: '#b45309',
      accentGlow: 'rgba(245, 158, 11, 0.25)',
    },
    light: {
      bgApp: '#fffbeb',
      bgSurface: '#ffffff',
      bgCard: '#fef3c7',
      bgNav: '#ffffff',
      border: '#fde68a',
      borderSubtle: '#fef3c7',
      borderFocus: '#d97706',
      primary: '#d97706',
      secondary: '#ea580c',
      textMain: '#451a03',
      textMuted: '#78350f',
      textSubtle: '#b45309',
      accentGlow: 'rgba(217, 119, 6, 0.15)',
    },
  },
  'high-contrast': {
    name: 'High Contrast',
    description: 'Maximized legibility with pure black/white backdrops and bold borders.',
    dark: {
      bgApp: '#000000',
      bgSurface: '#050505',
      bgCard: '#0f0f0f',
      bgNav: '#000000',
      border: '#ffffff',
      borderSubtle: '#d4d4d8',
      borderFocus: '#facc15',
      primary: '#facc15', // electric yellow
      secondary: '#38bdf8', // electric cyan
      textMain: '#ffffff',
      textMuted: '#e4e4e7',
      textSubtle: '#a1a1aa',
      accentGlow: 'rgba(250, 204, 21, 0.35)',
    },
    light: {
      bgApp: '#ffffff',
      bgSurface: '#ffffff',
      bgCard: '#ffffff',
      bgNav: '#ffffff',
      border: '#000000',
      borderSubtle: '#27272a',
      borderFocus: '#000000',
      primary: '#000000',
      secondary: '#0284c7',
      textMain: '#000000',
      textMuted: '#18181b',
      textSubtle: '#27272a',
      accentGlow: 'rgba(0, 0, 0, 0.2)',
    },
  },
  // =========================================================================
  // 24 NEW CARTOON & ANIME ENVIRONMENTS (TOTAL 40 PRESETS)
  // =========================================================================
  'mountain-summit': {
    name: '🏔️ Alpine Mountain Summit',
    description: 'Snow-capped peaks, crisp glacial blue winds, and sunrise summit victory.',
    dark: {
      bgApp: '#0a121f',
      bgSurface: '#111d33',
      bgCard: '#1b2a4a',
      bgNav: '#0c1524',
      border: '#2c426b',
      borderSubtle: '#182743',
      borderFocus: '#38bdf8',
      primary: '#38bdf8',
      secondary: '#facc15',
      textMain: '#f0f9ff',
      textMuted: '#93c5fd',
      textSubtle: '#60a5fa',
      accentGlow: 'rgba(56, 189, 248, 0.3)',
    },
    light: {
      bgApp: '#f0f9ff',
      bgSurface: '#ffffff',
      bgCard: '#e0f2fe',
      bgNav: '#ffffff',
      border: '#bae6fd',
      borderSubtle: '#e0f2fe',
      borderFocus: '#0284c7',
      primary: '#0284c7',
      secondary: '#d97706',
      textMain: '#082f49',
      textMuted: '#0369a1',
      textSubtle: '#0284c7',
      accentGlow: 'rgba(2, 132, 199, 0.15)',
    },
  },
  'sea-beach': {
    name: '🏖️ Tropical Sea Beach',
    description: 'Turquoise ocean waves, sunny golden sands, coconut breeze and coral reef vibes.',
    dark: {
      bgApp: '#051b24',
      bgSurface: '#092c3a',
      bgCard: '#0e3e52',
      bgNav: '#07212c',
      border: '#155e75',
      borderSubtle: '#0e4354',
      borderFocus: '#06b6d4',
      primary: '#06b6d4',
      secondary: '#f59e0b',
      textMain: '#ecfeff',
      textMuted: '#a5f3fc',
      textSubtle: '#67e8f9',
      accentGlow: 'rgba(6, 182, 212, 0.3)',
    },
    light: {
      bgApp: '#f0fdfa',
      bgSurface: '#ffffff',
      bgCard: '#ccfbf1',
      bgNav: '#ffffff',
      border: '#99f6e4',
      borderSubtle: '#ccfbf1',
      borderFocus: '#0d9488',
      primary: '#0d9488',
      secondary: '#ea580c',
      textMain: '#134e4a',
      textMuted: '#115e59',
      textSubtle: '#0f766e',
      accentGlow: 'rgba(13, 148, 136, 0.15)',
    },
  },
  'railway-express': {
    name: '🚂 Anime Railway Express',
    description: 'Sunset locomotive journey, click-clack tracks, amber lanterns, and travel romance.',
    dark: {
      bgApp: '#141018',
      bgSurface: '#221829',
      bgCard: '#33233d',
      bgNav: '#18111e',
      border: '#5b3b6e',
      borderSubtle: '#3a2446',
      borderFocus: '#f59e0b',
      primary: '#f59e0b',
      secondary: '#ec4899',
      textMain: '#fdf4ff',
      textMuted: '#e879f9',
      textSubtle: '#d946ef',
      accentGlow: 'rgba(245, 158, 11, 0.3)',
    },
    light: {
      bgApp: '#fdf4ff',
      bgSurface: '#ffffff',
      bgCard: '#fae8ff',
      bgNav: '#ffffff',
      border: '#f0abfc',
      borderSubtle: '#fae8ff',
      borderFocus: '#c026d3',
      primary: '#c026d3',
      secondary: '#d97706',
      textMain: '#4a044e',
      textMuted: '#86198f',
      textSubtle: '#a21caf',
      accentGlow: 'rgba(192, 38, 211, 0.15)',
    },
  },
  'jorna-waterfall': {
    name: '🌊 Emerald Jorna Waterfall',
    description: 'Cascading freshwater mountain springs, lush moss rocks, and sparkling misty pools.',
    dark: {
      bgApp: '#041814',
      bgSurface: '#072822',
      bgCard: '#0d3a31',
      bgNav: '#051f1a',
      border: '#115e51',
      borderSubtle: '#0b4339',
      borderFocus: '#10b981',
      primary: '#10b981',
      secondary: '#38bdf8',
      textMain: '#ecfdf5',
      textMuted: '#a7f3d0',
      textSubtle: '#6ee7b7',
      accentGlow: 'rgba(16, 185, 129, 0.3)',
    },
    light: {
      bgApp: '#ecfdf5',
      bgSurface: '#ffffff',
      bgCard: '#d1fae5',
      bgNav: '#ffffff',
      border: '#a7f3d0',
      borderSubtle: '#d1fae5',
      borderFocus: '#059669',
      primary: '#059669',
      secondary: '#0284c7',
      textMain: '#064e3b',
      textMuted: '#047857',
      textSubtle: '#059669',
      accentGlow: 'rgba(5, 150, 105, 0.15)',
    },
  },
  'neon-road': {
    name: '🏎️ Neon Cyber Highway',
    description: 'Midnight highway drift, glowing asphalt lanes, and blazing tail-light speed.',
    dark: {
      bgApp: '#0b0914',
      bgSurface: '#141024',
      bgCard: '#1f1738',
      bgNav: '#0e0b1c',
      border: '#432f70',
      borderSubtle: '#291c47',
      borderFocus: '#f43f5e',
      primary: '#f43f5e',
      secondary: '#a855f7',
      textMain: '#fff1f2',
      textMuted: '#fbcfe8',
      textSubtle: '#f472b6',
      accentGlow: 'rgba(244, 63, 94, 0.35)',
    },
    light: {
      bgApp: '#fff1f2',
      bgSurface: '#ffffff',
      bgCard: '#ffe4e6',
      bgNav: '#ffffff',
      border: '#fecdd3',
      borderSubtle: '#ffe4e6',
      borderFocus: '#e11d48',
      primary: '#e11d48',
      secondary: '#7c3aed',
      textMain: '#4c0519',
      textMuted: '#9f1239',
      textSubtle: '#be123c',
      accentGlow: 'rgba(225, 29, 72, 0.15)',
    },
  },
  'anime-village': {
    name: '🏡 Cozy Ghibli Anime Village',
    description: 'Charming thatched cottages, turning windmills, sunflower meadows, and warm village joy.',
    dark: {
      bgApp: '#0d170e',
      bgSurface: '#162719',
      bgCard: '#213925',
      bgNav: '#101d12',
      border: '#37613e',
      borderSubtle: '#244129',
      borderFocus: '#84cc16',
      primary: '#84cc16',
      secondary: '#facc15',
      textMain: '#f7fee7',
      textMuted: '#bef264',
      textSubtle: '#a3e635',
      accentGlow: 'rgba(132, 204, 22, 0.3)',
    },
    light: {
      bgApp: '#f7fee7',
      bgSurface: '#ffffff',
      bgCard: '#ecfccb',
      bgNav: '#ffffff',
      border: '#d9f99d',
      borderSubtle: '#ecfccb',
      borderFocus: '#65a30d',
      primary: '#65a30d',
      secondary: '#ca8a04',
      textMain: '#1a2e05',
      textMuted: '#365314',
      textSubtle: '#4d7c0f',
      accentGlow: 'rgba(101, 163, 13, 0.15)',
    },
  },
  'sci-fi-mecha': {
    name: '🤖 Sci-Fi Starship Mecha',
    description: 'Futuristic star cruiser bridge, rotating holographic HUDs, and laser plasma cores.',
    dark: {
      bgApp: '#060b17',
      bgSurface: '#0d172e',
      bgCard: '#142447',
      bgNav: '#081021',
      border: '#233d73',
      borderSubtle: '#17294e',
      borderFocus: '#00f0ff',
      primary: '#00f0ff',
      secondary: '#818cf8',
      textMain: '#f0fdf4',
      textMuted: '#93c5fd',
      textSubtle: '#60a5fa',
      accentGlow: 'rgba(0, 240, 255, 0.35)',
    },
    light: {
      bgApp: '#f0f9ff',
      bgSurface: '#ffffff',
      bgCard: '#e0f2fe',
      bgNav: '#ffffff',
      border: '#7dd3fc',
      borderSubtle: '#bae6fd',
      borderFocus: '#0284c7',
      primary: '#0284c7',
      secondary: '#4f46e5',
      textMain: '#082f49',
      textMuted: '#0369a1',
      textSubtle: '#0284c7',
      accentGlow: 'rgba(2, 132, 199, 0.15)',
    },
  },
  'fighting-coliseum': {
    name: '⚔️ Shonen Fighting Arena',
    description: 'Blazing tournament ring, soaring fighting spirit, roaring stadium sparks and combat aura.',
    dark: {
      bgApp: '#180808',
      bgSurface: '#270e0e',
      bgCard: '#3a1515',
      bgNav: '#1d0a0a',
      border: '#6e2525',
      borderSubtle: '#471818',
      borderFocus: '#ff4500',
      primary: '#ff4500',
      secondary: '#ffb703',
      textMain: '#fff5f5',
      textMuted: '#fca5a5',
      textSubtle: '#f87171',
      accentGlow: 'rgba(255, 69, 0, 0.35)',
    },
    light: {
      bgApp: '#fff5f5',
      bgSurface: '#ffffff',
      bgCard: '#fee2e2',
      bgNav: '#ffffff',
      border: '#fca5a5',
      borderSubtle: '#fecaca',
      borderFocus: '#dc2626',
      primary: '#dc2626',
      secondary: '#d97706',
      textMain: '#450a0a',
      textMuted: '#991b1b',
      textSubtle: '#b91c1c',
      accentGlow: 'rgba(220, 38, 38, 0.15)',
    },
  },
  'sakura-shrine': {
    name: '⛩️ Sakura Blossom Shrine',
    description: 'Crimson Torii gates, swirling cherry blossom petals, sacred shrine stone lanterns.',
    dark: {
      bgApp: '#1a0a14',
      bgSurface: '#291020',
      bgCard: '#3d1730',
      bgNav: '#1f0c18',
      border: '#6e2755',
      borderSubtle: '#481938',
      borderFocus: '#f472b6',
      primary: '#f472b6',
      secondary: '#fb7185',
      textMain: '#fdf2f8',
      textMuted: '#fbcfe8',
      textSubtle: '#f472b6',
      accentGlow: 'rgba(244, 114, 182, 0.35)',
    },
    light: {
      bgApp: '#fdf2f8',
      bgSurface: '#ffffff',
      bgCard: '#fce7f3',
      bgNav: '#ffffff',
      border: '#fbcfe8',
      borderSubtle: '#fce7f3',
      borderFocus: '#db2777',
      primary: '#db2777',
      secondary: '#e11d48',
      textMain: '#500724',
      textMuted: '#9d174d',
      textSubtle: '#be185d',
      accentGlow: 'rgba(219, 39, 119, 0.15)',
    },
  },
  'pixel-dungeon': {
    name: '🗡️ 8-Bit Pixel Dungeon',
    description: 'Retro dungeon castle stone, flickering pixel torches, and legendary loot chests.',
    dark: {
      bgApp: '#121118',
      bgSurface: '#1b1926',
      bgCard: '#272438',
      bgNav: '#151320',
      border: '#484263',
      borderSubtle: '#302c42',
      borderFocus: '#facc15',
      primary: '#facc15',
      secondary: '#a78bfa',
      textMain: '#f5f3ff',
      textMuted: '#ddd6fe',
      textSubtle: '#c4b5fd',
      accentGlow: 'rgba(250, 204, 21, 0.35)',
    },
    light: {
      bgApp: '#f5f3ff',
      bgSurface: '#ffffff',
      bgCard: '#ede9fe',
      bgNav: '#ffffff',
      border: '#ddd6fe',
      borderSubtle: '#ede9fe',
      borderFocus: '#7c3aed',
      primary: '#7c3aed',
      secondary: '#b45309',
      textMain: '#2e1065',
      textMuted: '#5b21b6',
      textSubtle: '#6d28d9',
      accentGlow: 'rgba(124, 58, 237, 0.15)',
    },
  },
  'steampunk-airship': {
    name: '⚙️ Steampunk Airship',
    description: 'Victorian brass clockwork cogs, zeppelin flight decks, and burnished copper steam.',
    dark: {
      bgApp: '#18110b',
      bgSurface: '#261a10',
      bgCard: '#372618',
      bgNav: '#1c130c',
      border: '#63452c',
      borderSubtle: '#432e1c',
      borderFocus: '#d97706',
      primary: '#d97706',
      secondary: '#f59e0b',
      textMain: '#fffbeb',
      textMuted: '#fde68a',
      textSubtle: '#fcd34d',
      accentGlow: 'rgba(217, 119, 6, 0.35)',
    },
    light: {
      bgApp: '#fffbeb',
      bgSurface: '#ffffff',
      bgCard: '#fef3c7',
      bgNav: '#ffffff',
      border: '#fde68a',
      borderSubtle: '#fef3c7',
      borderFocus: '#b45309',
      primary: '#b45309',
      secondary: '#78350f',
      textMain: '#451a03',
      textMuted: '#78350f',
      textSubtle: '#92400e',
      accentGlow: 'rgba(180, 83, 9, 0.15)',
    },
  },
  'aurora-borealis': {
    name: '🌌 Arctic Aurora Borealis',
    description: 'Spectacular emerald and violet dancing auroral ribbons in the Arctic polar sky.',
    dark: {
      bgApp: '#051419',
      bgSurface: '#09222a',
      bgCard: '#0f3340',
      bgNav: '#071b21',
      border: '#1a566b',
      borderSubtle: '#113d4c',
      borderFocus: '#34d399',
      primary: '#34d399',
      secondary: '#a78bfa',
      textMain: '#ecfdf5',
      textMuted: '#a7f3d0',
      textSubtle: '#6ee7b7',
      accentGlow: 'rgba(52, 211, 153, 0.35)',
    },
    light: {
      bgApp: '#ecfdf5',
      bgSurface: '#ffffff',
      bgCard: '#d1fae5',
      bgNav: '#ffffff',
      border: '#a7f3d0',
      borderSubtle: '#d1fae5',
      borderFocus: '#059669',
      primary: '#059669',
      secondary: '#7c3aed',
      textMain: '#064e3b',
      textMuted: '#047857',
      textSubtle: '#059669',
      accentGlow: 'rgba(5, 150, 105, 0.15)',
    },
  },
  'desert-oasis': {
    name: '🏜️ Golden Desert Oasis',
    description: 'Golden dunes under starlit twilight, sapphire palm water, and Arabian nights magic.',
    dark: {
      bgApp: '#191206',
      bgSurface: '#291e0a',
      bgCard: '#3d2c0f',
      bgNav: '#201708',
      border: '#6e4f1a',
      borderSubtle: '#473411',
      borderFocus: '#fbbf24',
      primary: '#fbbf24',
      secondary: '#38bdf8',
      textMain: '#fffbeb',
      textMuted: '#fef08a',
      textSubtle: '#fde047',
      accentGlow: 'rgba(251, 191, 36, 0.35)',
    },
    light: {
      bgApp: '#fffbeb',
      bgSurface: '#ffffff',
      bgCard: '#fef3c7',
      bgNav: '#ffffff',
      border: '#fde68a',
      borderSubtle: '#fef3c7',
      borderFocus: '#d97706',
      primary: '#d97706',
      secondary: '#0284c7',
      textMain: '#451a03',
      textMuted: '#78350f',
      textSubtle: '#92400e',
      accentGlow: 'rgba(217, 119, 6, 0.15)',
    },
  },
  'ninja-shadow': {
    name: '🥷 Hidden Leaf Shinobi',
    description: 'Moonlit bamboo groves, ninja scroll secrets, quiet shadows, and steel kunai focus.',
    dark: {
      bgApp: '#0a0c14',
      bgSurface: '#111422',
      bgCard: '#191e33',
      bgNav: '#0c0e18',
      border: '#2c3559',
      borderSubtle: '#1d233b',
      borderFocus: '#6366f1',
      primary: '#6366f1',
      secondary: '#94a3b8',
      textMain: '#f8fafc',
      textMuted: '#cbd5e1',
      textSubtle: '#94a3b8',
      accentGlow: 'rgba(99, 102, 241, 0.3)',
    },
    light: {
      bgApp: '#f1f5f9',
      bgSurface: '#ffffff',
      bgCard: '#e2e8f0',
      bgNav: '#ffffff',
      border: '#cbd5e1',
      borderSubtle: '#e2e8f0',
      borderFocus: '#4338ca',
      primary: '#4338ca',
      secondary: '#475569',
      textMain: '#0f172a',
      textMuted: '#334155',
      textSubtle: '#475569',
      accentGlow: 'rgba(67, 56, 202, 0.15)',
    },
  },
  'magic-academy': {
    name: '🔮 Starlight Magic Academy',
    description: 'Levitating grimoires, celestial spell circles, arcane crystal wands and wizard towers.',
    dark: {
      bgApp: '#0f0b1f',
      bgSurface: '#1a1336',
      bgCard: '#261c4d',
      bgNav: '#130e28',
      border: '#4d3791',
      borderSubtle: '#322461',
      borderFocus: '#c084fc',
      primary: '#c084fc',
      secondary: '#38bdf8',
      textMain: '#faf5ff',
      textMuted: '#e9d5ff',
      textSubtle: '#d8b4fe',
      accentGlow: 'rgba(192, 132, 252, 0.35)',
    },
    light: {
      bgApp: '#faf5ff',
      bgSurface: '#ffffff',
      bgCard: '#f3e8ff',
      bgNav: '#ffffff',
      border: '#e9d5ff',
      borderSubtle: '#f3e8ff',
      borderFocus: '#9333ea',
      primary: '#9333ea',
      secondary: '#0284c7',
      textMain: '#3b0764',
      textMuted: '#6b21a8',
      textSubtle: '#7e22ce',
      accentGlow: 'rgba(147, 51, 234, 0.15)',
    },
  },
  'underwater-atlantis': {
    name: '🧜 Deep Sea Atlantis',
    description: 'Bioluminescent deep sea coral, rising mermaid bubbles, and glowing ocean trenches.',
    dark: {
      bgApp: '#03131e',
      bgSurface: '#062133',
      bgCard: '#0b324c',
      bgNav: '#041926',
      border: '#155885',
      borderSubtle: '#0d3d5d',
      borderFocus: '#38bdf8',
      primary: '#38bdf8',
      secondary: '#2dd4bf',
      textMain: '#f0f9ff',
      textMuted: '#bae6fd',
      textSubtle: '#7dd3fc',
      accentGlow: 'rgba(56, 189, 248, 0.35)',
    },
    light: {
      bgApp: '#f0f9ff',
      bgSurface: '#ffffff',
      bgCard: '#e0f2fe',
      bgNav: '#ffffff',
      border: '#bae6fd',
      borderSubtle: '#e0f2fe',
      borderFocus: '#0284c7',
      primary: '#0284c7',
      secondary: '#0d9488',
      textMain: '#082f49',
      textMuted: '#0369a1',
      textSubtle: '#0284c7',
      accentGlow: 'rgba(2, 132, 199, 0.15)',
    },
  },
  'sunset-lofi': {
    name: '🌇 Sunset Lofi Chill',
    description: 'Pastel sunset rooftop, nostalgic cassette tape warmth, and mellow coding beats.',
    dark: {
      bgApp: '#190d16',
      bgSurface: '#291523',
      bgCard: '#3d2035',
      bgNav: '#1f101b',
      border: '#6e3960',
      borderSubtle: '#47253e',
      borderFocus: '#fb7185',
      primary: '#fb7185',
      secondary: '#f59e0b',
      textMain: '#fff1f2',
      textMuted: '#fecdd3',
      textSubtle: '#fda4af',
      accentGlow: 'rgba(251, 113, 133, 0.35)',
    },
    light: {
      bgApp: '#fff1f2',
      bgSurface: '#ffffff',
      bgCard: '#ffe4e6',
      bgNav: '#ffffff',
      border: '#fecdd3',
      borderSubtle: '#ffe4e6',
      borderFocus: '#e11d48',
      primary: '#e11d48',
      secondary: '#d97706',
      textMain: '#4c0519',
      textMuted: '#9f1239',
      textSubtle: '#be123c',
      accentGlow: 'rgba(225, 29, 72, 0.15)',
    },
  },
  'volcano-forge': {
    name: '🌋 Volcanic Magma Forge',
    description: 'Molten rivers of glowing magma, blazing blacksmith anvils, and obsidian flames.',
    dark: {
      bgApp: '#160606',
      bgSurface: '#260b0b',
      bgCard: '#3a1010',
      bgNav: '#1b0808',
      border: '#691d1d',
      borderSubtle: '#471313',
      borderFocus: '#f97316',
      primary: '#f97316',
      secondary: '#e11d48',
      textMain: '#fff7ed',
      textMuted: '#ffedd5',
      textSubtle: '#fed7aa',
      accentGlow: 'rgba(249, 115, 22, 0.35)',
    },
    light: {
      bgApp: '#fff7ed',
      bgSurface: '#ffffff',
      bgCard: '#ffedd5',
      bgNav: '#ffffff',
      border: '#fed7aa',
      borderSubtle: '#ffedd5',
      borderFocus: '#ea580c',
      primary: '#ea580c',
      secondary: '#dc2626',
      textMain: '#431407',
      textMuted: '#9a3412',
      textSubtle: '#c2410c',
      accentGlow: 'rgba(234, 88, 12, 0.15)',
    },
  },
  'cyberpunk-tokyo': {
    name: '🏮 Cyberpunk Tokyo Neon',
    description: 'Akihabara electric neon kanji, rainy dark asphalt, and magenta cyber alleyways.',
    dark: {
      bgApp: '#080415',
      bgSurface: '#12092c',
      bgCard: '#1d0f44',
      bgNav: '#0b061d',
      border: '#48228f',
      borderSubtle: '#2c1459',
      borderFocus: '#ff007f',
      primary: '#ff007f',
      secondary: '#00f0ff',
      textMain: '#fff0f5',
      textMuted: '#fbcfe8',
      textSubtle: '#f472b6',
      accentGlow: 'rgba(255, 0, 127, 0.35)',
    },
    light: {
      bgApp: '#fff0f5',
      bgSurface: '#ffffff',
      bgCard: '#ffe4e6',
      bgNav: '#ffffff',
      border: '#fecdd3',
      borderSubtle: '#ffe4e6',
      borderFocus: '#db2777',
      primary: '#db2777',
      secondary: '#0284c7',
      textMain: '#4c0519',
      textMuted: '#9d174d',
      textSubtle: '#be185d',
      accentGlow: 'rgba(219, 39, 119, 0.15)',
    },
  },
  'wild-west': {
    name: '🤠 Wild West Frontier',
    description: 'Red rock canyon sunsets, tumbleweeds, saloon gold, and dusty cowboy showdowns.',
    dark: {
      bgApp: '#180e07',
      bgSurface: '#26160b',
      bgCard: '#372010',
      bgNav: '#1c1008',
      border: '#63391b',
      borderSubtle: '#432612',
      borderFocus: '#ea580c',
      primary: '#ea580c',
      secondary: '#fbbf24',
      textMain: '#fff7ed',
      textMuted: '#fed7aa',
      textSubtle: '#fb923c',
      accentGlow: 'rgba(234, 88, 12, 0.35)',
    },
    light: {
      bgApp: '#fff7ed',
      bgSurface: '#ffffff',
      bgCard: '#ffedd5',
      bgNav: '#ffffff',
      border: '#fed7aa',
      borderSubtle: '#ffedd5',
      borderFocus: '#c2410c',
      primary: '#c2410c',
      secondary: '#d97706',
      textMain: '#431407',
      textMuted: '#7c2d12',
      textSubtle: '#9a3412',
      accentGlow: 'rgba(194, 65, 12, 0.15)',
    },
  },
  'pirate-cove': {
    name: '🏴‍☠️ Golden Pirate Cove',
    description: 'Caribbean turquoise lagoon, pirate galleons, treasure doubloons, and rum cask cheer.',
    dark: {
      bgApp: '#05151c',
      bgSurface: '#09242f',
      bgCard: '#0e3545',
      bgNav: '#071b23',
      border: '#1a5b75',
      borderSubtle: '#103e50',
      borderFocus: '#eab308',
      primary: '#eab308',
      secondary: '#06b6d4',
      textMain: '#fefce8',
      textMuted: '#fef08a',
      textSubtle: '#fde047',
      accentGlow: 'rgba(234, 179, 8, 0.35)',
    },
    light: {
      bgApp: '#fefce8',
      bgSurface: '#ffffff',
      bgCard: '#fef9c3',
      bgNav: '#ffffff',
      border: '#fef08a',
      borderSubtle: '#fef9c3',
      borderFocus: '#ca8a04',
      primary: '#ca8a04',
      secondary: '#0891b2',
      textMain: '#422006',
      textMuted: '#713f12',
      textSubtle: '#854d0e',
      accentGlow: 'rgba(202, 138, 4, 0.15)',
    },
  },
  'superhero-city': {
    name: '🦸 Comic Superhero Metropolis',
    description: 'Comic book action halftones, heroic crimson capes, towering skyscraper nightlines.',
    dark: {
      bgApp: '#130d17',
      bgSurface: '#1f1526',
      bgCard: '#2e1f38',
      bgNav: '#17101b',
      border: '#563968',
      borderSubtle: '#382544',
      borderFocus: '#ef4444',
      primary: '#ef4444',
      secondary: '#3b82f6',
      textMain: '#fef2f2',
      textMuted: '#fecaca',
      textSubtle: '#f87171',
      accentGlow: 'rgba(239, 68, 68, 0.35)',
    },
    light: {
      bgApp: '#fef2f2',
      bgSurface: '#ffffff',
      bgCard: '#fee2e2',
      bgNav: '#ffffff',
      border: '#fecaca',
      borderSubtle: '#fee2e2',
      borderFocus: '#dc2626',
      primary: '#dc2626',
      secondary: '#2563eb',
      textMain: '#450a0a',
      textMuted: '#991b1b',
      textSubtle: '#b91c1c',
      accentGlow: 'rgba(220, 38, 38, 0.15)',
    },
  },
  'fairytale-wonderland': {
    name: '🍄 Mushroom Wonderland',
    description: 'Giant glowing fairy mushrooms, sparkling magical pollen, and whimsical wonderland moss.',
    dark: {
      bgApp: '#130b1c',
      bgSurface: '#20122e',
      bgCard: '#2f1b44',
      bgNav: '#170d22',
      border: '#593380',
      borderSubtle: '#3b2155',
      borderFocus: '#a855f7',
      primary: '#a855f7',
      secondary: '#34d399',
      textMain: '#faf5ff',
      textMuted: '#e9d5ff',
      textSubtle: '#d8b4fe',
      accentGlow: 'rgba(168, 85, 247, 0.35)',
    },
    light: {
      bgApp: '#faf5ff',
      bgSurface: '#ffffff',
      bgCard: '#f3e8ff',
      bgNav: '#ffffff',
      border: '#e9d5ff',
      borderSubtle: '#f3e8ff',
      borderFocus: '#9333ea',
      primary: '#9333ea',
      secondary: '#059669',
      textMain: '#3b0764',
      textMuted: '#6b21a8',
      textSubtle: '#7e22ce',
      accentGlow: 'rgba(147, 51, 234, 0.15)',
    },
  },
  'valhalla-viking': {
    name: '🛡️ Viking Valhalla',
    description: 'Nordic battle shields, thunderous stormy blue skies, runic axes, and aurora glory.',
    dark: {
      bgApp: '#0a111a',
      bgSurface: '#101b2a',
      bgCard: '#18283d',
      bgNav: '#0c1420',
      border: '#2c4669',
      borderSubtle: '#1c2d43',
      borderFocus: '#60a5fa',
      primary: '#60a5fa',
      secondary: '#f59e0b',
      textMain: '#f0f9ff',
      textMuted: '#bae6fd',
      textSubtle: '#7dd3fc',
      accentGlow: 'rgba(96, 165, 250, 0.35)',
    },
    light: {
      bgApp: '#f0f9ff',
      bgSurface: '#ffffff',
      bgCard: '#e0f2fe',
      bgNav: '#ffffff',
      border: '#bae6fd',
      borderSubtle: '#e0f2fe',
      borderFocus: '#2563eb',
      primary: '#2563eb',
      secondary: '#d97706',
      textMain: '#082f49',
      textMuted: '#0369a1',
      textSubtle: '#0284c7',
      accentGlow: 'rgba(37, 99, 235, 0.15)',
    },
  },
};

export type ThemeCategory = 'all' | 'nature' | 'anime' | 'scifi' | 'adventure' | 'retro' | 'classic';

export const THEME_CATEGORIES: { id: ThemeCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All 40 Themes', icon: '🎨' },
  { id: 'nature', label: 'Nature & Journeys', icon: '🏔️' },
  { id: 'anime', label: 'Anime & Manga', icon: '🌸' },
  { id: 'scifi', label: 'Sci-Fi & Cyber', icon: '🤖' },
  { id: 'adventure', label: 'Adventure & RPG', icon: '⚔️' },
  { id: 'retro', label: 'Retro & Arcade', icon: '🕹️' },
  { id: 'classic', label: 'Classic CP & Dark', icon: '⚡' },
];

export const THEME_METADATA: Record<
  ThemePresetId,
  {
    category: ThemeCategory;
    icon: string;
    ambientTitle: string;
  }
> = {
  'mountain-summit': { category: 'nature', icon: '🏔️', ambientTitle: 'Snowy Peak Vista' },
  'sea-beach': { category: 'nature', icon: '🏖️', ambientTitle: 'Sunny Shoreline' },
  'railway-express': { category: 'adventure', icon: '🚂', ambientTitle: 'Anime Train Tracks' },
  'jorna-waterfall': { category: 'nature', icon: '🌊', ambientTitle: 'Emerald Spring Falls' },
  'neon-road': { category: 'scifi', icon: '🏎️', ambientTitle: 'Midnight Speed Drift' },
  'anime-village': { category: 'anime', icon: '🏡', ambientTitle: 'Pastoral Ghibli Breeze' },
  'sci-fi-mecha': { category: 'scifi', icon: '🤖', ambientTitle: 'Orbital Mecha Cruiser' },
  'fighting-coliseum': { category: 'adventure', icon: '⚔️', ambientTitle: 'Shonen Battle Tournament' },
  'sakura-shrine': { category: 'anime', icon: '⛩️', ambientTitle: 'Floating Cherry Blossoms' },
  'pixel-dungeon': { category: 'retro', icon: '🗡️', ambientTitle: '8-Bit Castle Torches' },
  'steampunk-airship': { category: 'adventure', icon: '⚙️', ambientTitle: 'Victorian Clockwork Flight' },
  'aurora-borealis': { category: 'nature', icon: '🌌', ambientTitle: 'Polar Starlight Ribbons' },
  'desert-oasis': { category: 'nature', icon: '🏜️', ambientTitle: 'Golden Dune Twilight' },
  'ninja-shadow': { category: 'anime', icon: '🥷', ambientTitle: 'Moonlit Shinobi Grove' },
  'magic-academy': { category: 'adventure', icon: '🔮', ambientTitle: 'Arcane Grimoire Starlight' },
  'underwater-atlantis': { category: 'nature', icon: '🧜', ambientTitle: 'Sunken Pearl Atlantis' },
  'sunset-lofi': { category: 'anime', icon: '🌇', ambientTitle: 'Tokyo Lofi Chill Beats' },
  'volcano-forge': { category: 'adventure', icon: '🌋', ambientTitle: 'Molten Obsidian Anvil' },
  'cyberpunk-tokyo': { category: 'scifi', icon: '🏮', ambientTitle: 'Akihabara Neon Rain' },
  'wild-west': { category: 'adventure', icon: '🤠', ambientTitle: 'Frontier Red Rock Mesa' },
  'pirate-cove': { category: 'adventure', icon: '🏴‍☠️', ambientTitle: 'Caribbean Treasure Cove' },
  'superhero-city': { category: 'retro', icon: '🦸', ambientTitle: 'Comic Book Metropolis' },
  'fairytale-wonderland': { category: 'adventure', icon: '🍄', ambientTitle: 'Whimsical Mushroom Spores' },
  'valhalla-viking': { category: 'adventure', icon: '🛡️', ambientTitle: 'Nordic Valhalla Thunder' },
  'climb-default': { category: 'classic', icon: '🏔️', ambientTitle: 'CLIMB Electric Indigo' },
  midnight: { category: 'classic', icon: '🌌', ambientTitle: 'Obsidian Late-Night Grind' },
  'cyber-matrix': { category: 'scifi', icon: '👾', ambientTitle: 'Phosphor 1337 Matrix' },
  'candy-pop': { category: 'retro', icon: '🍭', ambientTitle: 'Marshmallow Sugar Bubble' },
  'kawaii-anime': { category: 'anime', icon: '🌸', ambientTitle: 'Kawaii Catgirl Sparkles' },
  'retro-arcade': { category: 'retro', icon: '🕹️', ambientTitle: 'Synthwave Neon Grid' },
  'galaxy-space': { category: 'scifi', icon: '🚀', ambientTitle: 'Cosmic Constellations' },
  'jungle-safari': { category: 'nature', icon: '🌴', ambientTitle: 'Wild Bamboo Explorer' },
  'coffee-overdrive': { category: 'classic', icon: '☕', ambientTitle: 'Mocha Espresso Roast' },
  'dragon-fire': { category: 'adventure', icon: '🔥', ambientTitle: 'Dragon Magma Blast' },
  ocean: { category: 'nature', icon: '🌊', ambientTitle: 'Deep Oceanic Teal' },
  forest: { category: 'nature', icon: '🌲', ambientTitle: 'Enchanted Evergreen Pines' },
  violet: { category: 'classic', icon: '💜', ambientTitle: 'Imperial Velvet Violet' },
  'warm-neutral': { category: 'classic', icon: '📜', ambientTitle: 'Cozy Parchment Study' },
  amoled: { category: 'classic', icon: '🖤', ambientTitle: 'True OLED Black 0%' },
  'high-contrast': { category: 'classic', icon: '👁️', ambientTitle: 'Maximized Contrast Crisp' },
};

export const FONT_FAMILIES: Record<
  FontFamilyOption,
  {
    name: string;
    family: string;
    description: string;
    sample: string;
  }
> = {
  outfit: {
    name: 'Outfit (Modern & Stylish)',
    family: "'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    description: 'Ultra-modern geometric typography with sleek curves and high-fashion polish',
    sample: '1600 Specialist',
  },
  'space-grotesk': {
    name: 'Space Grotesk (Tech & Cyber)',
    family: "'Space Grotesk', 'Outfit', system-ui, sans-serif",
    description: 'Distinctive algorithmic & cyberpunk style with tech personality',
    sample: 'O(N log N) Tree',
  },
  jakarta: {
    name: 'Plus Jakarta Sans (Crisp & Clean)',
    family: "'Plus Jakarta Sans', 'Outfit', system-ui, -apple-system, sans-serif",
    description: 'Balanced modern neo-grotesque for precision clarity',
    sample: 'Binary Search',
  },
  sora: {
    name: 'Sora (Futuristic UI)',
    family: "'Sora', 'Outfit', system-ui, sans-serif",
    description: 'Geometric typography engineered for crisp screen legibility',
    sample: 'Dynamic Program',
  },
  system: {
    name: 'System Sans (Native)',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    description: 'Native operating system default interface typeface',
    sample: 'Native OS',
  },
};

export function getFontFamilyStack(option?: FontFamilyOption): string {
  const key = option || 'outfit';
  return FONT_FAMILIES[key]?.family || FONT_FAMILIES.outfit.family;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  preset: 'climb-default',
  density: 'comfortable',
  borderRadius: 'standard',
  fontSize: 'standard',
  fontFamily: 'outfit',
  animationIntensity: 'full',
  transparency: 'normal',
  selectedCharacter: 'climby',
  characterMood: 'happy',
  playfulMascot: true,
  backgroundSparkles: true,
  funnyThemeSounds: true,
};

export const MODE_PALETTES: Record<
  'light' | 'dark' | 'multicolor' | 'orange' | 'purple',
  ThemeColors
> = {
  light: {
    bgApp: '#f8fafc',
    bgSurface: '#ffffff',
    bgCard: '#f1f5f9',
    bgNav: '#ffffff',
    border: '#e2e8f0',
    borderSubtle: '#cbd5e1',
    borderFocus: '#4f46e5',
    primary: '#4f46e5',
    secondary: '#0891b2',
    textMain: '#0f172a',
    textMuted: '#475569',
    textSubtle: '#64748b',
    accentGlow: 'rgba(79, 70, 229, 0.15)',
  },
  dark: {
    bgApp: '#0b0f19',
    bgSurface: '#111827',
    bgCard: '#1e293b',
    bgNav: '#0f172a',
    border: '#334155',
    borderSubtle: '#1e293b',
    borderFocus: '#6366f1',
    primary: '#6366f1',
    secondary: '#06b6d4',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',
    accentGlow: 'rgba(99, 102, 241, 0.25)',
  },
  multicolor: {
    bgApp: '#0c0f24',
    bgSurface: '#13183b',
    bgCard: '#1a224e',
    bgNav: '#0e122f',
    border: '#4f46e5',
    borderSubtle: '#2d3778',
    borderFocus: '#ec4899',
    primary: '#ec4899',
    secondary: '#06b6d4',
    textMain: '#ffffff',
    textMuted: '#cbd5e1',
    textSubtle: '#94a3b8',
    accentGlow: 'rgba(236, 72, 153, 0.35)',
  },
  orange: {
    bgApp: '#150d06',
    bgSurface: '#211409',
    bgCard: '#2d1b0c',
    bgNav: '#190e07',
    border: '#5c3311',
    borderSubtle: '#3b200b',
    borderFocus: '#ea580c',
    primary: '#ea580c',
    secondary: '#f59e0b',
    textMain: '#fff7ed',
    textMuted: '#fdba74',
    textSubtle: '#fb923c',
    accentGlow: 'rgba(234, 88, 12, 0.35)',
  },
  purple: {
    bgApp: '#0f081d',
    bgSurface: '#190d30',
    bgCard: '#251347',
    bgNav: '#130926',
    border: '#4c257d',
    borderSubtle: '#331855',
    borderFocus: '#a855f7',
    primary: '#a855f7',
    secondary: '#ec4899',
    textMain: '#faf5ff',
    textMuted: '#d8b4fe',
    textSubtle: '#c084fc',
    accentGlow: 'rgba(168, 85, 247, 0.35)',
  },
};

// WCAG Luminance and Contrast Calculation
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

export function isValidHexColor(hex: string): boolean {
  return hexToRgb(hex) !== null;
}

export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const transform = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(rgb.r) + 0.7152 * transform(rgb.g) + 0.0722 * transform(rgb.b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1.0;
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isAccessibleContrast(fgHex: string, bgHex: string, minRatio: number = 4.5): boolean {
  return getContrastRatio(fgHex, bgHex) >= minRatio;
}

export function resolveEffectiveMode(
  mode: AppearanceMode
): 'light' | 'dark' | 'multicolor' | 'orange' | 'purple' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // default is light
  }
  return mode;
}

export function getActiveThemeColors(config: ThemeConfig): ThemeColors {
  const effectiveMode = resolveEffectiveMode(config.mode);
  const presetData = THEME_PRESETS[config.preset] || THEME_PRESETS['climb-default'];

  let baseColors: ThemeColors;
  if (effectiveMode === 'light') {
    baseColors = presetData.light;
  } else if (effectiveMode === 'dark') {
    baseColors = presetData.dark;
  } else {
    baseColors = MODE_PALETTES[effectiveMode] || MODE_PALETTES.light;
  }

  let primary = baseColors.primary;
  if (config.customPrimaryAccent && isValidHexColor(config.customPrimaryAccent)) {
    // Check contrast against app background; if readable, apply
    primary = config.customPrimaryAccent;
  }

  let secondary = baseColors.secondary;
  if (config.customSecondaryAccent && isValidHexColor(config.customSecondaryAccent)) {
    secondary = config.customSecondaryAccent;
  }

  const primaryRgb = hexToRgb(primary);
  const accentGlow = primaryRgb
    ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${effectiveMode === 'light' ? 0.15 : 0.3})`
    : baseColors.accentGlow;

  return {
    ...baseColors,
    primary,
    secondary,
    accentGlow,
  };
}

export function getPresetPreviewColors(presetId: ThemePresetId, mode: AppearanceMode): ThemeColors {
  const effectiveMode = resolveEffectiveMode(mode);
  const preset = THEME_PRESETS[presetId] || THEME_PRESETS['climb-default'];
  if (effectiveMode === 'light') return preset.light;
  if (effectiveMode === 'dark') return preset.dark;
  if (effectiveMode === 'orange') {
    return {
      ...preset.dark,
      borderFocus: '#ea580c',
      primary: '#ea580c',
      secondary: '#f59e0b',
    };
  }
  if (effectiveMode === 'purple') {
    return {
      ...preset.dark,
      borderFocus: '#a855f7',
      primary: '#a855f7',
      secondary: '#ec4899',
    };
  }
  if (effectiveMode === 'multicolor') {
    return {
      ...preset.dark,
      borderFocus: '#ec4899',
      primary: '#ec4899',
      secondary: '#06b6d4',
    };
  }
  return preset.light;
}

export function getRadiusValue(option: BorderRadiusOption): string {
  switch (option) {
    case 'compact':
      return '6px';
    case 'rounded':
      return '18px';
    case 'standard':
    default:
      return '12px';
  }
}

export function getDensityTokens(density: InterfaceDensity): {
  paddingScale: string;
  gapScale: string;
} {
  switch (density) {
    case 'compact':
      return { paddingScale: '0.75rem', gapScale: '0.5rem' };
    case 'spacious':
      return { paddingScale: '1.5rem', gapScale: '1.25rem' };
    case 'comfortable':
    default:
      return { paddingScale: '1rem', gapScale: '0.875rem' };
  }
}

export function getFontScaleRem(scale: FontScaleOption): string {
  switch (scale) {
    case 'small':
      return '0.9375rem'; // 15px base (compact)
    case 'large':
      return '1.1875rem'; // 19px base (generous legibility)
    case 'extra-large':
      return '1.3125rem'; // 21px base (extra large)
    case 'standard':
    default:
      return '1.0625rem'; // 17px base (increased comfortable standard)
  }
}

export function applyThemeToDom(config: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const effectiveMode = resolveEffectiveMode(config.mode);
  const effectiveFontFamily = config.fontFamily || 'outfit';
  const colors = getActiveThemeColors(config);

  // Set data attributes for high-level CSS selectors
  root.setAttribute('data-theme', config.preset);
  root.setAttribute('data-mode', effectiveMode);
  root.setAttribute('data-density', config.density);
  root.setAttribute('data-radius', config.borderRadius);
  root.setAttribute('data-font-size', config.fontSize);
  root.setAttribute('data-font-family', effectiveFontFamily);
  root.setAttribute('data-motion', config.animationIntensity);
  root.setAttribute('data-transparency', config.transparency);

  // Sync Tailwind dark class on root document element
  if (effectiveMode === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }

  // Sync browser theme-color meta tag
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', colors.bgApp);
  }

  // Notify listeners of theme update
  window.dispatchEvent(
    new CustomEvent('climb1600:theme-changed', {
      detail: { mode: effectiveMode, colors, config },
    })
  );

  // Apply CSS custom properties
  root.style.setProperty('--climb-bg-app', colors.bgApp);
  root.style.setProperty('--climb-bg-surface', colors.bgSurface);
  root.style.setProperty('--climb-bg-card', colors.bgCard);
  root.style.setProperty('--climb-bg-nav', colors.bgNav);
  root.style.setProperty('--climb-border', colors.border);
  root.style.setProperty('--climb-border-subtle', colors.borderSubtle);
  root.style.setProperty('--climb-border-focus', colors.borderFocus);
  root.style.setProperty('--climb-primary', colors.primary);
  root.style.setProperty('--climb-secondary', colors.secondary);
  root.style.setProperty('--climb-text-main', colors.textMain);
  root.style.setProperty('--climb-text-muted', colors.textMuted);
  root.style.setProperty('--climb-text-subtle', colors.textSubtle);
  root.style.setProperty('--climb-accent-glow', colors.accentGlow);

  // Radius token
  root.style.setProperty('--climb-radius', getRadiusValue(config.borderRadius));

  // Density tokens
  const density = getDensityTokens(config.density);
  root.style.setProperty('--climb-density-pad', density.paddingScale);
  root.style.setProperty('--climb-density-gap', density.gapScale);

  // Font scale & typography tokens
  root.style.setProperty('--climb-font-scale', getFontScaleRem(config.fontSize));
  root.style.setProperty('--climb-font-family', getFontFamilyStack(effectiveFontFamily));

  // Animation duration token
  if (config.animationIntensity === 'off') {
    root.style.setProperty('--climb-motion-duration', '0s');
  } else if (config.animationIntensity === 'reduced') {
    root.style.setProperty('--climb-motion-duration', '0.1s');
  } else {
    root.style.setProperty('--climb-motion-duration', '0.2s');
  }

  // Backdrop filter token
  if (config.transparency === 'reduced') {
    root.style.setProperty('--climb-backdrop-blur', 'none');
  } else {
    root.style.setProperty('--climb-backdrop-blur', 'blur(12px)');
  }
}
