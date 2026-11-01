import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BookmarksIcon,
  AddIcon,
  FilterIcon,
  CheckCircleIcon,
  CalendarIcon,
  WarningStatusIcon,
  RefreshIcon,
  AISparkleIcon,
  SearchIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  DeleteIcon,
  DownloadIcon,
  UploadIcon,
  RunCodeIcon,
  CloseIcon,
  TopicMasteryIcon,
  ChevronRightIcon,
  ClockIcon as Clock,
  AISparkleIcon as Sparkles,
  CheckCircle2Icon as CheckCircle2,
  TrendingUpIcon as TrendingUp,
  BookOpenIcon as BookOpen,
  RotateCcwIcon as RotateCcw,
} from './icons';
import { MistakeCategory, MistakeRecord, Sm2Quality } from '../types';
import {
  getMistakeCategoryLabel,
  getMistakeCategoryShortLabel,
  getMistakeCategoryBadgeStyle,
  isMistakeDue,
  getDaysOverdue,
  recordSm2Review,
  snoozeMistake,
  skipMistake,
  calculateRevisionStats,
  buildRevisionQueue,
  SM2_QUALITIES,
  computeSm2Interval,
} from '../utils/spacedRepetition';
import { storageService } from '../services/storage';
import { EmptySavedState } from './assets';
import { JoyCodeViewer } from './JoyCodeViewer';
import { useToast } from './Toast';
import { MathText } from './MathText';
import { FunCard } from './common/CardBackgrounds';
import { MascotByteCat, MascotClimby, FunnyStickerBadge, AnimeCharacterSprite } from './assets/MascotAndStickers';

interface MistakeNotebookViewProps {
  mistakes: MistakeRecord[];
  onSaveMistake: (mistake: MistakeRecord) => void;
  onDeleteMistake: (id: string) => void;
  onOpenWorkspaceWithCode?: (code: string, problemName?: string) => void;
  onAskCommunity?: (code: string, problemName: string, whyItFailed?: string) => void;
}

const ALL_CATEGORIES: MistakeCategory[] = [
  'integer_overflow',
  'boundary_case',
  'indexing_error',
  'wrong_complexity',
  'monotonicity_violation',
  'wrong_observation',
  'misread_statement',
  'incorrect_algorithm',
  'implementation_bug',
  'wrong_data_structure',
  'poor_time_management',
  'needed_too_many_hints',
  'could_not_prove_correctness',
];

export const MistakeNotebookView: React.FC<MistakeNotebookViewProps> = ({
  mistakes,
  onSaveMistake,
  onDeleteMistake,
  onOpenWorkspaceWithCode,
  onAskCommunity,
}) => {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'mastered' | 'frequent'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'rating' | 'nextReview'>('priority');

  // Modal & Card State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Flashcard Deck State
  const [isFlashcardModeOpen, setIsFlashcardModeOpen] = useState<boolean>(false);
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState<boolean>(false);

  // Form State
  const [formProblemId, setFormProblemId] = useState<string>('');
  const [formProblemName, setFormProblemName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<MistakeCategory>('integer_overflow');
  const [formOriginalApproach, setFormOriginalApproach] = useState<string>('');
  const [formWhyFailed, setFormWhyFailed] = useState<string>('');
  const [formCorrectObs, setFormCorrectObs] = useState<string>('');
  const [formLesson, setFormLesson] = useState<string>('');
  const [formRating, setFormRating] = useState<number>(1200);
  const [formCodeSnippet, setFormCodeSnippet] = useState<string>('');

  // Live revision history for stats
  const [history, setHistory] = useState(() => storageService.getRevisionHistory());

  const stats = useMemo(() => {
    return calculateRevisionStats(history, mistakes);
  }, [history, mistakes]);

  const dueMistakes = useMemo(() => {
    return mistakes.filter((m) => isMistakeDue(m));
  }, [mistakes]);

  const masteredMistakes = useMemo(() => {
    return mistakes.filter((m) => m.status === 'mastered' || (m.intervalDays || 1) >= 30);
  }, [mistakes]);

  const frequentFailureMistakes = useMemo(() => {
    return mistakes.filter((m) => (m.intervalDays || 1) <= 1 && (m.reviewCount || 0) > 0);
  }, [mistakes]);

  const filteredMistakes = useMemo(() => {
    const list = mistakes.filter((m) => {
      const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        m.problemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.problemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.personalLesson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.correctObservation.toLowerCase().includes(searchQuery.toLowerCase());

      const isDue = isMistakeDue(m);
      const isMastered = m.status === 'mastered' || (m.intervalDays || 1) >= 30;
      const isFrequent = (m.intervalDays || 1) <= 1 && (m.reviewCount || 0) > 0;

      if (statusFilter === 'due' && !isDue) return false;
      if (statusFilter === 'mastered' && !isMastered) return false;
      if (statusFilter === 'frequent' && !isFrequent) return false;

      return matchesCat && matchesSearch;
    });

    if (sortBy === 'rating') {
      return [...list].sort((a, b) => (b.rating || 800) - (a.rating || 800));
    }
    if (sortBy === 'nextReview') {
      return [...list].sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
    }
    // Default: Priority (Overdue first, then due today, then review count)
    return [...list].sort((a, b) => {
      const aDue = isMistakeDue(a);
      const bDue = isMistakeDue(b);
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      const aOverdue = getDaysOverdue(a.nextReviewDate);
      const bOverdue = getDaysOverdue(b.nextReviewDate);
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      return (b.rating || 800) - (a.rating || 800);
    });
  }, [mistakes, selectedCategory, searchQuery, statusFilter, sortBy]);

  // Flashcard Deck Cards
  const flashcardCards = useMemo(() => {
    return dueMistakes.length > 0 ? dueMistakes : filteredMistakes.length > 0 ? filteredMistakes : mistakes;
  }, [dueMistakes, filteredMistakes, mistakes]);

  const activeFlashcard = flashcardCards[flashcardIndex];

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRecordSm2 = (mistake: MistakeRecord, quality: Sm2Quality, notes?: string) => {
    const { updatedMistake, historyEntry } = recordSm2Review(mistake, quality, notes);
    storageService.saveRevisionHistoryEntry(historyEntry);
    setHistory(storageService.getRevisionHistory());
    onSaveMistake(updatedMistake);

    const qualityInfo = SM2_QUALITIES[quality];
    success(
      `Recall recorded: ${qualityInfo.label}. Next review in ${updatedMistake.intervalDays} day(s) (EF: ${updatedMistake.easeFactor?.toFixed(2)}).`,
      'SM-2 Revision'
    );
  };

  const handleFlashcardGrade = (quality: Sm2Quality) => {
    if (!activeFlashcard) return;
    handleRecordSm2(activeFlashcard, quality);
    setFlashcardFlipped(false);
    if (flashcardIndex + 1 < flashcardCards.length) {
      setFlashcardIndex((prev) => prev + 1);
    } else {
      setFlashcardIndex(flashcardCards.length);
    }
  };

  const handleSnooze = (mistake: MistakeRecord, days: number = 1) => {
    const updated = snoozeMistake(mistake, days);
    onSaveMistake(updated);
    success(`Postponed review for ${mistake.problemId} by ${days} day(s).`, 'Review Snoozed');
  };

  // Keyboard Navigation for Flashcard Deck
  useEffect(() => {
    if (!isFlashcardModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFlashcardModeOpen(false);
        return;
      }

      if (e.code === 'Space' && !flashcardFlipped) {
        e.preventDefault();
        setFlashcardFlipped(true);
        return;
      }

      if (flashcardFlipped && activeFlashcard) {
        if (['0', '1', '2', '3', '4', '5'].includes(e.key)) {
          const q = parseInt(e.key, 10) as Sm2Quality;
          handleFlashcardGrade(q);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlashcardModeOpen, flashcardFlipped, activeFlashcard]);

  const handleCreateMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProblemId || !formProblemName) return;

    const cleanId = formProblemId.trim().toUpperCase();
    const newMistake: MistakeRecord = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      problemId: cleanId,
      problemName: formProblemName.trim(),
      problemUrl: `https://codeforces.com/problemset`,
      rating: formRating,
      tags: [],
      category: formCategory,
      originalApproach: formOriginalApproach.trim(),
      whyItFailed: formWhyFailed.trim(),
      correctObservation: formCorrectObs.trim(),
      correctApproach: formCorrectObs.trim(),
      personalLesson: formLesson.trim(),
      codeSnippet: formCodeSnippet.trim() || undefined,
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 1 day
      intervalDays: 1,
      reviewCount: 0,
      status: 'due',
      easeFactor: 2.5,
      consecutiveSuccesses: 0,
    };

    onSaveMistake(newMistake);
    setShowAddForm(false);
    success(`Autopsy logged for ${newMistake.problemId}! First SM-2 recall scheduled tomorrow.`, 'Mistake Saved');

    // Reset form
    setFormProblemId('');
    setFormProblemName('');
    setFormOriginalApproach('');
    setFormWhyFailed('');
    setFormCorrectObs('');
    setFormLesson('');
    setFormCodeSnippet('');
  };

  // Export to JSON
  const handleExportJson = () => {
    if (mistakes.length === 0) {
      toastError('No mistakes logged to export yet.', 'Export');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mistakes, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `climb1600_mistakes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    success(`Exported ${mistakes.length} mistake cards to JSON.`, 'Export Finished');
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (mistakes.length === 0) {
      toastError('No mistakes logged to export yet.', 'Export');
      return;
    }
    const headers = [
      'Problem ID',
      'Problem Name',
      'Rating',
      'Category',
      'Why It Failed',
      'Correct Observation',
      'Personal Lesson',
      'Interval Days',
      'Ease Factor',
      'Next Review',
      'Status',
    ];
    const rows = mistakes.map((m) => [
      `"${m.problemId}"`,
      `"${(m.problemName || '').replace(/"/g, '""')}"`,
      m.rating || 800,
      `"${m.category}"`,
      `"${(m.whyItFailed || '').replace(/"/g, '""')}"`,
      `"${(m.correctObservation || '').replace(/"/g, '""')}"`,
      `"${(m.personalLesson || '').replace(/"/g, '""')}"`,
      m.intervalDays || 1,
      m.easeFactor || 2.5,
      m.nextReviewDate || '',
      `"${m.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csvContent);
    a.download = `climb1600_mistakes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    success(`Exported ${mistakes.length} mistake cards to CSV.`, 'Export Finished');
  };

  // Import from JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          let count = 0;
          for (const item of imported) {
            if (item.problemId && item.category) {
              onSaveMistake(item);
              count++;
            }
          }
          success(`Successfully imported ${count} mistakes!`, 'Import Complete');
        } else {
          toastError('Invalid JSON format. Expected an array of mistake records.', 'Import Error');
        }
      } catch (err: any) {
        toastError(`Failed to parse file: ${err.message}`, 'Import Error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900 dark:text-slate-100 font-sans">
      {/* =========================================================================
          TOP HEADER: Brand, Subtitle, Actions (Import/Export/Log)
          ========================================================================= */}
      <FunCard variant="coffee" sticker="coffee_power" className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex shrink-0 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 backdrop-blur-xs shadow-inner">
              <AnimeCharacterSprite characterId={storageService.getSettings()?.theme?.selectedCharacter || 'byte-cat'} size={68} mood="thinking" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                  <BookmarksIcon size={22} className="text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Mistake Notebook
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                  🧠 SM-2 Spaced Recall
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
                  🛡️ Invariant Fortification
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shadow-2xs">
                  🚫 Anti-Memory Leak
                </span>
              </div>
            </div>
          </div>

          {/* Separated and spacious action controls: utility buttons group + primary CTA */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs px-3 py-2 transition-all cursor-pointer"
                title="Import mistakes from JSON file"
              >
                <UploadIcon size={14} />
                <span>Import</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs px-3 py-2 transition-all cursor-pointer"
                title="Export mistakes as JSON backup"
              >
                <DownloadIcon size={14} />
                <span>JSON</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs px-3 py-2 transition-all cursor-pointer"
                title="Export mistakes as CSV spreadsheet"
              >
                <DownloadIcon size={14} />
                <span>CSV</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 transition-all cursor-pointer shadow-md shadow-emerald-600/25 shrink-0"
            >
              <AddIcon size={16} />
              <span>Log Mistake Autopsy</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            METRIC STATS BAR: Due, Retention Rate, Mastered, Total Cataloged
            ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FunCard
            variant={dueMistakes.length > 0 ? 'fire' : 'emerald'}
            className="p-4 space-y-1.5"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Due For Recall
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${dueMistakes.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {dueMistakes.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                card{dueMistakes.length === 1 ? '' : 's'}
              </span>
            </div>
            {dueMistakes.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Clock size={12} /> Active queue waiting
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} /> All caught up!
              </span>
            )}
          </FunCard>

          <FunCard variant="emerald" className="p-4 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Active Retention
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.accuracyRate}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">accuracy</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <TrendingUp size={12} /> Across {stats.totalReviews} recall reviews
            </span>
          </FunCard>

          <FunCard variant="cosmic" className="p-4 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Mastered Invariants
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {stats.masteredCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                card{stats.masteredCount === 1 ? '' : 's'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Sparkles size={12} /> &gt;= 30-day interval
            </span>
          </FunCard>

          <FunCard variant="clean" className="p-4 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Cataloged Mistakes
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {mistakes.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">total patterns</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <BookOpen size={12} /> Personal invariant archive
            </span>
          </FunCard>
        </div>

        {/* Due Reviews CTA Banner */}
        {dueMistakes.length > 0 && (
          <FunCard variant="arcade" sticker="speedrun_1600" className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <CalendarIcon size={22} semantic="warning" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base text-slate-900 dark:text-amber-200">
                    {dueMistakes.length} Card{dueMistakes.length === 1 ? '' : 's'} Scheduled for Spaced Recall
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    Run through your spaced revision deck. Self-test whether you can remember the key invariant and edge condition before flipping to peek.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFlashcardIndex(0);
                  setFlashcardFlipped(false);
                  setIsFlashcardModeOpen(true);
                }}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/30 transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                <RunCodeIcon size={16} />
                <span>Start Recall Session ({dueMistakes.length})</span>
              </button>
            </div>
          </FunCard>
        )}
      </FunCard>

      {/* =========================================================================
          FILTER & SEARCH TOOLBAR
          ========================================================================= */}
      <FunCard variant="clean" className="p-4 sm:p-5 space-y-4">
        {/* Status Filter Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none flex-nowrap">
            {[
              { id: 'all', label: `All Mistakes (${mistakes.length})` },
              { id: 'due', label: `Due Today (${dueMistakes.length})` },
              { id: 'mastered', label: `Mastered (${masteredMistakes.length})` },
              { id: 'frequent', label: `Frequent Failures (${frequentFailureMistakes.length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="priority">Priority (Overdue first)</option>
              <option value="rating">Problem Rating (Hardest first)</option>
              <option value="nextReview">Next Review (Soonest first)</option>
            </select>
          </div>
        </div>

        {/* Search & Category Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-8">
            <SearchIcon size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search logged mistakes, problem IDs, invariant observations, rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Mistake Categories ({mistakes.length})</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {getMistakeCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FunCard>

      {/* =========================================================================
          LOG NEW MISTAKE AUTOPSY MODAL
          ========================================================================= */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <BookmarksIcon size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Structured Mistake Autopsy & SM-2 Scheduling
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Formulate the core invariant so your future self never repeats this blunder.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateMistake} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Problem ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1352C or 4A"
                    required
                    value={formProblemId}
                    onChange={(e) => setFormProblemId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. K-th Not Divisible by n"
                    required
                    value={formProblemName}
                    onChange={(e) => setFormProblemName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Rating
                  </label>
                  <input
                    type="number"
                    min="800"
                    max="3500"
                    step="100"
                    value={formRating}
                    onChange={(e) => setFormRating(parseInt(e.target.value, 10) || 800)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Root Cause Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MistakeCategory)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getMistakeCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 1: Why it failed */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Autopsy Prompt 1: What did your code do & why did it fail? *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formWhyFailed}
                  onChange={(e) => setFormWhyFailed(e.target.value)}
                  placeholder="e.g. Iterated linearly up to k; got TLE on 10^9. Also prefix sum exceeded 2e9 without long long."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Step 2: Crucial Invariant */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Autopsy Prompt 2: Crucial Breakthrough Invariant / Observation *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formCorrectObs}
                  onChange={(e) => setFormCorrectObs(e.target.value)}
                  placeholder="e.g. Each block of (n - 1) numbers contains exactly one multiple of n. Thus formula is k + (k - 1) / (n - 1)."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Step 3: 1-Sentence Rule */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Autopsy Prompt 3: Personal Takeaway Rule (Contest Rule) *
                </label>
                <input
                  type="text"
                  required
                  value={formLesson}
                  onChange={(e) => setFormLesson(e.target.value)}
                  placeholder="e.g. When searching for the k-th non-multiple, divide by (n-1) to calculate skipped multiples directly."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Optional: Code snippet */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Failed Code Snippet or Test Case Input (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formCodeSnippet}
                  onChange={(e) => setFormCodeSnippet(e.target.value)}
                  placeholder="Paste snippet or tricky test case here..."
                  className="w-full font-mono text-[11px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Save to Mistake Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE FLASHCARD STUDY DECK MODAL
          ========================================================================= */}
      {isFlashcardModeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsFlashcardModeOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <AISparkleIcon size={18} semantic="warning" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  SM-2 Active Recall Deck
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {Math.min(flashcardIndex + 1, flashcardCards.length)} / {flashcardCards.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFlashcardModeOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>

            {/* Flashcard Body */}
            {flashcardIndex >= flashcardCards.length ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon size={32} semantic="success" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Spaced Revision Deck Completed!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  You have reviewed all cards scheduled for today. Actively reconstructing the core invariant is what cements 1600+ contest reflexes.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFlashcardModeOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Return to Notebook
                  </button>
                </div>
              </div>
            ) : activeFlashcard ? (
              <div className="p-6 space-y-5">
                {/* Problem Info */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {activeFlashcard.problemId}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeFlashcard.problemName}
                    </span>
                    {activeFlashcard.rating && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {activeFlashcard.rating}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getMistakeCategoryBadgeStyle(activeFlashcard.category).bg} ${getMistakeCategoryBadgeStyle(activeFlashcard.category).text} ${getMistakeCategoryBadgeStyle(activeFlashcard.category).border}`}>
                    {getMistakeCategoryShortLabel(activeFlashcard.category)}
                  </span>
                </div>

                {/* Question / Recall Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Initial Approach & Failure Trigger:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Interval: {activeFlashcard.intervalDays}d · EF: {activeFlashcard.easeFactor?.toFixed(2) || '2.50'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                    <MathText
                      text={activeFlashcard.whyItFailed || activeFlashcard.originalApproach || 'Failed test cases with Wrong Answer or Time Limit Exceeded.'}
                      inline={false}
                    />
                  </div>
                </div>

                {/* Flip Card or Reveal */}
                {!flashcardFlipped ? (
                  <div className="pt-2 text-center space-y-3">
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-medium">
                        Active Recall Protocol: Pause 15 seconds. Try to state the exact invariant and formula out loud before peeking.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFlashcardFlipped(true)}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <EyeIcon size={16} />
                      <span>Reveal Invariant & Rules (or press Space)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Breakthrough Invariant / Observation:
                      </span>
                      <div className="text-xs text-emerald-950 dark:text-emerald-100 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 leading-relaxed font-medium">
                        <MathText text={activeFlashcard.correctObservation} inline={false} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        Personal Contest Takeaway Rule:
                      </span>
                      <div className="text-xs text-indigo-950 dark:text-indigo-200 bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 italic font-semibold">
                        <MathText text={`"${activeFlashcard.personalLesson}"`} inline={false} />
                      </div>
                    </div>

                    {/* SM-2 6-Quality Grading Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Rate recall quality: (keys 0-5)</span>
                        <span>SM-2 Spaced Algorithm</span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {([0, 1, 2, 3, 4, 5] as Sm2Quality[]).map((q) => {
                          const info = SM2_QUALITIES[q];
                          return (
                            <button
                              key={q}
                              type="button"
                              onClick={() => handleFlashcardGrade(q)}
                              className={`p-2 rounded-xl border text-center transition-all cursor-pointer hover:scale-[1.02] ${info.badgeClass}`}
                              title={info.description}
                            >
                              <div className="font-bold text-xs">{info.shortLabel}</div>
                              <div className="text-[10px] opacity-80 mt-0.5">{info.intervalPreview}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* =========================================================================
          MISTAKE CARDS CATALOG LIST
          ========================================================================= */}
      {filteredMistakes.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-sm">
          {mistakes.length === 0 ? (
            <EmptySavedState
              title="No Mistakes Cataloged Yet"
              description="Whenever a Codeforces submission fails or requires editorial peeks, log a structured autopsy here to schedule active SM-2 recall."
              actionLabel="Log Your First Mistake Autopsy"
              onAction={() => setShowAddForm(true)}
            />
          ) : (
            <EmptySavedState
              title="No Mistakes Match Filters"
              description="Try selecting 'All Mistake Categories' or clearing your search term to see your cataloged reviews."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((m) => {
            const isDue = isMistakeDue(m);
            const isRevealed = revealedIds.has(m.id);
            const badgeStyle = getMistakeCategoryBadgeStyle(m.category);
            const daysOverdue = getDaysOverdue(m.nextReviewDate);

            return (
              <FunCard
                key={m.id}
                variant={isDue ? 'fire' : m.status === 'mastered' ? 'emerald' : 'clean'}
                className="p-5 sm:p-6 space-y-4"
              >
                {/* Header Row: Problem ID, Title, Category Badge, Rating, Interval */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-white/10 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg shadow-2xs">
                      {m.problemId}
                    </span>
                    <a
                      href={m.problemUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{m.problemName}</span>
                      <ExternalLinkIcon size={13} className="opacity-60" />
                    </a>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                      {getMistakeCategoryShortLabel(m.category)}
                    </span>
                    {m.rating && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        ★ {m.rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Interval: <strong className="text-slate-900 dark:text-white">{m.intervalDays}d</strong> · EF: <strong className="text-slate-900 dark:text-white">{m.easeFactor?.toFixed(2) || '2.50'}</strong> (Rev #{m.reviewCount})
                    </span>

                    {isDue ? (
                      <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                        <Clock size={11} />
                        {daysOverdue > 0 ? `${daysOverdue}d Overdue` : 'Due Today'}
                      </span>
                    ) : m.status === 'mastered' || (m.intervalDays || 1) >= 30 ? (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={11} />
                        Mastered ({m.intervalDays}d)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        Next: {m.nextReviewDate}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 pl-1">
                      <button
                        type="button"
                        onClick={() => handleSnooze(m, 1)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer transition-colors"
                        title="Snooze review by 1 day"
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete mistake autopsy for ${m.problemId}?`)) {
                            onDeleteMistake(m.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                        title="Delete mistake record"
                      >
                        <DeleteIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Self-Test & Reveal Notes */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Self-Test: What was the root cause & fix?
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReveal(m.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    >
                      {isRevealed ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      <span>{isRevealed ? 'Hide Autopsy Notes' : 'Reveal Autopsy Notes'}</span>
                    </button>
                  </div>

                  {isRevealed ? (
                    <div className="rounded-xl border border-white/10 dark:border-white/5 bg-slate-50/80 dark:bg-slate-950/60 p-4 space-y-3.5 text-xs animate-in fade-in duration-150">
                      <div>
                        <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
                          Why It Failed:
                        </span>
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <MathText text={m.whyItFailed} inline={false} />
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                          Correct Observation & Invariant:
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          <MathText text={m.correctObservation} inline={false} />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 shadow-2xs">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">
                          Personal Contest Rule:
                        </span>
                        <div className="text-slate-900 dark:text-white italic font-semibold">
                          <MathText text={`"${m.personalLesson}"`} inline={false} />
                        </div>
                      </div>

                      {m.codeSnippet && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold uppercase tracking-wider">
                              Snippet / Failing Test Case:
                            </span>
                            <div className="flex items-center gap-3">
                              {onOpenWorkspaceWithCode && (
                                <button
                                  type="button"
                                  onClick={() => onOpenWorkspaceWithCode(m.codeSnippet!, m.problemName)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                                >
                                  Open in IDE
                                </button>
                              )}
                              {onAskCommunity && (
                                <button
                                  type="button"
                                  onClick={() => onAskCommunity(m.codeSnippet!, m.problemName, m.whyItFailed)}
                                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                                >
                                  Ask Community
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 joy-code-container" data-joy-code="true">
                            <JoyCodeViewer
                              code={m.codeSnippet}
                              title={`${m.problemName} snippet`}
                              isModal={false}
                              maxHeight="220px"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-slate-400 text-center">
                      <p>Pause for 10 seconds. Try to recall why your approach failed before clicking Reveal.</p>
                    </div>
                  )}
                </div>

                {/* Inline SM-2 Grading Widget with generous button spacing */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 dark:border-white/5 pt-3.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Rate active recall performance:
                  </span>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRecordSm2(m, 1)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      title="Reset interval to 1 day"
                    >
                      Forgot (1d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecordSm2(m, 3)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      title="Hesitant recall"
                    >
                      Hard ({Math.max(2, m.intervalDays)}d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecordSm2(m, 4)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      title="Accurate recall"
                    >
                      Good ({Math.max(m.intervalDays + 1, Math.round(m.intervalDays * (m.easeFactor || 2.5)))}d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecordSm2(m, 5)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                      title="Instant, crisp recall"
                    >
                      ⚡ Instant Recall
                    </button>
                  </div>
                </div>
              </FunCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
