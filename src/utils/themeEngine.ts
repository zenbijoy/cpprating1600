import {
  AppearanceMode,
  BorderRadiusOption,
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
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  preset: 'climb-default',
  density: 'comfortable',
  borderRadius: 'standard',
  fontSize: 'standard',
  animationIntensity: 'full',
  transparency: 'normal',
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
      return '0.875rem'; // 14px
    case 'large':
      return '1.0625rem'; // 17px
    case 'standard':
    default:
      return '0.9375rem'; // 15px
  }
}

export function applyThemeToDom(config: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const effectiveMode = resolveEffectiveMode(config.mode);
  const colors = getActiveThemeColors(config);

  // Set data attributes for high-level CSS selectors
  root.setAttribute('data-theme', config.preset);
  root.setAttribute('data-mode', effectiveMode);
  root.setAttribute('data-density', config.density);
  root.setAttribute('data-radius', config.borderRadius);
  root.setAttribute('data-font-size', config.fontSize);
  root.setAttribute('data-motion', config.animationIntensity);
  root.setAttribute('data-transparency', config.transparency);

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

  // Font scale token
  root.style.setProperty('--climb-font-scale', getFontScaleRem(config.fontSize));

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
