import React from 'react';
import { IconProps } from './types';
import { IconBase } from './IconBase';

/**
 * Category B: General Actions
 * 37 core action icons matching the CLIMB 1600 Icon System specifications.
 */

// 1. Search
export const SearchIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBase>
);

// 2. Add
export const AddIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </IconBase>
);

// 3. Create
export const CreateIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconBase>
);

// 4. Edit
export const EditIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconBase>
);

// 5. Delete
export const DeleteIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </IconBase>
);

// 6. Save
export const SaveIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </IconBase>
);

// 7. Bookmark
export const BookmarkActionIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </IconBase>
);

// 8. Share
export const ShareIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </IconBase>
);

// 9. Copy
export const CopyIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </IconBase>
);

// 10. Paste
export const PasteIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </IconBase>
);

// 11. Download
export const DownloadIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconBase>
);

// 12. Upload
export const UploadIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconBase>
);

// 13. Export
export const ExportIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <polyline points="9 15 12 12 15 15" />
  </IconBase>
);

// 14. Import
export const ImportIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="12" x2="12" y2="18" />
    <polyline points="9 15 12 18 15 15" />
  </IconBase>
);

// 15. Refresh
export const RefreshIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </IconBase>
);

// 16. Retry
export const RetryIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </IconBase>
);

// 17. Undo
export const UndoIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="9 14 4 9 9 4" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </IconBase>
);

// 18. Redo
export const RedoIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="15 14 20 9 15 4" />
    <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
  </IconBase>
);

// 19. Filter
export const FilterIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </IconBase>
);

// 20. Sort
export const SortIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="11" y1="5" x2="20" y2="5" />
    <line x1="11" y1="12" x2="17" y2="12" />
    <line x1="11" y1="19" x2="14" y2="19" />
    <path d="M4 8l3-3 3 3" />
    <line x1="7" y1="5" x2="7" y2="19" />
  </IconBase>
);

// 21. Sort asc/desc
export const SortDescIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="11" y1="5" x2="21" y2="5" />
    <line x1="11" y1="12" x2="17" y2="12" />
    <line x1="11" y1="19" x2="14" y2="19" />
    <path d="M4 16l3 3 3-3" />
    <line x1="7" y1="5" x2="7" y2="19" />
  </IconBase>
);

// 22. Expand
export const ExpandIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </IconBase>
);

// 23. Collapse
export const CollapseIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </IconBase>
);

// 24. Open in new tab
export const OpenInNewTabIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </IconBase>
);

// 25. External link
export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </IconBase>
);

// 26. More (H)
export const MoreHorizontalIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
  </IconBase>
);

// 27. More (V)
export const MoreVerticalIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
  </IconBase>
);

// 28. Close
export const CloseIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </IconBase>
);

// 29. Back
export const BackIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </IconBase>
);

// 30. Forward
export const ForwardIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </IconBase>
);

// 31. Check
export const CheckIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="20 6 9 17 4 12" />
  </IconBase>
);

// 32. Check circle
export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </IconBase>
);

// 33. Chevron up
export const ChevronUpIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="18 15 12 9 6 15" />
  </IconBase>
);

// 34. Chevron down
export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
);

// 35. Chevron left
export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="15 18 9 12 15 6" />
  </IconBase>
);

// 36. Chevron right
export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="9 18 15 12 9 6" />
  </IconBase>
);

// 37. Arrow up right
export const ArrowUpRightIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </IconBase>
);
