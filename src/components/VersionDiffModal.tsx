import React from 'react';
import { CloseIcon, SynchronizationIcon } from './icons';
import { CodeVersion } from '../types';
import { computeLineDiff } from '../utils/workspaceTools';

interface VersionDiffModalProps {
  versionA: CodeVersion;
  versionB: CodeVersion;
  onClose: () => void;
  onRestoreVersion?: (code: string) => void;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  versionA,
  versionB,
  onClose,
  onRestoreVersion,
}) => {
  const diffLines = computeLineDiff(versionA.code, versionB.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden safe-area-overlay">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <SynchronizationIcon size={20} semantic="primary" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Code Version Comparison</span>
                <span className="text-xs text-slate-400 font-mono">
                  (v{versionA.versionNumber} &rarr; v{versionB.versionNumber})
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Line-by-line additions <span className="text-emerald-400 font-bold">(+)</span> and deletions <span className="text-rose-400 font-bold">(-)</span> between saved drafts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Diff Content View */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5 bg-[#0d1117]">
          {diffLines.map((line, idx) => (
            <div
              key={idx}
              className={`flex items-start px-3 py-0.5 rounded leading-relaxed ${
                line.type === 'added'
                  ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                  : line.type === 'removed'
                  ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                  : 'text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              <span className="w-10 shrink-0 text-slate-500 select-none text-right pr-3 text-[10px]">
                {line.lineNumberA || line.lineNumberB || idx + 1}
              </span>
              <span className="w-4 shrink-0 font-bold select-none">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <pre className="flex-1 font-mono whitespace-pre-wrap break-all">{line.text || ' '}</pre>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/50 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Added in v{versionB.versionNumber}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" />
              <span>Removed from v{versionA.versionNumber}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRestoreVersion && (
              <button
                type="button"
                onClick={() => {
                  onRestoreVersion(versionA.code);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              >
                Restore v{versionA.versionNumber}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
