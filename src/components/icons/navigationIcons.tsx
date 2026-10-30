import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category A: Application Navigation
 * 20 core navigation icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. Dashboard
export const DashboardIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
    <path d="M9 22V12h6v10" />
  </IconBase>
);

// 2. Practice
export const PracticeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </IconBase>
);

// 3. Problems
export const ProblemsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 6h12" />
    <path d="M9 12h12" />
    <path d="M9 18h12" />
    <polyline points="3 6 4 7 6 5" />
    <polyline points="3 12 4 13 6 11" />
    <polyline points="3 18 4 19 6 17" />
  </IconBase>
);

// 4. Contests
export const ContestsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
    <path d="M12 16v3" />
    <path d="M8 22h8" />
    <path d="M10 19h4" />
  </IconBase>
);

// 5. Analytics
export const AnalyticsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </IconBase>
);

// 6. Progress
export const ProgressIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
    <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
    <circle cx="13.5" cy="15.5" r="1.5" fill="currentColor" />
  </IconBase>
);

// 7. Learning Roadmap
export const LearningRoadmapIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </IconBase>
);

// 8. Topic Mastery
export const TopicMasteryIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </IconBase>
);

// 9. Bookmarks
export const BookmarksIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </IconBase>
);

// 10. Submission History
export const SubmissionHistoryIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <polyline points="12 7 12 12 15 15" />
  </IconBase>
);

// 11. AI Coach
export const AICoachIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="10" width="18" height="11" rx="3" />
    <circle cx="12" cy="4.5" r="1.5" />
    <line x1="12" y1="6" x2="12" y2="10" />
    <circle cx="8.5" cy="15" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15" r="1.5" fill="currentColor" />
    <path d="M9 18.5c1 .6 2 .6 3 .6s2 0 3-.6" />
    <line x1="1" y1="15" x2="3" y2="15" />
    <line x1="21" y1="15" x2="23" y2="15" />
  </IconBase>
);

// 12. Code Playground
export const CodePlaygroundIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <polyline points="9 8 7 10 9 12" />
    <polyline points="15 8 17 10 15 12" />
  </IconBase>
);

// 13. Focus Mode
export const FocusModeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

// 14. Achievements
export const AchievementsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.48 13.2L18 22l-6-3-6 3 2.52-8.8" />
    <polygon points="12 5 13.1 7.2 15.5 7.6 13.8 9.2 14.2 11.6 12 10.5 9.8 11.6 10.2 9.2 8.5 7.6 10.9 7.2" fill="currentColor" />
  </IconBase>
);

// 15. Community
export const CommunityIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconBase>
);

// 16. Notifications
export const NotificationsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="19" cy="5" r="2.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth={1.5} />
  </IconBase>
);

// 17. Settings
export const SettingsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </IconBase>
);

// 18. Help
export const HelpIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="0.75" fill="currentColor" strokeWidth={2.5} />
  </IconBase>
);

// 19. Feedback
export const FeedbackIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 7.5c-1.3-1.5-3.5-.8-3.5 1.3 0 1.8 3.5 4.2 3.5 4.2s3.5-2.4 3.5-4.2c0-2.1-2.2-2.8-3.5-1.3z" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 20. User Profile
export const UserProfileIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);
