import { DailyPlan, DailyTask, MissionMode, TopicCurriculum } from '../types';

export interface PhaseInfo {
  phase: number;
  name: string;
  startDay: number;
  endDay: number;
  targetRatingBand: string;
  focus: string;
  outcome: string;
}

export const PHASES: PhaseInfo[] = [
  {
    phase: 1,
    name: 'Foundations',
    startDay: 1,
    endDay: 14,
    targetRatingBand: '800 - 900',
    focus: 'Fast I/O, control flow, arrays, strings, basic math, time complexity intuition, reading edge cases.',
    outcome: 'Write and test small programs independently without syntax confusion or fear of inputs.',
  },
  {
    phase: 2,
    name: 'Basic Problem Solving',
    startDay: 15,
    endDay: 35,
    targetRatingBand: '900 - 1100',
    focus: 'Implementation, frequency counting, sorting, prefix sums, two pointers, greedy reasoning, brute force.',
    outcome: 'Formulate a reliable mental process for straightforward problems before writing code.',
  },
  {
    phase: 3,
    name: 'Core Algorithmic Skills',
    startDay: 36,
    endDay: 70,
    targetRatingBand: '1100 - 1300',
    focus: 'Binary search, sets/maps, bitwise operations, elementary number theory (GCD, Sieve), basic recursion & DP, graphs (BFS/DFS).',
    outcome: 'Recognize classical patterns and explain mathematical or algorithmic correctness.',
  },
  {
    phase: 4,
    name: 'Intermediate Problem Solving',
    startDay: 71,
    endDay: 105,
    targetRatingBand: '1300 - 1450',
    focus: 'Dynamic programming patterns, binary search on answer, DSU, trees, combinatorics, modular arithmetic, constructive algorithms.',
    outcome: 'Independently approach Div.2 B and Div.2 C difficulty problems with structured decomposition.',
  },
  {
    phase: 5,
    name: 'Contest Readiness',
    startDay: 106,
    endDay: 140,
    targetRatingBand: '1400 - 1500',
    focus: 'Mixed-topic sets, virtual contests, speed & accuracy, upsolving discipline, debugging under pressure.',
    outcome: 'Execute deliberate contest strategy, accurate problem picking, and rigorous post-contest upsolving.',
  },
  {
    phase: 6,
    name: 'Rating-Oriented Training',
    startDay: 141,
    endDay: 165,
    targetRatingBand: '1500 - 1600',
    focus: 'Adaptive weakness targeting, Div.2 C and D practice, constructive logic, advanced greedy and DP transitions.',
    outcome: 'Consistent solving in the 1500-1600 range and resilience against unusual constraints.',
  },
  {
    phase: 7,
    name: 'Final Assessment & Lifelong Solver',
    startDay: 166,
    endDay: 180,
    targetRatingBand: '1600+',
    focus: 'Weakness cleanup, virtual mock rounds, error checklist consolidation, baseline vs current performance review.',
    outcome: 'Consolidated competitive programming habits, ready for real rating growth beyond 1600.',
  },
];

export const TOPICS: TopicCurriculum[] = [
  // Phase 1
  {
    id: 'p1_basics',
    title: 'Fast I/O & Basic Syntax in C++/Python',
    phase: 1,
    phaseName: 'Foundations',
    startDay: 1,
    endDay: 4,
    description: 'Master standard competitive programming input/output, integer limits, and basic loops.',
    prerequisites: ['Basic variables'],
    keyIdeas: [
      'Use cin.tie(NULL); ios_base::sync_with_stdio(false); in C++',
      'Avoid endl in tight loops — use "\\n" to prevent flushing',
      'Watch for integer overflow: int fits ~2*10^9, use long long for sums up to 10^18',
    ],
    timeComplexityGuidance: 'Codeforces gives ~1.0-2.0s. 10^8 operations take ~1 second in C++.',
    recommendedProblems: [
      { contestId: 4, index: 'A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'] },
      { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
      { contestId: 231, index: 'A', name: 'Team', rating: 800, tags: ['implementation'] },
    ],
    commonMistakes: [
      'Using endl inside a 10^5 loop causing TLE',
      'Missing the even/odd condition for small numbers (e.g. n=2 in Watermelon)',
    ],
    externalResources: [
      { title: 'CP-Algorithms Basic Math', url: 'https://cp-algorithms.com/' },
      { title: 'USACO Guide Bronze Intro', url: 'https://usaco.guide/bronze/intro-complete' },
    ],
  },
  {
    id: 'p1_arrays_strings',
    title: 'Arrays, Strings & Frequency Counting',
    phase: 1,
    phaseName: 'Foundations',
    startDay: 5,
    endDay: 10,
    description: 'Work with 1D/2D arrays, string operations, char arithmetic, and array indexing.',
    prerequisites: ['Loops', 'Functions'],
    keyIdeas: [
      'Frequency counting using array of size 26 for lowercase letters: freq[c - "a"]++',
      '0-based vs 1-based indexing clarity',
      'Palindrome checks with two indices moving inward',
    ],
    timeComplexityGuidance: 'O(N) single pass over array length up to 10^6 is optimal.',
    recommendedProblems: [
      { contestId: 282, index: 'A', name: 'Bit++', rating: 800, tags: ['implementation'] },
      { contestId: 112, index: 'A', name: 'Petya and Strings', rating: 800, tags: ['strings'] },
      { contestId: 236, index: 'A', name: 'Boy or Girl', rating: 800, tags: ['strings'] },
      { contestId: 339, index: 'A', name: 'Helpful Maths', rating: 800, tags: ['greedy', 'strings'] },
    ],
    commonMistakes: [
      'Out of bounds indexing (accessing array[N] when size is N)',
      'Inefficient string concatenation inside loops (O(N^2) copying in Python/C++)',
    ],
    externalResources: [
      { title: 'USACO Bronze Simulation', url: 'https://usaco.guide/bronze/simulation' },
    ],
  },
  {
    id: 'p1_edge_cases',
    title: 'Edge Cases, Bounds & Complexity Intuition',
    phase: 1,
    phaseName: 'Foundations',
    startDay: 11,
    endDay: 14,
    description: 'Learn to read constraints before coding and test minimum, maximum, and extreme values.',
    prerequisites: ['Arrays', 'Math'],
    keyIdeas: [
      'N=1, N=0, N=Max, all elements equal, negative elements, strictly increasing/decreasing',
      'Calculate time limit feasibility before typing single line of code',
    ],
    timeComplexityGuidance: 'N <= 10: O(N!), N <= 20: O(2^N), N <= 500: O(N^3), N <= 5000: O(N^2), N <= 10^5: O(N log N) or O(N)',
    recommendedProblems: [
      { contestId: 546, index: 'A', name: 'Soldier and Bananas', rating: 800, tags: ['math'] },
      { contestId: 791, index: 'A', name: 'Bear and Big Brother', rating: 800, tags: ['implementation'] },
      { contestId: 617, index: 'A', name: 'Elephant', rating: 800, tags: ['math'] },
    ],
    commonMistakes: ['Integer overflow when computing sum: n * (n + 1) / 2 overflows 32-bit int if n=10^6'],
    externalResources: [
      { title: 'Codeforces Blog: Time Complexity', url: 'https://codeforces.com/blog/entry/21344' },
    ],
  },
  // Phase 2
  {
    id: 'p2_sorting_greedy',
    title: 'Sorting & Basic Greedy Choice',
    phase: 2,
    phaseName: 'Basic Problem Solving',
    startDay: 15,
    endDay: 24,
    description: 'Learn how ordering elements enables greedy strategies and simplifies search.',
    prerequisites: ['Arrays', 'Functions'],
    keyIdeas: [
      'Greedy choice property: making locally optimal choice leads to global optimum',
      'Sort pairs: std::sort with custom comparator or default pair comparison',
      'Exchange argument intuition for greedy proofs',
    ],
    timeComplexityGuidance: 'Sorting takes O(N log N). Standard std::sort is introsort (quick + heap + insertion).',
    recommendedProblems: [
      { contestId: 405, index: 'A', name: 'Gravity Flip', rating: 900, tags: ['greedy', 'sortings'] },
      { contestId: 96, index: 'A', name: 'Football', rating: 900, tags: ['strings'] },
      { contestId: 160, index: 'A', name: 'Twins', rating: 900, tags: ['greedy', 'sortings'] },
      { contestId: 133, index: 'A', name: 'HQ9+', rating: 900, tags: ['implementation'] },
    ],
    commonMistakes: ['Assuming greedy works without checking if a counterexample exists'],
    externalResources: [{ title: 'USACO Guide Bronze Sorting', url: 'https://usaco.guide/bronze/sorting' }],
  },
  {
    id: 'p2_prefix_sums_two_pointers',
    title: 'Prefix Sums & Two Pointers',
    phase: 2,
    phaseName: 'Basic Problem Solving',
    startDay: 25,
    endDay: 35,
    description: 'Query range sums in O(1) time and process arrays linearly with two scanning indices.',
    prerequisites: ['Arrays', 'Sorting'],
    keyIdeas: [
      'pref[i] = pref[i-1] + a[i], range sum [L, R] = pref[R] - pref[L-1]',
      'Two pointers on sorted arrays (find pair with sum X in O(N))',
      'Sliding window with non-negative values for subarray conditions',
    ],
    timeComplexityGuidance: 'Transforms O(N^2) subarray queries into O(1) query time after O(N) precomputation.',
    recommendedProblems: [
      { contestId: 313, index: 'B', name: 'Ilya and Queries', rating: 1100, tags: ['dp', 'prefix sums'] },
      { contestId: 279, index: 'B', name: 'Books', rating: 1100, tags: ['two pointers', 'binary search'] },
      { contestId: 381, index: 'A', name: 'Sereja and Dima', rating: 800, tags: ['two pointers', 'greedy'] },
    ],
    commonMistakes: ['1-based indexing fencepost errors when querying [L, R] (subtracting pref[L] instead of pref[L-1])'],
    externalResources: [{ title: 'USACO Guide Silver Prefix Sums', url: 'https://usaco.guide/silver/prefix-sums' }],
  },
  // Phase 3
  {
    id: 'p3_binary_search',
    title: 'Binary Search on Value & on Answer',
    phase: 3,
    phaseName: 'Core Algorithmic Skills',
    startDay: 36,
    endDay: 48,
    description: 'Master binary search on arrays and monotonic predicate functions ("BS on Answer").',
    prerequisites: ['Two Pointers', 'Sorting'],
    keyIdeas: [
      'Monotonicity check: if check(mid) is true for all x >= ans and false for x < ans',
      'Avoid infinite loops: mid = low + (high - low) / 2',
      'Setting bounds carefully: low = min possible answer, high = max possible answer',
    ],
    timeComplexityGuidance: 'O(log(Range) * checkTime). With range 10^18, log2(10^18) is only ~60 iterations.',
    recommendedProblems: [
      { contestId: 706, index: 'B', name: 'Interesting drink', rating: 1100, tags: ['binary search', 'dp'] },
      { contestId: 1613, index: 'C', name: 'Poisoned Dagger', rating: 1200, tags: ['binary search'] },
      { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
    ],
    commonMistakes: ['Off-by-one errors in while(low <= high) vs while(low < high) and setting high = mid vs mid - 1'],
    externalResources: [{ title: 'Errichto Binary Search Tutorial', url: 'https://codeforces.com/blog/entry/67509' }],
  },
  {
    id: 'p3_number_theory',
    title: 'Elementary Number Theory & Sieve',
    phase: 3,
    phaseName: 'Core Algorithmic Skills',
    startDay: 49,
    endDay: 60,
    description: 'Prime testing in O(sqrt(N)), Sieve of Eratosthenes, GCD/LCM, and prime factorization.',
    prerequisites: ['Basic math', 'Arrays'],
    keyIdeas: [
      'std::__gcd(a, b) in C++ (Euclidean algorithm takes logarithmic steps)',
      'Sieve of Eratosthenes generates all primes up to N in O(N log log N)',
      'Prime factorization in O(sqrt(N)) by dividing out 2 and odd factors',
    ],
    timeComplexityGuidance: 'Factorization up to 10^9 takes ~31622 operations.',
    recommendedProblems: [
      { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
      { contestId: 1285, index: 'B', name: 'Just Eat It!', rating: 1300, tags: ['dp', 'greedy'] },
      { contestId: 742, index: 'A', name: 'Arpa’s hard exam and Mehrdad’s naive cheat', rating: 1000, tags: ['math'] },
    ],
    commonMistakes: ['Integer overflow when computing a * b / gcd(a, b) — always do (a / gcd(a, b)) * b'],
    externalResources: [{ title: 'CP-Algorithms Sieve of Eratosthenes', url: 'https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html' }],
  },
  {
    id: 'p3_graphs_intro',
    title: 'Graph Fundamentals: BFS, DFS & Grid Traversal',
    phase: 3,
    phaseName: 'Core Algorithmic Skills',
    startDay: 61,
    endDay: 70,
    description: 'Adjacency lists, visited arrays, finding connected components, shortest path in unweighted graphs.',
    prerequisites: ['Recursion', 'Queues'],
    keyIdeas: [
      'Adjacency list: vector<int> adj[N] for sparse graphs',
      'DFS using recursion or stack for reachable components and cycle detection',
      'BFS using std::queue for shortest path in unweighted edges',
      'Grid traversal with dx = {0,0,1,-1}, dy = {1,-1,0,0}',
    ],
    timeComplexityGuidance: 'O(V + E) linear time for BFS/DFS traversal.',
    recommendedProblems: [
      { contestId: 580, index: 'C', name: 'Kefa and Park', rating: 1500, tags: ['dfs and similar', 'trees'] },
      { contestId: 520, index: 'B', name: 'Two Buttons', rating: 1400, tags: ['dfs and similar', 'graphs'] },
    ],
    commonMistakes: ['Forgetting to mark nodes visited when pushing to queue in BFS, causing exponential duplicate pushes'],
    externalResources: [{ title: 'USACO Guide Silver BFS', url: 'https://usaco.guide/silver/graph-traversal' }],
  },
  // Phase 4
  {
    id: 'p4_dynamic_programming',
    title: 'Introductory Dynamic Programming',
    phase: 4,
    phaseName: 'Intermediate Problem Solving',
    startDay: 71,
    endDay: 88,
    description: 'Overlapping subproblems, state definition, base cases, 1D/2D transitions, Knapsack patterns.',
    prerequisites: ['Recursion', 'Prefix sums'],
    keyIdeas: [
      'State definition: what minimal parameters fully describe a subproblem?',
      'Transition: how does state(i) depend on previous states?',
      'Base cases and iteration order (bottom-up vs memoized recursion)',
      '0/1 Knapsack: iterate backwards to reuse 1D space',
    ],
    timeComplexityGuidance: 'O(Number of States * Transitions per State).',
    recommendedProblems: [
      { contestId: 189, index: 'A', name: 'Cut Ribbon', rating: 1300, tags: ['dp'] },
      { contestId: 455, index: 'A', name: 'Boredom', rating: 1500, tags: ['dp'] },
      { contestId: 545, index: 'C', name: 'Woodcutters', rating: 1500, tags: ['dp', 'greedy'] },
    ],
    commonMistakes: ['Uninitialized DP array leading to garbage values', 'Incorrect loop bounds or visiting states out of topological order'],
    externalResources: [{ title: 'Errichto DP Tutorial', url: 'https://codeforces.com/blog/entry/67679' }],
  },
  {
    id: 'p4_dsu_trees',
    title: 'Disjoint Set Union (DSU) & Tree Basics',
    phase: 4,
    phaseName: 'Intermediate Problem Solving',
    startDay: 89,
    endDay: 105,
    description: 'Union-find with path compression and union-by-rank, tree diameter, subtrees.',
    prerequisites: ['Graphs BFS/DFS'],
    keyIdeas: [
      'DSU find with path compression: int find(int i) { return p[i] == i ? i : p[i] = find(p[i]); }',
      'Union by size/rank gives nearly O(1) amortized alpha(N) operations',
      'Trees have N nodes and N-1 edges with no cycles',
    ],
    timeComplexityGuidance: 'O(alpha(N)) nearly constant per query with path compression and rank.',
    recommendedProblems: [
      { contestId: 277, index: 'A', name: 'Learning Languages', rating: 1400, tags: ['dsu', 'dfs and similar'] },
      { contestId: 1167, index: 'C', name: 'News Distribution', rating: 1400, tags: ['dsu', 'dfs and similar'] },
    ],
    commonMistakes: ['Forgetting path compression and union-by-rank leading to O(N) chain lookups'],
    externalResources: [{ title: 'CP-Algorithms DSU', url: 'https://cp-algorithms.com/data_structures/disjoint_set_union.html' }],
  },
  // Phase 5, 6, 7
  {
    id: 'p5_contest_strategy',
    title: 'Virtual Contests & Contest Strategy',
    phase: 5,
    phaseName: 'Contest Readiness',
    startDay: 106,
    endDay: 140,
    description: 'Execute timed Div.2/Div.3 contests, master 2-minute sanity checks, and avoid penalty traps.',
    prerequisites: ['All Core Topics'],
    keyIdeas: [
      'First 5 minutes: skim problem A, B, and C before deep commitment',
      'If stuck for >20 mins on problem A/B, take a 30s breath and write down assumptions',
      'Upsolving: solve at least +1 problem beyond what was solved in the contest window',
    ],
    timeComplexityGuidance: 'Solve problem A in <10m, B in <25m to leave maximum time for C & D.',
    recommendedProblems: [
      { contestId: 1360, index: 'D', name: 'Buying Shovels', rating: 1300, tags: ['math', 'number theory'] },
      { contestId: 1352, index: 'D', name: 'Alice, Bob and Candies', rating: 1300, tags: ['implementation', 'two pointers'] },
      { contestId: 1335, index: 'C', name: 'Two Teams Composing', rating: 1100, tags: ['greedy', 'sortings'] },
    ],
    commonMistakes: ['Rushing implementation without testing sample 1 and boundary values locally'],
    externalResources: [{ title: 'Codeforces Contest Strategy Tips', url: 'https://codeforces.com/blog/entry/69385' }],
  },
  {
    id: 'p6_adaptive_climb',
    title: '1500-1600 Rating Band Push',
    phase: 6,
    phaseName: 'Rating-Oriented Training',
    startDay: 141,
    endDay: 165,
    description: 'Targeted Div.2 C and D problems, constructive reasoning, and combining multiple patterns.',
    prerequisites: ['All Core Topics', 'Contest Experience'],
    keyIdeas: [
      'Constructive problem strategy: analyze small invariants (mod 2, parity, extremes)',
      'Binary search on answer combined with greedy verification',
      'DP with bitmasks or state compression',
    ],
    timeComplexityGuidance: 'Solve 1400-1600 rated problems within 30-45 minutes without editorials.',
    recommendedProblems: [
      { contestId: 1520, index: 'E', name: 'Arranging The Sheep', rating: 1400, tags: ['greedy', 'math'] },
      { contestId: 1538, index: 'C', name: 'Number of Pairs', rating: 1300, tags: ['binary search', 'two pointers'] },
      { contestId: 1551, index: 'C', name: 'Interesting Story', rating: 1400, tags: ['greedy', 'sortings', 'strings'] },
    ],
    commonMistakes: ['Checking editorials too quickly (<20 minutes) instead of trying small hand simulations'],
    externalResources: [{ title: 'CF 1600 Roadmap Guide', url: 'https://codeforces.com/blog/entry/98621' }],
  },
  {
    id: 'p7_final_mastery',
    title: 'Personal Mistake Checklist & Consolidation',
    phase: 7,
    phaseName: 'Final Assessment and Continued Growth',
    startDay: 166,
    endDay: 180,
    description: 'Consolidate the top 10 recurring mistake patterns, complete timed assessment rounds, and finalize your toolbox.',
    prerequisites: ['Full 180-Day Curriculum'],
    keyIdeas: [
      'Pre-submission sanity checklist: 1. int vs long long, 2. edge cases, 3. complexity check, 4. 0 vs 1 based indexing',
      'Self-directed upsolving routine for lifelong rating progress',
    ],
    timeComplexityGuidance: 'Zero unforced errors on 800-1400 problems; high confidence on 1500-1600.',
    recommendedProblems: [
      { contestId: 1374, index: 'D', name: 'Zero Remainder Array', rating: 1400, tags: ['math', 'sortings'] },
      { contestId: 1475, index: 'C', name: 'Ball in Berland', rating: 1400, tags: ['combinatorics', 'graphs'] },
    ],
    commonMistakes: ['Complacency after reaching milestones — consistency is the only way to retain speed'],
    externalResources: [{ title: 'Codeforces Catalog', url: 'https://codeforces.com/problemset' }],
  },
];

export function getPhaseForDay(day: number): PhaseInfo {
  const clampedDay = Math.max(1, Math.min(180, day));
  const found = PHASES.find((p) => clampedDay >= p.startDay && clampedDay <= p.endDay);
  return found || PHASES[0];
}

export function getTopicForDay(day: number): TopicCurriculum {
  const clampedDay = Math.max(1, Math.min(180, day));
  const found = TOPICS.find((t) => clampedDay >= t.startDay && clampedDay <= t.endDay);
  return found || TOPICS[0];
}

/**
 * Generates an adaptive daily plan based on available minutes, day number, and mission mode.
 */
export function generateDailyPlan(
  dayNumber: number,
  mode: MissionMode = 'standard',
  availableMinutes: number = 45,
  weakTopicTitle?: string
): DailyPlan {
  const todayTopic = getTopicForDay(dayNumber);
  const dateStr = new Date().toISOString().split('T')[0];

  const tasks: DailyTask[] = [];

  if (mode === 'minimum') {
    // 5-15 minute recovery mode
    tasks.push({
      id: `task_${dayNumber}_recovery`,
      title: '5-Minute Concept or Mistake Review',
      description: weakTopicTitle
        ? `Review key intuition for "${weakTopicTitle}" or re-read one past mistake note.`
        : `Review the core intuition: "${todayTopic.keyIdeas[0] || todayTopic.title}".`,
      category: 'recovery',
      estimatedMinutes: Math.min(15, availableMinutes),
      completed: false,
      topicId: todayTopic.id,
    });
  } else if (mode === 'deep_work') {
    // Extended practice session (e.g. 75-120 minutes)
    tasks.push({
      id: `task_${dayNumber}_warmup`,
      title: 'Rapid Warmup (Speed Solve)',
      description: 'Solve or dry-run a quick 800-rated problem to get into flow without hesitation.',
      category: 'warmup',
      estimatedMinutes: 10,
      completed: false,
    });
    tasks.push({
      id: `task_${dayNumber}_concept`,
      title: `Deep Concept Study: ${todayTopic.title}`,
      description: `Understand the core ideas, complexity, and common traps for ${todayTopic.title}.`,
      category: 'concept',
      estimatedMinutes: 20,
      completed: false,
      topicId: todayTopic.id,
    });
    const p1 = todayTopic.recommendedProblems[0];
    tasks.push({
      id: `task_${dayNumber}_prob1`,
      title: `Primary Problem: ${p1 ? p1.name : 'Target Problem'}`,
      description: `Target rating ${p1?.rating || 1000}. Work independently for 20 minutes before asking for Hint 1.`,
      category: 'problem',
      estimatedMinutes: 30,
      completed: false,
      problemId: p1 ? `${p1.contestId}${p1.index}` : undefined,
    });
    const p2 = todayTopic.recommendedProblems[1] || todayTopic.recommendedProblems[0];
    tasks.push({
      id: `task_${dayNumber}_prob2`,
      title: `Challenge Problem: ${p2 ? p2.name : 'Second Challenge'}`,
      description: `Target rating ${p2?.rating || 1200}. Test your pattern recognition.`,
      category: 'problem',
      estimatedMinutes: 30,
      completed: false,
      problemId: p2 ? `${p2.contestId}${p2.index}` : undefined,
    });
    tasks.push({
      id: `task_${dayNumber}_review`,
      title: 'Mistake Journal & Reflection',
      description: 'Record any failed attempts, wrong assumptions, or new tricks learned today.',
      category: 'reflection',
      estimatedMinutes: 10,
      completed: false,
    });
  } else {
    // Standard mode (typically 30-60 mins)
    const p1 = todayTopic.recommendedProblems[0];
    tasks.push({
      id: `task_${dayNumber}_concept`,
      title: `Concept: ${todayTopic.title}`,
      description: todayTopic.keyIdeas[0] || 'Review foundational mechanics before coding.',
      category: 'concept',
      estimatedMinutes: Math.round(availableMinutes * 0.25),
      completed: false,
      topicId: todayTopic.id,
    });
    tasks.push({
      id: `task_${dayNumber}_prob1`,
      title: `Today's Mission: ${p1 ? p1.name : 'Core Practice'}`,
      description: `Rating ${p1?.rating || 900}. Follow the 10-step problem solving method.`,
      category: 'problem',
      estimatedMinutes: Math.round(availableMinutes * 0.6),
      completed: false,
      problemId: p1 ? `${p1.contestId}${p1.index}` : undefined,
    });
    tasks.push({
      id: `task_${dayNumber}_reflection`,
      title: 'Session Debrief & Log',
      description: 'Log your verdict, what slowed you down, and update your streak.',
      category: 'reflection',
      estimatedMinutes: Math.max(5, Math.round(availableMinutes * 0.15)),
      completed: false,
    });
  }

  const targetMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    id: `plan_${dayNumber}_${Date.now()}`,
    date: dateStr,
    dayNumber,
    mode,
    targetMinutes,
    actualMinutes: 0,
    tasks,
    status: 'planned',
  };
}

export function calculateCurriculumProgress(currentDay: number, solvedCount: number) {
  const dayProgress = Math.min(100, Math.round((currentDay / 180) * 100));
  const currentPhase = getPhaseForDay(currentDay);
  return {
    dayProgress,
    currentDay,
    totalDays: 180,
    currentPhaseNumber: currentPhase.phase,
    currentPhaseName: currentPhase.name,
    targetRatingBand: currentPhase.targetRatingBand,
    solvedCount,
  };
}
