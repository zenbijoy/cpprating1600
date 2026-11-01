import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrophyIcon,
  RunCodeIcon,
  TimerIcon,
  WarningStatusIcon,
  ExternalLinkIcon,
  TerminalIcon,
  CheckIcon,
  SearchIcon,
  CloseIcon,
  CheckCircleIcon,
  AISparkleIcon,
  ChevronRightIcon,
  CopyIcon,
  BookmarkIcon,
  FlameIcon,
  SparklesIcon,
  RotateCcwIcon,
  ZapIcon,
} from './icons';
import { useToast } from './Toast';
import { CFProblem, MistakeRecord } from '../types';
import { CFContest, codeforcesService } from '../services/codeforces';
import { storageService } from '../services/storage';
import { soundEffects } from '../utils/soundEffects';
import { fireConfettiBurst } from '../utils/confetti';
import {
  ArenaContestItem,
  ContestPlatform,
  CURATED_CONTESTS_DATASET,
  FUNNY_CP_QUOTES,
  FUNNY_EXCUSES,
} from '../data/contestsDataset';
import {
  ContestDivision,
  ContestSessionMode,
  VirtualContestState,
  ContestProblemState,
  calculateContestPenalty,
  estimatePerformanceRating,
  generateContestDebrief,
  generateMidContestAdvice,
  generatePreContestChecklist,
  recordContestSubmission,
  finalizeVirtualContest,
  generateLocalStandings,
} from '../utils/virtualContest';

interface VirtualContestArenaViewProps {
  onSelectProblem: (problem: CFProblem) => void;
  onOpenWorkspace?: (problem: CFProblem) => void;
  mistakes?: MistakeRecord[];
  userRating?: number;
}

type HumorMode = 'gigachad' | 'clown' | 'zen';

export const VirtualContestArenaView: React.FC<VirtualContestArenaViewProps> = ({
  onSelectProblem,
  onOpenWorkspace,
  mistakes = [],
  userRating = 1000,
}) => {
  const toast = useToast();

  // All contests pool (curated + dynamically fetched live contests)
  const [allContests, setAllContests] = useState<ArenaContestItem[]>(CURATED_CONTESTS_DATASET);
  const [loadingLiveContests, setLoadingLiveContests] = useState<boolean>(false);
  const [liveContestsPage, setLiveContestsPage] = useState<number>(1);

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<ContestPlatform | 'All' | 'Favorites'>('All');
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'target1600' | 'problems' | 'easiest' | 'hardest'>('newest');

  // Bookmarked contests
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('climb1600_bookmarked_contests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Humor mode
  const [humorMode, setHumorMode] = useState<HumorMode>(() => {
    try {
      return (localStorage.getItem('climb1600_humor_mode') as HumorMode) || 'gigachad';
    } catch {
      return 'gigachad';
    }
  });

  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.isMuted());
  const [showCuteSoundboard, setShowCuteSoundboard] = useState<boolean>(false);

  // Random Meme Quote of the moment
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [activeExcuse, setActiveExcuse] = useState<string | null>(null);

  // Roulette Spinning Wheel state
  const [isSpinningRoulette, setIsSpinningRoulette] = useState<boolean>(false);
  const [rouletteCandidate, setRouletteCandidate] = useState<ArenaContestItem | null>(null);
  const [showRouletteModal, setShowRouletteModal] = useState<boolean>(false);

  // Quick Peek Contest Modal
  const [previewContest, setPreviewContest] = useState<ArenaContestItem | null>(null);

  // Pre-Contest Config Modal
  const [activeContestId, setActiveContestId] = useState<number>(CURATED_CONTESTS_DATASET[0].id);
  const [showPreContestBriefing, setShowPreContestBriefing] = useState<boolean>(false);
  const [sessionMode, setSessionMode] = useState<ContestSessionMode>('simulated');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(120);

  // Active Contest Simulation State
  const [contestState, setContestState] = useState<VirtualContestState | null>(null);
  const [activeProblemIndex, setActiveProblemIndex] = useState<string>('A');
  const [timeSpentOnActiveProblem, setTimeSpentOnActiveProblem] = useState<number>(0);
  const [showDebrief, setShowDebrief] = useState<boolean>(false);
  const [activeArenaTab, setActiveArenaTab] = useState<'problems' | 'standings'>('problems');
  const [mobileArenaPane, setMobileArenaPane] = useState<'list' | 'solver'>('solver');

  // Save Bookmarks
  const toggleBookmark = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) => {
      const willBeSaved = !prev.includes(id);
      if (willBeSaved) {
        soundEffects.playStarCollect();
      } else {
        soundEffects.playBubblePop();
      }
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('climb1600_bookmarked_contests', JSON.stringify(updated));
      } catch {}
      toast.show(
        updated.includes(id) ? 'Contest saved to Favorites! ⭐' : 'Removed from Favorites',
        'info'
      );
      return updated;
    });
  };

  // Switch Humor Mode
  const handleSetHumorMode = (mode: HumorMode) => {
    setHumorMode(mode);
    if (mode === 'gigachad') {
      soundEffects.playFanfare();
    } else if (mode === 'clown') {
      soundEffects.playBoing();
    } else {
      soundEffects.playBobaSip();
    }
    try {
      localStorage.setItem('climb1600_humor_mode', mode);
    } catch {}
    const labels = {
      gigachad: '🗿 GigaChad Mode: Unshakeable confidence engaged!',
      clown: '🤡 Meme Mode: 1 min left, submit and pray!',
      zen: '🧘 Zen Mode: Pure analytical focus enabled.',
    };
    toast.show(labels[mode], 'success');
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    toast.show(muted ? 'Sound effects muted 🔇' : 'Sound effects enabled 🔊', 'info');
  };

  // Next Meme Quote
  const handleNextQuote = () => {
    soundEffects.playBubblePop();
    setCurrentQuoteIndex((i) => (i + 1) % FUNNY_CP_QUOTES.length);
  };

  // Generate CP Excuse
  const handleGenerateExcuse = () => {
    if (Math.random() > 0.5) {
      soundEffects.playSadPout();
    } else {
      soundEffects.playBoing();
    }
    const random = FUNNY_EXCUSES[Math.floor(Math.random() * FUNNY_EXCUSES.length)];
    setActiveExcuse(random);
  };

  // Roulette Wheel Action
  const handleSpinRoulette = () => {
    if (isSpinningRoulette) return;
    setIsSpinningRoulette(true);
    setShowRouletteModal(true);

    const candidates = filteredContests.length > 0 ? filteredContests : allContests;
    let spins = 0;
    const maxSpins = 18;
    const intervalTime = 80;

    const spinInterval = setInterval(() => {
      spins++;
      const randomIdx = Math.floor(Math.random() * candidates.length);
      const chosen = candidates[randomIdx];
      setRouletteCandidate(chosen);
      soundEffects.playRouletteTick(1 + (spins / maxSpins) * 0.5);

      if (spins >= maxSpins) {
        clearInterval(spinInterval);
        setIsSpinningRoulette(false);
        soundEffects.playConfettiPop();
        setTimeout(() => soundEffects.playLevelUpCute(), 120);
        fireConfettiBurst(1500);
      }
    }, intervalTime);
  };

  // Dynamic Live Codeforces Contests Fetcher
  const handleLoadMoreCodeforcesContests = async () => {
    if (loadingLiveContests) return;
    setLoadingLiveContests(true);
    soundEffects.playPop();
    toast.show('Fetching more past contests from official Codeforces API...', 'info');

    try {
      const allCf = await codeforcesService.getAllContests();
      // Filter finished contests with standard naming
      const finished = allCf.filter(
        (c) => c.phase === 'FINISHED' && (c.name.includes('Round') || c.name.includes('Educational'))
      );

      // Take a page of 20 contests not already in list
      const existingIds = new Set(allContests.map((c) => c.id));
      const newRounds = finished
        .filter((c) => !existingIds.has(c.id))
        .slice((liveContestsPage - 1) * 20, liveContestsPage * 20);

      if (newRounds.length === 0) {
        toast.show('All available Codeforces contests are already loaded!', 'info');
        setLoadingLiveContests(false);
        return;
      }

      // Convert to ArenaContestItem
      const formatted: ArenaContestItem[] = newRounds.map((c) => {
        let division: ContestDivision = 'Div. 3';
        if (c.name.includes('Div. 4')) division = 'Div. 4';
        else if (c.name.includes('Div. 2')) division = 'Div. 2';
        else if (c.name.includes('Educational')) division = 'Educational';
        else if (c.name.includes('Div. 1')) division = 'Div. 1 + Div. 2';

        return {
          id: c.id,
          platform: 'Codeforces',
          name: c.name,
          division,
          problemCount: 6,
          durationMinutes: Math.round((c.durationSeconds || 7200) / 60),
          ratingTarget: 1600,
          dangerLevel: division === 'Div. 4' ? 'Chill Walk' : division === 'Div. 3' ? 'Spicy' : 'Keyboard Hazard',
          difficultyLabel: division === 'Div. 4' ? 'Beginner' : division === 'Div. 3' ? 'Intermediate' : 'Advanced',
          humorBadge: '🌐 LIVE SYNCED',
          memeQuote: `Round #${c.id}: Straight from Codeforces servers into your virtual arena.`,
          officialUrl: `https://codeforces.com/contest/${c.id}`,
          isLiveSynced: true,
          problems: [
            { contestId: c.id, index: 'A', name: `Problem ${c.id}A`, rating: 800, tags: ['implementation'] },
            { contestId: c.id, index: 'B', name: `Problem ${c.id}B`, rating: 1000, tags: ['math'] },
            { contestId: c.id, index: 'C', name: `Problem ${c.id}C`, rating: 1200, tags: ['greedy'] },
            { contestId: c.id, index: 'D', name: `Problem ${c.id}D`, rating: 1400, tags: ['binary search'] },
            { contestId: c.id, index: 'E', name: `Problem ${c.id}E`, rating: 1600, tags: ['dp'] },
            { contestId: c.id, index: 'F', name: `Problem ${c.id}F`, rating: 1900, tags: ['graphs'] },
          ],
        };
      });

      setAllContests((prev) => [...prev, ...formatted]);
      setLiveContestsPage((p) => p + 1);
      soundEffects.playAc();
      toast.show(`Loaded ${formatted.length} additional past contests from Codeforces! 🚀`, 'success');
    } catch (err: any) {
      toast.show('Could not fetch from Codeforces API. Check your internet connection.', 'error');
    } finally {
      setLoadingLiveContests(false);
    }
  };

  // Timer Tick
  useEffect(() => {
    if (!contestState || contestState.isPaused || contestState.isCompleted) return;

    const timer = setInterval(() => {
      setContestState((prev) => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          clearInterval(timer);
          soundEffects.playFanfare();
          const finalized = finalizeVirtualContest({ ...prev, secondsRemaining: 0 });
          storageService.saveVirtualContest(finalized);
          setShowDebrief(true);
          return finalized;
        }

        // TLE warning tone in the last 10 seconds
        if (prev.secondsRemaining === 11 || prev.secondsRemaining === 6) {
          soundEffects.playTle();
        }

        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });

      setTimeSpentOnActiveProblem((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [contestState?.isPaused, contestState?.isCompleted]);

  // Strategy Coach Advice Monitor
  const currentAdvice = useMemo(() => {
    if (!contestState || contestState.isCompleted) return null;
    const currentProb = contestState.problems.find(
      (p) => p.problem.index === activeProblemIndex
    );
    if (!currentProb || currentProb.status === 'solved') return null;

    const baseAdvice = generateMidContestAdvice(
      timeSpentOnActiveProblem,
      currentProb.attemptsCount,
      activeProblemIndex
    );

    if (!baseAdvice) return null;

    if (humorMode === 'gigachad') {
      return `🗿 GigaChad Coach: ${baseAdvice} Remember: you are not stuck, the problem setter was simply too cowardly to provide sample 3. Trace it now!`;
    } else if (humorMode === 'clown') {
      return `🤡 Panic Coach: ${baseAdvice} Codeforces servers are currently mocking your loop bounds! Grab water and check your N=1!`;
    }
    return baseAdvice;
  }, [contestState, activeProblemIndex, timeSpentOnActiveProblem, humorMode]);

  // Selected round lookup
  const selectedRound = useMemo(() => {
    return allContests.find((r) => r.id === activeContestId) || allContests[0];
  }, [activeContestId, allContests]);

  // Launch Virtual Contest Session
  const handleStartContest = () => {
    const round = selectedRound;
    soundEffects.playUwUHooray();
    fireConfettiBurst(1200);

    const initialProblems: ContestProblemState[] = round.problems.map((p) => ({
      problem: p,
      status: 'unattempted',
      attemptsCount: 0,
      penaltyMinutes: 0,
    }));

    const durationSeconds = sessionDurationMinutes * 60;

    const newContest: VirtualContestState = {
      id: `vc_${Date.now()}`,
      contestId: round.id,
      contestName: round.name,
      division: round.division,
      mode: sessionMode,
      durationSeconds,
      secondsRemaining: durationSeconds,
      isPaused: false,
      isCompleted: false,
      startedAt: new Date().toISOString(),
      hideTagsAndRatings: sessionMode === 'simulated',
      problems: initialProblems,
      strategyPrompts: [],
    };

    setContestState(newContest);
    setActiveProblemIndex(round.problems[0].index);
    setTimeSpentOnActiveProblem(0);
    setActiveArenaTab('problems');
    setShowPreContestBriefing(false);
    setShowDebrief(false);
    setShowRouletteModal(false);

    toast.show(`Contest "${round.name}" started! Clock is running. Good luck! 🚀`, 'success');
  };

  // Mark Problem As Solved
  const handleMarkProblemSolved = (index: string) => {
    if (!contestState) return;
    soundEffects.playLevelUpCute();
    fireConfettiBurst(2000);

    const cheers = [
      'GIGACHAD ACCEPTED! 🚀 Test cases obliterated!',
      'ACCEPTED! 🌟 Pure algorithmic dominance!',
      'GREEN VERDICT! 💚 Pretests had no chance!',
    ];
    toast.show(cheers[Math.floor(Math.random() * cheers.length)], 'success');

    const elapsedSeconds = contestState.durationSeconds - contestState.secondsRemaining;
    const updated = recordContestSubmission(contestState, index, 'OK', elapsedSeconds);
    setContestState(updated);
  };

  // Log Failed Attempt
  const handleLogFailedAttempt = (
    index: string,
    verdict: 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' = 'WRONG_ANSWER'
  ) => {
    if (!contestState) return;
    if (verdict === 'TIME_LIMIT_EXCEEDED') {
      soundEffects.playTle();
      toast.show('TIME LIMIT EXCEEDED! 💀 While (true) strikes again! +20 min penalty.', 'error');
    } else {
      soundEffects.playWa();
      toast.show('EMOTIONAL DAMAGE! 😭 Wrong Answer on pretest! +20 min penalty.', 'error');
    }

    const elapsedSeconds = contestState.durationSeconds - contestState.secondsRemaining;
    const updated = recordContestSubmission(contestState, index, verdict, elapsedSeconds);
    setContestState(updated);
  };

  // End Contest Manually
  const handleEndContest = () => {
    if (!contestState) return;
    soundEffects.playFanfare();
    const finalized = finalizeVirtualContest(contestState);
    setContestState(finalized);
    storageService.saveVirtualContest(finalized);
    setShowDebrief(true);
  };

  // Local Standings
  const localStandings = useMemo(() => {
    if (!contestState) return [];
    return generateLocalStandings(contestState, 'You');
  }, [contestState]);

  // Filtered & Sorted Rounds
  const filteredContests = useMemo(() => {
    return allContests
      .filter((r) => {
        // Platform filter
        if (selectedPlatform === 'Favorites') {
          if (!bookmarkedIds.includes(r.id)) return false;
        } else if (selectedPlatform !== 'All' && r.platform !== selectedPlatform) {
          return false;
        }

        // Division filter
        if (selectedDivision !== 'All' && r.division !== selectedDivision) {
          return false;
        }

        // Difficulty filter
        if (selectedDifficulty !== 'All' && r.difficultyLabel !== selectedDifficulty) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = r.name.toLowerCase().includes(q);
          const matchId = String(r.id).includes(q);
          const matchProblem = r.problems.some(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
          );
          if (!matchName && !matchId && !matchProblem) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.id - a.id;
        if (sortBy === 'problems') return b.problemCount - a.problemCount;
        if (sortBy === 'easiest') {
          const avgA = a.problems.reduce((s, p) => s + (p.rating || 1000), 0) / a.problems.length;
          const avgB = b.problems.reduce((s, p) => s + (p.rating || 1000), 0) / b.problems.length;
          return avgA - avgB;
        }
        if (sortBy === 'hardest') {
          const avgA = a.problems.reduce((s, p) => s + (p.rating || 1000), 0) / a.problems.length;
          const avgB = b.problems.reduce((s, p) => s + (p.rating || 1000), 0) / b.problems.length;
          return avgB - avgA;
        }
        // target1600: Div 3 and Div 4 first
        const score = (div: string) => (div === 'Div. 3' ? 2 : div === 'Div. 4' ? 1 : 0);
        return score(b.division) - score(a.division);
      });
  }, [allContests, selectedPlatform, selectedDivision, selectedDifficulty, searchQuery, sortBy, bookmarkedIds]);

  const preContestChecklist = useMemo(() => {
    return generatePreContestChecklist(selectedRound.division, mistakes);
  }, [selectedRound, mistakes]);

  // Active Problem
  const currentProblemState = useMemo(() => {
    if (!contestState) return null;
    return contestState.problems.find((p) => p.problem.index === activeProblemIndex) || contestState.problems[0];
  }, [contestState, activeProblemIndex]);

  // Scoring
  const contestScore = useMemo(() => {
    if (!contestState) return { solvedCount: 0, totalPenaltyMinutes: 0 };
    return calculateContestPenalty(contestState.problems);
  }, [contestState]);

  // Debrief
  const debriefData = useMemo(() => {
    if (!contestState) return null;
    return generateContestDebrief(contestState, userRating);
  }, [contestState, userRating]);

  // Time format helper
  const formatTimeRemaining = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to get card background and theme styles per platform & division
  const getCardTheme = (platform: ContestPlatform, division: ContestDivision) => {
    if (platform === 'LeetCode') {
      return {
        bg: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 dark:from-amber-950/40 dark:via-zinc-900/90 dark:to-orange-950/30',
        border: 'border-amber-400/50 dark:border-amber-500/30 hover:border-amber-500 dark:hover:border-amber-400/70',
        glow: 'hover:shadow-amber-500/15',
        badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
        platformPill: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40',
        accentText: 'text-amber-600 dark:text-amber-400',
        pattern: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 40%)',
      };
    }
    if (platform === 'AtCoder') {
      return {
        bg: 'bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-cyan-500/10 dark:from-teal-950/40 dark:via-slate-900/90 dark:to-cyan-950/30',
        border: 'border-teal-400/50 dark:border-teal-500/30 hover:border-teal-500 dark:hover:border-teal-400/70',
        glow: 'hover:shadow-teal-500/15',
        badge: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40',
        platformPill: 'bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/40',
        accentText: 'text-teal-600 dark:text-teal-400',
        pattern: 'radial-gradient(circle at 90% 10%, rgba(20, 184, 166, 0.08) 0%, transparent 40%)',
      };
    }
    // Codeforces
    if (division === 'Div. 4') {
      return {
        bg: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-teal-950/25',
        border: 'border-emerald-400/50 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-400/60',
        glow: 'hover:shadow-emerald-500/15',
        badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
        platformPill: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40',
        accentText: 'text-emerald-600 dark:text-emerald-400',
        pattern: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 40%)',
      };
    }
    if (division === 'Div. 3') {
      return {
        bg: 'bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-purple-500/10 dark:from-indigo-950/50 dark:via-slate-900/90 dark:to-purple-950/30',
        border: 'border-indigo-400/50 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-400/60',
        glow: 'hover:shadow-indigo-500/15',
        badge: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40',
        platformPill: 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40',
        accentText: 'text-indigo-600 dark:text-indigo-400',
        pattern: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.09) 0%, transparent 45%)',
      };
    }
    if (division === 'Div. 2') {
      return {
        bg: 'bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-rose-500/10 dark:from-purple-950/50 dark:via-slate-900/90 dark:to-rose-950/30',
        border: 'border-purple-400/50 dark:border-purple-500/30 hover:border-purple-500 dark:hover:border-purple-400/60',
        glow: 'hover:shadow-purple-500/15',
        badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40',
        platformPill: 'bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/40',
        accentText: 'text-purple-600 dark:text-purple-400',
        pattern: 'radial-gradient(circle at 50% 10%, rgba(168, 85, 247, 0.09) 0%, transparent 40%)',
      };
    }
    // Educational / Div 1
    return {
      bg: 'bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-amber-500/10 dark:from-violet-950/50 dark:via-slate-950/95 dark:to-amber-950/30',
      border: 'border-amber-400/50 dark:border-amber-500/30 hover:border-amber-500 dark:hover:border-amber-400/60',
      glow: 'hover:shadow-amber-500/15',
      badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
      platformPill: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40',
      accentText: 'text-amber-600 dark:text-amber-400',
      pattern: 'radial-gradient(circle at 30% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 40%)',
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* View Header with Sound & Humor Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400 shadow-md">
              <TrophyIcon size={22} semantic="warning" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Virtual Contest Arena
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 uppercase tracking-wider">
                  Meme Dojo & Multi-Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Practice past rounds from Codeforces, LeetCode & AtCoder under strict clock pressure, 20-min WA penalty, and live Strategy Coach.
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Sound, Humor Mode, and Active Contest Indicator */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 shadow-sm'
            }`}
            title={isMuted ? 'Unmute 8-Bit Arcade Sounds' : 'Mute Sound Effects'}
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
            <span className="text-[11px] font-semibold">{isMuted ? 'Muted' : 'Sound ON'}</span>
          </button>

          {/* Cute Soundboard Button */}
          <button
            onClick={() => {
              soundEffects.playSparkle();
              setShowCuteSoundboard(true);
            }}
            className="p-2 rounded-xl border border-pink-500/40 bg-pink-950/40 text-pink-300 hover:bg-pink-900/60 hover:text-pink-100 text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Open Kawaii Cute Audio Soundboard (12 cute sounds!)"
          >
            <span className="animate-bounce-subtle">🎵</span>
            <span className="text-[11px] font-bold">Cute SFX</span>
          </button>

          {/* Humor / Vibe Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => handleSetHumorMode('gigachad')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                humorMode === 'gigachad'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="GigaChad Mode: Unshakeable confidence"
            >
              <span>🗿</span>
              <span className="hidden sm:inline">GigaChad</span>
            </button>
            <button
              onClick={() => handleSetHumorMode('clown')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                humorMode === 'clown'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Meme / Panic Mode: 1 min left, submit and pray!"
            >
              <span>🤡</span>
              <span className="hidden sm:inline">Meme</span>
            </button>
            <button
              onClick={() => handleSetHumorMode('zen')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                humorMode === 'zen'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zen Focus Mode: Serene competitive mindset"
            >
              <span>🧘</span>
              <span className="hidden sm:inline">Zen</span>
            </button>
          </div>

          {/* Active Contest Pill if running */}
          {contestState && !contestState.isCompleted && (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  contestState.secondsRemaining <= 300
                    ? 'bg-rose-950/80 border-rose-500 shadow-md shadow-rose-500/20 text-rose-200 animate-pulse'
                    : contestState.secondsRemaining <= 600
                    ? 'bg-amber-950/80 border-amber-500 shadow-sm shadow-amber-500/20 text-amber-200'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                <TimerIcon
                  size={16}
                  semantic={
                    contestState.secondsRemaining <= 300
                      ? 'error'
                      : contestState.secondsRemaining <= 600
                      ? 'warning'
                      : 'primary'
                  }
                />
                <span className="font-mono font-bold text-xs">
                  {formatTimeRemaining(contestState.secondsRemaining)}
                </span>
                {contestState.secondsRemaining <= 300 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white uppercase">
                    5m Left
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  soundEffects.playPop();
                  setContestState((prev) => (prev ? { ...prev, isPaused: !prev.isPaused } : null));
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title={contestState.isPaused ? 'Resume Contest' : 'Pause Contest'}
              >
                {contestState.isPaused ? <RunCodeIcon size={16} /> : <TimerIcon size={16} />}
              </button>

              <button
                onClick={handleEndContest}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-md"
              >
                Finish & Debrief
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE CONTEST WORKSPACE (If session is running) */}
      {contestState && !contestState.isCompleted ? (
        <div className="space-y-4">
          {/* Strategy Coach Alert Banner if triggered */}
          {currentAdvice && (
            <div className="p-4 rounded-2xl border border-amber-700/80 bg-gradient-to-r from-amber-950/60 to-slate-900/80 space-y-1 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <WarningStatusIcon size={16} semantic="warning" />
                <span>Strategy Coach Alert</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">{currentAdvice}</p>
            </div>
          )}

          {/* Arena Navigation Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => {
                  soundEffects.playPop();
                  setActiveArenaTab('problems');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeArenaTab === 'problems'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Problems & Submissions
              </button>
              <button
                onClick={() => {
                  soundEffects.playPop();
                  setActiveArenaTab('standings');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeArenaTab === 'standings'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrophyIcon size={14} />
                <span>Scoreboard ({contestScore.solvedCount} AC)</span>
              </button>
            </div>
          </div>

          {activeArenaTab === 'standings' ? (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrophyIcon size={16} semantic="warning" />
                    <span>Live Contest Scoreboard</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ranked by problems solved (descending), then penalty minutes (ascending).
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Round #{contestState.contestId} · {contestState.division}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3 font-semibold w-12">#</th>
                      <th className="py-2.5 px-3 font-semibold">Contestant</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-20">Solved</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-24">Penalty</th>
                      {contestState.problems.map((p) => (
                        <th key={p.problem.index} className="py-2.5 px-2 font-mono text-center w-20">
                          {p.problem.index}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {localStandings.map((row) => (
                      <tr
                        key={row.handle}
                        className={`${
                          row.isCurrentUser
                            ? 'bg-indigo-950/40 font-bold border-l-2 border-indigo-500'
                            : 'hover:bg-slate-800/20'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-400">{row.rank}</td>
                        <td className="py-2.5 px-3">
                          <span className={row.isCurrentUser ? 'text-indigo-300 font-bold' : 'text-slate-300'}>
                            {row.handle} {row.isCurrentUser && '(You)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">
                          {row.solvedCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {row.totalPenaltyMinutes}m
                        </td>
                        {contestState.problems.map((p) => {
                          const pStat = row.problemStatuses[p.problem.index];
                          return (
                            <td key={p.problem.index} className="py-2 px-2 text-center font-mono">
                              {pStat ? (
                                pStat.solved ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-300">
                                    +{pStat.attempts > 1 ? pStat.attempts - 1 : ''}
                                    {pStat.solveTimeMin !== undefined ? ` (${pStat.solveTimeMin}m)` : ''}
                                  </span>
                                ) : pStat.attempts > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-[10px] text-rose-300">
                                    -{pStat.attempts}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">·</span>
                                )
                              ) : (
                                <span className="text-slate-600">·</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              {/* Mobile switcher */}
              <div className="lg:hidden flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 gap-1 mb-3">
                <button
                  onClick={() => setMobileArenaPane('list')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    mobileArenaPane === 'list'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Problem Set ({contestScore.solvedCount}/{contestState.problems.length} AC)
                </button>
                <button
                  onClick={() => setMobileArenaPane('solver')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    mobileArenaPane === 'solver'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Solving Problem {activeProblemIndex}
                </button>
              </div>

              {/* Arena Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Problems List */}
                <div className={`lg:col-span-4 space-y-4 ${mobileArenaPane !== 'list' ? 'hidden lg:block' : 'block'}`}>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">{contestState.contestName}</h3>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {contestState.division} · {contestState.mode} mode
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {contestScore.solvedCount} AC
                        </span>
                        <p className="text-[10px] text-slate-500">{contestScore.totalPenaltyMinutes}m penalty</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {contestState.problems.map((p) => {
                        const isCurrent = p.problem.index === activeProblemIndex;
                        const isSolved = p.status === 'solved';
                        const isFailed = p.status === 'failed';

                        return (
                          <div
                            key={p.problem.index}
                            onClick={() => {
                              soundEffects.playPop();
                              setActiveProblemIndex(p.problem.index);
                              setTimeSpentOnActiveProblem(0);
                              setMobileArenaPane('solver');
                            }}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isCurrent
                                ? 'border-indigo-500 bg-indigo-950/60 shadow-md ring-1 ring-indigo-500/30'
                                : isSolved
                                ? 'border-emerald-800/60 bg-emerald-950/30 hover:border-emerald-700'
                                : isFailed
                                ? 'border-red-800/60 bg-red-950/30 hover:border-red-700'
                                : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 font-mono font-bold flex items-center justify-center shrink-0">
                                {p.problem.index}
                              </span>
                              <div className="truncate">
                                <h4 className="font-semibold text-slate-200 truncate">
                                  {p.problem.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  {p.attemptsCount > 0 && (
                                    <span>
                                      {p.attemptsCount} attempt{p.attemptsCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {isSolved && p.solvedTimeSeconds && (
                                    <span className="text-emerald-400">
                                      at {Math.floor(p.solvedTimeSeconds / 60)}m
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isSolved ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[10px]">
                                  +AC
                                </span>
                              ) : isFailed ? (
                                <span className="px-2 py-0.5 rounded-md bg-red-950 border border-red-800 text-red-300 font-bold text-[10px]">
                                  -{p.attemptsCount}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono text-[11px]">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Active Problem Solver */}
                {currentProblemState && (
                  <div className={`lg:col-span-8 space-y-4 ${mobileArenaPane !== 'solver' ? 'hidden lg:block' : 'block'}`}>
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-lg text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-xl">
                            {currentProblemState.problem.index}
                          </span>
                          <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {currentProblemState.problem.name}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>Contest {contestState.contestId}</span>
                              {!contestState.hideTagsAndRatings && currentProblemState.problem.rating && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-400 font-semibold">
                                    ⚡ Rating {currentProblemState.problem.rating}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://codeforces.com/contest/${contestState.contestId}/problem/${currentProblemState.problem.index}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                          >
                            <span>Official Statement</span>
                            <ExternalLinkIcon size={14} />
                          </a>

                          {onOpenWorkspace && (
                            <button
                              onClick={() => {
                                soundEffects.playPop();
                                onOpenWorkspace(currentProblemState.problem);
                              }}
                              className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all cursor-pointer"
                            >
                              <TerminalIcon size={14} />
                              <span>Code in Workspace</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Submission Result Controller */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Submit Verdict on Problem {currentProblemState.problem.index}
                        </span>

                        <p className="text-xs text-slate-400">
                          Write your code in the Debugging Workspace or online judge, then record your verdict to update contest standings:
                        </p>

                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <button
                            onClick={() => handleMarkProblemSolved(currentProblemState.problem.index)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                          >
                            <CheckIcon size={16} semantic="success" />
                            <span>Accepted (AC) 🎉</span>
                          </button>

                          <button
                            onClick={() => handleLogFailedAttempt(currentProblemState.problem.index, 'WRONG_ANSWER')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <span>Wrong Answer (WA) 😭</span>
                          </button>

                          <button
                            onClick={() => handleLogFailedAttempt(currentProblemState.problem.index, 'TIME_LIMIT_EXCEEDED')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <span>Time Limit (TLE) 💀</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CONTEST BROWSER & ARENA DASHBOARD */
        <div className="space-y-6">
          {/* High Energy Vibrant Interactive Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #09061a 0%, #170d30 50%, #050914 100%)',
              borderColor: 'rgba(99, 102, 241, 0.35)',
            }}
            className="relative overflow-hidden rounded-3xl border p-6 sm:p-7 shadow-2xl text-white keep-white"
          >
            {/* Background ambient decorative shapes */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/10 to-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <FlameIcon size={14} />
                  <span>Competitive Arena · Multi-Platform Dojo</span>
                </div>

                <h2
                  style={{ color: '#ffffff' }}
                  className="text-2xl sm:text-3xl font-black tracking-tight leading-tight"
                >
                  Simulate Real Contests <br />
                  <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                    Under Live Pressure
                  </span>
                </h2>

                <p
                  style={{ color: '#cbd5e1' }}
                  className="text-xs sm:text-sm leading-relaxed max-w-xl"
                >
                  Simulate past Codeforces rounds, LeetCode weekly contests, and AtCoder beginner rounds. Practice with strict timers, real WA penalties, and Strategy Coach interventions. Zero rating loss excuses!
                </p>

                {/* Interactive Meme Ticker & Excuse Button */}
                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleSpinRoulette}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>🎲</span>
                    <span>Spin Contest Roulette (YOLO)</span>
                  </button>

                  <button
                    onClick={handleGenerateExcuse}
                    style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.85)',
                      color: '#f1f5f9',
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer hover:bg-slate-700"
                  >
                    <span>🤡</span>
                    <span>Generate CP Excuse</span>
                  </button>

                  <button
                    onClick={handleNextQuote}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      color: '#cbd5e1',
                      borderColor: 'rgba(148, 163, 184, 0.2)',
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs transition-colors cursor-pointer hover:text-white"
                    title="Click for another meme quote"
                  >
                    <RotateCcwIcon size={13} />
                    <span className="italic truncate max-w-xs sm:max-w-sm">
                      "{FUNNY_CP_QUOTES[currentQuoteIndex]}"
                    </span>
                  </button>
                </div>

                {activeExcuse && (
                  <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700/60 text-xs text-rose-100 flex items-center justify-between gap-2 animate-fade-in shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📢</span>
                      <span><strong>Official Excuse:</strong> {activeExcuse}</span>
                    </div>
                    <button
                      onClick={() => setActiveExcuse(null)}
                      className="text-rose-300 hover:text-white p-1 cursor-pointer"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stat Counters Column */}
              <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2.5">
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                  className="p-3.5 rounded-2xl border backdrop-blur-sm flex items-center justify-between"
                >
                  <div>
                    <span
                      style={{ color: '#94a3b8' }}
                      className="text-[10px] uppercase font-bold tracking-wider"
                    >
                      Available Contests
                    </span>
                    <p
                      style={{ color: '#ffffff' }}
                      className="text-xl font-black font-mono mt-0.5"
                    >
                      {allContests.length} Rounds
                    </p>
                  </div>
                  <span className="text-2xl">🏆</span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                  className="p-3.5 rounded-2xl border backdrop-blur-sm flex items-center justify-between"
                >
                  <div>
                    <span
                      style={{ color: '#94a3b8' }}
                      className="text-[10px] uppercase font-bold tracking-wider"
                    >
                      Platforms Covered
                    </span>
                    <p
                      style={{ color: '#a5b4fc' }}
                      className="text-xs font-bold mt-1"
                    >
                      Codeforces · LeetCode · AtCoder
                    </p>
                  </div>
                  <span className="text-2xl">🌐</span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                  className="p-3.5 rounded-2xl border backdrop-blur-sm flex items-center justify-between"
                >
                  <div>
                    <span
                      style={{ color: '#94a3b8' }}
                      className="text-[10px] uppercase font-bold tracking-wider"
                    >
                      Target Milestone
                    </span>
                    <p
                      style={{ color: '#fcd34d' }}
                      className="text-xs font-bold font-mono mt-1"
                    >
                      Rating 1600 (3–4 Solves)
                    </p>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Filters Tab Bar with spacious layout */}
          <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {[
                { id: 'All', label: '🌟 All Platforms', count: allContests.length },
                {
                  id: 'Codeforces',
                  label: '🔴 Codeforces',
                  count: allContests.filter((c) => c.platform === 'Codeforces').length,
                },
                {
                  id: 'LeetCode',
                  label: '🟡 LeetCode',
                  count: allContests.filter((c) => c.platform === 'LeetCode').length,
                },
                {
                  id: 'AtCoder',
                  label: '🔵 AtCoder',
                  count: allContests.filter((c) => c.platform === 'AtCoder').length,
                },
                {
                  id: 'Favorites',
                  label: '⭐ Saved for Later',
                  count: bookmarkedIds.length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEffects.playPop();
                    setSelectedPlatform(tab.id as any);
                    setSelectedDivision('All');
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-xs ${
                    selectedPlatform === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/30'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      selectedPlatform === tab.id
                        ? 'bg-indigo-950 text-indigo-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Load More from Live Codeforces API button */}
            <button
              onClick={handleLoadMoreCodeforcesContests}
              disabled={loadingLiveContests}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 hover:text-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
              title="Query Codeforces public API to pull dozens more past contests"
            >
              {loadingLiveContests ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading Live CF...</span>
                </>
              ) : (
                <>
                  <SparklesIcon size={14} />
                  <span>Fetch Live CF Contests</span>
                </>
              )}
            </button>
          </div>

          {/* Sub-Filters: Division, Difficulty, Sort, and Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
            {/* Division Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
              {(selectedPlatform === 'Codeforces'
                ? ['All', 'Div. 4', 'Div. 3', 'Div. 2', 'Educational']
                : selectedPlatform === 'LeetCode'
                ? ['All', 'Weekly', 'Biweekly']
                : selectedPlatform === 'AtCoder'
                ? ['All', 'ABC']
                : ['All', 'Div. 4', 'Div. 3', 'Div. 2', 'Educational', 'Weekly', 'Biweekly', 'ABC']
              ).map((div) => (
                <button
                  key={div}
                  onClick={() => {
                    soundEffects.playPop();
                    setSelectedDivision(div);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDivision === div
                      ? 'bg-slate-200 text-slate-950 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {div}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Difficulty Dropdown */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                <option value="All">All Difficulties</option>
                <option value="Beginner">🌱 Beginner (800–1100)</option>
                <option value="Intermediate">⚡ Intermediate (1200–1500)</option>
                <option value="Advanced">🔥 Advanced (1600+)</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="target1600">🎯 1600 Target Recommended</option>
                <option value="problems">Most Problems</option>
                <option value="easiest">Easiest First</option>
                <option value="hardest">Hardest First</option>
              </select>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-60">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search rounds, problems, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <CloseIcon size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contests Count Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-mono">{filteredContests.length}</strong> contests
              {selectedPlatform !== 'All' && ` for ${selectedPlatform}`}
            </span>
            <span className="text-[11px] text-slate-500">
              💡 Tip: Click problem chips for quick preview or star to bookmark
            </span>
          </div>

          {/* Rich Themed Contest Cards Grid */}
          {filteredContests.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
              <span className="text-4xl">🏜️</span>
              <h3 className="text-sm font-bold text-slate-200">No Contests Match Your Filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try switching platforms, clearing your search query, or clicking "Fetch Live CF Contests" to load more.
              </p>
              <button
                onClick={() => {
                  setSelectedPlatform('All');
                  setSelectedDivision('All');
                  setSelectedDifficulty('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredContests.map((round) => {
                const isSelected = activeContestId === round.id;
                const isBookmarked = bookmarkedIds.includes(round.id);
                const theme = getCardTheme(round.platform, round.division);

                return (
                  <div
                    key={`${round.platform}_${round.id}`}
                    style={{ backgroundImage: theme.pattern }}
                    className={`relative p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 group overflow-hidden ${
                      theme.bg
                    } ${
                      isSelected
                        ? 'border-indigo-400/90 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                        : `${theme.border} ${theme.glow} shadow-lg hover:-translate-y-1`
                    }`}
                  >
                    {/* Top Header Row */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${theme.platformPill}`}>
                            {round.platform}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            #{round.id}
                          </span>
                          {round.isLiveSynced && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-bold">
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Humor Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
                            {round.humorBadge}
                          </span>

                          {/* Star / Bookmark Button */}
                          <button
                            onClick={(e) => toggleBookmark(round.id, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBookmarked
                                ? 'text-amber-500 bg-amber-500/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800'
                            }`}
                            title={isBookmarked ? 'Remove from favorites' : 'Bookmark contest'}
                          >
                            <BookmarkIcon size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Contest Name */}
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                          {round.name}
                        </h3>
                        {/* Meme Quote Tagline */}
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-0.5 leading-relaxed font-medium">
                          "{round.memeQuote}"
                        </p>
                      </div>

                      {/* Problem chips with interactive preview */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                          <span>
                            {round.problemCount} Problems · {Math.floor(round.durationMinutes / 60) > 0 ? `${Math.floor(round.durationMinutes / 60)}h ` : ''}{round.durationMinutes % 60 > 0 ? `${round.durationMinutes % 60}m` : ''} Duration
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                            Danger: <strong className={theme.accentText}>{round.dangerLevel}</strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {round.problems.map((p) => (
                            <button
                              key={p.index}
                              onClick={() => {
                                soundEffects.playPop();
                                setPreviewContest(round);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-950/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-[11px] font-mono shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              title={`${p.name} - Rating: ${p.rating || 'N/A'}. Click to preview.`}
                            >
                              <span className="font-bold text-slate-800 dark:text-slate-200">{p.index}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">({p.rating || '?'})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-300/80 dark:border-slate-800/70">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundEffects.playPop();
                            setPreviewContest(round);
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-semibold underline underline-offset-4 cursor-pointer"
                        >
                          Quick Peek
                        </button>

                        <a
                          href={round.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-slate-300 p-1"
                          title="Open official contest page"
                        >
                          <ExternalLinkIcon size={13} />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundEffects.playPop();
                            setActiveContestId(round.id);
                            setShowPreContestBriefing(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102 cursor-pointer"
                        >
                          <RunCodeIcon size={14} />
                          <span>Prepare & Enter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUICK PEEK CONTEST DRAWER / MODAL */}
      {previewContest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👁️</span>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">{previewContest.name}</h3>
                  <span className="text-xs text-slate-400">
                    {previewContest.platform} · {previewContest.division} · {previewContest.durationMinutes} mins
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewContest(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Funny Tagline Banner */}
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-200 italic">
              "{previewContest.memeQuote}"
            </div>

            {/* Problem List Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Problem Set & Difficulty Curve
              </h4>
              <div className="space-y-2">
                {previewContest.problems.map((prob) => (
                  <div
                    key={prob.index}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-800 font-mono font-bold text-indigo-300 flex items-center justify-center shrink-0">
                        {prob.index}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-200 truncate">{prob.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          {prob.tags && prob.tags.slice(0, 3).map((t) => (
                            <span key={t} className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-amber-400">
                        ⚡ {prob.rating || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <a
                href={previewContest.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <span>Open on {previewContest.platform}</span>
                <ExternalLinkIcon size={12} />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewContest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveContestId(previewContest.id);
                    setPreviewContest(null);
                    setShowPreContestBriefing(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RunCodeIcon size={14} />
                  <span>Enter This Contest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROULETTE WHEEL / YOLO RANDOMIZER MODAL */}
      {showRouletteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="space-y-1">
              <span className="text-4xl animate-bounce inline-block">🎰</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Contest Roulette</h3>
              <p className="text-xs text-slate-400">
                {isSpinningRoulette
                  ? 'Consulting the Coding Gods of Codeforces & LeetCode...'
                  : 'Destiny has spoken! Here is your challenge:'}
              </p>
            </div>

            {rouletteCandidate && (
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isSpinningRoulette
                    ? 'border-slate-800 bg-slate-950/80 animate-pulse'
                    : 'border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-slate-900 to-indigo-950/30 shadow-xl'
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  <span>{rouletteCandidate.platform}</span>
                  <span>·</span>
                  <span>{rouletteCandidate.division}</span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">{rouletteCandidate.name}</h4>
                <p className="text-xs text-slate-300 italic mt-2">
                  "{rouletteCandidate.memeQuote}"
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                  <span>{rouletteCandidate.problemCount} Problems</span>
                  <span>·</span>
                  <span>{rouletteCandidate.dangerLevel}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={isSpinningRoulette}
                onClick={() => setShowRouletteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold cursor-pointer"
              >
                Close
              </button>

              <button
                disabled={isSpinningRoulette}
                onClick={handleSpinRoulette}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-bold border border-amber-500/30 cursor-pointer"
              >
                Spin Again 🎲
              </button>

              {rouletteCandidate && !isSpinningRoulette && (
                <button
                  onClick={() => {
                    setActiveContestId(rouletteCandidate.id);
                    setShowRouletteModal(false);
                    setShowPreContestBriefing(true);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer"
                >
                  Accept Challenge! 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pre-Contest Strategy & Briefing Modal */}
      {showPreContestBriefing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrophyIcon size={20} semantic="warning" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Pre-Contest Briefing: {selectedRound.name}
                </h3>
              </div>
              <button
                onClick={() => setShowPreContestBriefing(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Mode & Duration Config */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Contest Mode:</label>
                <select
                  value={sessionMode}
                  onChange={(e) => setSessionMode(e.target.value as ContestSessionMode)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="simulated">🔒 Strict Simulation (Hide Ratings)</option>
                  <option value="practice">🛠️ Practice & Study (Pausable)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Duration (Minutes):</label>
                <select
                  value={sessionDurationMinutes}
                  onChange={(e) => setSessionDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="45">45 Minutes (Lightning Drill)</option>
                  <option value="60">60 Minutes (Speedrun)</option>
                  <option value="90">90 Minutes (LeetCode Standard)</option>
                  <option value="120">120 Minutes (Standard CF)</option>
                </select>
              </div>
            </div>

            {/* Strategy Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <WarningStatusIcon size={16} semantic="warning" /> Pre-Contest Strategy Checklist
              </h4>
              <ul className="space-y-1.5">
                {preContestChecklist.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <CheckCircleIcon size={14} semantic="success" className="shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Time Allocation Recommendation */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/40 text-xs space-y-1">
              <span className="font-semibold text-indigo-300">
                Target 1600 Milestone Time Allocation:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Problem A: ~15 mins · Problem B: ~25 mins · Problem C: ~45 mins. Verify all boundary invariants (N=1, even/odd, max value) before clicking submit!
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowPreContestBriefing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartContest}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                Start Virtual Contest 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Contest Debrief Modal */}
      {showDebrief && debriefData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 safe-area-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrophyIcon size={20} semantic="success" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Contest Debrief: {debriefData.contestName}
                </h3>
              </div>
              <button
                onClick={() => setShowDebrief(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Standings Summary Strip */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Final Rank</span>
                <p className="text-xl font-bold font-mono text-indigo-400 mt-1">
                  #{localStandings.find((r) => r.isCurrentUser)?.rank || 1}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Solved</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {debriefData.totalSolved} / {debriefData.totalProblems}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Penalty</span>
                <p className="text-xl font-bold font-mono text-slate-200 mt-1">
                  {debriefData.totalPenaltyMinutes}m
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Est. Rating</span>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                  ~{debriefData.estimatedPerformanceRating}
                </p>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Key Strategic Takeaways
              </h4>
              <ul className="space-y-1.5">
                {debriefData.keyTakeaways.map((takeaway, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <AISparkleIcon size={14} semantic="primary" className="shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upsolving Queue */}
            {debriefData.upsolvingQueue.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <TerminalIcon size={14} /> Recommended Upsolving Queue ({debriefData.upsolvingQueue.length} unsolved)
                  </h4>
                  <button
                    onClick={() => {
                      const firstUnsolved = debriefData.upsolvingQueue[0];
                      setShowDebrief(false);
                      if (onOpenWorkspace) onOpenWorkspace(firstUnsolved);
                      else onSelectProblem(firstUnsolved);
                      toast.show(`Opened Problem ${firstUnsolved.index} in Workspace for upsolving!`, 'info');
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    <span>Upsolve Problem {debriefData.upsolvingQueue[0].index}</span>
                    <ChevronRightIcon size={12} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {debriefData.upsolvingQueue.map((prob) => (
                    <div
                      key={prob.index}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">{prob.index}</span>
                        <span className="text-slate-300">{prob.name}</span>
                        {prob.rating && (
                          <span className="text-[11px] text-amber-400 font-semibold">⚡ {prob.rating}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowDebrief(false);
                            if (onOpenWorkspace) onOpenWorkspace(prob);
                            else onSelectProblem(prob);
                            toast.show(`Opened Problem ${prob.index} in Workspace`, 'info');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Upsolve in IDE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const summary = `🏆 Contest Debrief: ${debriefData.contestName}\n` +
                    `Solved: ${debriefData.totalSolved}/${debriefData.totalProblems} | Penalty: ${debriefData.totalPenaltyMinutes}m | Performance: ~${debriefData.estimatedPerformanceRating}\n` +
                    `Upsolving Queue: ${debriefData.upsolvingQueue.map(p => p.index).join(', ') || 'All Solved!'}`;
                  navigator.clipboard.writeText(summary);
                  toast.show('Contest summary copied to clipboard! 📋', 'success');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
              >
                <CopyIcon size={14} />
                <span>Copy Summary</span>
              </button>

              <button
                onClick={() => setShowDebrief(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KAWAII CUTE AUDIO SFX SOUNDBOARD MODAL */}
      {showCuteSoundboard && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 safe-area-overlay animate-fade-in"
          onClick={() => setShowCuteSoundboard(false)}
        >
          <div
            className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-pink-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-pink-500/20 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-pink-500/20">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 text-white flex items-center justify-center text-xl shadow-md shadow-pink-500/30">
                  🎵
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Kawaii SFX Soundboard</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300">
                      12 Cute Sounds
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hand-synthesized with native Web Audio API. Tap any tile to play instant cute audio!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSound}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-slate-900 border-slate-800 text-slate-500'
                      : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                  }`}
                  title="Toggle Mute"
                >
                  <span>{isMuted ? '🔇' : '🔊'}</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playPop();
                    setShowCuteSoundboard(false);
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            </div>

            {/* Grid of 12 cute sound cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {soundEffects.getCuteSoundLibrary().map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    sound.play();
                    fireConfettiBurst(600);
                  }}
                  className="group relative p-3.5 rounded-2xl border border-slate-800 hover:border-pink-500/50 bg-slate-950/70 hover:bg-pink-950/20 transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer hover:scale-102 hover:shadow-lg hover:shadow-pink-500/10 active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                      {sound.emoji}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ▶ Play
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-pink-300 transition-colors">
                      {sound.name}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {sound.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>💡 All cute sounds play automatically on button clicks, bookmark stars, excuse generation, and contest wins.</span>
              <button
                onClick={() => {
                  soundEffects.playConfettiPop();
                  setTimeout(() => soundEffects.playLevelUpCute(), 120);
                  fireConfettiBurst(1200);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-pink-600/30 whitespace-nowrap active:scale-95"
              >
                ✨ Play Cute Party Fanfare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
