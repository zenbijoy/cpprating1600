import { ProgrammingLanguage } from './index';

export type AppearanceMode = 'light' | 'dark' | 'multicolor' | 'orange' | 'purple' | 'system';

export type ThemePresetId =
  | 'climb-default'
  | 'midnight'
  | 'cyber-matrix'
  | 'candy-pop'
  | 'kawaii-anime'
  | 'retro-arcade'
  | 'galaxy-space'
  | 'jungle-safari'
  | 'coffee-overdrive'
  | 'dragon-fire'
  | 'ocean'
  | 'forest'
  | 'violet'
  | 'warm-neutral'
  | 'amoled'
  | 'high-contrast'
  // 24 New Cartoon & Anime Themed Environments (40 Total)
  | 'mountain-summit'
  | 'sea-beach'
  | 'railway-express'
  | 'jorna-waterfall'
  | 'neon-road'
  | 'anime-village'
  | 'sci-fi-mecha'
  | 'fighting-coliseum'
  | 'sakura-shrine'
  | 'pixel-dungeon'
  | 'steampunk-airship'
  | 'aurora-borealis'
  | 'desert-oasis'
  | 'ninja-shadow'
  | 'magic-academy'
  | 'underwater-atlantis'
  | 'sunset-lofi'
  | 'volcano-forge'
  | 'cyberpunk-tokyo'
  | 'wild-west'
  | 'pirate-cove'
  | 'superhero-city'
  | 'fairytale-wonderland'
  | 'valhalla-viking';

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

export type InterfaceDensity = 'compact' | 'comfortable' | 'spacious';
export type BorderRadiusOption = 'compact' | 'standard' | 'rounded';
export type FontScaleOption = 'small' | 'standard' | 'large' | 'extra-large';
export type FontFamilyOption = 'outfit' | 'jakarta' | 'space-grotesk' | 'sora' | 'system';
export type AnimationIntensity = 'full' | 'reduced' | 'off';
export type TransparencyOption = 'normal' | 'reduced';

export interface ThemeColors {
  bgApp: string;
  bgSurface: string;
  bgCard: string;
  bgNav: string;
  border: string;
  borderSubtle: string;
  borderFocus: string;
  primary: string;
  secondary: string;
  textMain: string;
  textMuted: string;
  textSubtle: string;
  accentGlow: string;
}

export interface ThemeConfig {
  mode: AppearanceMode;
  preset: ThemePresetId;
  customPrimaryAccent?: string;
  customSecondaryAccent?: string;
  density: InterfaceDensity;
  borderRadius: BorderRadiusOption;
  fontSize: FontScaleOption;
  fontFamily?: FontFamilyOption;
  animationIntensity: AnimationIntensity;
  transparency: TransparencyOption;
  funnyThemeSounds?: boolean;
  playfulMascot?: boolean;
  backgroundSparkles?: boolean;
  selectedCharacter?: AnimeCharacterId;
  characterMood?: 'happy' | 'coding' | 'celebrating' | 'thinking' | 'zen' | 'excited' | 'battle';
}

export type ExperienceLevel = 'complete_beginner' | 'some_experience' | 'experienced_coder';
export type TrainingIntensity = 'casual' | 'standard' | 'intensive';

export interface ProfileSettings {
  displayName: string;
  avatar: string;
  bio: string;
  country: string;
  preferredLanguage: ProgrammingLanguage;
  experienceLevel: ExperienceLevel;
  learningGoals: string[];
  preferredTopics: string[];
  targetRating: number;
  weeklyGoalHours: number;
}

export interface AccountSettings {
  email: string;
  emailVerified: boolean;
  googleConnected: boolean;
  lastLoginAt: string;
  activeSessionBrowser: string;
  activeSessionOs: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends_only';
  showActivityStatus: boolean;
  shareAchievements: boolean;
  personalizedRecommendations: boolean;
  telemetryEnabled: boolean;
}

export interface LocalizationPreferences {
  language: 'en' | 'bn';
  timeZone: string; // e.g. "Asia/Dhaka", "UTC", "America/New_York"
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat: '12h' | '24h';
  weekStart: 'sunday' | 'monday' | 'saturday';
}

export interface AccessibilitySettings {
  fontSize: FontScaleOption;
  fontFamily?: FontFamilyOption;
  reducedMotion: boolean;
  highContrast: boolean;
  clearFocusIndicators: boolean;
  screenReaderLabels: boolean;
  density: InterfaceDensity;
  sidebarBehavior: 'expanded' | 'collapsed' | 'auto';
  tooltipsEnabled: boolean;
  confirmDestructiveActions: boolean;
}

export interface CompetitiveProgrammingPreferences {
  defaultLanguage: ProgrammingLanguage;
  defaultDifficultyMin: number;
  defaultDifficultyMax: number;
  preferredTags: string[];
  dailyTargetMinutes: number;
  weeklyTargetProblems: number;
  targetRating: number;
  trainingIntensity: TrainingIntensity;
  recommendationBehavior: 'adaptive' | 'stretch' | 'review_first';
  defaultSort: 'rating_asc' | 'rating_desc' | 'contest_id' | 'popularity';
  defaultFilter: 'unsolved_only' | 'all';
  editorTheme: 'vs-dark' | 'light' | 'hc-black';
  editorFontSize: number;
  editorTabSize: 2 | 4 | 8;
  lineNumbers: boolean;
  wordWrap: boolean;
  codeFontFamily: 'JetBrains Mono' | 'Fira Code' | 'Menlo' | 'Consolas' | 'Source Code Pro';
  codeTemplates: Record<ProgrammingLanguage, string>;
}

export interface GuardianPreferences {
  guardianEnabled: boolean;
  focusSessionDurationMinutes: number;
  breakDurationMinutes: number;
  dailyFocusMinutesGoal: number;
  breathingDelaySeconds: number;
  strictBlocking: boolean;
  scheduledStudyStart: string;
  scheduledStudyEnd: string;
  studyProtectionDays: number[]; // 0-6
  sessionCompletionSound: boolean;
  blockedPackages: string[];
  blockedDomains: string[];
}

export interface ApplicationPreferences {
  defaultLandingTab: string;
  rememberProblemFilters: boolean;
  autoRefreshData: boolean;
  confirmBeforeLeavingUnsaved: boolean;
  showOnboardingTips: boolean;
  enableKeyboardShortcuts: boolean;
  autoOpenProblemFromNotification: boolean;
  showSplashScreenOnLaunch: 'always' | 'first_time' | 'never';
}

export interface GlobalUserSettings {
  theme: ThemeConfig;
  profile: ProfileSettings;
  privacy: PrivacySettings;
  localization: LocalizationPreferences;
  accessibility: AccessibilitySettings;
  competitiveProgramming: CompetitiveProgrammingPreferences;
  guardian: GuardianPreferences;
  app: ApplicationPreferences;
  lastUpdated: string;
}
