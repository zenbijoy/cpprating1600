import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category G: Notifications and Status
 * 17 Notifications & Status icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. Notification Bell
export const NotificationBellIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </IconBase>
);

// 2. Notification Unread
export const NotificationUnreadIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="19" cy="5" r="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth={1.5} />
  </IconBase>
);

// 3. Success
export const SuccessStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </IconBase>
);

// 4. Warning
export const WarningStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </IconBase>
);

// 5. Error
export const ErrorStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </IconBase>
);

// 6. Information
export const InformationStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="info" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
  </IconBase>
);

// 7. Loading
export const LoadingStatusIcon: React.FC<IconProps> = ({ className = '', ...props }) => (
  <IconBase className={`animate-spin ${className}`} semantic="primary" {...props}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </IconBase>
);

// 8. Offline
export const OfflineStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={3} />
  </IconBase>
);

// 9. Online
export const OnlineStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={3} />
  </IconBase>
);

// 10. Syncing
export const SyncingStatusIcon: React.FC<IconProps> = ({ className = '', ...props }) => (
  <IconBase className={`animate-spin ${className}`} semantic="primary" {...props}>
    <path d="M21.5 2v6h-6M2.5 22v-6h6" />
    <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2" />
  </IconBase>
);

// 11. Sync Complete
export const SyncCompleteStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    <polyline points="9 13 12 16 16 12" />
  </IconBase>
);

// 12. Clock
export const ClockStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </IconBase>
);

// 13. Calendar Event
export const CalendarEventStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="15" r="2" fill="currentColor" />
  </IconBase>
);

// 14. Reminder
export const ReminderStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M2 4l3 3M22 4l-3 3" />
  </IconBase>
);

// 15. New Update
export const NewUpdateStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 16. Connection Issue
export const ConnectionIssueStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l1.5-1.5" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-1.5 1.5" />
    <line x1="2" y1="2" x2="22" y2="22" />
    <circle cx="19" cy="5" r="2.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth={1} />
  </IconBase>
);

// 17. Permission Required
export const PermissionRequiredStatusIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="2" fill="currentColor" />
    <path d="M12 13v3" strokeWidth={2.5} />
  </IconBase>
);
