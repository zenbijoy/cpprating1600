import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category C: Competitive Programming
 * 41 CP & Code Editor icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. Coding brackets
export const CodingBracketsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </IconBase>
);

// 2. Terminal
export const TerminalIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </IconBase>
);

// 3. Code file
export const CodeFileIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <polyline points="10 12 8 14 10 16" />
    <polyline points="14 12 16 14 14 16" />
  </IconBase>
);

// 4. Source code
export const SourceCodeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </IconBase>
);

// 5. Compiler
export const CompilerIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </IconBase>
);

// 6. Run code
export const RunCodeIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 7. Submit solution
export const SubmitSolutionIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" fillOpacity="0.15" />
  </IconBase>
);

// 8. Test cases
export const TestCasesIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </IconBase>
);

// 9. Passed test
export const PassedTestIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="8 12 11 15 16 9" />
  </IconBase>
);

// 10. Failed test
export const FailedTestIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </IconBase>
);

// 11. Partial acceptance
export const PartialAcceptanceIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" fillOpacity="0.3" />
  </IconBase>
);

// 12. Time limit
export const TimeLimitIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="13" r="8" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="13" x2="15" y2="15" />
    <line x1="12" y1="2" x2="12" y2="5" />
  </IconBase>
);

// 13. Memory usage
export const MemoryUsageIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <line x1="6" y1="18" x2="6" y2="21" />
    <line x1="10" y1="18" x2="10" y2="21" />
    <line x1="14" y1="18" x2="14" y2="21" />
    <line x1="18" y1="18" x2="18" y2="21" />
    <rect x="5" y="9" width="3" height="4" />
    <rect x="10" y="9" width="3" height="4" />
    <rect x="15" y="9" width="3" height="4" />
  </IconBase>
);

// 14. Runtime
export const RuntimeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </IconBase>
);

// 15. Accepted (AC)
export const AcceptedIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
    <polyline points="8 12 11 15 16 9" />
  </IconBase>
);

// 16. Wrong answer (WA)
export const WrongAnswerIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </IconBase>
);

// 17. Compilation error (CE)
export const CompilationErrorIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="currentColor" fillOpacity="0.1" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3} />
  </IconBase>
);

// 18. Runtime error (RE)
export const RuntimeErrorIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.15" />
  </IconBase>
);

// 19. Time limit exceeded (TLE)
export const TimeLimitExceededIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </IconBase>
);

// 20. Memory limit exceeded (MLE)
export const MemoryLimitExceededIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </IconBase>
);

// 21. Difficulty level
export const DifficultyLevelIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="10" y="9" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.4" />
    <rect x="17" y="4" width="4" height="17" rx="1" fill="currentColor" fillOpacity="0.7" />
  </IconBase>
);

// 22. Problem tags
export const ProblemTagsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth={3} />
  </IconBase>
);

// 23. Problem statement
export const ProblemStatementIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="9" y1="7" x2="15" y2="7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </IconBase>
);

// 24. Editorial
export const EditorialIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    <path d="M12 7v5" strokeDasharray="1 1" />
  </IconBase>
);

// 25. Hint
export const HintIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" fill="currentColor" fillOpacity="0.15" />
  </IconBase>
);

// 26. Solution
export const SolutionIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <circle cx="8" cy="15" r="4" />
    <line x1="10.85" y1="12.15" x2="19" y2="4" />
    <line x1="18" y1="5" x2="20" y2="7" />
    <line x1="15" y1="8" x2="17" y2="10" />
  </IconBase>
);

// 27. Contest
export const ContestBadgeIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
    <path d="M12 16v3" />
    <path d="M8 22h8" />
  </IconBase>
);

// 28. Virtual contest
export const VirtualContestIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
    <circle cx="12" cy="18" r="4" />
    <polyline points="12 16 12 18 14 18" />
  </IconBase>
);

// 29. Rating
export const RatingIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 30. Rating increase
export const RatingIncreaseIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <polyline points="18 15 12 9 6 15" />
    <line x1="12" y1="9" x2="12" y2="21" />
    <polygon points="12 3 13.5 6 10.5 6" fill="currentColor" />
  </IconBase>
);

// 31. Rating decrease
export const RatingDecreaseIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <polyline points="6 9 12 15 18 9" />
    <line x1="12" y1="3" x2="12" y2="15" />
    <polygon points="12 21 13.5 18 10.5 18" fill="currentColor" />
  </IconBase>
);

// 32. Streak
export const StreakIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 33. Daily challenge
export const DailyChallengeIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polygon points="12 12 13 14 15 14.5 13.5 16 14 18 12 17 10 18 10.5 16 9 14.5 11 14" fill="currentColor" />
  </IconBase>
);

// 34. Target rating
export const TargetRatingIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </IconBase>
);

// 35. Leaderboard
export const LeaderboardIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="2" y="11" width="6" height="10" rx="1" fill="currentColor" fillOpacity="0.15" />
    <rect x="9" y="5" width="6" height="16" rx="1" fill="currentColor" fillOpacity="0.3" />
    <rect x="16" y="14" width="6" height="7" rx="1" fill="currentColor" fillOpacity="0.1" />
  </IconBase>
);

// 36. Trophy
export const TrophyIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 16v3" />
    <path d="M8 22h8" />
  </IconBase>
);

// 37. Medal
export const MedalIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <circle cx="12" cy="8" r="6" fill="currentColor" fillOpacity="0.15" />
    <path d="M15.48 13.2L18 22l-6-3-6 3 2.52-8.8" />
  </IconBase>
);

// 38. Milestone
export const MilestoneIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <line x1="4" y1="22" x2="4" y2="2" />
    <polygon points="4 4 19 8 4 12 4 4" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 39. Stopwatch
export const StopwatchIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="14" r="8" />
    <line x1="12" y1="10" x2="12" y2="14" />
    <line x1="12" y1="14" x2="15" y2="16" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="10" y1="2" x2="14" y2="2" />
  </IconBase>
);

// 40. Timer
export const TimerIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="10" y1="2" x2="14" y2="2" />
    <line x1="12" y1="14" x2="15" y2="11" />
    <circle cx="12" cy="14" r="8" />
  </IconBase>
);

// 41. Calendar
export const CalendarIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconBase>
);
