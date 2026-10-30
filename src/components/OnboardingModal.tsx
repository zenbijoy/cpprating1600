import React, { useState } from 'react';
import {
  CheckCircleIcon,
  TimerIcon,
  CodingBracketsIcon,
  StreakIcon,
  ChevronRightIcon,
  BackIcon,
  SearchIcon,
  WarningStatusIcon,
  ShieldIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
} from './icons';
import { BrandLogo } from './BrandLogo';
import { ProgrammingLanguage, SkillLevel, UserGoal, UserProfile } from '../types';
import { codeforcesService } from '../services/codeforces';
import { authService } from '../services/supabase';
import { CF_HANDLE_REGEX } from '../utils/codeforcesValidation';
import { MountainSummitHero } from './assets';
import { MathText } from './MathText';

interface OnboardingModalProps {
  initialGoal: UserGoal;
  initialProfile: UserProfile;
  onComplete: (goal: UserGoal, profile: UserProfile) => void;
  onSkip?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialGoal,
  initialProfile,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<number>(1);
  const [goal, setGoal] = useState<UserGoal>(initialGoal);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  // CF handle verification state
  const [cfInput, setCfInput] = useState<string>(profile.cfHandle || '');
  const [verifyingCf, setVerifyingCf] = useState<boolean>(false);
  const [cfError, setCfError] = useState<string | null>(null);
  const [cfSuccess, setCfSuccess] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string>('');
  const [challengeCode, setChallengeCode] = useState<string>('');
  const [showChallengeInstructions, setShowChallengeInstructions] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Diagnostic question answers
  const [diagnosticScore, setDiagnosticScore] = useState<number>(0);
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);

  const handleInitiateVerification = async () => {
    const trimmed = cfInput.trim();
    if (!trimmed) {
      setCfError('Please enter a Codeforces handle.');
      return;
    }
    if (!CF_HANDLE_REGEX.test(trimmed)) {
      setCfError('Codeforces handle may only contain letters, digits, underscores, hyphens, and dots (3-24 chars).');
      return;
    }

    setVerifyingCf(true);
    setCfError(null);
    setCfSuccess(null);

    try {
      const token = await authService.getAccessToken();
      if (token) {
        const res = await authService.initiateCfVerification(trimmed);
        setChallengeId(res.challengeId);
        setChallengeCode(res.challengeCode);
        setShowChallengeInstructions(true);
      } else {
        const user = await codeforcesService.getUserInfo(trimmed);
        setProfile((prev) => ({
          ...prev,
          cfHandle: user.handle,
          verifiedCfRating: user.rating,
          maxCfRating: user.maxRating,
          rank: user.rank,
          avatar: user.avatar,
        }));
        setCfSuccess(`Profile located for ${user.handle} (Guest mode: sign in with Google for official verification).`);
      }
    } catch (err: any) {
      setCfError(err.message || 'Could not verify handle on Codeforces.');
    } finally {
      setVerifyingCf(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!challengeId) return;
    setVerifyingCf(true);
    setCfError(null);

    try {
      const res = await authService.confirmCfVerification(challengeId);
      setProfile((prev) => ({
        ...prev,
        cfHandle: res.handle,
        verifiedCfRating: res.rating,
        rank: res.rank,
        avatar: res.avatar,
      }));
      setCfSuccess(`Ownership verified for ${res.handle}! Rating: ${res.rating || 'Unrated'}`);
      setShowChallengeInstructions(false);
    } catch (err: any) {
      setCfError(err.message || 'Verification check failed.');
    } finally {
      setVerifyingCf(false);
    }
  };

  const checkDiagnostic = () => {
    let score = 0;
    if (q1 === 'b') score++; // O(N)
    if (q2 === 'c') score++; // 2*10^9
    if (q3 === 'a') score++; // int vs long long
    setDiagnosticScore(score);
    setStep(6);
  };

  const handleFinish = () => {
    onComplete(
      {
        ...goal,
        currentDay: 1,
        currentPhase: 1,
      },
      {
        ...profile,
        onboardingCompleted: true,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto safe-area-overlay">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <BrandLogo size="md" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Step {step} of 6</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-5 rounded-full transition-colors ${
                    s === step ? 'bg-cyan-400' : s < step ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* STEP 1: Goal & Duration */}
        {step === 1 && (
          <div className="space-y-4">
            <MountainSummitHero compact={true} targetRating={goal.targetRating} currentRating={profile.verifiedCfRating || 800} />

            <div>
              <h2 className="text-xl font-bold text-white">Your Competitive Programming Goal</h2>
              <p className="text-sm text-slate-400 mt-1">
                Customize your target rating and timeframe to generate a tailored daily training roadmap.
              </p>
            </div>

            {/* Target Rating Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Target Rating Goal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { rating: 1200, label: '1200 (Pupil)', desc: 'Div.2 A/B mastery' },
                  { rating: 1400, label: '1400 (Pupil+)', desc: 'Greedy & Prefix Sums' },
                  { rating: 1600, label: '1600 (Specialist)', desc: 'Recommended Target' },
                  { rating: 1800, label: '1800 (Expert)', desc: 'Div.2 C/D & Trees' },
                ].map((item) => (
                  <button
                    key={item.rating}
                    type="button"
                    onClick={() => setGoal({ ...goal, targetRating: item.rating })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      goal.targetRating === item.rating
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Roadmap Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Roadmap Duration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { days: 60, label: '60 Days', desc: 'Accelerated Sprint' },
                  { days: 90, label: '90 Days', desc: 'Quarterly Bootcamp' },
                  { days: 180, label: '180 Days', desc: 'Standard 26 Weeks' },
                  { days: 365, label: '365 Days', desc: '1-Year Marathon' },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setGoal({ ...goal, totalDays: item.days })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      goal.totalDays === item.days
                        ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Current Starting Level
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  {
                    id: 'complete_beginner' as SkillLevel,
                    title: 'Complete Beginner',
                    desc: 'New to competitive programming, knows basic syntax or starting from scratch.',
                  },
                  {
                    id: 'some_experience' as SkillLevel,
                    title: 'Some Coding Experience',
                    desc: 'Comfortable with basic arrays and loops; want algorithmic rigor.',
                  },
                  {
                    id: 'experienced_coder' as SkillLevel,
                    title: 'Rated Solver (< 1200)',
                    desc: 'Has an active Codeforces account; stuck at Pupil/Newbie rating.',
                  },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setGoal({ ...goal, baselineLevel: lvl.id })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      goal.baselineLevel === lvl.id
                        ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-sm">{lvl.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Time Commitment & Availability */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Daily Time Availability</h2>
              <p className="text-sm text-slate-400 mt-1">
                Honest consistency beats occasional marathons. Pick a realistic time budget you can uphold on university weekdays.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daily Practice Budget
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[20, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setGoal({ ...goal, dailyMinutes: mins })}
                    className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      goal.dailyMinutes === mins
                        ? 'border-cyan-500 bg-cyan-950/40 text-white font-bold ring-1 ring-cyan-500'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TimerIcon size={16} semantic="primary" className="mx-auto mb-1" />
                    <div className="text-sm">{mins} min</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Preferred Practice Time Window
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { time: '08:00', label: 'Morning (08:00)' },
                  { time: '17:00', label: 'Evening (17:00)' },
                  { time: '21:00', label: 'Night (21:00)' },
                ].map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setGoal({ ...goal, preferredHour: slot.time })}
                    className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      goal.preferredHour === slot.time
                        ? 'border-indigo-500 bg-indigo-600/20 text-white font-medium'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <input
                type="checkbox"
                id="examWeeks"
                checked={goal.examWeeksActive}
                onChange={(e) => setGoal({ ...goal, examWeeksActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="examWeeks" className="text-xs text-slate-300">
                <span className="font-semibold text-white">University Exam Weeks Mode:</span> Automatically activates Low-Energy Minimum Mode when exams approach so your streak never collapses.
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Programming Language */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Primary Programming Language</h2>
              <p className="text-sm text-slate-400 mt-1">
                Stick to one primary language. Switching languages frequently delays pattern recognition.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'javascript' as ProgrammingLanguage,
                  name: 'JavaScript / TypeScript',
                  badge: 'Full-Stack & Web',
                  desc: 'High-speed V8 runtime, native Map/Set, arrays, and seamless execution in both web and Node.js environments.',
                },
                {
                  id: 'python' as ProgrammingLanguage,
                  name: 'Python 3 / PyPy3',
                  badge: 'Rapid Prototyping',
                  desc: 'Clean syntax and native arbitrary-precision integers. Requires attention to recursion depth and constant factor I/O speed.',
                },
                {
                  id: 'cpp20' as ProgrammingLanguage,
                  name: 'C++20 (Recommended for Codeforces)',
                  badge: 'Standard & Fastest',
                  desc: 'Standard in competitive programming. Zero runtime overhead, fast standard library (std::sort, std::vector, std::map, bitset), extensive tutorial support.',
                },
                {
                  id: 'java' as ProgrammingLanguage,
                  name: 'Java (LTS)',
                  badge: 'Enterprise & ICPC',
                  desc: 'Strong typing, rich Collections Framework, BigInteger, and cross-platform JVM competitive runtime.',
                },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, preferredLanguage: lang.id })}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    profile.preferredLanguage === lang.id
                      ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500 text-white'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <CodingBracketsIcon size={16} semantic="primary" />
                      {lang.name}
                    </div>
                    <span className="text-[10px] font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5">
                      {lang.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{lang.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Codeforces Account Integration */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Connect Your Codeforces Profile</h2>
              <p className="text-sm text-slate-400 mt-1">
                We use the official Codeforces public API with cryptographic challenge tokens to verify genuine account ownership. No passwords required.
              </p>
            </div>

            {!showChallengeInstructions ? (
              <div className="space-y-3">
                <label htmlFor="cfHandleInput" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Codeforces Handle (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    id="cfHandleInput"
                    type="text"
                    placeholder="e.g. tourist, Errichto, or your handle"
                    value={cfInput}
                    onChange={(e) => setCfInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInitiateVerification()}
                    disabled={verifyingCf}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleInitiateVerification}
                    disabled={verifyingCf || !cfInput.trim()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer"
                  >
                    {verifyingCf ? (
                      <span>Checking...</span>
                    ) : (
                      <>
                        <SearchIcon size={16} />
                        <span>Verify Handle</span>
                      </>
                    )}
                  </button>
                </div>

                {cfSuccess && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
                    <CheckCircleIcon size={16} className="shrink-0" />
                    <span>{cfSuccess}</span>
                  </div>
                )}

                {cfError && (
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-400 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50">
                    <WarningStatusIcon size={16} className="shrink-0" />
                    <span>{cfError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/50 text-xs text-slate-400 space-y-1">
                  <div className="font-medium text-slate-300 flex items-center gap-1.5">
                    <ShieldIcon size={16} semantic="primary" />
                    <span>Don't have a Codeforces handle yet?</span>
                  </div>
                  <p>
                    You can register for free at{' '}
                    <a href="https://codeforces.com/register" target="_blank" rel="noreferrer" className="text-cyan-400 underline">
                      codeforces.com/register
                    </a>{' '}
                    or skip this step now and link it anytime from Settings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/40 p-4 space-y-2">
                  <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                    Single-Use Verification Code
                  </span>
                  <div className="flex items-center justify-between gap-3 bg-slate-950 border border-indigo-700/50 rounded-xl p-3">
                    <code className="text-base font-mono font-bold tracking-wider text-amber-300">
                      {challengeCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(challengeCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <CheckIcon size={14} className="text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon size={14} />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 text-xs text-slate-300">
                  <h4 className="font-bold text-white">How to verify ownership:</h4>
                  <ol className="space-y-1.5 list-decimal pl-4 text-slate-300">
                    <li>
                      Open{' '}
                      <a
                        href="https://codeforces.com/settings/social"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>codeforces.com/settings/social</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                    </li>
                    <li>
                      Paste <code className="text-amber-300 font-mono bg-slate-900 px-1 py-0.5 rounded">{challengeCode}</code> into your First Name, Last Name, or Organization field.
                    </li>
                    <li>Click "Save changes" on Codeforces.</li>
                    <li>Click "Verify Ownership Now" below.</li>
                  </ol>
                </div>

                {cfError && (
                  <div className="flex items-start gap-2 text-xs font-medium text-rose-400 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50">
                    <WarningStatusIcon size={16} className="shrink-0 mt-0.5" />
                    <span>{cfError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChallengeInstructions(false);
                      setCfError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Change Handle
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmVerification}
                    disabled={verifyingCf}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    {verifyingCf ? (
                      <span>Verifying on Codeforces...</span>
                    ) : (
                      <>
                        <CheckCircleIcon size={16} />
                        <span>Verify Ownership Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Baseline Diagnostic Check */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Baseline Diagnostic Check</h2>
              <p className="text-sm text-slate-400 mt-1">
                3 quick questions to gauge your time complexity and integer limits awareness. No penalty for wrong answers!
              </p>
            </div>

            <div className="space-y-4">
              {/* Question 1 */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                <div className="text-xs font-bold text-cyan-400">Q1. Time Limit Intuition</div>
                <p className="text-xs text-slate-300">
                  <MathText text="A problem has $N \le 10^5$ and a 1.0 second limit. Which time complexity will safely pass?" />
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setQ1('a')}
                    className={`p-2 rounded-lg border text-left cursor-pointer flex items-center gap-1.5 ${
                      q1 === 'a' ? 'border-indigo-500 bg-indigo-950/50 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>A.</span>
                    <MathText text="$O(N^2)$" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ1('b')}
                    className={`p-2 rounded-lg border text-left cursor-pointer flex items-center gap-1.5 ${
                      q1 === 'b' ? 'border-indigo-500 bg-indigo-950/50 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>B.</span>
                    <MathText text="$O(N)$ or $O(N \log N)$" />
                  </button>
                </div>
              </div>

              {/* Question 2 */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                <div className="text-xs font-bold text-cyan-400">Q2. Integer Overflow</div>
                <p className="text-xs text-slate-300 flex items-center gap-1 flex-wrap">
                  <span>In C++, a standard signed 32-bit</span>
                  <code className="text-amber-300">int</code>
                  <span>can safely store values up to approximately:</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setQ2('a')}
                    className={`p-2 rounded-lg border text-left cursor-pointer flex items-center gap-1.5 ${
                      q2 === 'a' ? 'border-indigo-500 bg-indigo-950/50 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>A.</span>
                    <MathText text="$10^6$" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ2('c')}
                    className={`p-2 rounded-lg border text-left cursor-pointer flex items-center gap-1.5 ${
                      q2 === 'c' ? 'border-indigo-500 bg-indigo-950/50 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>B.</span>
                    <MathText text="$\approx 2 \times 10^9$" />
                  </button>
                </div>
              </div>

              {/* Question 3 */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                <div className="text-xs font-bold text-cyan-400">Q3. Prefix Sums Principle</div>
                <p className="text-xs text-slate-300">
                  <MathText text="What is the main benefit of computing prefix sums on an array?" />
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setQ3('a')}
                    className={`p-2 rounded-lg border text-left cursor-pointer flex items-center gap-1.5 ${
                      q3 === 'a' ? 'border-indigo-500 bg-indigo-950/50 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>A.</span>
                    <MathText text="Range sum queries in $O(1)$ time" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ3('b')}
                    className={`p-2 rounded-lg border text-left cursor-pointer flex items-center gap-1.5 ${
                      q3 === 'b' ? 'border-indigo-500 bg-indigo-950/50 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>B.</span>
                    <span>Sorts the array automatically</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Personal Learning Agreement */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Personal Learning Agreement</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Your personalized {goal.totalDays}-day journey to rating {goal.targetRating} is configured.
                </p>
              </div>
              <div className="shrink-0 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Goal Configured</div>
                <div className="text-lg font-black text-white">{goal.targetRating} Rating</div>
                <div className="text-[11px] text-cyan-300 font-mono">{goal.totalDays} Days ({Math.round(goal.totalDays / 7)}w)</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-900/60 bg-gradient-to-r from-indigo-950/50 to-slate-900 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <StreakIcon size={16} semantic="warning" />
                <span>First 7 Days Milestone</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Days 1–4:</strong> Fast I/O, variables, integer limits, and basic math (Watermelon, Team, Way Too Long Words)</li>
                <li><strong className="text-white">Days 5–7:</strong> Frequency counting with 26-char arrays and strings (Bit++, Petya and Strings, Boy or Girl)</li>
                <li><strong className="text-white">Day 7 Review:</strong> 1st weekly debrief with the AI Coach</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label htmlFor="personalReason" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Why I Started (Shown during tough sessions)
              </label>
              <textarea
                id="personalReason"
                rows={2}
                value={goal.personalMotivation}
                onChange={(e) => setGoal({ ...goal, personalMotivation: e.target.value })}
                placeholder="e.g. Master algorithms for top tech placements, compete in ICPC, or build problem-solving intuition..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <CheckCircleIcon size={16} semantic="success" className="shrink-0" />
              <span>
                Minimum commitment: On hard days, completing a 5-minute Minimum Mode session counts as a recovery action. Never guilt yourself.
              </span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <BackIcon size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip Onboarding
                </button>
              )}
            </div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRightIcon size={16} />
            </button>
          ) : step === 5 ? (
            <button
              type="button"
              onClick={checkDiagnostic}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <span>Complete Assessment</span>
              <ChevronRightIcon size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Start Day 1 Training</span>
              <StreakIcon size={16} semantic="warning" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
