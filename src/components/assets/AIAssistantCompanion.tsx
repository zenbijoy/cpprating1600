import React from 'react';
import { AISparkleIcon as Sparkles } from '../icons';

export type AIAssistantState = 'idle' | 'thinking' | 'celebrating' | 'teaching';

export interface AIAssistantCompanionProps {
  state?: AIAssistantState;
  size?: number | string;
  className?: string;
  speechBubble?: string;
  showHoloCard?: boolean;
}

export const AIAssistantCompanion: React.FC<AIAssistantCompanionProps> = ({
  state = 'idle',
  className = '',
  speechBubble,
}) => {
  const isThinking = state === 'thinking';
  const isCelebrating = state === 'celebrating';
  const isTeaching = state === 'teaching';

  return (
    <div className={`relative inline-flex flex-col items-center select-none animate-float-gentle ${className}`}>
      {/* Speech Bubble / Socratic Hint */}
      {speechBubble && (
        <div className="mb-2 max-w-sm rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 shadow-md border border-slate-200 animate-pop-spring">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
            <span>AI Coach Insight</span>
          </div>
          <p className="leading-relaxed text-slate-700">{speechBubble}</p>
        </div>
      )}

      {/* Professional SaaS AI Status Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-sm text-xs font-medium text-slate-700 interactive-card">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isThinking
                ? 'bg-amber-400'
                : isCelebrating
                ? 'bg-emerald-400'
                : isTeaching
                ? 'bg-sky-400'
                : 'bg-emerald-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isThinking
                ? 'bg-amber-500'
                : isCelebrating
                ? 'bg-emerald-500'
                : isTeaching
                ? 'bg-sky-500'
                : 'bg-emerald-500'
            }`}
          />
        </span>
        <span className="font-semibold text-slate-900">
          {isThinking
            ? 'Analyzing solution...'
            : isCelebrating
            ? 'Problem solved!'
            : isTeaching
            ? 'Socratic guidance active'
            : 'Socratic Coach Ready'}
        </span>
      </div>
    </div>
  );
};
