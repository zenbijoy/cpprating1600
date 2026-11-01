/**
 * Centralized Game & Reward Economy Service for Climb-1600.
 * Handles:
 * - Coin & Crystal Economy (localStorage + Supabase sync)
 * - Daily Login Rewards Calendar & "Interesting Things" (Lore, CS trivia, pro tips)
 * - Problem Wheel / Spinner Bounties (Spin, Accept, Solve, Claim)
 * - Gift Chests & Inventory (Unlocks, Badges, Stickers, Companions)
 * - Logic Games Progress (Stars, High scores, Level completions)
 */

export interface GiftItem {
  id: string;
  title: string;
  type: 'badge' | 'chest' | 'sticker' | 'booster' | 'companion' | 'title';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  unlockedAt: string;
  opened?: boolean;
  valueCoins?: number;
}

export interface SpunBounty {
  id: string;
  problem: {
    contestId: number;
    index: string;
    name: string;
    rating: number;
    tags: string[];
  };
  rewardCoins: number;
  giftChest: {
    title: string;
    rarity: 'rare' | 'epic' | 'legendary';
    icon: string;
  };
  spunAt: string;
  multiplier: number;
  isSolved: boolean;
  isClaimed: boolean;
}

export interface DailyLoginRewardDay {
  day: number;
  coins: number;
  crystals?: number;
  giftTitle: string;
  giftIcon: string;
  giftRarity: 'common' | 'rare' | 'epic' | 'legendary';
  interestingThing: {
    topic: string;
    fact: string;
    funExample: string;
    mindsetTip: string;
  };
}

export interface DailyFortune {
  date: string;
  luckyConcept: string;
  conceptEmoji: string;
  luckyRating: number;
  luckyConstant: string;
  powerBuff: {
    title: string;
    effect: string;
    icon: string;
  };
  humorQuote: string;
  mindsetAdvice: string;
  cracked: boolean;
  rewardCoins: number;
  rewardXp: number;
}

export const DAILY_LOGIN_SCHEDULE: DailyLoginRewardDay[] = [
  {
    day: 1,
    coins: 100,
    crystals: 1,
    giftTitle: 'Coffee-Powered Coder Badge',
    giftIcon: '☕',
    giftRarity: 'common',
    interestingThing: {
      topic: 'Why Arrays Start at Index 0',
      fact: 'Zero-based indexing is not an arbitrary choice: in C and memory architecture, array names are base pointers. `a[i]` literally means `*(a + i * sizeof(elem))`. An offset of 0 gives the very first element directly with zero addition overhead!',
      funExample: 'If a subway station is at distance 0 from your house, you are already standing inside it!',
      mindsetTip: 'Always think in memory offsets when writing two-pointer and sliding window algorithms.',
    },
  },
  {
    day: 2,
    coins: 150,
    crystals: 2,
    giftTitle: 'Apollo 11 Priority Crystal',
    giftIcon: '🚀',
    giftRarity: 'rare',
    interestingThing: {
      topic: 'The Priority Queue that Saved Apollo 11',
      fact: 'Three minutes before landing on the Moon in 1969, the Apollo Guidance Computer threw a 1202 alarm (radar overload). Margaret Hamilton had coded an asynchronous priority scheduler: it dropped low-priority radar calculations and prioritized landing thruster calculations, saving Neil Armstrong from crashing!',
      funExample: 'In real life, a priority queue is an emergency room: a scratch waits, but cardiac arrest jumps to index 0.',
      mindsetTip: 'Greedy algorithms and Priority Queues (Heaps) are how modern operating systems decide which task lives or dies.',
    },
  },
  {
    day: 3,
    coins: 200,
    crystals: 2,
    giftTitle: 'Streak Freeze Shield',
    giftIcon: '🛡️',
    giftRarity: 'rare',
    interestingThing: {
      topic: 'The Magic Number: 0x5f3759df in Quake III',
      fact: 'John Carmack and Gary Tarolli needed lighting vectors calculated 60 times per second in 1999 without modern GPUs. They invented the Fast Inverse Square Root (`1 / sqrt(x)`), interpreting IEEE floating point bits as integers, subtracting from magic constant `0x5f3759df`, and doing a single Newton-Raphson step—running 400% faster than standard division!',
      funExample: 'Bit manipulation isn’t just for bitmasks; it lets you hack mathematical dimensions at near-lightspeed.',
      mindsetTip: 'Never underestimate bitwise shifts (`>> 1` for division by 2, `x & (x - 1)` to clear least-significant bit).',
    },
  },
  {
    day: 4,
    coins: 250,
    crystals: 3,
    giftTitle: 'Mystery Algorithm Gift Box',
    giftIcon: '🎁',
    giftRarity: 'epic',
    interestingThing: {
      topic: 'The Git Bisect Heist: O(log N) Superpower',
      fact: 'If a software project has 100,000 commits and a bug appeared somewhere in the past 3 years, testing every single commit would take months. Binary search (`git bisect`) cuts the search space in half each step: `log2(100,000) ≈ 17` steps! In just 17 checks, the exact offending commit is found.',
      funExample: 'Guessing a number between 1 and 1,000,000 takes at most 20 questions if you always ask "Is it greater than X?"',
      mindsetTip: 'Whenever a problem has a monotonic property (True, True, True, False, False...), think Binary Search on Answer!',
    },
  },
  {
    day: 5,
    coins: 300,
    crystals: 4,
    giftTitle: '2x Rating XP Elixir',
    giftIcon: '🧪',
    giftRarity: 'epic',
    interestingThing: {
      topic: 'How Dijkstra Routes Your Midnight Pizza',
      fact: 'When you order food on an app, the delivery route uses Dijkstra’s or A* search algorithm across a weighted directed graph of thousands of city road segments, accounting for one-way streets, traffic weights, and turn penalties in milliseconds.',
      funExample: 'Dijkstra is like spilling water on a floor: it naturally expands uniformly along the easiest, shortest cracks first.',
      mindsetTip: 'Shortest path on unweighted graph? BFS. Shortest path with non-negative edge weights? Dijkstra with min-heap!',
    },
  },
  {
    day: 6,
    coins: 400,
    crystals: 5,
    giftTitle: 'Golden Key of Logic',
    giftIcon: '🗝️',
    giftRarity: 'epic',
    interestingThing: {
      topic: 'The Psychology of Pac-Man’s 4 Ghost Personalities',
      fact: 'Pac-Man was revolutionary because each ghost used a distinct logic algorithm: Blinky (Red) chases your exact tile. Pinky (Pink) targets 4 tiles ahead of your direction (predictive interception). Inky (Cyan) mirrors Blinky across Pac-Man’s vector (flanking). Clyde (Orange) chases you until within 8 tiles, then cowardly flees to his corner!',
      funExample: 'Simple deterministic rules combine to create the illusion of intelligent, coordinated predator behavior.',
      mindsetTip: 'Break complex game mechanics and system designs into simple independent state machines.',
    },
  },
  {
    day: 7,
    coins: 750,
    crystals: 10,
    giftTitle: 'Mythic Hero: Cyber Samurai & Golden Crown',
    giftIcon: '👑',
    giftRarity: 'legendary',
    interestingThing: {
      topic: 'The Million Dollar Riddle: P vs NP',
      fact: 'Can every problem whose solution can be quickly verified also be quickly solved by a computer? If P = NP, all modern cryptography would collapse overnight, cancer drugs could be solved in seconds, and theorem provers would make mathematicians obsolete. The Clay Mathematics Institute still offers a $1,000,000 bounty for the proof!',
      funExample: 'Verifying a solved Sudoku puzzle takes 5 seconds (NP). Solving an empty 1000x1000 Sudoku from scratch could take longer than the age of the universe (NP-Complete)!',
      mindsetTip: 'Embrace tough problems: every time your brain sweats on an algorithmic challenge, your neural pathways re-wire for real-life masteries.',
    },
  },
];

export interface DailyLoginState {
  streakCount: number;
  lastClaimDate: string | null;
  totalLogins: number;
  history: { date: string; dayIndex: number; coins: number }[];
}

export interface GameProgressRecord {
  gameId: 'pattern_matrix' | 'byte_city' | 'dungeon_bugs';
  starsTotal: number;
  completedLevels: Record<string, { stars: number; highscore: number; completedAt: string }>;
}

const STORAGE_KEYS = {
  COINS: 'climb1600_game_coins',
  CRYSTALS: 'climb1600_game_crystals',
  INVENTORY: 'climb1600_game_inventory',
  SPUN_BOUNTY: 'climb1600_spun_bounty',
  DAILY_LOGIN: 'climb1600_daily_login_v2',
  GAMES_PROGRESS: 'climb1600_games_progress_v2',
  DAILY_FORTUNE: 'climb1600_daily_fortune_v2',
  MASCOT_PET: 'climb1600_mascot_pet_v2',
};

// Safe storage wrapper for cross-environment safety (Browser & Node.js)
const memoryStore = new Map<string, string>();

function safeGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {}
  return memoryStore.get(key) || null;
}

function safeSet(key: string, val: string): void {
  memoryStore.set(key, val);
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, val);
    }
  } catch {}
}

function safeRemove(key: string): void {
  memoryStore.delete(key);
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(key);
    }
  } catch {}
}

export const DAILY_FORTUNES_CATALOG: Omit<DailyFortune, 'date' | 'cracked' | 'rewardCoins' | 'rewardXp'>[] = [
  {
    luckyConcept: 'Prefix Sums & Frequency Arrays',
    conceptEmoji: '🎯',
    luckyRating: 900,
    luckyConstant: '10^9 + 7',
    powerBuff: {
      title: 'Instant Range Query',
      effect: 'Precalculate once, answer queries in O(1) time!',
      icon: '⚡',
    },
    humorQuote: 'Why did the prefix sum cross the road? To answer the range query in O(1) time!',
    mindsetAdvice: 'Spend 2 minutes writing down the cumulative array before touching the keyboard.',
  },
  {
    luckyConcept: 'Two-Pointer Sliding Window',
    conceptEmoji: '🪟',
    luckyRating: 1100,
    luckyConstant: 'N ≤ 2·10^5',
    powerBuff: {
      title: 'Window Expansion Aura',
      effect: 'Zero unnecessary resets. The right pointer only moves right!',
      icon: '🔭',
    },
    humorQuote: "If at first you don't succeed, expand the right pointer and shrink the left.",
    mindsetAdvice: 'Check whether elements must be non-negative before using a sliding window.',
  },
  {
    luckyConcept: 'Binary Search on Answer',
    conceptEmoji: '🔍',
    luckyRating: 1200,
    luckyConstant: 'log₂(10^9) ≈ 30',
    powerBuff: {
      title: 'Monotonic Vision',
      effect: 'If f(mid) is true, eliminate half the universe instantly!',
      icon: '🔮',
    },
    humorQuote: 'Binary search: the only place where being indecisive cuts your workload by half every step.',
    mindsetAdvice: "Can you write a check(mid) boolean predicate? If it's monotonic, Binary Search will conquer it!",
  },
  {
    luckyConcept: 'Monotonic Stack / Queue',
    conceptEmoji: '🥞',
    luckyRating: 1300,
    luckyConstant: 'O(N) Amortized',
    powerBuff: {
      title: 'Next Greater Element Shield',
      effect: 'Every element pushed and popped at most once!',
      icon: '🛡️',
    },
    humorQuote: 'A monotonic stack is like Marie Kondo for your array: if an element does not spark joy, pop it!',
    mindsetAdvice: 'Great for finding the nearest smaller or larger element on either side in single passes.',
  },
  {
    luckyConcept: 'Breadth-First Search (BFS)',
    conceptEmoji: '🌊',
    luckyRating: 1000,
    luckyConstant: 'O(V + E)',
    powerBuff: {
      title: 'Uniform Wave Propagation',
      effect: 'Guarantees shortest path on unweighted graphs every single time!',
      icon: '🧭',
    },
    humorQuote: 'BFS is like pouring water on a tiled floor: it never leaves a neighbor unvisited.',
    mindsetAdvice: 'Always mark nodes visited as soon as you push them to the queue to avoid duplicate visits.',
  },
  {
    luckyConcept: 'Depth-First Search (DFS) & Subtrees',
    conceptEmoji: '🌲',
    luckyRating: 1000,
    luckyConstant: 'Stack Depth ≤ 2·10^5',
    powerBuff: {
      title: 'Deep Explorer Insight',
      effect: 'Traverse tree branches and compute subtree sizes in one clean pass!',
      icon: '🌲',
    },
    humorQuote: 'To understand recursion, you must first understand recursion.',
    mindsetAdvice: 'In C++ competitive programming, beware deep recursion without increasing stack size.',
  },
  {
    luckyConcept: 'Greedy Choice Property',
    conceptEmoji: '💎',
    luckyRating: 1100,
    luckyConstant: 'Sort First, Ask Later',
    powerBuff: {
      title: 'Local Optimum Catalyst',
      effect: 'Sorting by deadlines or endpoints yields global optimality!',
      icon: '✨',
    },
    humorQuote: 'Be greedy in algorithms, generous in life.',
    mindsetAdvice: 'Always prove your greedy choice property or test against small counter-examples.',
  },
  {
    luckyConcept: 'Fast Exponentiation & Modulo',
    conceptEmoji: '🔢',
    luckyRating: 1200,
    luckyConstant: '(A · B) % M',
    powerBuff: {
      title: 'Logarithmic Power Surge',
      effect: 'Compute A^B % M in 30 multiplication operations!',
      icon: '⚡',
    },
    humorQuote: 'Never forget: (a + b) % mod = ((a % mod) + (b % mod)) % mod. Your WA on test 7 misses you.',
    mindsetAdvice: 'Cast to 64-bit integer (long long) before multiplying two modulo values!',
  },
  {
    luckyConcept: 'Disjoint Set Union (DSU)',
    conceptEmoji: '🔗',
    luckyRating: 1300,
    luckyConstant: 'α(N) ≈ 4 (Ackermann)',
    powerBuff: {
      title: 'Connected Realm Binding',
      effect: 'Path compression + rank makes find and union practically instantaneous!',
      icon: '👑',
    },
    humorQuote: 'DSU is the social network of competitive programming: it connects everyone and finds the leader.',
    mindsetAdvice: 'Path compression parent[x] = find(parent[x]) is 3 keystrokes that prevent TLE.',
  },
  {
    luckyConcept: 'Coordinate Compression',
    conceptEmoji: '📐',
    luckyRating: 1200,
    luckyConstant: 'Mapped Range ≤ N',
    powerBuff: {
      title: 'Dimensional Shrink Ray',
      effect: 'Squash coordinates from 10^9 down to 10^5 without losing relative order!',
      icon: '🗜️',
    },
    humorQuote: 'When the universe is 10^9 wide but you only care about 100,000 points, compress the universe.',
    mindsetAdvice: 'std::unique + std::lower_bound in C++ makes coordinate compression a 2-line breeze.',
  },
  {
    luckyConcept: 'Sieve of Eratosthenes',
    conceptEmoji: '📜',
    luckyRating: 1100,
    luckyConstant: 'O(N log log N)',
    powerBuff: {
      title: 'Prime Divination Aegis',
      effect: 'Precalculate all primes up to 10^7 in under 50ms!',
      icon: '🛡️',
    },
    humorQuote: 'Prime numbers are the atoms of arithmetic. Sieve is the periodic table.',
    mindsetAdvice: 'Remember that an integer N has at most one prime factor greater than sqrt(N).',
  },
  {
    luckyConcept: 'Dynamic Programming: 1D State',
    conceptEmoji: '🧱',
    luckyRating: 1200,
    luckyConstant: 'dp[i] = dp[i-1] + dp[i-2]',
    powerBuff: {
      title: 'Subproblem Memorization',
      effect: 'Never calculate the same state twice! Linear memory, instant answers.',
      icon: '🧠',
    },
    humorQuote: 'Those who do not remember the past are condemned to recalculate it without memoization.',
    mindsetAdvice: 'Clearly state the meaning of dp[i] in words before writing the recurrence relation.',
  },
  {
    luckyConcept: 'Dynamic Programming: 0/1 Knapsack',
    conceptEmoji: '🎒',
    luckyRating: 1300,
    luckyConstant: 'Capacity W ≤ 10^5',
    powerBuff: {
      title: 'Optimal Packing Mastery',
      effect: 'Iterate backwards to reuse 1D array space efficiently!',
      icon: '📦',
    },
    humorQuote: 'Life is like a knapsack problem: you cannot take everything, so choose what has highest value per weight.',
    mindsetAdvice: 'Looping backwards prevents using the same item multiple times in 0/1 Knapsack.',
  },
  {
    luckyConcept: 'Bitmask Manipulation',
    conceptEmoji: '🎭',
    luckyRating: 1400,
    luckyConstant: '1 << N where N ≤ 20',
    powerBuff: {
      title: 'Silicon Speed Hack',
      effect: 'Represent subsets of 20 items in a single 32-bit register!',
      icon: '⚙️',
    },
    humorQuote: "There are 10 types of people in the world: those who understand bitwise tricks, and those who don't.",
    mindsetAdvice: 'x & (x - 1) removes the lowest set bit in one single instruction.',
  },
  {
    luckyConcept: 'Difference Arrays (Range Updates)',
    conceptEmoji: '📊',
    luckyRating: 1200,
    luckyConstant: 'diff[l] += x, diff[r+1] -= x',
    powerBuff: {
      title: 'Range Addition Miracle',
      effect: 'Add values to 100,000 ranges in O(1) per update, prefix sum once at the end!',
      icon: '📈',
    },
    humorQuote: 'Working smarter: mark the boundaries today, prefix-sum the whole thing tomorrow.',
    mindsetAdvice: 'The 2D version adds at top-left, subtracts at right+1 and bottom+1, adds at bottom-right+1.',
  },
  {
    luckyConcept: 'Two-Dimensional Grid Simulation',
    conceptEmoji: '🗺️',
    luckyRating: 900,
    luckyConstant: 'dx[] = {0, 0, 1, -1}',
    powerBuff: {
      title: 'Compass Navigation',
      effect: 'Direction arrays prevent messy 4-way switch statements!',
      icon: '🧭',
    },
    humorQuote: 'Always respect the grid boundaries: 0 <= r < R && 0 <= c < C is your sacred shield.',
    mindsetAdvice: 'Combine dx and dy arrays to traverse 4-directions or 8-directions cleanly.',
  },
  {
    luckyConcept: 'Greedy Interval Scheduling',
    conceptEmoji: '⏰',
    luckyRating: 1100,
    luckyConstant: 'Sort by End Time',
    powerBuff: {
      title: 'Time Weaver Focus',
      effect: 'Select maximum non-overlapping intervals with 100% mathematical proof!',
      icon: '⏳',
    },
    humorQuote: 'To maximize your accomplishments, always prioritize what finishes earliest.',
    mindsetAdvice: 'Sorting by end time is the key: it leaves the most room for remaining intervals.',
  },
  {
    luckyConcept: "Floyd's Cycle-Finding Algorithm",
    conceptEmoji: '🐢',
    luckyRating: 1200,
    luckyConstant: 'Tortoise & Hare',
    powerBuff: {
      title: 'Cycle Trapper',
      effect: 'Detect loops in linked lists or state spaces in O(1) extra space!',
      icon: '🐇',
    },
    humorQuote: 'Even if the hare is faster, the tortoise meets him in the cycle.',
    mindsetAdvice: "Used in Pollard's rho algorithm and pseudorandom number generators everywhere.",
  },
  {
    luckyConcept: 'Longest Increasing Subsequence (LIS)',
    conceptEmoji: '📶',
    luckyRating: 1300,
    luckyConstant: 'O(N log N) Patience Sorting',
    powerBuff: {
      title: 'Ascending Surge',
      effect: 'Tails array with binary search (std::lower_bound) finds LIS lightning fast!',
      icon: '🚀',
    },
    humorQuote: "Every day is an element in your life's array: keep building your longest increasing subsequence.",
    mindsetAdvice: "The tails array doesn't hold the sequence itself, but its length is always exact.",
  },
  {
    luckyConcept: 'Climber’s Tenacity & Zen Focus',
    conceptEmoji: '🧘',
    luckyRating: 1600,
    luckyConstant: 'Zero Dread',
    powerBuff: {
      title: 'Specialist Ascendance',
      effect: 'No penalty for wrong attempts in practice; every bug is a milestone in disguise!',
      icon: '🏔️',
    },
    humorQuote: 'The difference between an expert and a beginner is that the expert has failed more times than the beginner has even tried.',
    mindsetAdvice: 'You are only one consistent practice session away from your next rating breakthrough.',
  },
];

export interface MascotPetState {
  lastPetDate: string | null;
  totalPets: number;
}

type Listener = () => void;

class GameRewardService {
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('GameRewardService notification error:', err);
      }
    });
  }

  public resetForTesting() {
    memoryStore.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        Object.values(STORAGE_KEYS).forEach((k) => {
          try {
            localStorage.removeItem(k);
          } catch {}
        });
      }
    } catch {}
    this.notify();
  }

  // =========================================================================
  // 1. COIN & CRYSTAL ECONOMY
  // =========================================================================

  public getCoins(): number {
    const saved = safeGet(STORAGE_KEYS.COINS);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 500; // Starting balance for new coders!
  }

  public getCrystals(): number {
    const saved = safeGet(STORAGE_KEYS.CRYSTALS);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 10;
  }

  public addCoins(amount: number, _reason?: string): number {
    const current = this.getCoins();
    const updated = Math.max(0, current + amount);
    safeSet(STORAGE_KEYS.COINS, String(updated));
    this.notify();
    return updated;
  }

  public spendCoins(amount: number): boolean {
    const current = this.getCoins();
    if (current < amount) return false;
    const updated = current - amount;
    safeSet(STORAGE_KEYS.COINS, String(updated));
    this.notify();
    return true;
  }

  public addCrystals(amount: number): number {
    const current = this.getCrystals();
    const updated = Math.max(0, current + amount);
    safeSet(STORAGE_KEYS.CRYSTALS, String(updated));
    this.notify();
    return updated;
  }

  // =========================================================================
  // 2. INVENTORY & GIFTS
  // =========================================================================

  public getInventory(): GiftItem[] {
    const saved = safeGet(STORAGE_KEYS.INVENTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'starter_badge',
        title: 'Novice Climber',
        type: 'badge',
        icon: '🧗',
        rarity: 'common',
        description: 'Began the ascent toward Codeforces 1600 Specialist!',
        unlockedAt: new Date().toISOString(),
        opened: true,
      },
    ];
  }

  public addGiftToInventory(gift: Omit<GiftItem, 'unlockedAt'>): GiftItem {
    const current = this.getInventory();
    const newItem: GiftItem = {
      ...gift,
      unlockedAt: new Date().toISOString(),
      opened: gift.opened ?? false,
    };
    const updated = [newItem, ...current];
    safeSet(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
    this.notify();
    return newItem;
  }

  public openChest(giftId: string): { coinsAwarded: number; giftItem: GiftItem | null } {
    const current = this.getInventory();
    const item = current.find((g) => g.id === giftId);
    if (!item) return { coinsAwarded: 0, giftItem: null };

    item.opened = true;
    let coinsAwarded = item.valueCoins || 150;
    if (item.rarity === 'rare') coinsAwarded = 250;
    if (item.rarity === 'epic') coinsAwarded = 500;
    if (item.rarity === 'legendary') coinsAwarded = 1000;

    this.addCoins(coinsAwarded, `Opened ${item.title}`);
    safeSet(STORAGE_KEYS.INVENTORY, JSON.stringify(current));
    this.notify();
    return { coinsAwarded, giftItem: item };
  }

  // =========================================================================
  // 3. DAILY LOGIN SYSTEM
  // =========================================================================

  public getDailyLoginState(): DailyLoginState {
    const saved = safeGet(STORAGE_KEYS.DAILY_LOGIN);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      streakCount: 0,
      lastClaimDate: null,
      totalLogins: 0,
      history: [],
    };
  }

  public getTodayDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  public hasClaimedDailyToday(): boolean {
    const state = this.getDailyLoginState();
    return state.lastClaimDate === this.getTodayDateStr();
  }

  public getCurrentDayIndex(): number {
    const state = this.getDailyLoginState();
    return state.streakCount % DAILY_LOGIN_SCHEDULE.length;
  }

  public claimDailyReward(): {
    dayIndex: number;
    reward: DailyLoginRewardDay;
    newCoins: number;
    giftAwarded: GiftItem;
  } {
    const state = this.getDailyLoginState();
    const today = this.getTodayDateStr();

    let newStreak = state.streakCount;
    if (state.lastClaimDate) {
      const last = new Date(state.lastClaimDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const dayIndex = (newStreak - 1) % DAILY_LOGIN_SCHEDULE.length;
    const reward = DAILY_LOGIN_SCHEDULE[dayIndex];

    // Grant coins & crystals
    const newCoins = this.addCoins(reward.coins, `Daily Login Day ${dayIndex + 1}`);
    if (reward.crystals) {
      this.addCrystals(reward.crystals);
    }

    // Add gift item to inventory
    const giftAwarded = this.addGiftToInventory({
      id: `daily_gift_${today}_day${reward.day}`,
      title: reward.giftTitle,
      type: reward.giftRarity === 'legendary' ? 'companion' : 'badge',
      icon: reward.giftIcon,
      rarity: reward.giftRarity,
      description: reward.interestingThing.topic + ': ' + reward.interestingThing.fact,
      opened: true,
      valueCoins: reward.coins,
    });

    const updatedState: DailyLoginState = {
      streakCount: newStreak,
      lastClaimDate: today,
      totalLogins: state.totalLogins + 1,
      history: [
        { date: today, dayIndex, coins: reward.coins },
        ...state.history.slice(0, 30),
      ],
    };

    safeSet(STORAGE_KEYS.DAILY_LOGIN, JSON.stringify(updatedState));
    this.notify();
    return { dayIndex, reward, newCoins, giftAwarded };
  }

  // =========================================================================
  // 4. SPINNER / WHEEL OF DESTINY BOUNTIES
  // =========================================================================

  public getActiveSpunBounty(): SpunBounty | null {
    const saved = safeGet(STORAGE_KEYS.SPUN_BOUNTY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  }

  public setSpunBounty(bounty: SpunBounty) {
    safeSet(STORAGE_KEYS.SPUN_BOUNTY, JSON.stringify(bounty));
    this.notify();
  }

  public claimSpunBountyReward(bountyId: string): {
    coinsAwarded: number;
    giftAwarded: GiftItem;
  } | null {
    const bounty = this.getActiveSpunBounty();
    if (!bounty || bounty.id !== bountyId || bounty.isClaimed) return null;

    bounty.isSolved = true;
    bounty.isClaimed = true;
    this.setSpunBounty(bounty);

    const coinsAwarded = bounty.rewardCoins;
    this.addCoins(coinsAwarded, `Spun Problem Bounty: ${bounty.problem.name}`);

    const giftAwarded = this.addGiftToInventory({
      id: `bounty_chest_${Date.now()}`,
      title: bounty.giftChest.title,
      type: 'chest',
      icon: bounty.giftChest.icon,
      rarity: bounty.giftChest.rarity,
      description: `Earned by spinning the Wheel of Destiny and conquering ${bounty.problem.name} (${bounty.problem.rating})!`,
      opened: false,
      valueCoins: 300,
    });

    this.notify();
    return { coinsAwarded, giftAwarded };
  }

  public cancelActiveBounty() {
    safeRemove(STORAGE_KEYS.SPUN_BOUNTY);
    this.notify();
  }

  // =========================================================================
  // 5. GAMES PROGRESS & STARS
  // =========================================================================

  public getGamesProgress(): Record<string, GameProgressRecord> {
    const saved = safeGet(STORAGE_KEYS.GAMES_PROGRESS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      pattern_matrix: {
        gameId: 'pattern_matrix',
        starsTotal: 0,
        completedLevels: {},
      },
      byte_city: {
        gameId: 'byte_city',
        starsTotal: 0,
        completedLevels: {},
      },
      dungeon_bugs: {
        gameId: 'dungeon_bugs',
        starsTotal: 0,
        completedLevels: {},
      },
    };
  }

  public recordGameLevelComplete(
    gameId: 'pattern_matrix' | 'byte_city' | 'dungeon_bugs',
    levelId: string,
    stars: number,
    score: number
  ): { earnedCoins: number; isFirstClear: boolean; newTotalStars: number } {
    const all = this.getGamesProgress();
    const game = all[gameId] || {
      gameId,
      starsTotal: 0,
      completedLevels: {},
    };

    const prevRecord = game.completedLevels[levelId];
    const isFirstClear = !prevRecord;
    const prevStars = prevRecord?.stars || 0;
    const bestStars = Math.max(prevStars, stars);

    game.completedLevels[levelId] = {
      stars: bestStars,
      highscore: Math.max(prevRecord?.highscore || 0, score),
      completedAt: new Date().toISOString(),
    };

    let total = 0;
    Object.values(game.completedLevels).forEach((lvl) => {
      total += lvl.stars;
    });
    game.starsTotal = total;
    all[gameId] = game;

    safeSet(STORAGE_KEYS.GAMES_PROGRESS, JSON.stringify(all));

    const earnedCoins = isFirstClear ? 150 + stars * 50 : stars * 25;
    this.addCoins(earnedCoins, `Completed ${gameId} level ${levelId}`);

    this.notify();
    return { earnedCoins, isFirstClear, newTotalStars: total };
  }

  // =========================================================================
  // 6. DAILY CODE FORTUNE & LUCKY PROPHECY
  // =========================================================================

  public getDailyFortune(dateStr?: string): DailyFortune {
    const today = dateStr || this.getTodayDateStr();

    // Deterministic index based on date string
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
    }
    const idx = hash % DAILY_FORTUNES_CATALOG.length;
    const base = DAILY_FORTUNES_CATALOG[idx];

    // Check saved cracked status
    const saved = safeGet(STORAGE_KEYS.DAILY_FORTUNE);
    let cracked = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[today]?.cracked) {
          cracked = true;
        }
      } catch {}
    }

    return {
      date: today,
      ...base,
      cracked,
      rewardCoins: 50,
      rewardXp: 25,
    };
  }

  public hasCrackedDailyFortuneToday(): boolean {
    const today = this.getTodayDateStr();
    const saved = safeGet(STORAGE_KEYS.DAILY_FORTUNE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return !!parsed[today]?.cracked;
      } catch {}
    }
    return false;
  }

  public crackDailyFortune(dateStr?: string): {
    fortune: DailyFortune;
    coinsAwarded: number;
    xpAwarded: number;
  } {
    const today = dateStr || this.getTodayDateStr();
    const currentFortune = this.getDailyFortune(today);

    if (currentFortune.cracked) {
      return {
        fortune: currentFortune,
        coinsAwarded: 0,
        xpAwarded: 0,
      };
    }

    const saved = safeGet(STORAGE_KEYS.DAILY_FORTUNE);
    let store: Record<string, { cracked: boolean; crackedAt: string }> = {};
    if (saved) {
      try {
        store = JSON.parse(saved);
      } catch {}
    }

    store[today] = {
      cracked: true,
      crackedAt: new Date().toISOString(),
    };
    safeSet(STORAGE_KEYS.DAILY_FORTUNE, JSON.stringify(store));

    const coinsAwarded = currentFortune.rewardCoins;
    const xpAwarded = currentFortune.rewardXp;
    this.addCoins(coinsAwarded, `Cracked Daily Code Fortune for ${today}`);

    this.notify();
    return {
      fortune: { ...currentFortune, cracked: true },
      coinsAwarded,
      xpAwarded,
    };
  }

  // =========================================================================
  // 7. MASCOT COMPANION PETTING & DAILY LOVE
  // =========================================================================

  public getMascotPetState(): MascotPetState {
    const saved = safeGet(STORAGE_KEYS.MASCOT_PET);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { lastPetDate: null, totalPets: 0 };
  }

  public hasPetMascotToday(): boolean {
    const state = this.getMascotPetState();
    return state.lastPetDate === this.getTodayDateStr();
  }

  public petMascot(): {
    coinsAwarded: number;
    xpAwarded: number;
    message: string;
    isFirstPetToday: boolean;
  } {
    const state = this.getMascotPetState();
    const today = this.getTodayDateStr();
    const isFirstPetToday = state.lastPetDate !== today;

    const messages = [
      "Pat pat! Climby feels super energized and believes in your 1600 climb! 🐾",
      "Purr! ByteCat sharpened your algorithm claws! Ready to pounce on bug-free code! 🐱",
      "Hooray! Turbo Duck quacks approval: 'Every bug is just a step towards mastery!' 🦆",
      "Beep-boop! RoboByte calibrated your syntax receptors: +10% focus boost! 🤖",
      "Whoo! BigBrain Owl affirms: 'Patience and consistency conquer any rating!' 🦉",
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    const updatedState: MascotPetState = {
      lastPetDate: today,
      totalPets: state.totalPets + 1,
    };
    safeSet(STORAGE_KEYS.MASCOT_PET, JSON.stringify(updatedState));

    let coinsAwarded = 0;
    let xpAwarded = 5;
    if (isFirstPetToday) {
      coinsAwarded = 15;
      xpAwarded = 10;
      this.addCoins(coinsAwarded, 'Mascot Daily Pat Bonus');
    }

    this.notify();
    return {
      coinsAwarded,
      xpAwarded,
      message: randomMsg,
      isFirstPetToday,
    };
  }
}

export const gameRewardService = new GameRewardService();
