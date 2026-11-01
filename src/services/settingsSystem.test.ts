import test from 'node:test';
import assert from 'node:assert/strict';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
  hexToRgb,
  isValidHexColor,
  getRelativeLuminance,
  getContrastRatio,
  isAccessibleContrast,
  resolveEffectiveMode,
  getActiveThemeColors,
  getRadiusValue,
  getDensityTokens,
  getFontScaleRem,
  FONT_FAMILIES,
  getFontFamilyStack,
} from '../utils/themeEngine.ts';
import {
  t,
  formatDate,
  formatTime,
  SUPPORTED_TIMEZONES,
  TRANSLATIONS,
} from '../utils/i18n.ts';
import {
  DEFAULT_GLOBAL_SETTINGS,
  mergeWithDefaultSettings,
  DEFAULT_CPP20_TEMPLATE,
  DEFAULT_CPP17_TEMPLATE,
  DEFAULT_PYTHON_TEMPLATE,
} from '../utils/settingsDefaults.ts';
import { SettingsUpdateSchema } from './settingsServer.ts';
import { AppearanceMode, ThemePresetId, AnimeCharacterId } from '../types/settings.ts';
import { ANIME_CHARACTERS } from '../components/assets/MascotAndStickers.tsx';

// -------------------------------------------------------------
// 1. THEME ENGINE & PRESET ARCHITECTURE TESTS
// -------------------------------------------------------------
test('Theme Engine: All 8 Presets are fully defined with dark & light tokens', () => {
  const expectedPresets: ThemePresetId[] = [
    'climb-default',
    'midnight',
    'amoled',
    'ocean',
    'forest',
    'violet',
    'warm-neutral',
    'high-contrast',
  ];

  for (const presetId of expectedPresets) {
    const preset = THEME_PRESETS[presetId];
    assert.ok(preset, `Preset "${presetId}" must be defined.`);
    assert.ok(preset.name, `Preset "${presetId}" must have a human-readable name.`);
    assert.ok(preset.description, `Preset "${presetId}" must have a description.`);

    // Dark mode colors
    assert.ok(isValidHexColor(preset.dark.bgApp), `Preset "${presetId}" dark.bgApp must be a valid hex color.`);
    assert.ok(isValidHexColor(preset.dark.primary), `Preset "${presetId}" dark.primary must be a valid hex color.`);
    assert.ok(isValidHexColor(preset.dark.textMain), `Preset "${presetId}" dark.textMain must be a valid hex color.`);

    // Light mode colors
    assert.ok(isValidHexColor(preset.light.bgApp), `Preset "${presetId}" light.bgApp must be a valid hex color.`);
    assert.ok(isValidHexColor(preset.light.primary), `Preset "${presetId}" light.primary must be a valid hex color.`);
    assert.ok(isValidHexColor(preset.light.textMain), `Preset "${presetId}" light.textMain must be a valid hex color.`);
  }
});

test('Theme Engine: All 40 Presets are fully registered and contain key requested environments', () => {
  const allPresets = Object.keys(THEME_PRESETS) as ThemePresetId[];
  assert.equal(allPresets.length, 40, 'Must have exactly 40 themes defined in THEME_PRESETS.');

  const requiredThemes: ThemePresetId[] = [
    'mountain-summit',
    'sea-beach',
    'railway-express',
    'jorna-waterfall',
    'neon-road',
    'anime-village',
    'sci-fi-mecha',
    'fighting-coliseum',
    'sakura-shrine',
    'pixel-dungeon',
    'steampunk-airship',
    'aurora-borealis',
  ];

  for (const theme of requiredThemes) {
    assert.ok(THEME_PRESETS[theme], `Required theme "${theme}" must exist in THEME_PRESETS.`);
    assert.ok(isValidHexColor(THEME_PRESETS[theme].dark.primary), `Theme "${theme}" dark.primary must be valid hex.`);
    assert.ok(isValidHexColor(THEME_PRESETS[theme].light.primary), `Theme "${theme}" light.primary must be valid hex.`);
  }
});

test('Anime Character System: All 17 anime & cartoon heroes have valid metadata and dialogues', () => {
  assert.equal(ANIME_CHARACTERS.length, 17, 'Must have 17 selectable anime & cartoon characters.');

  const ids = new Set<string>();
  for (const hero of ANIME_CHARACTERS) {
    assert.ok(hero.id, 'Hero must have an ID.');
    assert.ok(!ids.has(hero.id), `Hero ID "${hero.id}" must be unique.`);
    ids.add(hero.id);
    assert.ok(hero.name, `Hero "${hero.id}" must have a name.`);
    assert.ok(hero.title, `Hero "${hero.id}" must have a title.`);
    assert.ok(hero.quote, `Hero "${hero.id}" must have a battle/motto quote.`);
    assert.ok(hero.avatarEmoji, `Hero "${hero.id}" must have an emoji avatar.`);
    assert.ok(hero.dialogues.length >= 2, `Hero "${hero.id}" must have at least 2 quotes.`);
  }
});

test('Theme Engine: Hex Color Parsing and Validation', () => {
  // Valid hex colors
  assert.equal(isValidHexColor('#fff'), true);
  assert.equal(isValidHexColor('#ffffff'), true);
  assert.equal(isValidHexColor('#6366f1'), true);
  assert.equal(isValidHexColor('0b0f19'), true);

  // Invalid hex colors
  assert.equal(isValidHexColor(''), false);
  assert.equal(isValidHexColor('not-a-color'), false);
  assert.equal(isValidHexColor('#12345'), false); // 5 digits
  assert.equal(isValidHexColor('#gggggg'), false); // non-hex character
  assert.equal(isValidHexColor('rgba(0,0,0,1)'), false);

  const rgb = hexToRgb('#6366f1');
  assert.ok(rgb);
  assert.equal(rgb.r, 99);
  assert.equal(rgb.g, 102);
  assert.equal(rgb.b, 241);
});

test('Theme Engine: Luminance and WCAG 2.1 AA Contrast Ratio Calculations', () => {
  // Pure white vs pure black contrast is 21:1
  const maxContrast = getContrastRatio('#ffffff', '#000000');
  assert.ok(Math.abs(maxContrast - 21.0) < 0.1, `Expected ~21:1 contrast, got: ${maxContrast}`);

  // Pure black vs pure black contrast is 1:1
  const minContrast = getContrastRatio('#000000', '#000000');
  assert.ok(Math.abs(minContrast - 1.0) < 0.01, `Expected 1:1 contrast, got: ${minContrast}`);

  // High contrast theme yellow text (#facc15) on black (#000000)
  const hcContrast = getContrastRatio('#facc15', '#000000');
  assert.ok(hcContrast >= 7.0, `High contrast theme must achieve >= 7:1 ratio (WCAG AAA), got: ${hcContrast}`);
  assert.equal(isAccessibleContrast('#facc15', '#000000', 4.5), true);

  // Low contrast: dark slate (#1e293b) on black (#000000)
  const lowContrast = getContrastRatio('#1e293b', '#000000');
  assert.ok(lowContrast < 3.0, `Expected low contrast, got: ${lowContrast}`);
  assert.equal(isAccessibleContrast('#1e293b', '#000000', 4.5), false);
});

test('Theme Engine: Mode Resolution and Design Tokens', () => {
  assert.equal(resolveEffectiveMode('dark'), 'dark');
  assert.equal(resolveEffectiveMode('light'), 'light');
  assert.equal(resolveEffectiveMode('multicolor'), 'multicolor');
  assert.equal(resolveEffectiveMode('orange'), 'orange');
  assert.equal(resolveEffectiveMode('purple'), 'purple');
  assert.equal(resolveEffectiveMode('system'), 'light'); // fallback in headless Node.js (default mode)

  // Density Tokens
  const compact = getDensityTokens('compact');
  assert.equal(compact.paddingScale, '0.75rem');
  const spacious = getDensityTokens('spacious');
  assert.equal(spacious.paddingScale, '1.5rem');

  // Radius Tokens
  assert.equal(getRadiusValue('compact'), '6px');
  assert.equal(getRadiusValue('standard'), '12px');
  assert.equal(getRadiusValue('rounded'), '18px');

  // Font Scale Tokens (Increased content font sizes)
  assert.equal(getFontScaleRem('small'), '0.9375rem');
  assert.equal(getFontScaleRem('standard'), '1.0625rem');
  assert.equal(getFontScaleRem('large'), '1.1875rem');
  assert.equal(getFontScaleRem('extra-large'), '1.3125rem');

  // Stylish Font Family Tokens
  assert.equal(DEFAULT_THEME_CONFIG.fontFamily, 'outfit');
  assert.ok(FONT_FAMILIES.outfit);
  assert.ok(FONT_FAMILIES['space-grotesk']);
  assert.ok(FONT_FAMILIES.jakarta);
  assert.ok(FONT_FAMILIES.sora);
  assert.ok(FONT_FAMILIES.system);
  assert.match(getFontFamilyStack('outfit'), /Outfit/);
  assert.match(getFontFamilyStack('space-grotesk'), /Space Grotesk/);
});

test('Theme Engine: Default mode is Light Mode and all modes are supported', () => {
  assert.equal(DEFAULT_THEME_CONFIG.mode, 'light');
  assert.equal(DEFAULT_GLOBAL_SETTINGS.theme.mode, 'light');

  // Verify all modes return valid ThemeColors
  const modes: AppearanceMode[] = ['light', 'dark', 'multicolor', 'orange', 'purple'];
  for (const mode of modes) {
    const colors = getActiveThemeColors({ ...DEFAULT_THEME_CONFIG, mode });
    assert.ok(colors.bgApp, `Mode ${mode} must have bgApp`);
    assert.ok(colors.primary, `Mode ${mode} must have primary`);
    assert.ok(colors.textMain, `Mode ${mode} must have textMain`);
  }
});

test('Theme Engine: Custom Accent Color Application & Safety', () => {
  const config = {
    ...DEFAULT_THEME_CONFIG,
    customPrimaryAccent: '#10b981', // emerald
    customSecondaryAccent: '#f59e0b', // amber
  };

  const colors = getActiveThemeColors(config);
  assert.equal(colors.primary, '#10b981');
  assert.equal(colors.secondary, '#f59e0b');

  // Invalid custom color falls back to preset primary
  const invalidConfig = {
    ...DEFAULT_THEME_CONFIG,
    mode: 'dark' as const,
    customPrimaryAccent: 'invalid-accent',
  };
  const fallbackColors = getActiveThemeColors(invalidConfig);
  assert.equal(fallbackColors.primary, THEME_PRESETS['climb-default'].dark.primary);

  const invalidConfigLight = {
    ...DEFAULT_THEME_CONFIG,
    mode: 'light' as const,
    customPrimaryAccent: 'invalid-accent',
  };
  const fallbackColorsLight = getActiveThemeColors(invalidConfigLight);
  assert.equal(fallbackColorsLight.primary, THEME_PRESETS['climb-default'].light.primary);
});

// -------------------------------------------------------------
// 2. LOCALIZATION & TEMPORAL FORMATTING TESTS
// -------------------------------------------------------------
test('Localization: English and Bangla Translation Keys', () => {
  assert.ok(TRANSLATIONS.en['settings.title'], 'English must have settings.title');
  assert.ok(TRANSLATIONS.bn['settings.title'], 'Bangla must have settings.title');

  assert.equal(t('settings.title', 'en'), 'Settings');
  assert.equal(t('settings.title', 'bn'), 'সেটিংস');

  assert.equal(t('appearance.mode', 'en'), 'Appearance Mode');
  assert.equal(t('appearance.mode', 'bn'), 'ডিসপ্লে মোড');

  // Missing key returns key itself
  assert.equal(t('nonexistent.key.xyz', 'en'), 'nonexistent.key.xyz');

  // Supported timezones
  assert.ok(SUPPORTED_TIMEZONES.some((tz) => tz.value === 'UTC'));
  assert.ok(SUPPORTED_TIMEZONES.some((tz) => tz.value === 'Asia/Dhaka'));
});

test('Localization: Date Formatting Across Standards', () => {
  const testDate = new Date('2026-10-30T15:30:00Z');

  // ISO Format
  const iso = formatDate(testDate, 'YYYY-MM-DD');
  assert.ok(iso.includes('2026-10-'), `ISO format should match YYYY-MM-DD, got: ${iso}`);

  // DD/MM/YYYY Format
  const dmy = formatDate(testDate, 'DD/MM/YYYY');
  assert.ok(dmy.includes('/10/2026'), `DD/MM/YYYY should match dd/mm/yyyy, got: ${dmy}`);

  // MM/DD/YYYY Format
  const mdy = formatDate(testDate, 'MM/DD/YYYY');
  assert.ok(mdy.startsWith('10/'), `MM/DD/YYYY should start with month, got: ${mdy}`);

  // Invalid date safe fallback
  assert.equal(formatDate('invalid-date'), '');
});

test('Localization: Time Formatting 12h vs 24h', () => {
  const testDate = new Date('2026-10-30T20:45:00Z');

  const time12 = formatTime(testDate, '12h', 'UTC');
  assert.ok(
    time12.toUpperCase().includes('PM') || time12.toUpperCase().includes('AM'),
    `12h format should include AM/PM, got: ${time12}`
  );

  const time24 = formatTime(testDate, '24h', 'UTC');
  assert.ok(
    !time24.toUpperCase().includes('PM') && !time24.toUpperCase().includes('AM'),
    `24h format should not have AM/PM, got: ${time24}`
  );

  // Invalid time safe fallback
  assert.equal(formatTime('not-a-valid-time'), '');
});

// -------------------------------------------------------------
// 3. SETTINGS DEFAULTS & DEEP MERGE TESTS
// -------------------------------------------------------------
test('Settings Defaults: Structure and Complete Coverage', () => {
  assert.ok(DEFAULT_GLOBAL_SETTINGS.theme);
  assert.ok(DEFAULT_GLOBAL_SETTINGS.profile);
  assert.ok(DEFAULT_GLOBAL_SETTINGS.privacy);
  assert.ok(DEFAULT_GLOBAL_SETTINGS.localization);
  assert.ok(DEFAULT_GLOBAL_SETTINGS.accessibility);
  assert.ok(DEFAULT_GLOBAL_SETTINGS.competitiveProgramming);
  assert.ok(DEFAULT_GLOBAL_SETTINGS.guardian);
  assert.ok(DEFAULT_GLOBAL_SETTINGS.app);

  // CP Code Templates
  assert.ok(DEFAULT_CPP20_TEMPLATE.includes('cin.tie(NULL);'), 'C++20 template must have fast I/O');
  assert.ok(DEFAULT_CPP17_TEMPLATE.includes('<bits/stdc++.h>'), 'C++17 template must include bits/stdc++');
  assert.ok(DEFAULT_PYTHON_TEMPLATE.includes('sys.stdin.read'), 'Python template must have fast stdin reading');
});

test('Settings Defaults: Deep Merge Resilience', () => {
  // Empty input returns defaults
  const fromEmpty = mergeWithDefaultSettings(null);
  assert.equal(fromEmpty.theme.preset, 'climb-default');
  assert.equal(fromEmpty.profile.targetRating, 1600);

  // Partial update overrides only specified fields
  const merged = mergeWithDefaultSettings({
    theme: { preset: 'forest', mode: 'light', density: 'spacious', borderRadius: 'rounded', fontSize: 'large', animationIntensity: 'reduced', transparency: 'reduced' },
    profile: { displayName: 'AlgoMaster', targetRating: 1800 } as any,
  });

  assert.equal(merged.theme.preset, 'forest');
  assert.equal(merged.theme.mode, 'light');
  assert.equal(merged.profile.displayName, 'AlgoMaster');
  assert.equal(merged.profile.targetRating, 1800);
  // Unspecified fields retain safe defaults
  assert.equal(merged.localization.language, 'en');
  assert.equal(merged.competitiveProgramming.defaultLanguage, 'cpp20');
});

// -------------------------------------------------------------
// 4. BACKEND API & ZOD SCHEMA VALIDATION TESTS
// -------------------------------------------------------------
test('Backend API: SettingsUpdateSchema Validation', () => {
  // Valid payload
  const validPayload = {
    theme: {
      mode: 'dark',
      preset: 'ocean',
      density: 'compact',
    },
    profile: {
      displayName: 'CompetitiveCoder',
      targetRating: 1900,
      weeklyGoalHours: 15,
    },
    privacy: {
      profileVisibility: 'private',
      showActivityStatus: false,
    },
    localization: {
      language: 'bn',
      timeZone: 'Asia/Dhaka',
    },
    competitiveProgramming: {
      defaultLanguage: 'cpp20',
      defaultDifficultyMin: 1000,
      defaultDifficultyMax: 1700,
      editorFontSize: 16,
      editorTabSize: 4,
    },
  };

  const parsed = SettingsUpdateSchema.safeParse(validPayload);
  assert.equal(parsed.success, true, `Expected valid payload to parse successfully, errors: ${JSON.stringify(parsed.error?.issues)}`);

  // Validate new appearance modes
  for (const mode of ['light', 'dark', 'multicolor', 'orange', 'purple'] as const) {
    const modeParse = SettingsUpdateSchema.safeParse({ theme: { mode } });
    assert.equal(modeParse.success, true, `Mode ${mode} must be accepted by SettingsUpdateSchema`);
  }

  // Invalid rating (< 800)
  const invalidRating = SettingsUpdateSchema.safeParse({
    profile: { targetRating: 500 },
  });
  assert.equal(invalidRating.success, false, 'Rating < 800 must be rejected');

  // Invalid rating (> 3500)
  const extremeRating = SettingsUpdateSchema.safeParse({
    profile: { targetRating: 9999 },
  });
  assert.equal(extremeRating.success, false, 'Rating > 3500 must be rejected');

  // Invalid theme preset
  const invalidPreset = SettingsUpdateSchema.safeParse({
    theme: { preset: 'nonexistent-neon' },
  });
  assert.equal(invalidPreset.success, false, 'Invalid preset must be rejected');

  // Invalid language
  const invalidLang = SettingsUpdateSchema.safeParse({
    localization: { language: 'fr' },
  });
  assert.equal(invalidLang.success, false, 'Unsupported language must be rejected');
});

// -------------------------------------------------------------
// 5. ACCOUNT DELETION SAFETY CONFIRMATION TESTS
// -------------------------------------------------------------
test('Account Deletion: Rejects Without Exact Confirmation Token', async () => {
  const { deleteAccountHandler } = await import('./settingsServer.ts');

  // Case A: Missing confirmation
  let statusResult = 0;
  let jsonResult: any = null;
  const mockReqNoConfirm: any = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    body: {},
  };
  const mockRes: any = {
    status(s: number) {
      statusResult = s;
      return {
        json(j: any) {
          jsonResult = j;
        },
      };
    },
  };

  await deleteAccountHandler(mockReqNoConfirm, mockRes);
  assert.equal(statusResult, 400);
  assert.equal(jsonResult?.error, 'InvalidConfirmation');

  // Case B: Partial or typo confirmation
  const mockReqTypo: any = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    body: { confirmation: 'delete' },
  };
  await deleteAccountHandler(mockReqTypo, mockRes);
  assert.equal(statusResult, 400);
  assert.equal(jsonResult?.error, 'InvalidConfirmation');
});

// -------------------------------------------------------------
// 6. GUARDIAN PREFERENCES & EMERGENCY EXCLUSION TESTS
// -------------------------------------------------------------
test('Guardian Preferences: Essential Apps Are Unblockable and Duration Ranges Valid', () => {
  const guardian = DEFAULT_GLOBAL_SETTINGS.guardian;

  // Essential packages like phone dialer must NEVER be in default blockedPackages
  assert.equal(guardian.blockedPackages.includes('com.google.android.dialer'), false);
  assert.equal(guardian.blockedPackages.includes('com.google.android.apps.authenticator2'), false);

  // Focus duration must be reasonable for deliberate practice
  assert.ok(guardian.focusSessionDurationMinutes >= 15);
  assert.ok(guardian.focusSessionDurationMinutes <= 120);
  assert.ok(guardian.breakDurationMinutes >= 5);
  assert.ok(guardian.breathingDelaySeconds >= 0);
});
