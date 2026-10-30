import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category F: User Account and Settings
 * 27 Account, Security & Preferences icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. User
export const UserIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);

// 2. Edit Profile
export const EditProfileIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 11l3-3-2-2-3 3v2h2z" />
  </IconBase>
);

// 3. Account
export const AccountIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="11" r="2.5" />
    <path d="M6 17a3 3 0 0 1 6 0" />
    <line x1="14" y1="9" x2="18" y2="9" />
    <line x1="14" y1="13" x2="18" y2="13" />
  </IconBase>
);

// 4. Security
export const SecurityIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1" />
    <polyline points="9 12 11 14 15 10" />
  </IconBase>
);

// 5. Password
export const PasswordIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </IconBase>
);

// 6. Eye
export const EyeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

// 7. Eye Off
export const EyeOffIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </IconBase>
);

// 8. Shield
export const ShieldIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </IconBase>
);

// 9. Lock
export const LockIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconBase>
);

// 10. Unlock
export const UnlockIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </IconBase>
);

// 11. Key
export const KeyIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 2l-2 2m-1.5 1.5L14 9l-2-2-4 4 2 2-7 7a2.828 2.828 0 0 0 4 4l7-7 2 2 4-4-2-2 3.5-3.5" />
    <circle cx="17.5" cy="6.5" r="1.5" />
  </IconBase>
);

// 12. Google Integration
export const GoogleIntegrationIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <path d="M21.35 11.1H12v2.85h5.36c-.24 1.34-1.05 2.48-2.22 3.24v2.66h3.6c2.1-1.94 3.31-4.8 3.31-8.15 0-.58-.06-1.12-.17-1.6z" fill="#4285F4" stroke="none" />
    <path d="M12 21c2.7 0 4.98-.9 6.64-2.45l-3.6-2.66c-.9.6-2.06.96-3.04.96-2.34 0-4.32-1.58-5.03-3.71H3.25v2.75C4.9 19.16 8.18 21 12 21z" fill="#34A853" stroke="none" />
    <path d="M6.97 13.14a5.55 5.55 0 0 1 0-2.28V8.11H3.25A9.47 9.47 0 0 0 2 12c0 1.52.36 2.96 1.25 3.89l3.72-2.75z" fill="#FBBC05" stroke="none" />
    <path d="M12 5.15c1.47 0 2.79.51 3.83 1.5l2.87-2.87C17.02 2.21 14.7 1.25 12 1.25 8.18 1.25 4.9 3.09 3.25 6.36l3.72 2.75c.71-2.13 2.69-3.71 5.03-3.71z" fill="#EA4335" stroke="none" />
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth={1.5} />
  </IconBase>
);

// 13. Codeforces Integration
export const CodeforcesIntegrationIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="11" width="4.5" height="10" rx="1" fill="#FFC107" stroke="#FFC107" strokeWidth={1} />
    <rect x="9.75" y="4" width="4.5" height="17" rx="1" fill="#2196F3" stroke="#2196F3" strokeWidth={1} />
    <rect x="16.5" y="8" width="4.5" height="13" rx="1" fill="#E91E63" stroke="#E91E63" strokeWidth={1} />
  </IconBase>
);

// 14. Connected
export const ConnectedIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </IconBase>
);

// 15. Disconnected
export const DisconnectedIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l1.5-1.5" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-1.5 1.5" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </IconBase>
);

// 16. Synchronization
export const SynchronizationIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <path d="M21.5 2v6h-6M2.5 22v-6h6" />
    <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2" />
  </IconBase>
);

// 17. Preferences
export const PreferencesIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </IconBase>
);

// 18. Appearance
export const AppearanceIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
  </IconBase>
);

// 19. Sun
export const SunIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </IconBase>
);

// 20. Moon
export const MoonIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 21. System Theme
export const SystemThemeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <path d="M12 3v14" />
    <path d="M12 3a9 9 0 0 1 0 14" fill="currentColor" fillOpacity="0.25" />
  </IconBase>
);

// 22. Language
export const LanguageIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </IconBase>
);

// 23. Accessibility
export const AccessibilityIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <circle cx="12" cy="4" r="2" fill="currentColor" />
    <path d="M4 8h16" />
    <path d="M12 8v7" />
    <path d="M9 22l3-7 3 7" />
  </IconBase>
);

// 24. Keyboard Shortcuts
export const KeyboardShortcutsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="6" y1="8" x2="6.01" y2="8" strokeWidth={3} />
    <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth={3} />
    <line x1="14" y1="8" x2="14.01" y2="8" strokeWidth={3} />
    <line x1="18" y1="8" x2="18.01" y2="8" strokeWidth={3} />
    <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth={3} />
    <line x1="18" y1="12" x2="18.01" y2="12" strokeWidth={3} />
    <line x1="8" y1="16" x2="16" y2="16" />
  </IconBase>
);

// 25. Data Export
export const DataExportIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconBase>
);

// 26. Delete Account
export const DeleteAccountIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <circle cx="12" cy="13" r="2" />
    <path d="M9.5 18a2.5 2.5 0 0 1 5 0" />
  </IconBase>
);

// 27. Log Out
export const LogOutIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </IconBase>
);
