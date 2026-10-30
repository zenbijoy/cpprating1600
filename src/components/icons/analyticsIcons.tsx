import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category E: Dashboard Analytics
 * 21 Analytics & Progress icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. Total Solved
export const TotalSolvedIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </IconBase>
);

// 2. Problems Attempted
export const ProblemsAttemptedIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
    <line x1="12" y1="8" x2="17" y2="8" />
    <line x1="12" y1="12" x2="17" y2="12" />
    <line x1="12" y1="16" x2="17" y2="16" />
  </IconBase>
);

// 3. Accuracy
export const AccuracyIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
  </IconBase>
);

// 4. Current Rating
export const CurrentRatingIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <circle cx="12" cy="9" r="7" fill="currentColor" fillOpacity="0.15" />
    <polygon points="12 4 13.5 7 17 7.5 14.5 9.8 15.2 13.2 12 11.5 8.8 13.2 9.5 9.8 7 7.5 10.5 7" fill="currentColor" />
    <path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" />
  </IconBase>
);

// 5. Rating Goal
export const RatingGoalIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <polygon points="12 5 18 8 12 11 12 19" fill="currentColor" fillOpacity="0.3" />
    <line x1="12" y1="5" x2="12" y2="19" />
  </IconBase>
);

// 6. Progress
export const AnalyticsProgressIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </IconBase>
);

// 7. Weekly Activity
export const WeeklyActivityIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="7" y1="15" x2="7" y2="17" />
    <line x1="11" y1="13" x2="11" y2="17" />
    <line x1="15" y1="16" x2="15" y2="17" />
  </IconBase>
);

// 8. Monthly Activity
export const MonthlyActivityIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <rect x="7" y="13" width="2" height="2" rx="0.5" fill="currentColor" />
    <rect x="11" y="13" width="2" height="2" rx="0.5" fill="currentColor" />
    <rect x="15" y="13" width="2" height="2" rx="0.5" fill="currentColor" />
    <rect x="7" y="17" width="2" height="2" rx="0.5" fill="currentColor" />
    <rect x="11" y="17" width="2" height="2" rx="0.5" fill="currentColor" />
  </IconBase>
);

// 9. Topic Strength
export const TopicStrengthIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <circle cx="12" cy="5" r="3" fill="currentColor" fillOpacity="0.2" />
    <circle cx="6" cy="17" r="3" fill="currentColor" fillOpacity="0.2" />
    <circle cx="18" cy="17" r="3" fill="currentColor" fillOpacity="0.2" />
    <line x1="12" y1="8" x2="6" y2="14" />
    <line x1="12" y1="8" x2="18" y2="14" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </IconBase>
);

// 10. Weak Topic
export const WeakTopicIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3} />
  </IconBase>
);

// 11. Time Spent
export const TimeSpentIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </IconBase>
);

// 12. Consistency
export const ConsistencyIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polyline points="8 15 11 18 16 13" />
  </IconBase>
);

// 13. Calendar Heatmap
export const CalendarHeatmapIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <rect x="3" y="3" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="9" y="3" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.5" />
    <rect x="15" y="3" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.8" />
    <rect x="3" y="9" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.6" />
    <rect x="9" y="9" width="4" height="4" rx="1" fill="currentColor" fillOpacity="1" />
    <rect x="15" y="9" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.3" />
    <rect x="3" y="15" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.4" />
    <rect x="9" y="15" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.7" />
    <rect x="15" y="15" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.9" />
  </IconBase>
);

// 14. Trend Up
export const TrendUpIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </IconBase>
);

// 15. Trend Down
export const TrendDownIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </IconBase>
);

// 16. Neutral Trend
export const NeutralTrendIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="secondary" {...props}>
    <line x1="3" y1="12" x2="21" y2="12" />
  </IconBase>
);

// 17. Chart
export const ChartIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 16l4-7 4 3 5-8" />
  </IconBase>
);

// 18. Bar Chart
export const BarChartIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </IconBase>
);

// 19. Line Chart
export const LineChartIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 3v18h18" />
    <circle cx="8" cy="14" r="2" fill="currentColor" />
    <circle cx="14" cy="9" r="2" fill="currentColor" />
    <circle cx="19" cy="5" r="2" fill="currentColor" />
    <line x1="8" y1="14" x2="14" y2="9" />
    <line x1="14" y1="9" x2="19" y2="5" />
  </IconBase>
);

// 20. Target
export const TargetIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </IconBase>
);

// 21. Insights
export const InsightsIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" fill="currentColor" fillOpacity="0.15" />
    <line x1="12" y1="2" x2="12" y2="0" />
    <line x1="4.22" y1="4.22" x2="2.8" y2="2.8" />
    <line x1="19.78" y1="4.22" x2="21.2" y2="2.8" />
  </IconBase>
);
