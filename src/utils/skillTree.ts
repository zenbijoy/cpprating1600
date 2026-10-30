import { CFProblem, MistakeRecord, ProblemAttempt } from '../types';

export type SkillNodeStatus =
  | 'locked_by_prerequisite'
  | 'available'
  | 'learning'
  | 'practicing'
  | 'needs_revision'
  | 'strong';

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  description: string;
  prerequisites: string[]; // IDs of prerequisite topics
  difficultyTier: 1 | 2 | 3 | 4 | 5; // 1: 800-1000, 2: 1000-1200, 3: 1200-1400, 4: 1400-1500, 5: 1500-1600+
  ratingRange: [number, number];
  tags: string[];
  keyConcepts: string[];
  commonPitfalls: string[];
  practiceProblems: {
    beginner: CFProblem;
    intermediate: CFProblem;
    challenging: CFProblem;
  };
}

export interface MasteryBreakdown {
  solvesScore: number; // 0 - 35
  difficultyScore: number; // 0 - 25
  independenceScore: number; // 0 - 20
  revisionScore: number; // 0 - 10
  consistencyScore: number; // 0 - 10
  totalScore: number; // 0 - 100
  formula: string;
}

export interface TopicProgress {
  topicId: string;
  name: string;
  status: SkillNodeStatus;
  masteryScore: number; // 0 to 100
  breakdown: MasteryBreakdown;
  solvedCount: number;
  attemptedCount: number;
  accuracyRate: number; // 0.0 to 1.0
  lastPracticedDate?: string;
  revisionDueCount: number;
  recommendedAction: string;
  userOverrideScore?: number;
}

export const SKILL_TREE_NODES: SkillNode[] = [
  // 1. Implementation
  {
    id: 'implementation',
    name: 'Implementation & Simulation',
    category: 'Core Fundamentals',
    description: 'Direct translation of problem specifications into bug-free code, managing complex rules, and boundary simulations.',
    prerequisites: [],
    difficultyTier: 1,
    ratingRange: [800, 1000],
    tags: ['implementation'],
    keyConcepts: ['1-based vs 0-based coordinates', 'Grid simulation', 'State tracking', 'String formatting'],
    commonPitfalls: ['Off-by-one errors', 'Uninitialized variables in multi-testcases', 'Skipping constraints check'],
    practiceProblems: {
      beginner: { contestId: 231, index: 'A', name: 'Team', rating: 800, tags: ['implementation'] },
      intermediate: { contestId: 282, index: 'A', name: 'Bit++', rating: 800, tags: ['implementation'] },
      challenging: { contestId: 133, index: 'A', name: 'HQ9+', rating: 900, tags: ['implementation'] },
    },
  },

  // 2. Complexity Analysis
  {
    id: 'complexity_analysis',
    name: 'Complexity Analysis & Fast I/O',
    category: 'Core Fundamentals',
    description: 'Analyzing Time/Space asymptotic Big-O bounds and preventing TLE with fast C++ streams.',
    prerequisites: ['implementation'],
    difficultyTier: 1,
    ratingRange: [800, 1000],
    tags: ['implementation', 'math'],
    keyConcepts: ['10^8 operations per second rule', 'O(1) vs O(N) vs O(N log N) vs O(N^2)', 'cin.tie(NULL) fast I/O'],
    commonPitfalls: ['Using endl instead of \\n in tight loops', 'Hidden O(N) calls like strlen(s) inside loop conditions'],
    practiceProblems: {
      beginner: { contestId: 158, index: 'A', name: 'Next Round', rating: 800, tags: ['implementation'] },
      intermediate: { contestId: 546, index: 'A', name: 'Soldier and Bananas', rating: 800, tags: ['math'] },
      challenging: { contestId: 791, index: 'A', name: 'Bear and Big Brother', rating: 800, tags: ['implementation'] },
    },
  },

  // 3. Basic Mathematics
  {
    id: 'basic_mathematics',
    name: 'Basic Mathematics & Parity',
    category: 'Mathematics',
    description: 'Divisibility, parity invariants, ceiling division formulas, and arithmetic progression sums.',
    prerequisites: ['implementation'],
    difficultyTier: 1,
    ratingRange: [800, 1000],
    tags: ['math'],
    keyConcepts: ['Ceiling division: (a + b - 1) / b', 'Odd/even parity invariants', 'Arithmetic progression: n*(n+1)/2'],
    commonPitfalls: ['Integer overflow when computing n*(n+1)', 'Negative modulo: (a % m + m) % m'],
    practiceProblems: {
      beginner: { contestId: 4, index: 'A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'] },
      intermediate: { contestId: 617, index: 'A', name: 'Elephant', rating: 800, tags: ['math'] },
      challenging: { contestId: 1352, index: 'A', name: 'Sum of Round Numbers', rating: 800, tags: ['math'] },
    },
  },

  // 4. Sorting
  {
    id: 'sorting',
    name: 'Sorting & Custom Comparators',
    category: 'Algorithmic Paradigms',
    description: 'Ordering collections to reveal greedy properties, coordinate compression, and custom struct comparators.',
    prerequisites: ['implementation', 'complexity_analysis'],
    difficultyTier: 2,
    ratingRange: [900, 1100],
    tags: ['sortings'],
    keyConcepts: ['std::sort with O(N log N)', 'Strict weak ordering comparators', 'Coordinate compression'],
    commonPitfalls: ['Writing comparators that return true on equality (causes undefined behavior and crashes)'],
    practiceProblems: {
      beginner: { contestId: 405, index: 'A', name: 'Gravity Flip', rating: 900, tags: ['greedy', 'sortings'] },
      intermediate: { contestId: 160, index: 'A', name: 'Twins', rating: 900, tags: ['greedy', 'sortings'] },
      challenging: { contestId: 339, index: 'A', name: 'Helpful Maths', rating: 800, tags: ['greedy', 'strings'] },
    },
  },

  // 5. Binary Search
  {
    id: 'binary_search',
    name: 'Binary Search & Lower/Upper Bound',
    category: 'Search & Navigation',
    description: 'Logarithmic lookup in sorted arrays, std::lower_bound, std::upper_bound, and exact indices.',
    prerequisites: ['sorting'],
    difficultyTier: 2,
    ratingRange: [1000, 1200],
    tags: ['binary search'],
    keyConcepts: ['lower_bound (>= x) vs upper_bound (> x)', 'Monotonic range invariants', 'Midpoint overflow: l + (r - l) / 2'],
    commonPitfalls: ['Infinite loop when l = mid instead of l = mid + 1', 'Off-by-one when subtracting iterators'],
    practiceProblems: {
      beginner: { contestId: 706, index: 'B', name: 'Interesting drink', rating: 1100, tags: ['binary search', 'dp'] },
      intermediate: { contestId: 279, index: 'B', name: 'Books', rating: 1100, tags: ['two pointers', 'binary search'] },
      challenging: { contestId: 1613, index: 'C', name: 'Poisoned Dagger', rating: 1200, tags: ['binary search'] },
    },
  },

  // 6. Binary Search on Answer
  {
    id: 'binary_search_answer',
    name: 'Binary Search on Answer',
    category: 'Search & Navigation',
    description: 'Transforming optimization problems ("find min X such that P(X)") into monotonic feasibility checks.',
    prerequisites: ['binary_search'],
    difficultyTier: 3,
    ratingRange: [1200, 1400],
    tags: ['binary search'],
    keyConcepts: ['Predicate function check(x)', 'Monotonicity condition (False...False True...True)', 'Wide bounds (0 to 10^18)'],
    commonPitfalls: ['Insufficient upper bound for r (e.g. 10^9 when answer can be 10^18)', 'Non-monotonic predicate logic'],
    practiceProblems: {
      beginner: { contestId: 1613, index: 'C', name: 'Poisoned Dagger', rating: 1200, tags: ['binary search'] },
      intermediate: { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
      challenging: { contestId: 1475, index: 'E', name: 'Advertising Agency', rating: 1500, tags: ['combinatorics', 'sortings'] },
    },
  },

  // 7. Two Pointers
  {
    id: 'two_pointers',
    name: 'Two Pointers & Sliding Window',
    category: 'Algorithmic Paradigms',
    description: 'Subarray optimization, sliding window constraints, and paired search with linear O(N) total pointer moves.',
    prerequisites: ['sorting'],
    difficultyTier: 2,
    ratingRange: [1000, 1200],
    tags: ['two pointers'],
    keyConcepts: ['Expanding right pointer, contracting left pointer', 'Monotonic window properties', 'O(N) amortized complexity'],
    commonPitfalls: ['Window state not properly updated when shrinking left pointer', 'Right pointer out-of-bounds check'],
    practiceProblems: {
      beginner: { contestId: 279, index: 'B', name: 'Books', rating: 1100, tags: ['two pointers', 'binary search'] },
      intermediate: { contestId: 1462, index: 'C', name: 'Unique Number', rating: 900, tags: ['greedy'] },
      challenging: { contestId: 1352, index: 'D', name: 'Alice, Bob and Candies', rating: 1300, tags: ['implementation', 'two pointers'] },
    },
  },

  // 8. Prefix Sums
  {
    id: 'prefix_sums',
    name: 'Prefix Sums & Difference Arrays',
    category: 'Data Structures',
    description: 'Range sum queries in O(1) time and range updates with difference arrays.',
    prerequisites: ['implementation'],
    difficultyTier: 2,
    ratingRange: [1000, 1200],
    tags: ['prefix sums', 'dp'],
    keyConcepts: ['pref[i] = pref[i-1] + a[i]', 'Range query: pref[r] - pref[l-1]', 'Difference array diff[l]+=v, diff[r+1]-=v'],
    commonPitfalls: ['Integer overflow when accumulating sums (must use long long)', '1-based indexing confusion at index 0'],
    practiceProblems: {
      beginner: { contestId: 313, index: 'B', name: 'Ilya and Queries', rating: 1100, tags: ['dp', 'prefix sums'] },
      intermediate: { contestId: 1374, index: 'C', name: 'Move Brackets', rating: 1000, tags: ['greedy'] },
      challenging: { contestId: 1285, index: 'B', name: 'Just Eat It!', rating: 1300, tags: ['dp', 'greedy'] },
    },
  },

  // 9. Greedy Algorithms
  {
    id: 'greedy_algorithms',
    name: 'Greedy Algorithms & Exchange Arguments',
    category: 'Algorithmic Paradigms',
    description: 'Making locally optimal choices that lead to globally optimal solutions, backed by exchange arguments.',
    prerequisites: ['sorting'],
    difficultyTier: 2,
    ratingRange: [1000, 1300],
    tags: ['greedy'],
    keyConcepts: ['Greedy choice property', 'Exchange argument proofs', 'Sorting before picking'],
    commonPitfalls: ['Assuming greedy is correct without testing counterexamples', 'Greedy failing where DP is required'],
    practiceProblems: {
      beginner: { contestId: 1520, index: 'E', name: 'Arranging The Sheep', rating: 1400, tags: ['greedy', 'math'] },
      intermediate: { contestId: 1551, index: 'C', name: 'Interesting Story', rating: 1400, tags: ['greedy', 'sortings', 'strings'] },
      challenging: { contestId: 545, index: 'C', name: 'Woodcutters', rating: 1500, tags: ['dp', 'greedy'] },
    },
  },

  // 10. Data Structures: Sets & Maps
  {
    id: 'sets_and_maps',
    name: 'Sets, Maps & Frequency Tables',
    category: 'Data Structures',
    description: 'Hash tables and balanced BSTs for frequency counting, element uniqueness, and dynamic order tracking.',
    prerequisites: ['implementation', 'complexity_analysis'],
    difficultyTier: 2,
    ratingRange: [1000, 1300],
    tags: ['data structures'],
    keyConcepts: ['std::map (O(log N)) vs std::unordered_map (O(1) average)', 'std::multiset for sliding maximums', 'Hash collision hacking'],
    commonPitfalls: ['Unordered_map worst-case O(N^2) anti-hash tests on Codeforces (use custom hash)'],
    practiceProblems: {
      beginner: { contestId: 4, index: 'C', name: 'Registration System', rating: 1200, tags: ['data structures', 'hashing'] },
      intermediate: { contestId: 1374, index: 'D', name: 'Zero Remainder Array', rating: 1400, tags: ['math', 'sortings'] },
      challenging: { contestId: 1472, index: 'D', name: 'Even-Odd Game', rating: 1200, tags: ['greedy', 'sortings'] },
    },
  },

  // 11. Stacks & Queues
  {
    id: 'stacks_and_queues',
    name: 'Stacks, Queues & Monotonic Deque',
    category: 'Data Structures',
    description: 'LIFO and FIFO operations, balanced brackets matching, and next greater element using monotonic stacks.',
    prerequisites: ['implementation'],
    difficultyTier: 2,
    ratingRange: [1100, 1300],
    tags: ['data structures'],
    keyConcepts: ['Bracket matching invariant', 'Monotonic stack for Next Greater Element in O(N)', 'Deque sliding window'],
    commonPitfalls: ['Popping from empty stack (segmentation fault)', 'Not clearing stack across test cases'],
    practiceProblems: {
      beginner: { contestId: 1374, index: 'C', name: 'Move Brackets', rating: 1000, tags: ['greedy'] },
      intermediate: { contestId: 5, index: 'C', name: 'Longest Regular Bracket Sequence', rating: 1900, tags: ['dp', 'data structures'] },
      challenging: { contestId: 279, index: 'B', name: 'Books', rating: 1100, tags: ['two pointers'] },
    },
  },

  // 12. Recursion
  {
    id: 'recursion',
    name: 'Recursion & Divide and Conquer',
    category: 'Algorithmic Paradigms',
    description: 'Formulating solutions via subproblems, base cases, call stacks, and divide-and-conquer recurrences.',
    prerequisites: ['implementation'],
    difficultyTier: 2,
    ratingRange: [1100, 1300],
    tags: ['divide and conquer'],
    keyConcepts: ['Base cases and termination', 'Recursion call stack depth', 'Merge sort paradigm'],
    commonPitfalls: ['Stack overflow from recursing 10^5 times without tail call optimization', 'Missing return value'],
    practiceProblems: {
      beginner: { contestId: 189, index: 'A', name: 'Cut Ribbon', rating: 1300, tags: ['dp'] },
      intermediate: { contestId: 1352, index: 'E', name: 'Special Elements', rating: 1300, tags: ['brute force'] },
      challenging: { contestId: 520, index: 'B', name: 'Two Buttons', rating: 1400, tags: ['dfs and similar'] },
    },
  },

  // 13. Backtracking
  {
    id: 'backtracking',
    name: 'Backtracking & Pruning',
    category: 'Search & Navigation',
    description: 'Systematic exploration of configuration spaces with early prune conditions (Sudoku, N-Queens).',
    prerequisites: ['recursion'],
    difficultyTier: 3,
    ratingRange: [1200, 1400],
    tags: ['dfs and similar', 'brute force'],
    keyConcepts: ['Choose -> Explore -> Unchoose state pattern', 'Pruning branches that violate constraints', 'Bitmask state'],
    commonPitfalls: ['Forgetting to undo the state change before returning', 'Exponential 2^N explosion without branch cutting'],
    practiceProblems: {
      beginner: { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
      intermediate: { contestId: 1475, index: 'B', name: 'New Year\'s Number', rating: 900, tags: ['math'] },
      challenging: { contestId: 1352, index: 'G', name: 'Special Permutation', rating: 1400, tags: ['constructive algorithms'] },
    },
  },

  // 14. Graph Traversal: BFS & DFS
  {
    id: 'bfs_dfs',
    name: 'Graph Traversal (BFS & DFS)',
    category: 'Graphs & Trees',
    description: 'Adjacency lists, connected components, cycle detection, bipartite testing, and shortest path in unweighted graphs.',
    prerequisites: ['stacks_and_queues', 'recursion'],
    difficultyTier: 3,
    ratingRange: [1200, 1400],
    tags: ['dfs and similar', 'graphs'],
    keyConcepts: ['Adjacency list vector<vector<int>> adj', 'visited[] array guard', 'Queue BFS for shortest path', 'Cycle check'],
    commonPitfalls: ['Forgetting to mark node visited BEFORE pushing to queue in BFS (causes duplicate queue states)', '1-based node indexing'],
    practiceProblems: {
      beginner: { contestId: 520, index: 'B', name: 'Two Buttons', rating: 1400, tags: ['dfs and similar', 'graphs'] },
      intermediate: { contestId: 277, index: 'A', name: 'Learning Languages', rating: 1400, tags: ['dsu', 'dfs and similar'] },
      challenging: { contestId: 115, index: 'A', name: 'Party', rating: 900, tags: ['graphs', 'trees'] },
    },
  },

  // 15. Trees
  {
    id: 'trees',
    name: 'Trees & Tree DP Fundamentals',
    category: 'Graphs & Trees',
    description: 'Tree properties, root-directed DFS, subtree sizes, tree diameters, and ancestor queries.',
    prerequisites: ['bfs_dfs'],
    difficultyTier: 4,
    ratingRange: [1400, 1500],
    tags: ['trees', 'dfs and similar'],
    keyConcepts: ['Tree has N-1 edges and no cycles', 'DFS with (u, parent) avoiding visited array', 'Subtree dynamic programming'],
    commonPitfalls: ['Assuming tree is rooted at 1 when root is arbitrary', 'Stack overflow on long line trees (use manual stack or increase limit)'],
    practiceProblems: {
      beginner: { contestId: 580, index: 'C', name: 'Kefa and Park', rating: 1500, tags: ['dfs and similar', 'trees'] },
      intermediate: { contestId: 115, index: 'A', name: 'Party', rating: 900, tags: ['graphs', 'trees'] },
      challenging: { contestId: 1336, index: 'A', name: 'Linova and Kingdom', rating: 1600, tags: ['dfs and similar', 'greedy', 'trees'] },
    },
  },

  // 16. Shortest Paths
  {
    id: 'shortest_paths',
    name: 'Shortest Paths (Dijkstra)',
    category: 'Graphs & Trees',
    description: 'Single-source shortest path on weighted non-negative graphs using priority queues in O((V + E) log V).',
    prerequisites: ['bfs_dfs'],
    difficultyTier: 4,
    ratingRange: [1400, 1600],
    tags: ['graphs', 'shortest paths'],
    keyConcepts: ['priority_queue<pair<long long, int>, vector<...>, greater<...>>', 'Relaxation condition: dist[v] > dist[u] + w', 'Early continue if d > dist[u]'],
    commonPitfalls: ['Integer overflow on edge weight accumulations (dist must be long long)', 'Negative edge weights causing infinite loops'],
    practiceProblems: {
      beginner: { contestId: 20, index: 'C', name: 'Dijkstra?', rating: 1900, tags: ['graphs', 'shortest paths'] },
      intermediate: { contestId: 520, index: 'B', name: 'Two Buttons', rating: 1400, tags: ['dfs and similar', 'graphs'] },
      challenging: { contestId: 59, index: 'E', name: 'Shortest Path', rating: 2000, tags: ['graphs', 'shortest paths'] },
    },
  },

  // 17. Dynamic Programming
  {
    id: 'dynamic_programming',
    name: 'Dynamic Programming (1D & 2D)',
    category: 'Dynamic Programming',
    description: 'State design, optimal substructure, transitions, memoization, and space-optimized tabulation.',
    prerequisites: ['recursion', 'prefix_sums'],
    difficultyTier: 3,
    ratingRange: [1200, 1500],
    tags: ['dp'],
    keyConcepts: ['State definition: what does dp[i][j] represent?', 'Base cases dp[0]', 'Transition: optimal choice among predecessors', 'Knapsack paradigm'],
    commonPitfalls: ['Wrong computation order (using uncomputed states)', 'Memory limit exceeded on 2D table (reduce to 1D rolling array)'],
    practiceProblems: {
      beginner: { contestId: 189, index: 'A', name: 'Cut Ribbon', rating: 1300, tags: ['dp'] },
      intermediate: { contestId: 455, index: 'A', name: 'Boredom', rating: 1500, tags: ['dp'] },
      challenging: { contestId: 545, index: 'C', name: 'Woodcutters', rating: 1500, tags: ['dp', 'greedy'] },
    },
  },

  // 18. Number Theory
  {
    id: 'number_theory',
    name: 'Number Theory (Primes, GCD & Modular Arithmetic)',
    category: 'Mathematics',
    description: 'GCD via Euclidean algorithm, Sieve of Eratosthenes, prime factorization, and modular inverse using Fermat\'s Little Theorem.',
    prerequisites: ['basic_mathematics'],
    difficultyTier: 3,
    ratingRange: [1200, 1400],
    tags: ['number theory', 'math'],
    keyConcepts: ['std::gcd', 'Sieve of Eratosthenes in O(N log log N)', 'Modular exponentiation in O(log P)', 'Fermat Little Theorem: a^(p-2) % p'],
    commonPitfalls: ['Modulo before subtraction: (a - b) % M can be negative! Must do ((a - b) % M + M) % M', 'Testing primality up to N instead of sqrt(N)'],
    practiceProblems: {
      beginner: { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['math'] },
      intermediate: { contestId: 1374, index: 'D', name: 'Zero Remainder Array', rating: 1400, tags: ['math'] },
      challenging: { contestId: 1475, index: 'B', name: 'New Year\'s Number', rating: 900, tags: ['math'] },
    },
  },

  // 19. Combinatorics
  {
    id: 'combinatorics',
    name: 'Combinatorics & Stars and Bars',
    category: 'Mathematics',
    description: 'Permutations, combinations nCr, Pascal\'s identity, precomputed factorials modulo 10^9+7, and stars-and-bars.',
    prerequisites: ['number_theory'],
    difficultyTier: 4,
    ratingRange: [1400, 1600],
    tags: ['combinatorics', 'math'],
    keyConcepts: ['nCr = fact[n] * invFact[r] * invFact[n-r] % MOD', 'Precomputing factorials in O(N)', 'Inclusion-Exclusion Principle'],
    commonPitfalls: ['Division before modulo (must multiply by modular inverse!)', 'r > n boundary returning non-zero'],
    practiceProblems: {
      beginner: { contestId: 1475, index: 'E', name: 'Advertising Agency', rating: 1500, tags: ['combinatorics', 'sortings'] },
      intermediate: { contestId: 1352, index: 'B', name: 'Same Parity Summands', rating: 1200, tags: ['math'] },
      challenging: { contestId: 1520, index: 'E', name: 'Arranging The Sheep', rating: 1400, tags: ['math'] },
    },
  },

  // 20. Bit Manipulation
  {
    id: 'bit_manipulation',
    name: 'Bit Manipulation & Bitmasks',
    category: 'Core Fundamentals',
    description: 'Bitwise AND/OR/XOR/NOT, bit shifts, checking k-th bit, popcount, and iterating over subsets.',
    prerequisites: ['basic_mathematics'],
    difficultyTier: 2,
    ratingRange: [1100, 1300],
    tags: ['bitmasks'],
    keyConcepts: ['(1 << k) vs (1LL << k) for 64-bit', '__builtin_popcountll', 'XOR invariant: x ^ x = 0', 'Checking bit: (x >> k) & 1'],
    commonPitfalls: ['Operator precedence: `1 << k + 1` evaluates as `1 << (k + 1)`!', '1 << 35 overflows 32-bit int! Must use 1LL << 35'],
    practiceProblems: {
      beginner: { contestId: 1520, index: 'B', name: 'Ordinary Numbers', rating: 800, tags: ['math'] },
      intermediate: { contestId: 1352, index: 'E', name: 'Special Elements', rating: 1300, tags: ['brute force'] },
      challenging: { contestId: 1613, index: 'C', name: 'Poisoned Dagger', rating: 1200, tags: ['binary search'] },
    },
  },

  // 21. String Algorithms
  {
    id: 'string_algorithms',
    name: 'String Algorithms & Palindromes',
    category: 'Strings',
    description: 'String manipulation, palindromic checks, frequency counting, and string hashing fundamentals.',
    prerequisites: ['implementation'],
    difficultyTier: 2,
    ratingRange: [900, 1200],
    tags: ['strings'],
    keyConcepts: ['char arithmetic: c - \'a\'', 'std::string operations & substr O(N) cost', 'Palindrome two pointers'],
    commonPitfalls: ['String concatenation `s = s + c` creating O(N^2) copies (use `s += c` or `push_back`)'],
    practiceProblems: {
      beginner: { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
      intermediate: { contestId: 112, index: 'A', name: 'Petya and Strings', rating: 800, tags: ['strings'] },
      challenging: { contestId: 236, index: 'A', name: 'Boy or Girl', rating: 800, tags: ['strings'] },
    },
  },

  // 22. Disjoint Set Union (DSU)
  {
    id: 'dsu',
    name: 'Disjoint Set Union (DSU / Union-Find)',
    category: 'Data Structures',
    description: 'Nearly O(1) connected components, path compression, and union by rank/size.',
    prerequisites: ['bfs_dfs'],
    difficultyTier: 4,
    ratingRange: [1300, 1500],
    tags: ['dsu'],
    keyConcepts: ['find(x) with path compression', 'union_sets(a, b) with size tracking', 'Detecting cycles in undirected graphs'],
    commonPitfalls: ['Forgetting path compression (turns O(alpha(N)) into O(N))', 'Connecting parent to non-root'],
    practiceProblems: {
      beginner: { contestId: 277, index: 'A', name: 'Learning Languages', rating: 1400, tags: ['dsu', 'dfs and similar'] },
      intermediate: { contestId: 25, index: 'D', name: 'Roads not only in Berland', rating: 1800, tags: ['dsu', 'graphs'] },
      challenging: { contestId: 1167, index: 'C', name: 'News Distribution', rating: 1200, tags: ['dfs and similar', 'dsu'] },
    },
  },

  // 23. Basic Constructive Algorithms
  {
    id: 'constructive_algorithms',
    name: 'Constructive Algorithms & Invariants',
    category: 'Algorithmic Paradigms',
    description: 'Designing deterministic patterns and constructions satisfying strict properties without brute force.',
    prerequisites: ['basic_mathematics', 'greedy_algorithms'],
    difficultyTier: 3,
    ratingRange: [1200, 1500],
    tags: ['constructive algorithms'],
    keyConcepts: ['Small N pattern exploration', 'Parity coloring (chessboard / alternating)', 'Extremal principle'],
    commonPitfalls: ['Trying every permutation when a direct regular pattern exists', 'Failing on odd vs even N'],
    practiceProblems: {
      beginner: { contestId: 1335, index: 'D', name: 'Anti-Sudoku', rating: 1300, tags: ['constructive algorithms'] },
      intermediate: { contestId: 1352, index: 'G', name: 'Special Permutation', rating: 1400, tags: ['constructive algorithms'] },
      challenging: { contestId: 1374, index: 'D', name: 'Zero Remainder Array', rating: 1400, tags: ['constructive algorithms', 'math'] },
    },
  },
];

/**
 * Calculates a transparent, fair mastery score for a topic node.
 * Formula:
 * - Solves Score: up to 35 points (gradual curve, requires multiple solves, avoids instant 100% on 1 solve)
 * - Difficulty Factor: up to 25 points (solves at or above target tier/rating)
 * - Independence: up to 20 points (penalizes hint dependency, rewards self-sufficiency)
 * - Revision Retention: up to 10 points (mistakes mastered vs scheduled)
 * - Consistency/Contest: up to 10 points (recent solve velocity)
 */
export function calculateTopicMastery(
  node: SkillNode,
  attempts: ProblemAttempt[],
  mistakes: MistakeRecord[],
  userRating: number = 1000,
  userOverrideScore?: number
): TopicProgress {
  if (userOverrideScore !== undefined && userOverrideScore >= 0 && userOverrideScore <= 100) {
    const status: SkillNodeStatus =
      userOverrideScore >= 70
        ? 'strong'
        : userOverrideScore >= 40
        ? 'practicing'
        : userOverrideScore > 0
        ? 'learning'
        : 'available';

    return {
      topicId: node.id,
      name: node.name,
      status,
      masteryScore: userOverrideScore,
      breakdown: {
        solvesScore: Math.round(userOverrideScore * 0.35),
        difficultyScore: Math.round(userOverrideScore * 0.25),
        independenceScore: Math.round(userOverrideScore * 0.20),
        revisionScore: Math.round(userOverrideScore * 0.10),
        consistencyScore: Math.round(userOverrideScore * 0.10),
        totalScore: userOverrideScore,
        formula: 'Manual user override classification applied.',
      },
      solvedCount: 0,
      attemptedCount: 0,
      accuracyRate: 1.0,
      revisionDueCount: 0,
      recommendedAction: `Manual override set to ${userOverrideScore}%. Practice ${node.name} to advance.`,
      userOverrideScore,
    };
  }

  // Filter attempts matching this topic's tags or explicitly named problems
  const matchedAttempts = attempts.filter((att) => {
    if (!att.tags) return false;
    const hasTag = att.tags.some((t) => node.tags.includes(t.toLowerCase()));
    const isCuratedProblem =
      (node.practiceProblems.beginner.contestId === att.contestId && node.practiceProblems.beginner.index === att.index) ||
      (node.practiceProblems.intermediate.contestId === att.contestId && node.practiceProblems.intermediate.index === att.index) ||
      (node.practiceProblems.challenging.contestId === att.contestId && node.practiceProblems.challenging.index === att.index);
    return hasTag || isCuratedProblem;
  });

  const solvedAttempts = matchedAttempts.filter(
    (att) => att.outcome === 'solved_independently' || att.outcome === 'solved_with_hints' || att.officialVerdict === 'OK'
  );

  const attemptedCount = matchedAttempts.length;
  const solvedCount = solvedAttempts.length;
  const accuracyRate = attemptedCount > 0 ? solvedCount / attemptedCount : 0;

  // 1. Solves Score (0 to 35 pts)
  // 1 solve = 12pts, 2 solves = 20pts, 3 solves = 27pts, 4+ solves = 35pts
  let solvesScore = 0;
  if (solvedCount >= 4) solvesScore = 35;
  else if (solvedCount === 3) solvesScore = 27;
  else if (solvedCount === 2) solvesScore = 20;
  else if (solvedCount === 1) solvesScore = 12;

  // 2. Difficulty Score (0 to 25 pts)
  // Rewards solving problems near or above node.ratingRange[0]
  let difficultyScore = 0;
  if (solvedCount > 0) {
    const avgSolvedRating =
      solvedAttempts.reduce((acc, curr) => acc + (curr.rating || node.ratingRange[0]), 0) / solvedCount;
    const tierTarget = node.ratingRange[0];
    const diffRatio = Math.min(1.2, Math.max(0.5, avgSolvedRating / tierTarget));
    difficultyScore = Math.min(25, Math.round(25 * (diffRatio / 1.1)));
  }

  // 3. Independence Score (0 to 20 pts)
  // Independent solves get full score; hint levels reduce points
  let independenceScore = 0;
  if (solvedCount > 0) {
    let independencePoints = 0;
    solvedAttempts.forEach((a) => {
      if (a.outcome === 'solved_independently' || a.highestHintLevel === 0) {
        independencePoints += 1.0;
      } else if (a.highestHintLevel <= 2) {
        independencePoints += 0.7;
      } else if (a.highestHintLevel <= 4) {
        independencePoints += 0.4;
      } else {
        independencePoints += 0.2;
      }
    });
    const avgIndependence = independencePoints / solvedCount;
    independenceScore = Math.min(20, Math.round(avgIndependence * 20));
  }

  // 4. Revision Score (0 to 10 pts)
  // Matched mistakes that have been reviewed/mastered
  const matchedMistakes = mistakes.filter((m) =>
    m.tags.some((t) => node.tags.includes(t.toLowerCase()))
  );
  let revisionScore = 0;
  const dueMistakes = matchedMistakes.filter((m) => m.status === 'due');
  if (matchedMistakes.length > 0) {
    const masteredCount = matchedMistakes.filter((m) => m.status === 'mastered').length;
    revisionScore = Math.min(10, Math.round((masteredCount / matchedMistakes.length) * 10));
    if (dueMistakes.length > 0) {
      revisionScore = Math.max(0, revisionScore - 4);
    }
  } else if (solvedCount > 0) {
    // If user solved problems in this topic with 0 mistakes logged, award full retention credit
    revisionScore = 10;
  }

  // 5. Consistency Score (0 to 10 pts)
  // Recent solves in the last 14 days
  let consistencyScore = 0;
  let lastPracticedDate: string | undefined = undefined;
  if (matchedAttempts.length > 0) {
    // Sort by startedAt descending
    const sorted = [...matchedAttempts].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    lastPracticedDate = sorted[0].startedAt.slice(0, 10);
    const daysSince = Math.floor(
      (Date.now() - new Date(sorted[0].startedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 7) consistencyScore = 10;
    else if (daysSince <= 14) consistencyScore = 6;
    else if (daysSince <= 30) consistencyScore = 3;
    else consistencyScore = 1;
  }

  const totalScore = Math.min(100, solvesScore + difficultyScore + independenceScore + revisionScore + consistencyScore);

  const formula = `Mastery (${totalScore}%) = Solves (${solvesScore}/35) + Difficulty (${difficultyScore}/25) + Independence (${independenceScore}/20) + Retention (${revisionScore}/10) + Recency (${consistencyScore}/10)`;

  // Determine Status
  let status: SkillNodeStatus = 'available';
  if (dueMistakes.length > 0 && totalScore > 30) {
    status = 'needs_revision';
  } else if (totalScore >= 70) {
    status = 'strong';
  } else if (totalScore >= 40) {
    status = 'practicing';
  } else if (totalScore > 0 || attemptedCount > 0) {
    status = 'learning';
  } else {
    status = 'available';
  }

  let recommendedAction = `Begin by solving ${node.practiceProblems.beginner.name} (${node.practiceProblems.beginner.rating || 800}).`;
  if (status === 'needs_revision') {
    recommendedAction = `Review ${dueMistakes.length} due mistake cards on ${node.name} before starting new problems.`;
  } else if (status === 'strong') {
    recommendedAction = `Mastery solid (${totalScore}%). Advance to next connected prerequisite topic or try challenging problem.`;
  } else if (status === 'practicing') {
    recommendedAction = `Solve ${node.practiceProblems.intermediate.name} (${node.practiceProblems.intermediate.rating || 1200}) without hints to cross 70%.`;
  } else if (status === 'learning') {
    recommendedAction = `Complete beginner problem and trace edge cases manually to cement fundamentals.`;
  }

  return {
    topicId: node.id,
    name: node.name,
    status,
    masteryScore: totalScore,
    breakdown: {
      solvesScore,
      difficultyScore,
      independenceScore,
      revisionScore,
      consistencyScore,
      totalScore,
      formula,
    },
    solvedCount,
    attemptedCount,
    accuracyRate,
    lastPracticedDate,
    revisionDueCount: dueMistakes.length,
    recommendedAction,
  };
}

/**
 * Checks whether prerequisites for a topic node are satisfied or soft-locked.
 * Note: Never strictly blocks the user, but highlights dependency health.
 */
export function checkPrerequisitesStatus(
  nodeId: string,
  progressMap: Map<string, TopicProgress>
): { satisfied: boolean; missingPrereqs: string[] } {
  const node = SKILL_TREE_NODES.find((n) => n.id === nodeId);
  if (!node || node.prerequisites.length === 0) {
    return { satisfied: true, missingPrereqs: [] };
  }

  const missing: string[] = [];
  node.prerequisites.forEach((pId) => {
    const prog = progressMap.get(pId);
    // Prerequisite considered satisfied if mastery >= 40 (practicing or strong)
    if (!prog || prog.masteryScore < 40) {
      const pNode = SKILL_TREE_NODES.find((n) => n.id === pId);
      missing.push(pNode ? pNode.name : pId);
    }
  });

  return {
    satisfied: missing.length === 0,
    missingPrereqs: missing,
  };
}

/**
 * Recommends the next optimal learning sequence of topics based on weak or missing prerequisites.
 */
export function recommendNextLearningTopics(
  progressMap: Map<string, TopicProgress>
): { topic: SkillNode; progress: TopicProgress; rationale: string }[] {
  const recommendations: { topic: SkillNode; progress: TopicProgress; rationale: string }[] = [];

  for (const node of SKILL_TREE_NODES) {
    const prog = progressMap.get(node.id);
    if (!prog) continue;

    // 1. Revision urgency takes top priority
    if (prog.status === 'needs_revision') {
      recommendations.push({
        topic: node,
        progress: prog,
        rationale: `Needs urgent revision: ${prog.revisionDueCount} mistake cards are due for spaced repetition.`,
      });
      continue;
    }

    // 2. Ready for practice (prerequisites satisfied, but mastery < 70)
    const prereqCheck = checkPrerequisitesStatus(node.id, progressMap);
    if (prereqCheck.satisfied && prog.masteryScore < 70) {
      const rationale =
        prog.masteryScore === 0
          ? `All prerequisites met! Excellent topic to unlock next.`
          : `Currently at ${prog.masteryScore}% mastery. Solve intermediate challenges to reach Strong status.`;
      recommendations.push({
        topic: node,
        progress: prog,
        rationale,
      });
    }
  }

  // Sort by lowest mastery first, prioritizing nodes that have some prerequisites completed
  recommendations.sort((a, b) => {
    if (a.progress.status === 'needs_revision' && b.progress.status !== 'needs_revision') return -1;
    if (b.progress.status === 'needs_revision' && a.progress.status !== 'needs_revision') return 1;
    return a.topic.difficultyTier - b.topic.difficultyTier || a.progress.masteryScore - b.progress.masteryScore;
  });

  return recommendations.slice(0, 5);
}
