import React, { useState, useEffect, useMemo } from 'react';
import {
  AcceptedIcon,
  WrongAnswerIcon,
  TimeLimitExceededIcon,
  MemoryLimitExceededIcon,
  RuntimeErrorIcon,
  CompilationErrorIcon,
  CodingBracketsIcon,
  TerminalIcon,
  TimerIcon,
  MemoryUsageIcon,
  TimeLimitIcon,
  RuntimeIcon,
  ExternalLinkIcon,
  RefreshIcon,
  CopyIcon,
  CheckIcon,
  CheckCircleIcon,
  BookmarksIcon,
  StreakIcon,
  AISparkleIcon,
  WarningStatusIcon,
  CodeFileIcon,
  DebugCodeIcon,
  AskAQuestionIcon,
} from './icons';
import { CFProblem, CFSubmissionRecord, MistakeRecord, ProblemAttempt, UserProfile } from '../types';
import { codeforcesService } from '../services/codeforces';
import { cfStorageService, storageService } from '../services/storage';
import {
  AutopsyReport,
  ConfidenceLevel,
  createMistakeFromAutopsy,
  runSubmissionAutopsy,
} from '../utils/autopsy';
import { VersionDiffModal } from './VersionDiffModal';
import { AIAssistantCompanion, NeonProcessingSpinner } from './assets';
import { useToast } from './Toast';
import { MathText } from './MathText';

interface SubmissionAutopsyViewProps {
  cfHandle?: string;
  onSelectProblem?: (prob: CFProblem) => void;
  onOpenWorkspace?: (prob: CFProblem, initialCode?: string) => void;
  onSaveMistake?: (mistake: MistakeRecord) => void;
  initialSubmission?: CFSubmissionRecord;
  onAskCommunity?: (code: string, problemName: string, verdict: string, analysisSummary?: string) => void;
}

const CONFIDENCE_BADGES: Record<ConfidenceLevel, { label: string; bg: string; text: string; border: string }> = {
  CONFIRMED: {
    label: 'Confirmed Fact',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-800/80',
  },
  LIKELY: {
    label: 'High Probability',
    bg: 'bg-indigo-950/80',
    text: 'text-indigo-300',
    border: 'border-indigo-800/80',
  },
  POSSIBLE: {
    label: 'Potential Cause',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-800/80',
  },
  UNDETERMINED: {
    label: 'Needs User Verification',
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-800',
  },
};

export const SubmissionAutopsyView: React.FC<SubmissionAutopsyViewProps> = ({
  cfHandle,
  onSelectProblem,
  onOpenWorkspace,
  onSaveMistake,
  initialSubmission,
  onAskCommunity,
}) => {
  const toast = useToast();
  const [submissions, setSubmissions] = useState<CFSubmissionRecord[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(initialSubmission?.id || null);
  const [loadingSubs, setLoadingSubs] = useState<boolean>(false);
  const [subFetchError, setSubFetchError] = useState<string | null>(null);

  // Manual code paste & custom autopsy state
  const [pastedCode, setPastedCode] = useState<string>('');
  const [pastedVerdict, setPastedVerdict] = useState<string>('WRONG_ANSWER');
  const [pastedProblemIndex, setPastedProblemIndex] = useState<string>('A');
  const [pastedContestId, setPastedContestId] = useState<string>('1352');
  const [pastedProblemName, setPastedProblemName] = useState<string>('K-th Not Divisible by n');
  const [userNotes, setUserNotes] = useState<string>('');

  // Recorded to mistake state
  const [recordedMistakeId, setRecordedMistakeId] = useState<string | null>(null);
  const [showDiffModal, setShowDiffModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [mobileAutopsyTab, setMobileAutopsyTab] = useState<'submissions' | 'report'>('report');

  // Load submissions from storage and CF API
  useEffect(() => {
    const cached = cfStorageService.getCFSubmissions();
    if (cached && cached.length > 0) {
      setSubmissions(cached);
      if (!selectedSubId) {
        // Default to most recent failed submission or first submission
        const firstFailed = cached.find((s) => s.verdict && s.verdict !== 'OK');
        setSelectedSubId(firstFailed ? firstFailed.id : cached[0].id);
      }
    }

    if (cfHandle) {
      loadLiveSubmissions(cfHandle);
    }
  }, [cfHandle]);

  const loadLiveSubmissions = async (handle: string) => {
    setLoadingSubs(true);
    setSubFetchError(null);
    try {
      const live = await codeforcesService.getUserSubmissions(handle, 40);
      if (live && live.length > 0) {
        setSubmissions(live);
        cfStorageService.saveCFSubmissions(live);
        if (!selectedSubId) {
          const firstFailed = live.find((s) => s.verdict && s.verdict !== 'OK');
          setSelectedSubId(firstFailed ? firstFailed.id : live[0].id);
        }
      }
    } catch (err: any) {
      setSubFetchError(err.message || 'Failed to fetch live Codeforces submissions.');
    } finally {
      setLoadingSubs(false);
    }
  };

  const selectedSubmission = useMemo(() => {
    if (!selectedSubId) return null;
    return submissions.find((s) => s.id === selectedSubId) || null;
  }, [selectedSubId, submissions]);

  // Code retrieval: from local drafts, saved versions, or user paste
  const effectiveCode = useMemo(() => {
    if (pastedCode.trim()) return pastedCode;
    if (!selectedSubmission) return '';
    const pid = `${selectedSubmission.problem.contestId || selectedSubmission.contestId || ''}${selectedSubmission.problem.index}`;
    const draft = cfStorageService.getDraft(pid, 'cpp20') || cfStorageService.getDraft(pid, 'cpp17') || cfStorageService.getDraft(pid, 'python');
    return draft?.code || '';
  }, [pastedCode, selectedSubmission]);

  // Run structured autopsy
  const autopsyReport: AutopsyReport = useMemo(() => {
    if (selectedSubmission) {
      return runSubmissionAutopsy(selectedSubmission, effectiveCode, undefined, cfHandle);
    }

    // Fallback manual report from pasted inputs
    const dummySub: Partial<CFSubmissionRecord> = {
      id: 0,
      contestId: parseInt(pastedContestId, 10) || 0,
      verdict: pastedVerdict,
      programmingLanguage: 'GNU C++20 (64)',
      creationTimeSeconds: Math.floor(Date.now() / 1000),
      problem: {
        contestId: parseInt(pastedContestId, 10) || 0,
        index: pastedProblemIndex.toUpperCase(),
        name: pastedProblemName || 'Custom Problem',
        tags: ['implementation'],
      },
    };
    return runSubmissionAutopsy(dummySub, effectiveCode, undefined, cfHandle);
  }, [selectedSubmission, effectiveCode, pastedVerdict, pastedContestId, pastedProblemIndex, pastedProblemName, cfHandle]);

  // Handle 1-Click Save to Mistake Notebook
  const handleSaveToMistakes = () => {
    const newMistakeData = createMistakeFromAutopsy(autopsyReport, effectiveCode, userNotes);
    const savedMistake: MistakeRecord = {
      ...newMistakeData,
      id: `m_${Date.now()}`,
    };

    if (onSaveMistake) {
      onSaveMistake(savedMistake);
    } else {
      // Direct local storage persistence fallback
      const existing = storageService.getMistakes();
      storageService.saveMistake(savedMistake);
    }

    setRecordedMistakeId(savedMistake.id);
    toast.show('Saved to Mistake Notebook (+1d spaced review scheduled)!', 'success');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(effectiveCode).then(() => {
      setCopiedCode(true);
      toast.show('Source code copied to clipboard!', 'info');
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <DebugCodeIcon size={20} semantic="error" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Submission Autopsy</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Root-cause diagnostic engine for failed verdicts (WA, TLE, MLE, RE, CE) with 1-click spaced revision scheduling.
              </p>
            </div>
          </div>
        </div>

        {cfHandle && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadLiveSubmissions(cfHandle)}
              disabled={loadingSubs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshIcon size={14} className={loadingSubs ? 'animate-spin' : ''} />
              <span>Sync CF Submissions</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Submissions / Report Switcher */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 gap-1">
        <button
          onClick={() => setMobileAutopsyTab('submissions')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            mobileAutopsyTab === 'submissions'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Submissions & Code
        </button>
        <button
          onClick={() => setMobileAutopsyTab('report')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            mobileAutopsyTab === 'report'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Diagnosis Report
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submissions Selector & Manual Paste (4 cols) */}
        <div className={`lg:col-span-4 space-y-4 ${mobileAutopsyTab !== 'submissions' ? 'hidden lg:block' : 'block'}`}>
          {/* Recent Submissions List Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TimerIcon size={14} semantic="primary" />
                Recent Submissions
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {submissions.length} fetched
              </span>
            </div>

            {loadingSubs && (
              <div className="text-center py-6 text-xs text-slate-400 space-y-3">
                <NeonProcessingSpinner size={44} label="" />
                <p>Loading authoritative Codeforces submissions...</p>
              </div>
            )}

            {subFetchError && (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
                {subFetchError}
              </div>
            )}

            {!loadingSubs && submissions.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 space-y-1">
                <p>No recent submissions synced yet.</p>
                <p className="text-[11px] text-slate-500">
                  Enter your Codeforces handle in Settings or paste your code below.
                </p>
              </div>
            )}

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {submissions.map((sub) => {
                const isSelected = selectedSubId === sub.id;
                const isFailed = sub.verdict !== 'OK';

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubId(sub.id);
                      setPastedCode(''); // clear paste to prioritize official submission
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/60 shadow-md'
                        : isFailed
                        ? 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                        : 'border-slate-800/40 bg-slate-950/30 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-200">
                          {sub.problem.contestId || ''}{sub.problem.index}
                        </span>
                        <span className="truncate text-slate-300 font-medium">
                          {sub.problem.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        ID: {sub.id} · {sub.programmingLanguage.split(' ')[0]}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap border ${
                        sub.verdict === 'OK'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                          : 'bg-red-950/80 text-red-400 border-red-800/60'
                      }`}
                    >
                      {sub.verdict === 'OK' ? 'AC' : sub.verdict?.slice(0, 3) || 'ERR'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paste Custom Code Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CodeFileIcon size={14} semantic="primary" />
              Source Code for Autopsy
            </span>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Codeforces API does not expose source code directly due to privacy policies. Paste your submitted C++ code below to run full static logic analysis:
            </p>

            <textarea
              rows={8}
              value={pastedCode}
              onChange={(e) => setPastedCode(e.target.value)}
              placeholder="#include <iostream>&#10;using namespace std;&#10;int main() { ... }"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-y"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{effectiveCode ? `${effectiveCode.split('\n').length} lines ready` : 'No code provided'}</span>
              {effectiveCode && (
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {copiedCode ? <CheckIcon size={12} semantic="success" /> : <CopyIcon size={12} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Autopsy Findings & Action Center (8 cols) */}
        <div className={`lg:col-span-8 space-y-4 ${mobileAutopsyTab !== 'report' ? 'hidden lg:block' : 'block'}`}>
          {/* Submission Verdict Banner */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
            {/* Mobile Back to Submissions */}
            <div className="lg:hidden pb-1">
              <button
                onClick={() => setMobileAutopsyTab('submissions')}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
              >
                <span>← Back to Submissions & Code</span>
              </button>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold text-sm border flex items-center gap-1.5 ${autopsyReport.verdictDisplay.bg} ${autopsyReport.verdictDisplay.color}`}
                >
                  {autopsyReport.verdictType === 'OK' ? (
                    <AcceptedIcon size={16} />
                  ) : (
                    <WrongAnswerIcon size={16} />
                  )}
                  {autopsyReport.verdictDisplay.label}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-base">
                      {autopsyReport.problem.contestId || ''}{autopsyReport.problem.index}: {autopsyReport.problem.name}
                    </span>
                    {autopsyReport.problem.rating && (
                      <span className="text-xs font-semibold text-amber-400">
                        ⚡ {autopsyReport.problem.rating}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {autopsyReport.submissionId ? (
                      <span>ID: #{autopsyReport.submissionId}</span>
                    ) : (
                      <span>Local Test Run</span>
                    )}
                    <span>·</span>
                    <span>{autopsyReport.language}</span>
                    {autopsyReport.submittedAt && (
                      <>
                        <span>·</span>
                        <span>{new Date(autopsyReport.submittedAt).toLocaleTimeString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {autopsyReport.problem.contestId && (
                  <a
                    href={autopsyReport.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                  >
                    <span>CF Verdict</span>
                    <ExternalLinkIcon size={14} />
                  </a>
                )}
                {onOpenWorkspace && (
                  <button
                    onClick={() => onOpenWorkspace(autopsyReport.problem, effectiveCode)}
                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <TerminalIcon size={14} />
                    <span>Debug in Workspace</span>
                  </button>
                )}
                {onAskCommunity && (
                  <button
                    onClick={() =>
                      onAskCommunity(
                        effectiveCode,
                        autopsyReport.problem.name,
                        autopsyReport.verdict,
                        autopsyReport.primaryLesson || autopsyReport.findings[0]?.explanation || ''
                      )
                    }
                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold transition-all cursor-pointer"
                    title="Ask the community about this submission autopsy"
                  >
                    <AskAQuestionIcon size={14} />
                    <span>Ask Community</span>
                  </button>
                )}
              </div>
            </div>

            {/* Authoritative Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/40">
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <TimeLimitIcon size={12} semantic="primary" /> Execution Time
                </span>
                <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                  {autopsyReport.executionTimeMs !== undefined && autopsyReport.executionTimeMs !== null
                    ? `${autopsyReport.executionTimeMs} ms`
                    : 'N/A (Hidden/Unavailable)'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/40">
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <MemoryUsageIcon size={12} semantic="primary" /> Memory Footprint
                </span>
                <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                  {autopsyReport.memoryBytes !== undefined && autopsyReport.memoryBytes !== null
                    ? `${Math.round(autopsyReport.memoryBytes / 1024)} KB`
                    : 'N/A (Hidden/Unavailable)'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/40">
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <CodingBracketsIcon size={12} semantic="primary" /> Source Analysis
                </span>
                <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                  {autopsyReport.codeProvided ? 'Code Inspected' : 'Metadata Only'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/40">
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <StreakIcon size={12} semantic="warning" /> Root Cause Tag
                </span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 capitalize truncate">
                  {autopsyReport.suggestedMistakeCategory.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Autopsy Findings Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <DebugCodeIcon size={16} semantic="error" />
              Diagnostic Findings & Code Inspections
            </h3>

            {autopsyReport.findings.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                <AIAssistantCompanion
                  state="teaching"
                  size={120}
                  speechBubble="Paste your C++ solution in the left panel to scan for boundary traps, integer overflow, or asymptotic issues!"
                />
              </div>
            ) : (
              autopsyReport.findings.map((f) => {
                const badge = CONFIDENCE_BADGES[f.confidence];

                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{f.title}</h4>
                      </div>

                      {f.lineNumber && (
                        <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-md">
                          Line {f.lineNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed">
                      <MathText text={f.explanation} inline />
                    </div>

                    {f.codeSnippet && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-amber-300/90 overflow-x-auto">
                        {f.codeSnippet}
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs space-y-1">
                      <span className="font-semibold text-indigo-300 flex items-center gap-1">
                        <AISparkleIcon size={14} semantic="indigo" /> Actionable Fix:
                      </span>
                      <div className="text-slate-300 text-[11px] leading-relaxed">
                        <MathText text={f.suggestedFix} inline />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Counterexample Recommendation Card */}
          {autopsyReport.counterexampleSuggestion && (
            <div className="p-4 rounded-2xl border border-amber-900/40 bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <WarningStatusIcon size={16} semantic="warning" />
                  Boundary Counterexample to Test
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(autopsyReport.counterexampleSuggestion!.input);
                      toast.show('Counterexample input copied to clipboard!', 'info');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 text-[10px] font-semibold border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    Copy Input
                  </button>
                  {onOpenWorkspace && (
                    <button
                      onClick={() => {
                        onOpenWorkspace(autopsyReport.problem, effectiveCode);
                        toast.show(`Workspace opened for Problem ${autopsyReport.problem.index}! Test against the counterexample.`, 'info');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition-colors cursor-pointer shadow-sm"
                    >
                      Test in Workspace
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-200">
                {autopsyReport.counterexampleSuggestion.input}
              </div>

              <p className="text-xs text-amber-200/90 leading-relaxed">
                {autopsyReport.counterexampleSuggestion.rationale}
              </p>
            </div>
          )}

          {/* 1-Click Save to Mistake Notebook & Schedule Spaced Repetition */}
          <div className="p-5 rounded-2xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookmarksIcon size={16} semantic="primary" />
                  Record to Mistake Notebook & Schedule Spaced Repetition
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Converts autopsy findings into an active spaced review task (+1d, +3d, +7d, +14d, +30d) in Mission Control.
                </p>
              </div>

              <button
                onClick={handleSaveToMistakes}
                disabled={Boolean(recordedMistakeId)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                  recordedMistakeId
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {recordedMistakeId ? (
                  <>
                    <CheckCircleIcon size={16} semantic="success" />
                    <span>Scheduled for Tomorrow (+1d)</span>
                  </>
                ) : (
                  <>
                    <BookmarksIcon size={16} />
                    <span>Save Mistake & Schedule Spaced Review</span>
                  </>
                )}
              </button>
            </div>

            {recordedMistakeId && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircleIcon size={16} semantic="success" className="shrink-0" />
                <span>
                  Mistake cataloged! Spaced review card scheduled. It will automatically appear in your Mission Control revision tasks due tomorrow.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
