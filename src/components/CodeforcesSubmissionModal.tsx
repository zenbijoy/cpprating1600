import React, { useState, useEffect, useRef } from 'react';
import {
  CloseIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshIcon,
  ZapIcon,
  WarningStatusIcon,
  ShieldIcon,
} from './icons';
import { codeforcesService } from '../services/codeforces';
import { storageService } from '../services/storage';
import { CFProblem, CFSubmissionRecord, ProblemAttempt, ProgrammingLanguage } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface CodeforcesSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: CFProblem;
  code: string;
  language: ProgrammingLanguage;
  onVerifiedSubmission?: (attempt: ProblemAttempt, submission: CFSubmissionRecord) => void;
  onOpenAutopsy?: (code: string, verdict: string, problem: CFProblem) => void;
}

export const CodeforcesSubmissionModal: React.FC<CodeforcesSubmissionModalProps> = ({
  isOpen,
  onClose,
  problem,
  code,
  language,
  onVerifiedSubmission,
  onOpenAutopsy,
}) => {
  const profile = storageService.getProfile();
  const [handle, setHandle] = useState<string>(profile.cfHandle || '');
  const [isEditingHandle, setIsEditingHandle] = useState<boolean>(!profile.cfHandle);
  const [sessionCookie, setSessionCookie] = useState<string>('');
  const [showAdvancedCookie, setShowAdvancedCookie] = useState<boolean>(false);

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [submittingDirect, setSubmittingDirect] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<CFSubmissionRecord | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const contestId = problem.contestId || 4;
  const problemIndex = (problem.index || 'A').toUpperCase();
  const cfSubmitUrl = `https://codeforces.com/contest/${contestId}/submit`;
  const cfProblemsetUrl = `https://codeforces.com/problemset/submit?submittedProblemCode=${contestId}${problemIndex}`;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  // Scroll to bottom of terminal when logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // When modal opens: auto-copy code to clipboard and initialize terminal
  useEffect(() => {
    if (isOpen) {
      const currentProfile = storageService.getProfile();
      if (currentProfile.cfHandle) {
        setHandle(currentProfile.cfHandle);
        setIsEditingHandle(false);
      } else {
        setIsEditingHandle(true);
      }

      setLogs([]);
      setCurrentSubmission(null);
      setPollError(null);

      // Copy code to clipboard automatically
      if (code) {
        navigator.clipboard.writeText(code).then(
          () => {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2500);
            addLog(`Code for ${contestId}${problemIndex} automatically copied to clipboard.`);
          },
          () => {
            addLog(`Could not auto-copy code. Please use the Copy Code button.`);
          }
        );
      }

      addLog(`Target Problem: ${contestId}${problemIndex} - ${problem.name}`);
      addLog(`Language selected: ${language.toUpperCase()}`);

      // If handle is already set, start watching the Codeforces judge
      if (currentProfile.cfHandle) {
        startLivePolling(currentProfile.cfHandle);
      } else {
        addLog(`Please enter and save your Codeforces handle to track your live judge status.`);
      }
    } else {
      stopLivePolling();
    }

    return () => {
      stopLivePolling();
    };
  }, [isOpen, problem, language]);

  const stopLivePolling = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPolling(false);
  };

  const startLivePolling = async (targetHandle: string) => {
    if (!targetHandle.trim()) {
      setPollError('Please provide a Codeforces handle.');
      return;
    }
    stopLivePolling();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsPolling(true);
    setPollError(null);

    const minTimestamp = Math.floor(Date.now() / 1000) - 30; // 30s buffer

    addLog(`Connecting to live Codeforces telemetry for @${targetHandle.trim()}...`);

    try {
      const finishedSub = await codeforcesService.pollLatestSubmission({
        handle: targetHandle.trim(),
        contestId,
        index: problemIndex,
        minTimestampSeconds: minTimestamp,
        onUpdate: (sub) => {
          setCurrentSubmission(sub);
        },
        onLog: (msg) => {
          addLog(msg);
        },
      });

      if (finishedSub) {
        setCurrentSubmission(finishedSub);
        const isOk = finishedSub.verdict === 'OK';

        if (isOk) {
          try {
            soundEffects.playVictory();
          } catch {}
          addLog(`CONGRATULATIONS! Solution Accepted on Codeforces!`);
        } else {
          try {
            soundEffects.playWa();
          } catch {}
          addLog(`Verdict: ${finishedSub.verdict || 'REJECTED'}. You can inspect and log autopsy.`);
        }

        // Record attempt to app
        const attempt: ProblemAttempt = {
          id: `cf_${finishedSub.id}`,
          problemId: `${contestId}${problemIndex}`,
          contestId,
          index: problemIndex,
          name: problem.name,
          rating: problem.rating,
          tags: problem.tags,
          url: `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`,
          startedAt: new Date(Date.now() - 300000).toISOString(),
          endedAt: new Date().toISOString(),
          timeSpentSeconds: Math.round((finishedSub.timeConsumedMillis || 30000) / 1000),
          hintsUsedCount: 0,
          highestHintLevel: 0,
          outcome: isOk ? 'solved_independently' : 'attempted_gave_up',
          officialVerdict: isOk ? 'OK' : 'WRONG_ANSWER',
          selfReported: false,
          userCode: code,
          codeLanguage: language,
        };

        if (onVerifiedSubmission) {
          onVerifiedSubmission(attempt, finishedSub);
        }
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setPollError(err.message || 'Judge polling error');
        addLog(`Judge polling error: ${err.message || 'Network error'}`);
      }
    } finally {
      setIsPolling(false);
    }
  };

  const handleSaveHandle = () => {
    const trimmed = handle.trim();
    if (!trimmed) return;
    const currProfile = storageService.getProfile();
    storageService.saveProfile({
      ...currProfile,
      cfHandle: trimmed,
    });
    setIsEditingHandle(false);
    addLog(`Codeforces handle set to @${trimmed}.`);
    startLivePolling(trimmed);
  };

  const handleCopyCodeManual = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      addLog('Source code copied to clipboard!');
    } catch {}
  };

  const handleOpenCfSubmit = () => {
    handleCopyCodeManual();
    addLog(`Opening Codeforces contest submit page: ${cfSubmitUrl}`);
    window.open(cfSubmitUrl, '_blank', 'noopener,noreferrer');
    if (handle.trim() && !isPolling) {
      startLivePolling(handle.trim());
    }
  };

  const handleOpenProblemsetSubmit = () => {
    handleCopyCodeManual();
    addLog(`Opening Codeforces problemset submit page: ${cfProblemsetUrl}`);
    window.open(cfProblemsetUrl, '_blank', 'noopener,noreferrer');
    if (handle.trim() && !isPolling) {
      startLivePolling(handle.trim());
    }
  };

  const handleDirectSubmit = async () => {
    setSubmittingDirect(true);
    addLog(`Attempting direct submission to Codeforces...`);
    try {
      const res = await codeforcesService.submitSolution({
        contestId,
        index: problemIndex,
        language,
        code,
        handle: handle.trim(),
        sessionCookie: sessionCookie.trim() || undefined,
      });

      if (res.success) {
        addLog(`Direct submission accepted by Codeforces!`);
        if (handle.trim()) {
          startLivePolling(handle.trim());
        }
      } else {
        addLog(`Direct submission required browser session: ${res.message || 'Using Web Bridge.'}`);
        handleOpenCfSubmit();
      }
    } catch (err: any) {
      addLog(`Direct submission error: ${err.message || 'Failed'}. Fallback to 1-Click submit.`);
      handleOpenCfSubmit();
    } finally {
      setSubmittingDirect(false);
    }
  };

  if (!isOpen) return null;

  const isVerdictFinished = currentSubmission && currentSubmission.verdict && currentSubmission.verdict !== 'TESTING';
  const isOk = currentSubmission?.verdict === 'OK';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black">
              CF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Codeforces Official Submission</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {contestId}{problemIndex}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                {problem.name} • {problem.rating ? `Rating: ${problem.rating}` : 'Unrated'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Handle Configuration Bar */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldIcon size={16} className="text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">Codeforces Handle:</span>
              {!isEditingHandle && handle ? (
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-500/20">
                  @{handle}
                </span>
              ) : null}
            </div>

            {isEditingHandle ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 w-36"
                />
                <button
                  type="button"
                  onClick={handleSaveHandle}
                  className="px-3 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingHandle(true)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Change handle
              </button>
            )}
          </div>

          {/* Action Step Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZapIcon size={16} className="text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Automated Codeforces Upload
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCodeManual}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                {copiedCode ? <CheckIcon size={13} className="text-emerald-400" /> : <CopyIcon size={13} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your solution has been formatted and copied. Click below to open Codeforces submit page with{' '}
              <strong className="text-white">{contestId}{problemIndex}</strong> pre-selected, paste (<kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-[10px]">Ctrl+V</kbd>), and submit. Our Live Judge automatically streams your results!
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenCfSubmit}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-900/30 cursor-pointer"
              >
                <ExternalLinkIcon size={15} />
                <span>Submit on Codeforces ↗</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSubmit}
                disabled={submittingDirect}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                {submittingDirect ? <RefreshIcon size={14} className="animate-spin text-indigo-400" /> : <ZapIcon size={14} />}
                <span>Direct Auto-Upload</span>
              </button>

              <button
                type="button"
                onClick={() => handle.trim() && startLivePolling(handle.trim())}
                disabled={isPolling}
                className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50 ml-auto"
                title="Refresh judge listener"
              >
                <RefreshIcon size={14} className={isPolling ? 'animate-spin text-indigo-400' : ''} />
                <span>{isPolling ? 'Listening...' : 'Check Status'}</span>
              </button>
            </div>

            {/* Advanced Session Cookie Dropdown */}
            <div className="pt-2 border-t border-slate-800/70">
              <button
                type="button"
                onClick={() => setShowAdvancedCookie(!showAdvancedCookie)}
                className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{showAdvancedCookie ? '▼' : '►'} Advanced: 100% Headless Session Submit (Optional)</span>
              </button>
              {showAdvancedCookie && (
                <div className="mt-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Paste your Codeforces cookie string (<code className="text-indigo-300">JSESSIONID=...; 39ce7...</code>) from your browser Developer Tools to allow direct background submissions without opening tabs.
                  </p>
                  <input
                    type="password"
                    value={sessionCookie}
                    onChange={(e) => setSessionCookie(e.target.value)}
                    placeholder="JSESSIONID=...; 39ce7c19d6da87f81c3fc5c145d853ea=..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submission Finalized Result Card */}
          {isVerdictFinished && currentSubmission && (
            <div
              className={`p-4 rounded-xl border ${
                isOk
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
              } space-y-3 animate-in zoom-in-95 duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black ${isOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isOk ? '🎉 ACCEPTED (OK)' : `❌ ${currentSubmission.verdict?.replace(/_/g, ' ')}`}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-mono">
                    #{currentSubmission.id}
                  </span>
                </div>
                <a
                  href={`https://codeforces.com/contest/${contestId}/submission/${currentSubmission.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold flex items-center gap-1 hover:underline text-indigo-400"
                >
                  <span>View on Codeforces</span>
                  <ExternalLinkIcon size={12} />
                </a>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Passed Tests</div>
                  <div className="text-sm font-black text-white">{currentSubmission.passedTestCount ?? 0} tests</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Execution Time</div>
                  <div className="text-sm font-black text-white">{currentSubmission.timeConsumedMillis ?? 0} ms</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Memory</div>
                  <div className="text-sm font-black text-white">
                    {Math.round((currentSubmission.memoryConsumedBytes ?? 0) / 1024)} KB
                  </div>
                </div>
              </div>

              {!isOk && onOpenAutopsy && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenAutopsy(code, currentSubmission.verdict || 'WRONG_ANSWER', problem)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all cursor-pointer shadow-md"
                  >
                    Analyze in Mistake Notebook 🔬
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Live Judge Terminal Log */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Codeforces Judge Logs
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {isPolling ? 'Watching stream...' : 'Stream paused'}
              </span>
            </div>

            <div
              ref={logContainerRef}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 h-44 overflow-y-auto space-y-1 shadow-inner"
            >
              {logs.length === 0 ? (
                <p className="text-slate-500 italic">Awaiting submission events...</p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.includes('ACCEPTED') || log.includes('Final Verdict: OK')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('Rejected') || log.includes('WRONG_ANSWER')
                        ? 'text-rose-400 font-bold'
                        : log.includes('Testing on test')
                        ? 'text-amber-300'
                        : log.includes('Detected') || log.includes('📡')
                        ? 'text-cyan-300 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
              {isPolling && (
                <div className="flex items-center gap-1 text-slate-500 text-[11px] pt-1">
                  <span className="inline-block animate-pulse">▍</span>
                  <span>polling Codeforces judge status...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Powered by official Codeforces Telemetry
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
