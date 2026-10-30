import React from 'react';

export type IconSize = 'sm' | 'md' | 'lg' | 16 | 20 | 24 | number;

export type IconVariant = 'default' | 'hover' | 'active' | 'disabled' | 'focus';

export type IconSemantic =
  | 'primary'   // #2563EB
  | 'indigo'    // #4F46E5
  | 'success'   // #059669
  | 'warning'   // #D97706
  | 'error'     // #DC2626
  | 'info'      // #2563EB or #0284C7
  | 'secondary' // #64748B
  | 'neutral'   // #0F172A (dark text / white)
  | 'inherit';  // currentColor

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  strokeWidth?: number;
  variant?: IconVariant;
  semantic?: IconSemantic;
  title?: string;
  className?: string;
}

export type IconCategory =
  | 'A' // Application Navigation
  | 'B' // General Actions
  | 'C' // Competitive Programming
  | 'D' // AI Assistant
  | 'E' // Dashboard Analytics
  | 'F' // User Account and Settings
  | 'G' // Notifications and Status
  | 'H'; // Interface Controls

export interface IconMeta {
  id: string;
  name: string;
  category: IconCategory;
  categoryName: string;
  component: React.FC<IconProps>;
  keywords: string[];
  defaultSemantic?: IconSemantic;
  recommendedPlaces: string[];
}
