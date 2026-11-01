import React, { useState, useMemo } from 'react';
import {
  WeeklyActivityIcon,
  WarningStatusIcon,
  CheckCircleIcon,
  ErrorStatusIcon,
  AISparkleIcon,
  InformationStatusIcon,
} from './icons';
import {
  DifficultyBand,
  HeatmapCell,
  HeatmapTimeBucket,
  PlateauDiagnostic,
  generateDifficultyHeatmap,
} from '../utils/difficultyHeatmap';
import { ProblemAttempt } from '../types';

interface DifficultyHeatmapProps {
  attempts: ProblemAttempt[];
  onSelectProblemFilter?: (ratingBand: string) => void;
}

export const DifficultyHeatmap: React.FC<DifficultyHeatmapProps> = ({
  attempts,
  onSelectProblemFilter,
}) => {
  const [weeksCount, setWeeksCount] = useState<number>(8);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);

  // Heatmap generation
  const heatmapData = useMemo(() => {
    return generateDifficultyHeatmap(attempts, weeksCount);
  }, [attempts, weeksCount]);

  const { bands, buckets, cells, diagnostic, totalAnalyzedSolves, highestRatingSolved } =
    heatmapData;

  const selectedCell = selectedCellKey ? cells[selectedCellKey] : null;

  // Intensity style resolver
  const getCellClasses = (intensity: number, isCurrentWeek: boolean) => {
    switch (intensity) {
      case 4:
        return 'bg-amber-500/25 border-amber-400/80 text-amber-200 font-black shadow-sm shadow-amber-500/20';
      case 3:
        return 'bg-emerald-950/80 border-emerald-500/70 text-emerald-200 font-bold';
      case 2:
        return 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200 font-semibold';
      case 1:
        return 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300';
      case 0:
      default:
        return isCurrentWeek
          ? 'bg-slate-950/80 border-slate-800 text-slate-600'
          : 'bg-slate-950/40 border-slate-900 text-slate-700';
    }
  };

  const getStatusVisuals = (status: PlateauDiagnostic['status']) => {
    switch (status) {
      case 'plateau_detected':
        return {
          badge: 'Skill Plateau Warning',
          bg: 'bg-amber-950/40 border-amber-900/60',
          textColor: 'text-amber-300',
          icon: <WarningStatusIcon size={16} semantic="warning" className="shrink-0" />,
          barColor: 'bg-amber-500',
        };
      case 'healthy_progression':
        return {
          badge: 'Healthy Upward Migration',
          bg: 'bg-emerald-950/30 border-emerald-900/50',
          textColor: 'text-emerald-300',
          icon: <CheckCircleIcon size={16} semantic="success" className="shrink-0" />,
          barColor: 'bg-emerald-500',
        };
      case 'overreaching':
        return {
          badge: 'Difficulty Spike Warning',
          bg: 'bg-rose-950/40 border-rose-900/60',
          textColor: 'text-rose-300',
          icon: <ErrorStatusIcon size={16} semantic="error" className="shrink-0" />,
          barColor: 'bg-rose-500',
        };
      case 'early_stage':
      default:
        return {
          badge: 'Foundations Calibration',
          bg: 'bg-indigo-950/30 border-indigo-900/50',
          textColor: 'text-indigo-300',
          icon: <AISparkleIcon size={16} semantic="primary" className="shrink-0" />,
          barColor: 'bg-indigo-500',
        };
    }
  };

  const statusVisuals = getStatusVisuals(diagnostic.status);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-6">
      {/* Header & Time Window Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <WeeklyActivityIcon size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                <span>Problem Difficulty Distribution Heatmap</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {totalAnalyzedSolves} Solves Mapped
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Temporal distribution across 800 to 1600+ rating bands over time to detect skill plateaus and comfort traps.
              </p>
            </div>
          </div>
        </div>

        {/* Weeks window controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          {[6, 8, 12].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeeksCount(w)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                weeksCount === w
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {w} Weeks
            </button>
          ))}
        </div>
      </div>

      {/* Plateau Diagnostic Banner */}
      <div className={`rounded-xl border p-4.5 space-y-3 ${statusVisuals.bg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            {statusVisuals.icon}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${statusVisuals.textColor}`}>
                  {statusVisuals.badge}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Risk Index: {diagnostic.riskScore}%
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{diagnostic.title}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Recent Avg Rating</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{diagnostic.recentAverageDifficulty}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Peak Solved</span>
              <span className="font-bold text-cyan-400 text-sm">
                {highestRatingSolved ? `${highestRatingSolved}` : '800'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Recommended Next</span>
              <span className="font-bold text-amber-300 text-sm">{diagnostic.recommendedNextBand}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-8 text-slate-300 leading-relaxed space-y-1">
            <p>{diagnostic.summary}</p>
            <p className="text-slate-400 font-medium">
              <strong className="text-indigo-300">Coach Guidance:</strong> {diagnostic.actionableRecommendation}
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col justify-center rounded-lg bg-slate-950/50 p-2.5 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
              <span className="text-slate-400">Plateau Risk Meter</span>
              <span className={statusVisuals.textColor}>{diagnostic.riskScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${statusVisuals.barColor}`}
                style={{ width: `${diagnostic.riskScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* The Visual Difficulty Heatmap Matrix */}
      <div className="space-y-3">
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[620px] space-y-2">
            {/* Header: Weekly Buckets */}
            <div className="grid grid-cols-12 gap-2 text-center text-xs font-mono text-slate-400 pb-1 border-b border-slate-800">
              <div className="col-span-3 text-left font-bold text-slate-300">Rating Band</div>
              {buckets.map((b) => (
                <div
                  key={b.id}
                  className={`col-span-1 truncate ${
                    b.isCurrent ? 'text-cyan-400 font-bold' : 'text-slate-400'
                  }`}
                  title={`${b.label}: ${b.startDate} to ${b.endDate}`}
                >
                  {b.shortLabel}
                  {b.isCurrent && <span className="block text-[9px] uppercase font-sans">Now</span>}
                </div>
              ))}
              {/* Pad if fewer than 9 weeks */}
              {Array.from({ length: 9 - buckets.length }).map((_, idx) => (
                <div key={idx} className="col-span-1" />
              ))}
            </div>

            {/* Bands Rows */}
            {bands.map((band) => (
              <div key={band.id} className="grid grid-cols-12 gap-2 items-center">
                {/* Band Label Header */}
                <div className="col-span-3 flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: band.tierColor }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{band.label}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{band.badge}</span>
                  </div>
                </div>

                {/* Cells for each week */}
                {buckets.map((bucket) => {
                  const key = `${bucket.id}_${band.id}`;
                  const cell = cells[key] || {
                    bucketId: bucket.id,
                    bandId: band.id,
                    solvedCount: 0,
                    attemptCount: 0,
                    problems: [],
                    intensity: 0,
                  };
                  const isSelected = selectedCellKey === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCellKey(isSelected ? null : key)}
                      className={`col-span-1 h-12 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative group ${getCellClasses(
                        cell.intensity,
                        bucket.isCurrent
                      )} ${isSelected ? 'ring-2 ring-indigo-400 scale-105 z-10' : ''}`}
                    >
                      <span className="text-xs font-mono">
                        {cell.solvedCount > 0 ? cell.solvedCount : '·'}
                      </span>
                      {cell.attemptCount > cell.solvedCount && (
                        <span className="text-[9px] text-rose-400 font-mono">
                          +{cell.attemptCount - cell.solvedCount} failed
                        </span>
                      )}

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 pointer-events-none">
                        <div className="rounded-lg bg-slate-950 border border-slate-700 p-2 text-left text-[11px] shadow-xl w-44">
                          <div className="font-bold text-slate-900 dark:text-white">{band.label}</div>
                          <div className="text-slate-400 font-mono text-[10px] mb-1">
                            {bucket.label}
                          </div>
                          <div className="text-cyan-300 font-bold">
                            {cell.solvedCount} solved / {cell.attemptCount} attempts
                          </div>
                          {cell.problems.length > 0 && (
                            <div className="text-slate-400 mt-1 line-clamp-2">
                              {cell.problems.map((p) => p.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Cell Detail Popover */}
        {selectedCell && (
          <div className="p-4 rounded-xl border border-indigo-900/60 bg-slate-950/90 space-y-2.5 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Inspect: {bands.find((b) => b.id === selectedCell.bandId)?.label} during{' '}
                  {buckets.find((b) => b.id === selectedCell.bucketId)?.label}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedCell.solvedCount} Solved ({selectedCell.attemptCount} total attempts)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCellKey(null)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {selectedCell.problems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {selectedCell.problems.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs space-y-0.5"
                  >
                    <div className="font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Rating {p.rating || 800}</span>
                      <span className="text-emerald-400 font-bold">{p.verdict || 'OK'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                No problem solves recorded in this rating band during this week.
              </div>
            )}
          </div>
        )}

        {/* Heatmap Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Solves Intensity:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded border border-slate-900 bg-slate-950/60 text-[9px] flex items-center justify-center font-mono">
                0
              </div>
              <div className="w-5 h-5 rounded border border-indigo-700/50 bg-indigo-950/60 text-[9px] flex items-center justify-center font-mono text-indigo-300">
                1
              </div>
              <div className="w-5 h-5 rounded border border-cyan-500/50 bg-cyan-950/70 text-[9px] flex items-center justify-center font-mono text-cyan-200">
                2-3
              </div>
              <div className="w-5 h-5 rounded border border-emerald-500/70 bg-emerald-950/80 text-[9px] flex items-center justify-center font-mono text-emerald-200">
                4-5
              </div>
              <div className="w-5 h-5 rounded border border-amber-400/80 bg-amber-500/25 text-[9px] flex items-center justify-center font-mono text-amber-200 font-bold">
                6+
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <InformationStatusIcon size={14} semantic="primary" className="shrink-0" />
            <span>Rating progression requires upward difficulty migration, not just volume.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
