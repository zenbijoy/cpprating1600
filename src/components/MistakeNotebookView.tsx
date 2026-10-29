import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { MistakeCategory, MistakeRecord } from '../types';
import {
  getMistakeCategoryLabel,
  isMistakeDue,
  recordReviewAttempt,
} from '../utils/spacedRepetition';

interface MistakeNotebookViewProps {
  mistakes: MistakeRecord[];
  onSaveMistake: (mistake: MistakeRecord) => void;
  onDeleteMistake: (id: string) => void;
}

const ALL_CATEGORIES: MistakeCategory[] = [
  'boundary_case',
  'integer_overflow',
  'indexing_error',
  'wrong_observation',
  'misread_statement',
  'wrong_complexity',
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
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Form State
  const [formProblemId, setFormProblemId] = useState<string>('');
  const [formProblemName, setFormProblemName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<MistakeCategory>('boundary_case');
  const [formOriginalApproach, setFormOriginalApproach] = useState<string>('');
  const [formWhyFailed, setFormWhyFailed] = useState<string>('');
  const [formCorrectObs, setFormCorrectObs] = useState<string>('');
  const [formLesson, setFormLesson] = useState<string>('');
  const [formRating, setFormRating] = useState<number>(800);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReview = (mistake: MistakeRecord, remembered: boolean, confidence: number) => {
    const updated = recordReviewAttempt(mistake, remembered, confidence);
    onSaveMistake(updated);
    setActiveReviewId(null);
  };

  const handleCreateMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProblemId || !formProblemName) return;

    const newMistake: MistakeRecord = {
      id: `m_${Date.now()}`,
      problemId: formProblemId.toUpperCase(),
      problemName: formProblemName,
      problemUrl: `https://codeforces.com/problemset`,
      rating: formRating,
      tags: [],
      category: formCategory,
      originalApproach: formOriginalApproach,
      whyItFailed: formWhyFailed,
      correctObservation: formCorrectObs,
      correctApproach: formCorrectObs,
      personalLesson: formLesson,
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 1 day
      intervalDays: 1,
      reviewCount: 0,
      status: 'due',
    };

    onSaveMistake(newMistake);
    setShowAddForm(false);
    // Reset form
    setFormProblemId('');
    setFormProblemName('');
    setFormOriginalApproach('');
    setFormWhyFailed('');
    setFormCorrectObs('');
    setFormLesson('');
  };

  const dueMistakes = mistakes.filter((m) => isMistakeDue(m));
  const filteredMistakes = mistakes.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      m.problemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.problemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.personalLesson.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Mistake Notebook & Spaced Revision</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            "Your rating is determined by how many mistake patterns you eliminate." Recall first before peeking at the solution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 self-start rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Mistake</span>
        </button>
      </div>

      {/* Due Reviews Alert Banner */}
      {dueMistakes.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-900/40 bg-gradient-to-r from-amber-950/40 to-slate-900 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">
                {dueMistakes.length} Mistake {dueMistakes.length === 1 ? 'Card' : 'Cards'} Due for Spaced Recall
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Test whether you remember the critical observation before revealing the notes below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Mistake Form Modal */}
      {showAddForm && (
        <form
          onSubmit={handleCreateMistake}
          className="rounded-2xl border border-indigo-900/60 bg-slate-900 p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Log Mistake & Schedule Spaced Revision</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Problem ID</label>
              <input
                type="text"
                placeholder="e.g. 158A"
                required
                value={formProblemId}
                onChange={(e) => setFormProblemId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Problem Title</label>
              <input
                type="text"
                placeholder="e.g. Next Round"
                required
                value={formProblemName}
                onChange={(e) => setFormProblemName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as MistakeCategory)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getMistakeCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Original Approach & Why It Failed</label>
            <textarea
              rows={2}
              required
              value={formWhyFailed}
              onChange={(e) => setFormWhyFailed(e.target.value)}
              placeholder="What did you try, and why did it get WA/TLE? (e.g. Sum exceeded 2*10^9 without long long)"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Correct Observation / Approach</label>
            <textarea
              rows={2}
              required
              value={formCorrectObs}
              onChange={(e) => setFormCorrectObs(e.target.value)}
              placeholder="The breakthrough idea or invariant that actually works..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Personal Takeaway Lesson</label>
            <input
              type="text"
              required
              value={formLesson}
              onChange={(e) => setFormLesson(e.target.value)}
              placeholder="1 sentence rule to avoid this in the future (e.g. 'Check N=0 and N=1 limits before coding')"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 text-xs shadow-md"
            >
              Save to Notebook
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logged mistakes, problem names, lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="all">All Mistake Types ({mistakes.length})</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {getMistakeCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Mistake Cards */}
      {filteredMistakes.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-slate-500" />
          <h3 className="font-bold text-white text-base">No mistakes match your filter</h3>
          <p className="text-xs text-slate-400">
            Whenever a problem fails or requires too many hints, log it here to cement the lesson.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((m) => {
            const isDue = isMistakeDue(m);
            const isRevealed = revealedIds.has(m.id);

            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-5 space-y-4 transition-all ${
                  isDue
                    ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 shadow-md'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-indigo-400">{m.problemId}</span>
                    <h4 className="font-bold text-sm text-white">{m.problemName}</h4>
                    <span className="rounded bg-rose-950/70 border border-rose-800/60 text-rose-300 text-[10px] font-bold px-2 py-0.5">
                      {getMistakeCategoryLabel(m.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Interval: <strong className="text-slate-200">{m.intervalDays}d</strong> (Review #{m.reviewCount})
                    </span>
                    {isDue ? (
                      <span className="rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        Due Today
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        Next: {m.nextReviewDate}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteMistake(m.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Delete mistake record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Recall First Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Self-Test: What was the root cause & fix?
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReveal(m.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isRevealed ? 'Hide Notes' : 'Reveal Solution Notes'}</span>
                    </button>
                  </div>

                  {isRevealed ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-rose-400 block mb-0.5">Why it failed:</span>
                        <p className="text-slate-300 leading-relaxed">{m.whyItFailed}</p>
                      </div>

                      <div>
                        <span className="font-bold text-emerald-400 block mb-0.5">Correct Observation:</span>
                        <p className="text-slate-200 leading-relaxed">{m.correctObservation}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/50">
                        <span className="font-bold text-indigo-300 block mb-0.5">Personal Rule:</span>
                        <p className="text-white italic">"{m.personalLesson}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400 text-center space-y-1">
                      <p>Pause for 10 seconds. Try to recall why your approach failed before clicking Reveal.</p>
                    </div>
                  )}
                </div>

                {/* Spaced Repetition Grading */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Rate your recall performance:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReview(m, false, 1)}
                      className="rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 px-3 py-1 text-xs font-semibold cursor-pointer"
                    >
                      Forgot / Hard (Reset to 1d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview(m, true, 4)}
                      className="rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 px-3 py-1 text-xs font-semibold cursor-pointer"
                    >
                      Remembered Clearly (+Interval)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
