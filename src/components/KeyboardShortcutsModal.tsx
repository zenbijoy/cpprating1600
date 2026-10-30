import React from 'react';
import { KeyboardShortcutsIcon, CloseIcon } from './icons';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  category: string;
  items: { keys: string[]; description: string }[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups: ShortcutGroup[] = [
    {
      category: 'Global & Navigation',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Open Universal Command Palette & Problem Search' },
        { keys: ['?'], description: 'Show this keyboard shortcuts guide' },
        { keys: ['Esc'], description: 'Close any active modal, dialog, or drawer' },
        { keys: ['G', 'D'], description: 'Quick jump to Mission Control Dashboard' },
        { keys: ['G', 'P'], description: 'Quick jump to Problem Explorer' },
        { keys: ['G', 'W'], description: 'Quick jump to Workspace IDE' },
        { keys: ['G', 'C'], description: 'Quick jump to Virtual Contest Arena' },
        { keys: ['G', 'M'], description: 'Quick jump to Mistake Notebook' },
        { keys: ['G', 'S'], description: 'Quick jump to Algorithm Skill Tree' },
        { keys: ['G', 'A'], description: 'Quick jump to AI Socratic Coach' },
        { keys: ['G', 'F'], description: 'Quick jump to Community Feed' },
        { keys: ['G', 'H'], description: 'Quick jump to Communities Hub' },
        { keys: ['G', 'R'], description: 'Quick jump to Direct Messages' },
        { keys: ['G', 'U'], description: 'Quick jump to Social Profile' },
      ],
    },
    {
      category: 'Workspace & Code Execution',
      items: [
        { keys: ['Ctrl', 'Enter'], description: 'Run code & execute local test case' },
        { keys: ['Ctrl', 'S'], description: 'Save current code draft to local storage' },
        { keys: ['Tab'], description: 'Indent code by 4 spaces in Monaco editor' },
        { keys: ['Shift', 'Alt', 'F'], description: 'Format current code' },
      ],
    },
    {
      category: 'Problem Explorer & Lists',
      items: [
        { keys: ['/'], description: 'Instantly focus search input in Problem Explorer' },
        { keys: ['↑', '↓'], description: 'Navigate through command results or problem lists' },
        { keys: ['Enter'], description: 'Open selected problem in Workspace' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <KeyboardShortcutsIcon size={20} semantic="primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Power-user navigation for competitive programming</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{group.category}</h3>
              <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
                {group.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <span className="text-slate-300">{item.description}</span>
                    <div className="flex items-center gap-1.5">
                      {item.keys.map((k, kidx) => (
                        <React.Fragment key={kidx}>
                          <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] shadow-sm">
                            {k}
                          </kbd>
                          {kidx < item.keys.length - 1 && <span className="text-slate-500 text-[10px]">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
