import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CodingBracketsIcon,
  SearchIcon,
  SearchIcon as Search,
  FilterIcon,
  ExternalLinkIcon,
  ExternalLinkIcon as ExternalLink,
  CopyIcon,
  CheckIcon,
  SourceCodeIcon,
  ShieldIcon,
  TerminalIcon,
  TerminalIcon as Terminal,
  SplitPanelControlIcon,
  RefreshIcon,
  WarningStatusIcon,
  CodeFileIcon,
  ProblemTagsIcon,
  ChevronLeftIcon,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon,
  ChevronRightIcon as ChevronRight,
  EditorialIcon,
  MedalIcon,
  AISparkleIcon,
  CloseIcon,
  CommunityIcon,
  BookmarkIcon,
  FlameIcon,
  DownloadIcon,
  ZapIcon,
  TrophyIcon,
  TrophyIcon as Trophy,
} from './icons';
import {
  Star,
  Sparkles,
  Download,
  BookOpen,
  Cpu,
  Layers,
  Eye,
  Share2,
  Code2,
  Dices,
  Shuffle,
  LayoutGrid,
  ListFilter,
  Check,
  Lightbulb,
  GitFork,
  CheckCheck,
  User,
  FolderGit2,
  HelpCircle,
} from 'lucide-react';
import { EmptySavedState, RocketLoading } from './assets';
import { MascotClimby, MascotByteCat, FunnyStickerBadge, StickerType, AnimeCharacterSprite } from './assets/MascotAndStickers';
import { storageService } from '../services/storage';
import { useToast } from './Toast';
import { JoyCodeViewer } from './JoyCodeViewer';
import { soundEffects } from '../utils/soundEffects';

export interface SolutionItemSummary {
  id: string;
  problem_id: string | null;
  contest_id: number | null;
  problem_index: string | null;
  problem_name: string | null;
  rating: number | null;
  tags: string[];
  language: string;
  compiler_standard: string;
  validation_status: string;
  mapping_confidence: string;
  source_repository: string;
  source_file_path: string;
  original_author: string;
  license_spdx: string;
  statement_url?: string;
}

export interface DetailedSolution extends SolutionItemSummary {
  source_code: string;
  source_sha256: string;
  normalized_sha256: string;
  source_repository_url: string;
  source_commit: string;
  validation_notes?: string;
  provenance: Array<{
    source_repository: string;
    source_repository_url: string;
    source_commit: string;
    source_file_path: string;
    original_author: string;
    license_spdx: string;
    imported_at: string;
  }>;
}

interface SolutionLibraryViewProps {
  initialProblemId?: string;
  onOpenWorkspaceWithCode?: (code: string, problemName?: string) => void;
  onShareToCommunity?: (code: string, problemName?: string, problemUrl?: string) => void;
}

interface SocraticExplanation {
  problemId: string;
  problemName: string;
  rating: number | null;
  coreObservation: string;
  naiveTrap: string;
  optimalInvariant: string;
  timeComplexity: string;
  spaceComplexity: string;
  grandmasterTip: string;
}

const FAVORITES_STORAGE_KEY = 'climb1600_favorite_solutions';

const CP_MEMES = [
  { quote: "If brute force gives TLE, just `#define int long long` and pray to Tourist 🛐", tag: "Life Advice ☕" },
  { quote: "There are 10 types of coders: those who get Accepted, and those who TLE on test 2 💀", tag: "Real Talk 🚀" },
  { quote: "Why do programmers love C++? Because Java takes 200MB to print 'YES' 😂", tag: "Speed Truth 🏎️" },
  { quote: "A binary search a day keeps the memory limit exceeded away ⚡", tag: "Health Tip 🍏" },
  { quote: "My code worked on sample 1 and now I'm terrified something is deeply broken 😱", tag: "Anxiety 💥" },
  { quote: "Converting 4 shots of espresso into clean O(N log N) divide-and-conquer ☕", tag: "Fuel ⚡" },
  { quote: "Remember: `ios_base::sync_with_stdio(0); cin.tie(0);` or perish 💀", tag: "C++ Rule #1 🔥" },
  { quote: "Specialist rating is just 800 rating with 800 kilograms of pure stubbornness 🧗", tag: "1600 Grind 🏔️" },
  { quote: "Polycarp bought 4,000 watermelons again. We must divide them evenly 🍉", tag: "Polycarp Lore 🍉" },
  { quote: "Pretests passed! Now sweating uncontrollably waiting for system tests 💧", tag: "Contest Thrill 🏆" },
];

export const SolutionLibraryView: React.FC<SolutionLibraryViewProps> = ({
  initialProblemId,
  onOpenWorkspaceWithCode,
  onShareToCommunity,
}) => {
  const toast = useToast();
  const [solutions, setSolutions] = useState<SolutionItemSummary[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>(initialProblemId || '');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(800);
  const [maxRating, setMaxRating] = useState<number>(2400);
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating-asc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Favorites stored in localStorage
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  // Meme ticker state
  const [memeIndex, setMemeIndex] = useState<number>(0);

  // Selected solution for code modal
  const [selectedSolution, setSelectedSolution] = useState<DetailedSolution | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const openedInitialRef = useRef<string | null>(null);

  // Socratic Breakdown Modal State
  const [socraticModalOpen, setSocraticModalOpen] = useState<boolean>(false);
  const [socraticData, setSocraticData] = useState<SocraticExplanation | null>(null);

  // Comparison State
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [compareSol1, setCompareSol1] = useState<DetailedSolution | null>(null);
  const [compareSol2, setCompareSol2] = useState<DetailedSolution | null>(null);
  const [compareMetrics, setCompareMetrics] = useState<any>(null);
  const [loadingCompare, setLoadingCompare] = useState<boolean>(false);

  // Cycle meme with dice roll sound
  const handleRollMeme = () => {
    soundEffects.playDiceRoll();
    setMemeIndex((prev) => (prev + 1) % CP_MEMES.length);
  };

  // Toggle Favorite
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playPop();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const isStarred = next.has(id);
      if (isStarred) {
        next.delete(id);
        toast.show('Removed from starred solutions', 'info');
      } else {
        next.add(id);
        toast.show('Added to starred solutions! ⭐', 'success');
      }
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Complexity determination helper
  const getComplexityFromTags = (tags: string[] = []): string => {
    const lower = tags.map((t) => t.toLowerCase());
    if (lower.includes('binary search')) return 'O(log N)';
    if (lower.includes('sortings') || (lower.includes('two pointers') && lower.includes('greedy'))) return 'O(N log N)';
    if (lower.includes('math') || lower.includes('number theory')) return 'O(log M)';
    if (lower.includes('dp') || lower.includes('dynamic programming')) return 'O(N · K)';
    if (lower.includes('graphs') || lower.includes('dfs and similar') || lower.includes('trees')) return 'O(V + E)';
    if (lower.includes('greedy') || lower.includes('two pointers') || lower.includes('strings')) return 'O(N)';
    return 'O(N)';
  };

  // Funny badge generator based on tags and rating
  const getFunnyBadge = (item: SolutionItemSummary): { emoji: string; text: string; bg: string } => {
    const rating = item.rating || 800;
    const tags = (item.tags || []).map((t) => t.toLowerCase());

    if (tags.some((t) => t.includes('dp'))) {
      return { emoji: '🧠', text: '200 IQ DP', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
    }
    if (tags.some((t) => t.includes('greedy'))) {
      return { emoji: '🤑', text: 'Pure Greed', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
    if (tags.some((t) => t.includes('math') || t.includes('number theory'))) {
      return { emoji: '📐', text: 'Math Sorcery', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
    if (tags.some((t) => t.includes('graph') || t.includes('tree') || t.includes('dfs'))) {
      return { emoji: '🌲', text: 'Tree Whisperer', bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800' };
    }
    if (tags.some((t) => t.includes('binary search'))) {
      return { emoji: '⚡', text: 'Logarithmic Snipe', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' };
    }
    if (rating <= 900) {
      return { emoji: '🍼', text: 'Toddler AC', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    }
    if (rating >= 1600) {
      return { emoji: '🦁', text: 'Expert Chad', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
    }
    return { emoji: '✨', text: '0ms Fast I/O', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
  };

  // Fetch Solutions
  const fetchSolutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
      });

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedTag !== 'all') params.set('tag', selectedTag);
      if (selectedRepo !== 'all') params.set('repo', selectedRepo);
      if (minRating > 800) params.set('minRating', String(minRating));
      if (maxRating < 2400) params.set('maxRating', String(maxRating));

      const res = await fetch(`/api/solutions?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setSolutions(data.results);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (
          initialProblemId &&
          openedInitialRef.current !== initialProblemId &&
          data.results.length > 0
        ) {
          openedInitialRef.current = initialProblemId;
          handleOpenSolution(data.results[0].id);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch solutions');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to solutions server');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, selectedTag, selectedRepo, minRating, maxRating, sortBy]);

  useEffect(() => {
    if (initialProblemId) {
      setSearchQuery(initialProblemId);
      setPage(1);
    }
  }, [initialProblemId]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  // Open Solution in JoyCodeViewer Modal
  const handleOpenSolution = async (id: string) => {
    setLoadingDetails(true);
    soundEffects.playPop();
    try {
      const res = await fetch(`/api/solutions/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSolution(data.solution);
      } else {
        toast.show('Could not load solution code', 'error');
      }
    } catch (e: any) {
      console.error('Failed to load solution code:', e);
      toast.show('Network error fetching solution', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Instant 1-Click Copy Code from Card
  const handleQuickCopyCode = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playPop();
    try {
      let codeToCopy = '';
      if (selectedSolution && selectedSolution.id === id) {
        codeToCopy = selectedSolution.source_code;
      } else {
        const res = await fetch(`/api/solutions/${id}`);
        const data = await res.json();
        if (data.success && data.solution?.source_code) {
          codeToCopy = data.solution.source_code;
        }
      }

      if (codeToCopy) {
        await navigator.clipboard.writeText(codeToCopy);
        setCopiedId(id);
        soundEffects.playVictory();
        toast.show('Copied! Codeforces anti-cheat won\'t suspect a thing 🤫', 'success');
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {
      toast.show('Failed to copy code to clipboard', 'error');
    }
  };

  // Download .cpp file
  const handleDownloadCpp = async (id: string, problemId: string | null, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playPop();
    try {
      let code = '';
      if (selectedSolution && selectedSolution.id === id) {
        code = selectedSolution.source_code;
      } else {
        const res = await fetch(`/api/solutions/${id}`);
        const data = await res.json();
        if (data.success && data.solution?.source_code) {
          code = data.solution.source_code;
        }
      }

      if (code) {
        const blob = new Blob([code], { type: 'text/x-c++src' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${problemId || 'codeforces'}_solution.cpp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        soundEffects.playVictory();
        toast.show(`Downloaded ${problemId || 'codeforces'}_solution.cpp! 🚀`, 'success');
      }
    } catch {
      toast.show('Failed to download .cpp file', 'error');
    }
  };

  // Open direct in IDE Workspace
  const handleOpenInWorkspaceDirect = async (id: string, problemIdOrName?: string | null, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playPop();
    try {
      const res = await fetch(`/api/solutions/${id}`);
      const data = await res.json();
      if (data.success && data.solution?.source_code && onOpenWorkspaceWithCode) {
        onOpenWorkspaceWithCode(
          data.solution.source_code,
          problemIdOrName || data.solution.problem_id || data.solution.problem_name || undefined
        );
        toast.show('Loaded solution directly into IDE Workspace!', 'success');
      }
    } catch {
      toast.show('Failed to fetch solution code', 'error');
    }
  };

  // Spin Lucky AC Roulette
  const handleSpinRandomAC = () => {
    soundEffects.playDiceRoll();
    if (solutions.length === 0) {
      toast.show('No solutions match the current filters to roll from!', 'info');
      return;
    }
    const randomIndex = Math.floor(Math.random() * solutions.length);
    const randomSol = solutions[randomIndex];
    toast.show(`🎲 Roulette landed on: ${randomSol.problem_id || 'Problem'} - ${randomSol.problem_name || ''}!`, 'success');
    handleOpenSolution(randomSol.id);
  };

  // Open Socratic Breakdown Modal
  const handleOpenSocratic = (item: SolutionItemSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playPop();
    const tags = (item.tags || []).map((t) => t.toLowerCase());

    let core = 'Identify the problem invariant and eliminate redundant state evaluations.';
    let naive = 'Brute-forcing all permutations or subsets takes exponential O(2^N) or factorial O(N!) time, causing an instant TLE on test 2 💀.';
    let invariant = 'Transitions preserve monotonicity; locally optimal choices guarantee global optimality.';
    let timeComp = getComplexityFromTags(item.tags);
    let spaceComp = 'O(1) auxiliary memory';
    let tip = 'Always pre-allocate vectors and use `\\n` instead of `std::endl` to avoid slow buffer flushes!';

    if (tags.some((t) => t.includes('dp'))) {
      core = 'Subproblem overlap with optimal substructure. State dp[i] represents optimal answer for prefix i.';
      naive = 'Naive recursion recomputes identical states repeatedly, causing 2^N tree explosion and judge timeout.';
      invariant = 'Topological evaluation ensures every state depends strictly on previously memoized optimal values.';
      timeComp = 'O(N · K) state transitions';
      spaceComp = 'O(N) or O(1) rolling buffer';
      tip = 'Check if you can reduce space from O(N) to O(1) by retaining only the last 2 states!';
    } else if (tags.some((t) => t.includes('greedy'))) {
      core = 'Sort the input elements by key priority and commit to locally optimal choices without backtracking.';
      naive = 'Evaluating all alternate decision paths takes O(N!), which turns into heat and sadness on Codeforces.';
      invariant = 'Exchange argument proves that any swap of adjacent elements in sorted order cannot improve the score.';
      timeComp = 'O(N log N) dominated by std::sort';
      spaceComp = 'O(1) auxiliary space';
      tip = 'If you cannot prove greedy with an exchange argument, double check if it is secretly DP!';
    } else if (tags.some((t) => t.includes('math') || t.includes('number theory'))) {
      core = 'Deduce closed-form algebraic formula, parity properties, or modular arithmetic reduction.';
      naive = 'Looping up to 10^9 tests one-by-one burns 2.0 seconds easily. With T=10^4 test cases, you will definitely TLE.';
      invariant = 'Euclidean GCD reduction or O(1) mathematical formulation handles astronomical values instantly.';
      timeComp = 'O(log(min(A, B))) or O(1)';
      spaceComp = 'O(1) memory';
      tip = 'In C++, always write `1LL * a * b` to prevent 32-bit signed integer overflow traps!';
    } else if (tags.some((t) => t.includes('binary search'))) {
      core = 'Predicated binary search over monotonic answer space: check(mid) switches smoothly from true to false.';
      naive = 'Linear search takes 10^9 operations. At 10^8 ops/sec, that is 10 seconds of pure judge agony.';
      invariant = 'Halving the search interval takes at most 30 steps because 2^30 > 10^9.';
      timeComp = 'O(N log(MaxVal))';
      spaceComp = 'O(1) memory';
      tip = 'Use `mid = low + (high - low) / 2` to safely avoid arithmetic overflow in mid calculations.';
    } else if (tags.some((t) => t.includes('graph') || t.includes('tree') || t.includes('dfs'))) {
      core = 'Construct adjacency list and traverse reachable components with visited flags.';
      naive = 'Matrix representation takes O(V^2) memory (MLE) and redundant vertex visits cause infinite loops.';
      invariant = 'Each vertex and edge is visited at most twice during depth-first traversal.';
      timeComp = 'O(V + E) linear in graph size';
      spaceComp = 'O(V + E) for adjacency list';
      tip = 'For tree diameters, run BFS twice: first from an arbitrary node, then from the farthest discovered node!';
    }

    setSocraticData({
      problemId: item.problem_id || 'Problem',
      problemName: item.problem_name || 'Codeforces Problem',
      rating: item.rating,
      coreObservation: core,
      naiveTrap: naive,
      optimalInvariant: invariant,
      timeComplexity: timeComp,
      spaceComplexity: spaceComp,
      grandmasterTip: tip,
    });
    setSocraticModalOpen(true);
  };

  // Start Side-by-side comparison
  const handleStartCompare = async (sol: DetailedSolution | SolutionItemSummary) => {
    setLoadingCompare(true);
    soundEffects.playPop();

    let fullSol1: DetailedSolution;
    if ('source_code' in sol) {
      fullSol1 = sol as DetailedSolution;
    } else {
      const res1 = await fetch(`/api/solutions/${sol.id}`);
      const data1 = await res1.json();
      fullSol1 = data1.solution;
    }
    setCompareSol1(fullSol1);

    if (fullSol1.problem_id) {
      try {
        const res = await fetch(`/api/solutions/problem/${fullSol1.problem_id}`);
        const data = await res.json();
        if (data.success && data.solutions.length > 1) {
          const alt = data.solutions.find((s: any) => s.id !== fullSol1.id) || data.solutions[0];
          setCompareSol2(alt);

          const compRes = await fetch(`/api/solutions/compare?id1=${fullSol1.id}&id2=${alt.id}`);
          const compData = await compRes.json();
          if (compData.success) {
            setCompareMetrics(compData.metrics);
          }
        } else {
          // If only 1 solution exists, compare with next available solution
          const nextSol = solutions.find((s) => s.id !== fullSol1.id);
          if (nextSol) {
            const nextRes = await fetch(`/api/solutions/${nextSol.id}`);
            const nextData = await nextRes.json();
            if (nextData.success) {
              setCompareSol2(nextData.solution);
              setCompareMetrics({
                solution1: { lines: fullSol1.source_code.split('\n').length, chars: fullSol1.source_code.length, author: fullSol1.original_author, repo: fullSol1.source_repository },
                solution2: { lines: nextData.solution.source_code.split('\n').length, chars: nextData.solution.source_code.length, author: nextData.solution.original_author, repo: nextData.solution.source_repository },
                identical_normalized: false,
              });
            }
          }
        }
      } catch (err) {
        console.error('Compare fetch error:', err);
      }
    }
    setLoadingCompare(false);
    setCompareModalOpen(true);
  };

  // Filter solutions by favorites or complexity if requested
  const displayedSolutions = useMemo(() => {
    let list = solutions;
    if (showFavoritesOnly) {
      list = list.filter((s) => favoriteIds.has(s.id));
    }
    if (selectedComplexity !== 'all') {
      list = list.filter((s) => {
        const comp = getComplexityFromTags(s.tags);
        return comp.toLowerCase().includes(selectedComplexity.toLowerCase());
      });
    }
    return list;
  }, [solutions, showFavoritesOnly, favoriteIds, selectedComplexity]);

  // Helper for Rating Colors
  const getRatingBadgeClass = (rating: number | null) => {
    if (!rating) return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    if (rating < 1200) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
    if (rating < 1400) return 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30';
    if (rating < 1600) return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30';
    if (rating < 1900) return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30';
    if (rating < 2100) return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
    if (rating < 2400) return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30';
  };

  const getRatingEmoji = (rating: number | null) => {
    if (!rating) return '🎯';
    if (rating < 1200) return '🍼';
    if (rating < 1400) return '🐥';
    if (rating < 1600) return '🧗';
    if (rating < 1900) return '🦁';
    return '🧙‍♂️';
  };

  const getTopicTagClass = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower.includes('dp') || lower.includes('dynamic')) return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    if (lower.includes('math') || lower.includes('number theory')) return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    if (lower.includes('greedy')) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    if (lower.includes('graph') || lower.includes('tree') || lower.includes('dfs')) return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60';
    if (lower.includes('data structure')) return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    if (lower.includes('string')) return 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/60';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* =========================================================================
          1. REDESIGNED HERO BANNER (Clean, focused, modern glassmorphic)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white keep-white p-6 sm:p-7 shadow-2xl border border-indigo-500/30">
        {/* Ambient Subtle Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Content */}
          <div className="space-y-3 max-w-2xl">
            {/* Minimal Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/40 text-xs font-semibold backdrop-blur-sm keep-white">
              <Sparkles size={13} className="text-amber-400 shrink-0" />
              <span className="text-white keep-white font-semibold">C++20 Fast I/O</span>
              <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
              <span className="text-white/80 keep-white font-normal">Verified AC Solutions</span>
            </div>

            {/* Clear High-Contrast Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white keep-white flex items-center gap-2.5">
              <span className="text-white keep-white">Codeforces C++ Vault</span>
              <span className="text-xl sm:text-2xl select-none">🚀</span>
            </h1>

            {/* Sleek Interactive Quote Pill */}
            <button
              type="button"
              onClick={handleRollMeme}
              className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs transition-all text-left max-w-xl cursor-pointer keep-white"
              title="Click to roll competitive programming tips"
            >
              <span className="text-amber-300 select-none text-sm shrink-0">💡</span>
              <span className="font-medium truncate text-white keep-white">
                {CP_MEMES[memeIndex].quote}
              </span>
              <Shuffle size={13} className="text-white/70 group-hover:text-amber-300 group-hover:rotate-45 transition-transform shrink-0 ml-auto" />
            </button>

            {/* Clean Metrics Strip */}
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 keep-white">
                <Trophy size={13} className="text-amber-400 shrink-0" />
                <span className="text-white keep-white"><strong className="text-white font-bold keep-white">{total.toLocaleString()}</strong> Solutions</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 keep-white">
                <Star size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
                <span className="text-white keep-white"><strong className="text-white font-bold keep-white">{favoriteIds.size}</strong> Starred</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 keep-white">
                <ShieldIcon size={13} semantic="success" />
                <span className="text-white keep-white">MIT Licensed</span>
              </div>
            </div>
          </div>

          {/* Right Action & Companion */}
          <div className="flex items-center gap-4 shrink-0 self-start md:self-center">
            <div
              onClick={handleRollMeme}
              className="relative group cursor-pointer p-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
              title="Click companion for competitive programming tips!"
            >
              <AnimeCharacterSprite
                characterId={storageService.getSettings()?.theme?.selectedCharacter || 'archmage-luna'}
                size={82}
                mood="coding"
              />
            </div>

            <button
              type="button"
              onClick={handleSpinRandomAC}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer keep-white"
            >
              <Dices size={18} className="text-amber-200 shrink-0" />
              <span className="text-white keep-white font-extrabold tracking-wide">Lucky AC Pick</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. POWER COMMAND BAR (Less Text, Many Icons, Grid/List & Filters)
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Top Action Row: Search + View Modes + Starred Toggle + Roulette */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Problem ID (4A, 1000A, 1800B), title, tags, or author..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <CloseIcon size={16} />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 select-none">
                /
              </span>
            )}
          </div>

          {/* Quick Actions Group */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
            {/* Starred Filter Button */}
            <button
              onClick={() => {
                soundEffects.playPop();
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showFavoritesOnly
                  ? 'bg-amber-500 text-slate-950 dark:text-white border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
              title="Show only bookmarked favorite solutions"
            >
              <Star size={14} className={showFavoritesOnly ? 'fill-white' : 'text-amber-500'} />
              <span>Starred ({favoriteIds.size})</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  soundEffects.playPop();
                  setViewMode('grid');
                }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => {
                  soundEffects.playPop();
                  setViewMode('table');
                }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Compact Table View"
              >
                <ListFilter size={16} />
              </button>
            </div>

            {/* Sort Selector */}
            <div className="w-40">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="rating-asc">★ Rating (Low → High)</option>
                <option value="rating-desc">★ Rating (High → Low)</option>
                <option value="contest-desc">Contest (Newest First)</option>
                <option value="contest-asc">Contest (Oldest First)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Topic Chips (Clickable icons) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 shrink-0 mr-1">
            <ProblemTagsIcon size={14} />
            <span>Topics:</span>
          </span>
          {[
            { id: 'all', label: 'All Topics', emoji: '✨' },
            { id: 'implementation', label: 'Implementation', emoji: '⚙️' },
            { id: 'math', label: 'Math', emoji: '📐' },
            { id: 'greedy', label: 'Greedy', emoji: '🤑' },
            { id: 'dp', label: 'DP', emoji: '💎' },
            { id: 'data structures', label: 'Data Structures', emoji: '🧱' },
            { id: 'binary search', label: 'Binary Search', emoji: '⚡' },
            { id: 'strings', label: 'Strings', emoji: '🧵' },
            { id: 'graphs', label: 'Graphs & Trees', emoji: '🌲' },
            { id: 'number theory', label: 'Number Theory', emoji: '🔢' },
          ].map((t) => {
            const isSelected = selectedTag === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  soundEffects.playPop();
                  setSelectedTag(t.id);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rating Range Selector with Emojis */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0 mr-1">
            <Trophy size={14} className="text-amber-500" />
            <span>Rating:</span>
          </span>
          {[
            { label: 'All Ratings', emoji: '🌈', min: 800, max: 2400 },
            { label: '800-1100 (Newbie)', emoji: '🍼', min: 800, max: 1100 },
            { label: '1200-1399 (Pupil)', emoji: '🐥', min: 1200, max: 1399 },
            { label: '1400-1599 (Specialist Target)', emoji: '🧗', min: 1400, max: 1599 },
            { label: '1600-1899 (Expert Chad)', emoji: '🦁', min: 1600, max: 1899 },
            { label: '1900+ (Grandmaster)', emoji: '🧙‍♂️', min: 1900, max: 2400 },
          ].map((preset) => {
            const isActive = minRating === preset.min && maxRating === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  soundEffects.playPop();
                  setMinRating(preset.min);
                  setMaxRating(preset.max);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-xs ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Problem Jump Chips with Problem Nicknames */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0">Quick Jumps:</span>
          {[
            { id: '4A', name: 'Watermelon 🍉' },
            { id: '71A', name: 'Long Words 🔤' },
            { id: '158A', name: 'Next Round 🏃' },
            { id: '1000A', name: 'Codehorses 🐴' },
            { id: '1352A', name: 'Special Round 🍕' },
            { id: '1800B', name: 'Count Pairs ⚔️' },
            { id: '2000A', name: 'Hardcore 🌋' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundEffects.playPop();
                setSearchQuery(item.id);
                setPage(1);
              }}
              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                searchQuery.toUpperCase() === item.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-indigo-300 dark:border-slate-700'
              }`}
            >
              {item.id} {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          3. SOLUTIONS CONTENT (Grid View OR Table View)
          ========================================================================= */}
      {loading ? (
        <div className="py-20 text-center">
          <RocketLoading size={130} label="Fetching Verified C++ Solutions..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center text-red-600 dark:text-red-400 space-y-3">
          <WarningStatusIcon size={36} semantic="error" className="mx-auto" />
          <h3 className="font-bold text-lg">Failed to Query Solution Library</h3>
          <p className="text-xs max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchSolutions}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
          >
            <RefreshIcon size={14} />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : displayedSolutions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-sm">
          <MascotByteCat size={120} mood="thinking" className="mx-auto" />
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Polycarp Found 0 Solutions 🤷‍♂️
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto">
            {showFavoritesOnly
              ? "You haven't starred any solutions yet! Click the ⭐ icon on any card to save it."
              : "No solutions matched your search filters. Try clearing tags or searching for a common problem like 4A or 1000A."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                soundEffects.playPop();
                setSearchQuery('');
                setSelectedTag('all');
                setSelectedRepo('all');
                setMinRating(800);
                setMaxRating(2400);
                setShowFavoritesOnly(false);
                setSelectedComplexity('all');
                setPage(1);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              Reset All Filters
            </button>
            <button
              onClick={handleSpinRandomAC}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer transition-all"
            >
              🎲 Spin Random AC
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {displayedSolutions.map((item) => {
            const isStarred = favoriteIds.has(item.id);
            const funnyBadge = getFunnyBadge(item);
            const complexity = getComplexityFromTags(item.tags);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-4.5 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5 group relative overflow-hidden"
              >
                {/* Glowing Top Edge */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 group-hover:h-1.5 transition-all" />

                <div>
                  {/* Card Header: Problem ID + Rating Emoji + Funny Badge + Star Button */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        {item.problem_id || 'Problem'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${getRatingBadgeClass(item.rating)}`}>
                        <span>{getRatingEmoji(item.rating)}</span>
                        <span>{item.rating || 'Unrated'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Star / Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isStarred
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isStarred ? 'Remove from starred' : 'Bookmark solution'}
                      >
                        <Star size={16} className={isStarred ? 'fill-amber-500 text-amber-500' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Problem Name */}
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {item.problem_name || `Contest ${item.contest_id} Problem ${item.problem_index}`}
                  </h3>

                  {/* Funny Algorithmic Sticker + Complexity Pill */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${funnyBadge.bg}`}>
                      <span>{funnyBadge.emoji}</span>
                      <span>{funnyBadge.text}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      ⚡ {complexity}
                    </span>
                  </div>

                  {/* Topic Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {item.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className={`text-[10px] border px-1.5 py-0.5 rounded-md font-semibold ${getTopicTagClass(t)}`}
                        >
                          {t}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium px-1 py-0.5">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata Row: Author & Repository Icons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]" title={item.original_author}>
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="font-semibold truncate">{item.original_author}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] truncate max-w-[140px]" title={item.source_repository}>
                      <FolderGit2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.source_repository}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Rich Icons, Less Text) */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                  {/* Left: Problem Link & Explain & Download */}
                  <div className="flex items-center gap-1">
                    {item.statement_url && (
                      <a
                        href={item.statement_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Open official Codeforces problem statement"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleOpenSocratic(item, e)}
                      className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                      title="AI Socratic Breakdown & Proof"
                    >
                      <Sparkles size={15} />
                    </button>
                    <button
                      onClick={(e) => handleDownloadCpp(item.id, item.problem_id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Download .cpp file"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => handleStartCompare(item)}
                      className="p-1.5 rounded-lg text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                      title="Compare implementations"
                    >
                      <GitFork size={15} />
                    </button>
                  </div>

                  {/* Right: Quick Copy, IDE, View C++ Code */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={(e) => handleQuickCopyCode(item.id, e)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                      title="Copy C++ source code"
                    >
                      {copiedId === item.id ? <Check size={15} className="text-emerald-500" /> : <CopyIcon size={15} />}
                    </button>

                    {onOpenWorkspaceWithCode && (
                      <button
                        onClick={(e) => handleOpenInWorkspaceDirect(item.id, item.problem_id || item.problem_name, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Load directly into IDE Workspace"
                      >
                        <Terminal size={14} />
                        <span>IDE</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenSolution(item.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
                      title="View syntax-highlighted code"
                    >
                      <Code2 size={15} />
                      <span>View Code</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / COMPACT LIST VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 uppercase font-extrabold text-[10px] tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-3 w-8 text-center">⭐</th>
                  <th className="py-3 px-3">Problem</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-3">Complexity</th>
                  <th className="py-3 px-3">Topics</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedSolutions.map((item) => {
                  const isStarred = favoriteIds.has(item.id);
                  const complexity = getComplexityFromTags(item.tags);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors group cursor-pointer"
                      onClick={() => handleOpenSolution(item.id)}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => toggleFavorite(item.id, e)}>
                        <Star
                          size={15}
                          className={`mx-auto cursor-pointer ${
                            isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300 hover:text-amber-400'
                          }`}
                        />
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
                            {item.problem_id || 'Problem'}
                          </span>
                          <span className="truncate max-w-xs">{item.problem_name || item.source_file_path}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${getRatingBadgeClass(item.rating)}`}>
                          {getRatingEmoji(item.rating)} {item.rating || 'Unrated'}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        ⚡ {complexity}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(item.tags || []).slice(0, 2).map((t) => (
                            <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border ${getTopicTagClass(t)}`}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-500 truncate max-w-[120px]">
                        {item.original_author}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenSocratic(item, e)}
                            className="p-1 rounded-md text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950 cursor-pointer"
                            title="AI Breakdown"
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={(e) => handleQuickCopyCode(item.id, e)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <CopyIcon size={14} />}
                          </button>
                          <button
                            onClick={(e) => handleDownloadCpp(item.id, item.problem_id, e)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Download .cpp"
                          >
                            <Download size={14} />
                          </button>
                          {onOpenWorkspaceWithCode && (
                            <button
                              onClick={(e) => handleOpenInWorkspaceDirect(item.id, item.problem_id || item.problem_name, e)}
                              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer"
                            >
                              IDE
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenSolution(item.id)}
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. PAGINATION CONTROLS
          ========================================================================= */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900 dark:text-slate-200">{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-900 dark:text-slate-200">{Math.min(page * pageSize, total)}</strong> of{' '}
            <strong className="text-slate-900 dark:text-slate-200">{total.toLocaleString()}</strong> verified solutions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playPop();
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:border-slate-700 cursor-pointer shadow-xs"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3.5 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => {
                soundEffects.playPop();
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:border-slate-700 cursor-pointer shadow-xs"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. JOY CODE VIEWER MODAL (Full Syntax Highlights, Themes, Pinning, Search)
          ========================================================================= */}
      {selectedSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md safe-area-overlay animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col">
            <JoyCodeViewer
              code={selectedSolution.source_code}
              title={selectedSolution.problem_name || undefined}
              problemId={selectedSolution.problem_id || undefined}
              rating={selectedSolution.rating}
              compilerStandard={selectedSolution.compiler_standard}
              license={selectedSolution.license_spdx}
              author={selectedSolution.original_author}
              repository={selectedSolution.source_repository}
              repositoryUrl={selectedSolution.source_repository_url}
              commitSha={selectedSolution.source_commit}
              sha256={selectedSolution.source_sha256}
              statementUrl={selectedSolution.statement_url}
              maxHeight="70vh"
              onOpenInIDE={
                onOpenWorkspaceWithCode
                  ? () => {
                      onOpenWorkspaceWithCode(
                        selectedSolution.source_code,
                        selectedSolution.problem_id || selectedSolution.problem_name || undefined
                      );
                      setSelectedSolution(null);
                    }
                  : undefined
              }
              onCompare={() => handleStartCompare(selectedSolution)}
              onDiscuss={
                onShareToCommunity
                  ? () => {
                      onShareToCommunity(
                        selectedSolution.source_code,
                        selectedSolution.problem_name || selectedSolution.problem_id || undefined,
                        selectedSolution.statement_url
                      );
                      setSelectedSolution(null);
                    }
                  : undefined
              }
              onClose={() => {
                soundEffects.playPop();
                setSelectedSolution(null);
              }}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          6. SOCRATIC AI BREAKDOWN MODAL (Educational & Funny)
          ========================================================================= */}
      {socraticModalOpen && socraticData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md safe-area-overlay animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  <Sparkles size={22} className="animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Socratic Algorithmic Breakdown</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
                      {socraticData.problemId}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {socraticData.problemName} • ★ {socraticData.rating || 'Standard'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSocraticModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
              {/* 1. Aha Moment */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-sm">
                  <Lightbulb size={16} />
                  <span>The "Aha!" Observation</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs">
                  {socraticData.coreObservation}
                </p>
              </div>

              {/* 2. Naive Trap */}
              <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-extrabold text-sm">
                  <span>💀 The Naive Brute Force Trap</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs">
                  {socraticData.naiveTrap}
                </p>
              </div>

              {/* 3. Optimal Invariant */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
                  <CheckCheck size={16} />
                  <span>Guaranteed Optimal Invariant</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs">
                  {socraticData.optimalInvariant}
                </p>
              </div>

              {/* 4. Complexity Proof */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase">Time Complexity</span>
                  <code className="text-xs font-mono font-black text-slate-900 dark:text-slate-100">
                    {socraticData.timeComplexity}
                  </code>
                </div>
                <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block uppercase">Space Complexity</span>
                  <code className="text-xs font-mono font-black text-slate-900 dark:text-slate-100">
                    {socraticData.spaceComplexity}
                  </code>
                </div>
              </div>

              {/* 5. Grandmaster Pro-Tip */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-extrabold text-sm">
                  <span>🧙‍♂️ Grandmaster Pro-Tip</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                  {socraticData.grandmasterTip}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setSocraticModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Got It, Let's Code! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. SIDE-BY-SIDE IMPLEMENTATION COMPARISON MODAL
          ========================================================================= */}
      {compareModalOpen && compareSol1 && compareSol2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md safe-area-overlay animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  <GitFork size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Side-by-Side Implementation Comparison</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
                      {compareSol1.problem_id}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {compareSol1.problem_name || 'Codeforces Problem'} • Compare two distinct approaches
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Funny AI Referee Verdict Bar */}
            <div className="px-6 py-2.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <span className="text-lg">🥊</span>
                <span className="font-semibold">
                  {compareSol1.source_code.split('\n').length < compareSol2.source_code.split('\n').length
                    ? `Solution 1 is ${compareSol2.source_code.split('\n').length - compareSol1.source_code.split('\n').length} lines shorter — Pure Code Golf Ninja! 🥷`
                    : `Solution 2 is ${compareSol1.source_code.split('\n').length - compareSol2.source_code.split('\n').length} lines shorter — High-speed minimalist! ⚡`}
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Both Standard C++20 Verified
              </span>
            </div>

            {/* Metrics Header */}
            {compareMetrics && (
              <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-950 px-6 py-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div className="border-r border-slate-200 dark:border-slate-800 pr-4 flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Author: <strong className="text-blue-600 dark:text-blue-400">{compareSol1.original_author}</strong></span>
                  <span className="font-mono text-[11px]">Lines: <strong>{compareMetrics.solution1.lines}</strong> | Chars: <strong>{compareMetrics.solution1.chars}</strong></span>
                </div>
                <div className="pl-4 flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Author: <strong className="text-purple-600 dark:text-purple-400">{compareSol2.original_author}</strong></span>
                  <span className="font-mono text-[11px]">Lines: <strong>{compareMetrics.solution2.lines}</strong> | Chars: <strong>{compareMetrics.solution2.chars}</strong></span>
                </div>
              </div>
            )}

            {/* Split Screen Code with JoyCodeViewer */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden bg-slate-950 p-3 gap-3">
              <div className="overflow-hidden flex flex-col rounded-2xl border border-slate-800 bg-slate-950">
                <div className="px-3 py-1.5 bg-blue-950/50 border-b border-slate-800 text-[11px] font-bold text-blue-300 flex items-center justify-between">
                  <span>Approach 1 ({compareSol1.source_repository})</span>
                  <span className="font-mono text-[10px] text-slate-400">{compareSol1.compiler_standard}</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <JoyCodeViewer
                    code={compareSol1.source_code}
                    title={compareSol1.problem_name || undefined}
                    problemId={compareSol1.problem_id || undefined}
                    rating={compareSol1.rating}
                    compilerStandard={compareSol1.compiler_standard}
                    license={compareSol1.license_spdx}
                    author={compareSol1.original_author}
                    repository={compareSol1.source_repository}
                    isModal={false}
                    maxHeight="55vh"
                  />
                </div>
              </div>

              <div className="overflow-hidden flex flex-col rounded-2xl border border-slate-800 bg-slate-950">
                <div className="px-3 py-1.5 bg-purple-950/50 border-b border-slate-800 text-[11px] font-bold text-purple-300 flex items-center justify-between">
                  <span>Approach 2 ({compareSol2.source_repository})</span>
                  <span className="font-mono text-[10px] text-slate-400">{compareSol2.compiler_standard}</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <JoyCodeViewer
                    code={compareSol2.source_code}
                    title={compareSol2.problem_name || undefined}
                    problemId={compareSol2.problem_id || undefined}
                    rating={compareSol2.rating}
                    compilerStandard={compareSol2.compiler_standard}
                    license={compareSol2.license_spdx}
                    author={compareSol2.original_author}
                    repository={compareSol2.source_repository}
                    isModal={false}
                    maxHeight="55vh"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
