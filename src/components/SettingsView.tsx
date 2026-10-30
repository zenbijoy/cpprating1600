import React, { useState, useEffect, useMemo } from 'react';
import {
  SettingsIcon,
  AppearanceIcon,
  UserProfileIcon,
  AccountIcon,
  SecurityIcon,
  LanguageIcon,
  AccessibilityIcon,
  CodingBracketsIcon,
  CodeforcesIntegrationIcon,
  FocusModeIcon,
  DataExportIcon,
  NotificationsIcon,
  SettingsSlidersIcon,
  SearchIcon,
  GoogleIntegrationIcon,
  WarningStatusIcon as AlertCircle,
  RetryIcon as RotateCcw,
  CheckCircleIcon as CheckCircle2,
  SaveIcon as Save,
  ShieldIcon as ShieldCheck,
  ChevronRightIcon as ChevronRight,
} from './icons';
import { UserGoal, UserProfile } from '../types';
import { GlobalUserSettings, ThemeConfig, ProfileSettings, PrivacySettings, LocalizationPreferences, AccessibilitySettings, CompetitiveProgrammingPreferences, GuardianPreferences, ApplicationPreferences } from '../types/settings';
import { storageService } from '../services/storage';
import { settingsService } from '../services/settingsService';
import { applyThemeToDom } from '../utils/themeEngine';
import { useTranslation } from '../utils/i18n';

// Modular Section Components
import { AppearanceSettingsSection } from './settings/AppearanceSettingsSection';
import { ProfileSettingsSection } from './settings/ProfileSettingsSection';
import { AccountSettingsSection } from './settings/AccountSettingsSection';
import { PrivacySettingsSection } from './settings/PrivacySettingsSection';
import { LocalizationSettingsSection } from './settings/LocalizationSettingsSection';
import { AccessibilitySettingsSection } from './settings/AccessibilitySettingsSection';
import { CompetitiveProgrammingSettingsSection } from './settings/CompetitiveProgrammingSettingsSection';
import { CodeforcesSettingsSection } from './settings/CodeforcesSettingsSection';
import { GuardianSettingsSection } from './settings/GuardianSettingsSection';
import { DataSettingsSection } from './settings/DataSettingsSection';
import { NotificationSettingsSection } from './settings/NotificationSettingsSection';
import { ApplicationSettingsSection } from './settings/ApplicationSettingsSection';

export type SettingsSectionId =
  | 'appearance'
  | 'profile'
  | 'account'
  | 'privacy'
  | 'localization'
  | 'accessibility'
  | 'cp'
  | 'codeforces'
  | 'guardian'
  | 'data'
  | 'notifications'
  | 'app';

interface SettingsViewProps {
  goal: UserGoal;
  profile: UserProfile;
  onUpdateGoal: (goal: UserGoal) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetAllData: () => void;
  isAuthenticated?: boolean;
  userEmail?: string;
  isCfVerified?: boolean;
  cfAccount?: any;
  onOpenAuthModal?: () => void;
  onOpenVerificationModal?: () => void;
  onUnlinkCfAccount?: () => void;
  onSyncCfData?: () => void;
  onSignOut?: () => void;
  onReplaySplash?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  goal,
  profile,
  onUpdateGoal,
  onUpdateProfile,
  onResetAllData,
  isAuthenticated = false,
  userEmail,
  isCfVerified = false,
  cfAccount,
  onOpenAuthModal,
  onOpenVerificationModal,
  onUnlinkCfAccount,
  onSyncCfData,
  onSignOut,
  onReplaySplash,
}) => {
  const { t } = useTranslation();

  // Settings State
  const [settings, setSettings] = useState<GlobalUserSettings>(() => storageService.getSettings());
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('appearance');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Initialize and sync settings from remote if authenticated
  useEffect(() => {
    let mounted = true;
    settingsService.getSettings().then((remoteSettings) => {
      if (mounted) {
        setSettings(remoteSettings);
        applyThemeToDom(remoteSettings.theme);
      }
    });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Section Navigation Items
  const navSections = useMemo(
    () => [
      { id: 'appearance' as SettingsSectionId, label: t('nav.appearance'), icon: AppearanceIcon, category: 'Personalization' },
      { id: 'profile' as SettingsSectionId, label: t('nav.profile'), icon: UserProfileIcon, category: 'Personalization' },
      { id: 'account' as SettingsSectionId, label: t('nav.account'), icon: AccountIcon, category: 'Identity & Access' },
      { id: 'privacy' as SettingsSectionId, label: t('nav.privacy'), icon: SecurityIcon, category: 'Identity & Access' },
      { id: 'localization' as SettingsSectionId, label: t('nav.localization'), icon: LanguageIcon, category: 'Preferences' },
      { id: 'accessibility' as SettingsSectionId, label: t('nav.accessibility'), icon: AccessibilityIcon, category: 'Preferences' },
      { id: 'cp' as SettingsSectionId, label: t('nav.cp'), icon: CodingBracketsIcon, category: 'Training' },
      { id: 'codeforces' as SettingsSectionId, label: t('nav.codeforces'), icon: CodeforcesIntegrationIcon, category: 'Integrations' },
      { id: 'guardian' as SettingsSectionId, label: t('nav.guardian'), icon: FocusModeIcon, category: 'Integrations' },
      { id: 'data' as SettingsSectionId, label: t('nav.data'), icon: DataExportIcon, category: 'System' },
      { id: 'notifications' as SettingsSectionId, label: t('nav.notifications'), icon: NotificationsIcon, category: 'System' },
      { id: 'app' as SettingsSectionId, label: t('nav.app'), icon: SettingsSlidersIcon, category: 'System' },
    ],
    [t]
  );

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navSections;
    const q = searchQuery.toLowerCase();
    return navSections.filter(
      (sec) =>
        sec.label.toLowerCase().includes(q) ||
        sec.id.toLowerCase().includes(q) ||
        sec.category.toLowerCase().includes(q)
    );
  }, [navSections, searchQuery]);

  // Section Change Handler
  const handleSelectSection = (id: SettingsSectionId) => {
    setActiveSection(id);
  };

  // Updaters for individual sections
  const handleUpdateTheme = (updatedTheme: ThemeConfig) => {
    setSettings((prev) => ({ ...prev, theme: updatedTheme }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateProfileSection = (updatedProfile: ProfileSettings) => {
    setSettings((prev) => ({ ...prev, profile: updatedProfile }));
    setHasUnsavedChanges(true);
  };

  const handleUpdatePrivacy = (updatedPrivacy: PrivacySettings) => {
    setSettings((prev) => ({ ...prev, privacy: updatedPrivacy }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateLocalization = (updatedLoc: LocalizationPreferences) => {
    setSettings((prev) => ({ ...prev, localization: updatedLoc }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateAccessibility = (updatedA11y: AccessibilitySettings) => {
    setSettings((prev) => ({ ...prev, accessibility: updatedA11y }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateCP = (updatedCP: CompetitiveProgrammingPreferences) => {
    setSettings((prev) => ({ ...prev, competitiveProgramming: updatedCP }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateGuardian = (updatedGuardian: GuardianPreferences) => {
    setSettings((prev) => ({ ...prev, guardian: updatedGuardian }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateApp = (updatedApp: ApplicationPreferences) => {
    setSettings((prev) => ({ ...prev, app: updatedApp }));
    setHasUnsavedChanges(true);
  };

  // Master Save Action
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Save through unified settings service (localStorage + cloud API)
      await settingsService.saveSettings(settings);

      // 2. Sync profile & goal to parent App state
      const updatedProfileModel: UserProfile = {
        ...profile,
        name: settings.profile.displayName || profile.name,
        avatar: settings.profile.avatar || profile.avatar,
        preferredLanguage: settings.profile.preferredLanguage,
        theme: settings.theme.mode,
      };
      onUpdateProfile(updatedProfileModel);

      const updatedGoalModel: UserGoal = {
        ...goal,
        targetRating: settings.profile.targetRating || goal.targetRating,
        dailyMinutes: settings.competitiveProgramming.dailyTargetMinutes || goal.dailyMinutes,
      };
      onUpdateGoal(updatedGoalModel);

      // 3. Apply theme tokens to DOM immediately
      applyThemeToDom(settings.theme);

      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save settings error:', err);
      alert(`Save notice: ${err.message || 'Error updating settings.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Section Reset Action
  const handleResetCurrentSection = async () => {
    if (window.confirm(`Reset "${navSections.find((s) => s.id === activeSection)?.label}" to default values?`)) {
      let resetKey: keyof GlobalUserSettings = 'theme';
      if (activeSection === 'appearance') resetKey = 'theme';
      else if (activeSection === 'profile') resetKey = 'profile';
      else if (activeSection === 'privacy') resetKey = 'privacy';
      else if (activeSection === 'localization') resetKey = 'localization';
      else if (activeSection === 'accessibility') resetKey = 'accessibility';
      else if (activeSection === 'cp') resetKey = 'competitiveProgramming';
      else if (activeSection === 'guardian') resetKey = 'guardian';
      else if (activeSection === 'app') resetKey = 'app';

      const updated = await settingsService.resetSettings(resetKey);
      setSettings(updated);
      setHasUnsavedChanges(false);
    }
  };

  const activeNav = navSections.find((s) => s.id === activeSection);

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* 1. Header & Quick Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('settings.title')}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t('settings.description')}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {hasUnsavedChanges && (
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 mr-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Unsaved changes</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetCurrentSection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            title="Reset active category to default values"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t('settings.reset_section')}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? t('settings.saving') : saveSuccess ? t('settings.saved') : t('settings.save_changes')}</span>
          </button>
        </div>
      </div>

      {/* 2. Profile Summary Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {profile.avatar || settings.profile.avatar ? (
            <img
              src={profile.avatar || settings.profile.avatar}
              alt="Avatar"
              className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-950 border-2 border-indigo-700 flex items-center justify-center font-bold text-lg text-indigo-300">
              {(settings.profile.displayName || profile.name || userEmail || 'U')[0]?.toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base">
                {settings.profile.displayName || profile.name || 'Competitive Programmer'}
              </h2>
              {isCfVerified && (
                <span className="flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {profile.cfHandle ? (
                <span>
                  Codeforces: <strong className="text-white">{profile.cfHandle}</strong> (Rating: {profile.verifiedCfRating || 'Unrated'} • {profile.rank || 'Unrated'})
                </span>
              ) : (
                <span>No Codeforces handle linked yet</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAuthenticated ? (
            <span className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Cloud Synced</span>
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-amber-900/60 bg-amber-950/30 text-amber-300 text-xs font-semibold px-3 py-1.5">
                Local Guest Mode
              </span>
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <GoogleIntegrationIcon size={14} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Search Bar for Settings */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('settings.search_placeholder')}
          className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
        />
        <SearchIcon size={16} className="text-slate-500 absolute left-3.5 top-3" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* 4. Master Layout: Left Navigation + Main Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side Navigation (Desktop Sidebar / Mobile Selector) */}
        <div className="lg:col-span-1 space-y-2">
          {/* Mobile Category Dropdown Selector */}
          <div className="block lg:hidden">
            <select
              value={activeSection}
              onChange={(e) => handleSelectSection(e.target.value as SettingsSectionId)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {filteredSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Left Navigation Bar */}
          <div className="hidden lg:flex flex-col space-y-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
            {filteredSections.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 text-center">{t('settings.no_results')}</p>
            ) : (
              filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isSelected = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectSection(sec.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{sec.label}</span>
                    </div>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side Main Content Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Settings</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-semibold">{activeNav?.label}</span>
          </div>

          {/* Section Panel Switching */}
          {activeSection === 'appearance' && (
            <AppearanceSettingsSection
              config={settings.theme}
              onChange={handleUpdateTheme}
              onReset={() => handleResetCurrentSection()}
            />
          )}

          {activeSection === 'profile' && (
            <ProfileSettingsSection
              profile={settings.profile}
              onChange={handleUpdateProfileSection}
              cfHandle={profile.cfHandle}
              cfRating={profile.verifiedCfRating}
              cfMaxRating={profile.maxCfRating}
              cfRank={profile.rank}
              isCfVerified={isCfVerified}
            />
          )}

          {activeSection === 'account' && (
            <AccountSettingsSection
              isAuthenticated={isAuthenticated}
              userEmail={userEmail}
              onOpenAuthModal={onOpenAuthModal}
              onSignOut={onSignOut}
            />
          )}

          {activeSection === 'privacy' && (
            <PrivacySettingsSection
              privacy={settings.privacy}
              onChange={handleUpdatePrivacy}
            />
          )}

          {activeSection === 'localization' && (
            <LocalizationSettingsSection
              localization={settings.localization}
              onChange={handleUpdateLocalization}
            />
          )}

          {activeSection === 'accessibility' && (
            <AccessibilitySettingsSection
              accessibility={settings.accessibility}
              onChange={handleUpdateAccessibility}
            />
          )}

          {activeSection === 'cp' && (
            <CompetitiveProgrammingSettingsSection
              cp={settings.competitiveProgramming}
              onChange={handleUpdateCP}
            />
          )}

          {activeSection === 'codeforces' && (
            <CodeforcesSettingsSection
              cfHandle={profile.cfHandle}
              isCfVerified={isCfVerified}
              cfAccount={cfAccount}
              onOpenVerificationModal={onOpenVerificationModal}
              onSyncCfData={onSyncCfData}
              onUnlinkCfAccount={onUnlinkCfAccount}
            />
          )}

          {activeSection === 'guardian' && (
            <GuardianSettingsSection
              guardian={settings.guardian}
              onChange={handleUpdateGuardian}
              isAuthenticated={isAuthenticated}
            />
          )}

          {activeSection === 'data' && (
            <DataSettingsSection onResetAllData={onResetAllData} />
          )}

          {activeSection === 'notifications' && <NotificationSettingsSection />}

          {activeSection === 'app' && (
            <ApplicationSettingsSection
              app={settings.app}
              onChange={handleUpdateApp}
              onReplaySplash={onReplaySplash}
            />
          )}
        </div>
      </div>
    </div>
  );
};
