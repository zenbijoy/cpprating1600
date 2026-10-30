import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category H: Interface Controls
 * 21 UI & Layout Control icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. Sidebar
export const SidebarControlIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </IconBase>
);

// 2. Menu
export const MenuControlIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </IconBase>
);

// 3. Grid View
export const GridViewIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </IconBase>
);

// 4. List View
export const ListViewIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth={3} />
    <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth={3} />
    <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth={3} />
  </IconBase>
);

// 5. Table View
export const TableViewIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </IconBase>
);

// 6. Split Panel
export const SplitPanelIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </IconBase>
);
export const SplitPanelControlIcon = SplitPanelIcon;

// 7. Fullscreen
export const FullscreenIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </IconBase>
);

// 8. Exit Fullscreen
export const ExitFullscreenIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M10 4v6m0 0H4m6 0L3 3m10 7h6m-6 0V4m0 6l7-7" />
  </IconBase>
);

// 9. Settings Sliders
export const SettingsSlidersIcon: React.FC<IconProps> = (props) => (
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

// 10. Toggle
export const ToggleControlIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <rect x="1" y="5" width="22" height="14" rx="7" fill="currentColor" fillOpacity="0.15" />
    <circle cx="16" cy="12" r="4" fill="currentColor" />
  </IconBase>
);

// 11. Radio Selection
export const RadioSelectionIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </IconBase>
);

// 12. Checkbox
export const CheckboxControlIcon: React.FC<IconProps> = (props) => (
  <IconBase semantic="primary" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <polyline points="7 12 10 15 17 8" />
  </IconBase>
);

// 13. Dropdown
export const DropdownIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
);

// 14. Tooltip
export const TooltipIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </IconBase>
);

// 15. Help Circle
export const HelpCircleControlIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="0.75" fill="currentColor" strokeWidth={2.5} />
  </IconBase>
);

// 16. Command Palette
export const CommandPaletteIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M6 10l3 2-3 2" />
    <line x1="12" y1="14" x2="16" y2="14" />
  </IconBase>
);

// 17. Keyboard
export const KeyboardControlIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="6" y1="8" x2="6.01" y2="8" strokeWidth={3} />
    <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth={3} />
    <line x1="14" y1="8" x2="14.01" y2="8" strokeWidth={3} />
    <line x1="18" y1="8" x2="18.01" y2="8" strokeWidth={3} />
    <line x1="8" y1="16" x2="16" y2="16" />
  </IconBase>
);

// 18. Pin
export const PinIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-2l-2-2V5h1V2H6v3h1v8l-2 2v2z" />
  </IconBase>
);

// 19. Drag Handle
export const DragHandleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="9" cy="6" r="1.5" fill="currentColor" />
    <circle cx="15" cy="6" r="1.5" fill="currentColor" />
    <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
    <circle cx="9" cy="18" r="1.5" fill="currentColor" />
    <circle cx="15" cy="18" r="1.5" fill="currentColor" />
  </IconBase>
);

// 20. Resize
export const ResizeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="3" y2="21" />
  </IconBase>
);

// 21. Panel Layout
export const PanelLayoutIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="14" y1="9" x2="14" y2="21" />
  </IconBase>
);
