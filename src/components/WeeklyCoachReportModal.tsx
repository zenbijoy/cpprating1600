import React from 'react';
import {
  CloseIcon,
  ThinkingIcon,
  CalendarIcon,
  TargetRatingIcon,
  AISparkleIcon,
  CheckCircleIcon,
  WarningStatusIcon,
  DownloadIcon,
} from './icons';
import { WeeklyCoachReport } from '../utils/missionControl';

interface WeeklyCoachReportModalProps {
  report: WeeklyCoachReport;
  onClose: () => void;
}

export const WeeklyCoachReportModal: React.FC<WeeklyCoachReportModalProps> = ({
  report,
  onClose,
}) => {
  const { measuredResults, aiInterpretations } = report;

  const handleDownload = () => {
    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CLIMB1600_Week_${report.weekNumber}_Coach_Report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto safe-area-overlay">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <CloseIcon size={20} />
        </button>

        {/* Header */}
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ThinkingIcon size={18} semantic="primary" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Weekly AI Coach Report • Week {report.weekNumber}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Performance Diagnostics & Weekly Focus
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarIcon size={14} />
            <span>
              {report.startDate} to {report.endDate}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              Grounding: Verified Codeforces Submissions + SM-2 Logs
            </span>
          </div>
        </div>

        {/* SECTION 1: Measured Facts (Objective telemetry) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TargetRatingIcon size={16} semantic="primary" />
              <span>1. Measured Results (Factual Telemetry)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Zero Hallucinations Guarantee</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Solves / Attempts</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {measuredResults.problemsAccepted} / {measuredResults.problemsAttempted}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                {measuredResults.solveRatePercent}% Success Rate
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Focused Time</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {measuredResults.totalFocusedMinutes}m
              </div>
              <span className="text-[11px] text-slate-500">
                {measuredResults.activeDaysCount} active practice days
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Avg Solved Rating</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {measuredResults.averageRatingSolved}
              </div>
              <span className="text-[11px] text-slate-500">Target: 1600</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Top Mistake Pattern</span>
              <div className="text-sm font-bold text-slate-800 truncate mt-1">
                {measuredResults.topMistakeCategory
                  ? measuredResults.topMistakeCategory.replace(/_/g, ' ')
                  : 'None logged'}
              </div>
              <span className="text-[11px] text-slate-500">
                {measuredResults.mistakesReviewedCount} reviews done
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: AI Coach Interpretations & Qualitative Insights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <AISparkleIcon size={16} semantic="success" />
              <span>2. Coach Interpretations & Strategic Advice</span>
            </h3>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
              Coach Assessment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What Improved */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <CheckCircleIcon size={16} semantic="success" />
                <span>What Improved</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {aiInterpretations.whatImproved.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What Remained Weak */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <WarningStatusIcon size={16} semantic="warning" />
                <span>What Remained Weak</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {aiInterpretations.whatRemainedWeak.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Consistency & Productivity */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Consistency Assessment:</span>
                <p className="text-slate-700 leading-relaxed">{aiInterpretations.consistencyAssessment}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Session Output Summary:</span>
                <p className="text-slate-700 leading-relaxed">{aiInterpretations.mostProductiveSessionSummary}</p>
              </div>
            </div>

            {/* Next Week Strategic Focus */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <TargetRatingIcon size={14} semantic="primary" />
                <span>Suggested Strategic Focus for Next Week:</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {aiInterpretations.nextWeekStrategicFocus.map((rec, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] flex items-center justify-center shrink-0 font-bold">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium transition-colors shadow-sm cursor-pointer"
          >
            <DownloadIcon size={14} className="text-slate-500" />
            <span>Export JSON Report</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            Acknowledge & Continue Training
          </button>
        </div>
      </div>
    </div>
  );
};
