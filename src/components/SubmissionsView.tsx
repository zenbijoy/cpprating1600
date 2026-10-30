import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  SubmissionHistoryIcon,
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  RefreshIcon,
  WarningStatusIcon,
  CheckCircleIcon,
  CloseIcon,
  AIAssistantBotIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TimerIcon,
  TimeLimitIcon,
  MemoryUsageIcon,
  CodingBracketsIcon,
  SendMessageIcon,
  CopyIcon,
  CheckIcon,
  EditorialIcon,
  AISparkleIcon,
  ProblemTagsIcon,
  CalendarIcon,
  AcceptedIcon,
  WrongAnswerIcon,
} from './icons';
import { CFSubmissionRecord, CFProblem, MistakeRecord } from '../types';
import { cfStorageService } from '../services/storage';
import { codeforcesService } from '../services/codeforces';

interface SubmissionsViewProps {
  cfHandle?: string;
  onSelectProblem?: (prob: CFProblem) => void;
  onSaveMistake?: (mistake: MistakeRecord) => void;
}

type VerdictFilter = 'all' | 'OK' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';

const VERDICT_DISPLAY: Record<string, { label: string; short: string; color: string; bg: string }> = {
  OK: { label: 'Accepted', short: 'AC', color: 'text-emerald-300', bg: 'bg-emerald-950/60 border-emerald-800/60' },
  WRONG_ANSWER: { label: 'Wrong Answer', short: 'WA', color: 'text-red-300', bg: 'bg-red-950/60 border-red-800/60' },
  TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded', short: 'TLE', color: 'text-amber-300', bg: 'bg-amber-950/60 border-amber-800/60' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memory Limit Exceeded', short: 'MLE', color: 'text-orange-300', bg: 'bg-orange-950/60 border-orange-800/60' },
  RUNTIME_ERROR: { label: 'Runtime Error', short: 'RE', color: 'text-rose-300', bg: 'bg-rose-950/60 border-rose-800/60' },
  COMPILATION_ERROR: { label: 'Compilation Error', short: 'CE', color: 'text-pink-300', bg: 'bg-pink-950/60 border-pink-800/60' },
  PRESENTATION_ERROR: { label: 'Presentation Error', short: 'PE', color: 'text-slate-300', bg: 'bg-slate-900 border-slate-700/60' },
  SKIPPED: { label: 'Skipped', short: 'SK', color: 'text-slate-400', bg: 'bg-slate-900 border-slate-700/60' },
  PARTIAL: { label: 'Partial', short: 'PA', color: 'text-yellow-300', bg: 'bg-yellow-950/60 border-yellow-800/60' },
  HACKED: { label: 'Hacked', short: 'HA', color: 'text-red-400', bg: 'bg-red-950/60 border-red-800/60' },
};

function getVerdictInfo(v?: string) {
  return VERDICT_DISPLAY[v ?? ''] ?? {
    label: v ?? 'Unknown',
    short: v?.slice(0, 3) ?? '?',
    color: 'text-slate-400',
    bg: 'bg-slate-800 border-slate-700/40',
  };
}

function formatTs(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(seconds: number): string {
  const diff = Math.floor((Date.now() - seconds * 1000) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return formatTs(seconds);
}

// ── AI Wrong Answer Analysis Panel ──────────────────────────────────────────
interface AIAnalysisPanelProps {
  submission: CFSubmissionRecord;
  onSaveMistake?: (mistake: MistakeRecord) => void;
}

function AIAnalysisPanel({ submission, onSaveMistake }: AIAnalysisPanelProps) {
  const [hintLevel, setHintLevel] = useState(1);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [failingInput, setFailingInput] = useState('');
  const [userCode, setUserCode] = useState(() => {
    const pid = `${submission.problem.contestId ?? submission.contestId ?? ''}${submission.problem.index}`;
    const draft = cfStorageService.getDraft(pid, 'cpp20') || cfStorageService.getDraft(pid, 'cpp17') || cfStorageService.getDraft(pid, 'python');
    return draft?.code || '';
  });
  const [showInputForm, setShowInputForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedToMistakes, setSavedToMistakes] = useState(false);

  const requestHint = useCallback(async (level: number) => {
    setLoading(true);
    setError(null);
    setAnalysis('');
    setHintLevel(level);
    try {
      const res = await fetch('/api/ai/analyze-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: submission.verdict,
          problemName: submission.problem.name,
          problemRating: submission.problem.rating,
          problemTags: submission.problem.tags,
          userNotes: userNotes || undefined,
          failingInput: failingInput || undefined,
          code: userCode || undefined,
          hintLevel: level,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI analysis failed');
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'AI service error');
    } finally {
      setLoading(false);
    }
  }, [submission, userNotes, failingInput, userCode]);

  const copyAnalysis = () => {
    navigator.clipboard.writeText(analysis).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendToMistakeNotebook = () => {
    if (!onSaveMistake) return;
    const pid = `${submission.problem.contestId ?? submission.contestId ?? ''}${submission.problem.index}`;
    const newMistake: MistakeRecord = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      problemId: pid,
      problemName: submission.problem.name,
      problemUrl: submission.problem.contestId
        ? `https://codeforces.com/problemset/problem/${submission.problem.contestId}/${submission.problem.index}`
        : 'https://codeforces.com/problemset',
      rating: submission.problem.rating,
      tags: submission.problem.tags || [],
      category: submission.verdict === 'TIME_LIMIT_EXCEEDED' ? 'wrong_complexity' : 'incorrect_algorithm',
      originalApproach: userNotes || 'Attempted submission got ' + (submission.verdict || 'WA'),
      whyItFailed: analysis ? analysis.slice(0, 300) : `Received ${submission.verdict} verdict on test ${submission.passedTestCount != null ? submission.passedTestCount + 1 : '?'}.`,
      correctObservation: 'Identified via AI analysis & post-contest debrief.',
      correctApproach: 'Refactor according to optimal bounds and invariants.',
      personalLesson: 'Always check problem constraints, small corner cases (N=1, boundary values), and potential integer overflow before submitting.',
      codeSnippet: userCode ? userCode.slice(0, 500) : undefined,
      createdAt: new Date().toISOString(),
      nextReviewDate: new Date().toISOString().split('T')[0],
      intervalDays: 1,
      reviewCount: 0,
      status: 'due',
    };
    onSaveMistake(newMistake);
    setSavedToMistakes(true);
    setTimeout(() => setSavedToMistakes(false), 3000);
  };

  const HINT_LEVELS = [
    { level: 1, label: 'Hint 1', desc: 'Conceptual Nudge' },
    { level: 2, label: 'Hint 2', desc: 'Observation' },
    { level: 3, label: 'Hint 3', desc: 'Algorithm' },
    { level: 4, label: 'Hint 4', desc: 'Pseudocode' },
    { level: 5, label: 'Hint 5', desc: 'Full Approach' },
    { level: 6, label: 'Editorial', desc: 'Code Template' },
  ];

  if (submission.verdict === 'OK') {
    return (
      <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-sm text-emerald-300 flex items-center gap-2">
        <CheckCircleIcon size={16} semantic="success" className="shrink-0" />
        This submission was Accepted. AI analysis is designed for reviewing failed submissions.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AIAssistantBotIcon size={16} semantic="primary" />
          <h3 className="text-sm font-semibold text-slate-200">AI Wrong Answer Review</h3>
          <span className="text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Official Verdict: {submission.verdict}
          </span>
        </div>
        <button
          onClick={() => setShowInputForm((v) => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          {showInputForm ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
          {showInputForm ? 'Hide Extra Context' : 'Add Code / Notes'}
        </button>
      </div>

      {showInputForm && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Your Code (optional, for direct inspection)</label>
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700/70 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              placeholder="// Paste your C++ or Python code here for deep syntax & overflow inspection..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Failing Input (if revealed or suspected)</label>
              <textarea
                value={failingInput}
                onChange={(e) => setFailingInput(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700/70 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 5\n1 2 3 4 5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Your Hypotheses / Notes</label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700/70 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Got WA on test 3, possibly integer overflow or greedy sorting fails on ties."
              />
            </div>
          </div>
        </div>
      )}

      {/* Progressive Hint Ladder */}
      <div>
        <p className="text-xs text-slate-400 mb-2 font-medium">
          Select assistance level (start with low hints to develop independent intuition):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {HINT_LEVELS.map((h) => (
            <button
              key={h.level}
              onClick={() => requestHint(h.level)}
              disabled={loading}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 flex items-center gap-1 ${
                hintLevel === h.level && analysis
                  ? 'bg-violet-900/40 border-violet-500/70 text-violet-200 shadow-sm'
                  : 'bg-slate-900 border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="font-semibold">{h.label}:</span>
              <span className="text-[11px] text-slate-400">{h.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-300 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
          <RefreshIcon size={16} className="animate-spin text-violet-400" />
          <span>Analyzing submission logic against rating {submission.problem.rating || 1200} patterns…</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50">
          <WarningStatusIcon size={16} semantic="error" className="shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
              <AISparkleIcon size={14} semantic="indigo" />
              AI Feedback (Hint Level {hintLevel})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyAnalysis}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 cursor-pointer"
              >
                {copied ? <CheckIcon size={12} semantic="success" /> : <CopyIcon size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {onSaveMistake && (
                <button
                  onClick={handleSendToMistakeNotebook}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 transition-colors border border-indigo-500/40 font-medium cursor-pointer"
                >
                  <EditorialIcon size={12} />
                  {savedToMistakes ? 'Saved to Mistakes!' : 'Log in Mistake Notebook'}
                </button>
              )}
            </div>
          </div>
          <div className="prose prose-sm prose-invert max-w-none p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {analysis}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-900/40 p-2 rounded border border-slate-800/40">
            <WarningStatusIcon size={14} semantic="primary" className="shrink-0" />
            <span>Note: Hidden testcases are confidential on Codeforces. The AI analyzes algorithmic invariants, constraints, and standard pitfalls.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Submission Row ────────────────────────────────────────────────────────────
interface SubmissionRowProps {
  sub: CFSubmissionRecord;
  onSelectProblem?: (prob: CFProblem) => void;
  onSaveMistake?: (mistake: MistakeRecord) => void;
}

function SubmissionRow({ sub, onSelectProblem, onSaveMistake }: SubmissionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const v = getVerdictInfo(sub.verdict);
  const pid = `${sub.problem.contestId ?? sub.contestId ?? ''}${sub.problem.index}`;
  const cfSubUrl = sub.contestId
    ? `https://codeforces.com/contest/${sub.contestId}/submission/${sub.id}`
    : `https://codeforces.com/problemset/submission/${sub.problem.contestId}/${sub.id}`;
  const probUrl = sub.problem.contestId
    ? `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`
    : 'https://codeforces.com/problemset';

  return (
    <>
      <tr
        className={`hover:bg-slate-800/40 transition-colors cursor-pointer border-b border-slate-800/50 ${
          expanded ? 'bg-slate-800/30' : ''
        }`}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUpIcon size={16} semantic="primary" className="shrink-0" /> : <ChevronDownIcon size={16} className="text-slate-500 shrink-0" />}
            <div className="min-w-0">
              <span className="font-mono text-xs text-slate-500">{pid}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProblem?.(sub.problem);
                }}
                className="text-sm font-semibold text-slate-200 hover:text-indigo-300 transition-colors text-left block truncate max-w-[240px]"
              >
                {sub.problem.name}
              </button>
            </div>
          </div>
        </td>
        <td className="py-3 px-3">
          <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border font-semibold ${v.bg} ${v.color}`}>
            {v.label}
          </span>
        </td>
        <td className="py-3 px-3 text-xs text-slate-300 whitespace-nowrap">
          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">{sub.programmingLanguage}</span>
        </td>
        <td className="py-3 px-3 text-xs text-slate-300 text-right font-mono">
          {sub.timeConsumedMillis != null ? `${sub.timeConsumedMillis} ms` : '—'}
        </td>
        <td className="py-3 px-3 text-xs text-slate-300 text-right font-mono">
          {sub.memoryConsumedBytes != null ? `${Math.round(sub.memoryConsumedBytes / 1024)} KB` : '—'}
        </td>
        <td className="py-3 px-3 text-xs text-slate-400 text-right whitespace-nowrap">
          {formatRelative(sub.creationTimeSeconds)}
        </td>
        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 justify-end">
            <a
              href={cfSubUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View authoritative submission on Codeforces"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
            >
              <ExternalLinkIcon size={14} />
            </a>
            <button
              onClick={() => onSelectProblem?.(sub.problem)}
              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Workspace
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-900/60 border-b border-slate-800">
          <td colSpan={7} className="p-4">
            <div className="space-y-4 max-w-5xl mx-auto">
              {/* Problem Metadata Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-300">
                    Contest: {sub.contestId || sub.problem.contestId || 'Problemset'}
                  </span>
                  {sub.problem.rating && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 font-bold">
                      ⚡ Rating: {sub.problem.rating}
                    </span>
                  )}
                  {sub.passedTestCount != null && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      Passed Tests: {sub.passedTestCount}
                    </span>
                  )}
                  <span className="text-slate-500">Submitted at: {formatTs(sub.creationTimeSeconds)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={probUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Open Problem on Codeforces <ExternalLinkIcon size={12} />
                  </a>
                </div>
              </div>

              {/* Tags */}
              {sub.problem.tags && sub.problem.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <ProblemTagsIcon size={12} /> Tags:
                  </span>
                  {sub.problem.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* AI Wrong Answer Analysis Box */}
              <AIAnalysisPanel submission={sub} onSaveMistake={onSaveMistake} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Submissions View Component ─────────────────────────────────────────
export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  cfHandle,
  onSelectProblem,
  onSaveMistake,
}) => {
  const [submissions, setSubmissions] = useState<CFSubmissionRecord[]>(() => cfStorageService.getCFSubmissions());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all');
  const [langFilter, setLangFilter] = useState('all');
  const [minRating, setMinRating] = useState<number | 'all'>('all');
  const [maxRating, setMaxRating] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const refresh = useCallback(async () => {
    if (!cfHandle) return;
    setLoading(true);
    setError(null);
    try {
      const subs = await codeforcesService.getUserSubmissions(cfHandle, 200);
      cfStorageService.saveCFSubmissions(subs);
      setSubmissions(subs);
    } catch (err: any) {
      setError(err.message || 'Failed to sync submissions from Codeforces');
    } finally {
      setLoading(false);
    }
  }, [cfHandle]);

  // Auto-load live submissions when cfHandle is available
  useEffect(() => {
    if (!cfHandle) return;
    const cached = cfStorageService.getCFSubmissions();
    if (cached && cached.length > 0) {
      setSubmissions(cached);
    } else {
      refresh();
    }
  }, [cfHandle, refresh]);

  // Compute available languages
  const languages = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.programmingLanguage) set.add(s.programmingLanguage);
    });
    return Array.from(set).sort();
  }, [submissions]);

  // Filtered submissions
  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (verdictFilter !== 'all' && s.verdict !== verdictFilter) return false;
      if (langFilter !== 'all' && s.programmingLanguage !== langFilter) return false;
      if (minRating !== 'all' && (s.problem.rating || 0) < minRating) return false;
      if (maxRating !== 'all' && (s.problem.rating || 0) > maxRating) return false;
      if (search) {
        const pid = `${s.problem.contestId ?? s.contestId ?? ''}${s.problem.index}`.toLowerCase();
        const name = (s.problem.name || '').toLowerCase();
        const q = search.toLowerCase();
        if (!pid.includes(q) && !name.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, verdictFilter, langFilter, minRating, maxRating, search]);

  const displayed = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = displayed.length < filtered.length;

  const stats = useMemo(() => {
    const ac = submissions.filter((s) => s.verdict === 'OK').length;
    const wa = submissions.filter((s) => s.verdict === 'WRONG_ANSWER').length;
    const tle = submissions.filter((s) => s.verdict === 'TIME_LIMIT_EXCEEDED').length;
    const re = submissions.filter((s) => s.verdict === 'RUNTIME_ERROR').length;
    return { total: submissions.length, ac, wa, tle, re };
  }, [submissions]);

  if (!cfHandle) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 inline-flex">
          <SubmissionHistoryIcon size={48} semantic="primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Connect Codeforces to View Submissions</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Please link your handle in the CF Profile tab to automatically fetch, filter, and inspect your real submission history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SubmissionHistoryIcon size={20} semantic="primary" />
            Submission History & Logs
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Handle: <span className="font-semibold text-slate-200">{cfHandle}</span> · {stats.total} submissions · {stats.ac} AC · {stats.wa} WA · {stats.tle} TLE
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Submissions</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
            <AcceptedIcon size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Accepted</p>
            <p className="text-lg font-bold text-emerald-400">{stats.ac}</p>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/50 text-red-400">
            <WrongAnswerIcon size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Wrong Answer</p>
            <p className="text-lg font-bold text-red-400">{stats.wa}</p>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-400">
            <TimeLimitIcon size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Time Limit Exceeded</p>
            <p className="text-lg font-bold text-amber-400">{stats.tle}</p>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-400">
            <MemoryUsageIcon size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Runtime Errors</p>
            <p className="text-lg font-bold text-rose-400">{stats.re}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by problem name or ID (e.g. 158A, Watermelon)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={verdictFilter}
            onChange={(e) => {
              setVerdictFilter(e.target.value as VerdictFilter);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Verdicts</option>
            <option value="OK">Accepted (AC)</option>
            <option value="WRONG_ANSWER">Wrong Answer (WA)</option>
            <option value="TIME_LIMIT_EXCEEDED">Time Limit Exceeded (TLE)</option>
            <option value="MEMORY_LIMIT_EXCEEDED">Memory Limit Exceeded (MLE)</option>
            <option value="RUNTIME_ERROR">Runtime Error (RE)</option>
            <option value="COMPILATION_ERROR">Compilation Error (CE)</option>
          </select>
          <select
            value={langFilter}
            onChange={(e) => {
              setLangFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50">
          <WarningStatusIcon size={16} semantic="error" className="shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {submissions.length === 0 && !loading && (
        <div className="text-center py-16 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <SubmissionHistoryIcon size={48} className="text-slate-600 mx-auto" />
          <p className="text-slate-300 font-medium">No submissions loaded yet.</p>
          <p className="text-xs text-slate-500">Click Sync Submissions above to fetch your official Codeforces submission history.</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
          >
            Fetch From Codeforces
          </button>
        </div>
      )}

      {/* Submissions Table */}
      {filtered.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-3">Problem</th>
                  <th className="py-3 px-3">Verdict</th>
                  <th className="py-3 px-3">Language</th>
                  <th className="py-3 px-3 text-right">Time</th>
                  <th className="py-3 px-3 text-right">Memory</th>
                  <th className="py-3 px-3 text-right">When</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {displayed.map((sub) => (
                  <SubmissionRow
                    key={`${sub.id}-${sub.creationTimeSeconds}`}
                    sub={sub}
                    onSelectProblem={onSelectProblem}
                    onSaveMistake={onSaveMistake}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="p-4 text-center border-t border-slate-800/60 bg-slate-950/30">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700/60"
              >
                Load More Submissions ({filtered.length - displayed.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
