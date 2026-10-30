import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category D: AI Assistant
 * 17 AI Assistant icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. AI Assistant
export const AIAssistantBotIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <rect x="3" y="10" width="18" height="11" rx="3" fill="currentColor" fillOpacity="0.08" />
    <circle cx="12" cy="4.5" r="1.5" />
    <line x1="12" y1="6" x2="12" y2="10" />
    <circle cx="8.5" cy="15" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15" r="1.5" fill="currentColor" />
    <path d="M9 18.5c1 .6 2 .6 3 .6s2 0 3-.6" />
    <line x1="1" y1="15" x2="3" y2="15" />
    <line x1="21" y1="15" x2="23" y2="15" />
  </IconBase>
);

// 2. AI Sparkle
export const AISparkleIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M19 17l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="currentColor" />
  </IconBase>
);

// 3. Ask a Question
export const AskQuestionIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="0.75" fill="currentColor" strokeWidth={2.5} />
  </IconBase>
);

// 4. Generate Explanation
export const GenerateExplanationIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="12" y2="17" />
    <path d="M17 17l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" fill="currentColor" />
  </IconBase>
);

// 5. Debug Code
export const DebugCodeIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <polyline points="7 8 3 12 7 16" />
    <polyline points="17 8 21 12 17 16" />
    <rect x="9" y="9" width="6" height="7" rx="3" />
    <path d="M9 11H6" />
    <path d="M18 11h-3" />
    <path d="M9 14H6" />
    <path d="M18 14h-3" />
    <path d="M10 7L8 5" />
    <path d="M14 7l2-2" />
  </IconBase>
);

// 6. Explain Code
export const ExplainCodeIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
    <polyline points="10 9 9 10.5 10 12" />
    <polyline points="14 9 15 10.5 14 12" />
  </IconBase>
);

// 7. Suggest Optimization
export const SuggestOptimizationIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="warning" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 8. Generate Test Cases
export const GenerateTestCasesIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 6h11" />
    <path d="M9 12h11" />
    <path d="M9 18h6" />
    <polyline points="3 6 4 7 6 5" />
    <polyline points="3 12 4 13 6 11" />
    <polyline points="3 18 4 19 6 17" />
    <path d="M18 17l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" fill="currentColor" />
  </IconBase>
);

// 9. Chat
export const ChatIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </IconBase>
);

// 10. Send Message
export const SendMessageIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" fillOpacity="0.2" />
  </IconBase>
);

// 11. Stop Generation
export const StopGenerationIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
  </IconBase>
);

// 12. Regenerate
export const RegenerateIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </IconBase>
);

// 13. Thinking
export const ThinkingIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="indigo" {...props}>
    <path d="M9.5 2A4.5 4.5 0 0 0 5 6.5C5 7.9 5.6 9.1 6.6 10 5.6 10.9 5 12.1 5 13.5a4.5 4.5 0 0 0 4 4.47V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.03A4.5 4.5 0 0 0 19 13.5c0-1.4-.6-2.6-1.6-3.5 1-.9 1.6-2.1 1.6-3.5A4.5 4.5 0 0 0 14.5 2c-1.3 0-2.4.5-3.3 1.4C10.3 2.5 9.2 2 9.5 2z" />
    <path d="M9 18h6" />
  </IconBase>
);

// 14. Context
export const ContextIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </IconBase>
);

// 15. Copy Response
export const CopyResponseIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </IconBase>
);

// 16. Feedback Positive
export const FeedbackPositiveIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="success" {...props}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </IconBase>
);

// 17. Feedback Negative
export const FeedbackNegativeIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="error" {...props}>
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </IconBase>
);
