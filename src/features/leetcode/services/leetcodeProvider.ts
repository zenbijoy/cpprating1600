import {
  LeetCodeDifficulty,
  LeetCodeProblem,
  LeetCodeProblemFilter,
  PaginatedLeetCodeProblems,
  LeetCodeTopicTag,
  LeetCodeUserProfile,
  LeetCodeDailyChallenge,
} from '../types/leetcode.types';
import { CURATED_LEETCODE_PROBLEMS } from '../data/curatedLeetcodeProblems';

export interface ILeetCodeProvider {
  getProblems(filter: LeetCodeProblemFilter): Promise<PaginatedLeetCodeProblems>;
  getProblemDetail(slugOrId: string): Promise<LeetCodeProblem | null>;
  getDailyChallenge(): Promise<LeetCodeDailyChallenge>;
  getUserProfile(username: string): Promise<LeetCodeUserProfile>;
  getAvailableTags(): Promise<LeetCodeTopicTag[]>;
}

// Memory cache helper with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class ProviderMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const providerCache = new ProviderMemoryCache();

// ---------------------------------------------------------------------------
// 1. LOCAL CURATED PROVIDER (Reliable, fast, deterministic, offline-first)
// ---------------------------------------------------------------------------
export class LocalCuratedLeetCodeProvider implements ILeetCodeProvider {
  private problems: LeetCodeProblem[];

  constructor(problems: LeetCodeProblem[] = CURATED_LEETCODE_PROBLEMS) {
    this.problems = problems;
  }

  public async getAvailableTags(): Promise<LeetCodeTopicTag[]> {
    const counts = new Map<string, number>();
    for (const prob of this.problems) {
      for (const tag of prob.topicTags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([name, problemCount]) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        problemCount,
      }))
      .sort((a, b) => (b.problemCount ?? 0) - (a.problemCount ?? 0));
  }

  public async getProblems(filter: LeetCodeProblemFilter = {}): Promise<PaginatedLeetCodeProblems> {
    const {
      search = '',
      difficulty = 'All',
      topicTags = [],
      sortBy = 'id',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = filter;

    let filtered = [...this.problems];

    // Search filter (title, slug, or frontend ID)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.titleSlug.toLowerCase().includes(q) ||
          p.frontendQuestionId === q ||
          p.topicTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'All') {
      filtered = filtered.filter((p) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // Topic tags filter (match all selected tags if specified)
    if (topicTags.length > 0) {
      filtered = filtered.filter((p) =>
        topicTags.every((t) => p.topicTags.some((pt) => pt.toLowerCase() === t.toLowerCase()))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'id') {
        comparison = parseInt(a.frontendQuestionId, 10) - parseInt(b.frontendQuestionId, 10);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'difficulty') {
        const order: Record<LeetCodeDifficulty, number> = { Easy: 1, Medium: 2, Hard: 3 };
        comparison = order[a.difficulty] - order[b.difficulty];
      } else if (sortBy === 'acceptanceRate') {
        comparison = a.acceptanceRate - b.acceptanceRate;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = filtered.length;
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const paginated = filtered.slice(startIndex, startIndex + safeLimit);

    // Compute difficulty counts across current search/tag filter (ignoring difficulty filter)
    const baseSetForCounts = this.problems.filter((p) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.titleSlug.toLowerCase().includes(q) ||
        p.frontendQuestionId === q
      );
    });

    const difficultyCounts = {
      all: baseSetForCounts.length,
      easy: baseSetForCounts.filter((p) => p.difficulty === 'Easy').length,
      medium: baseSetForCounts.filter((p) => p.difficulty === 'Medium').length,
      hard: baseSetForCounts.filter((p) => p.difficulty === 'Hard').length,
    };

    const availableTags = await this.getAvailableTags();

    return {
      problems: paginated,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      availableTags,
      difficultyCounts,
    };
  }

  public async getProblemDetail(slugOrId: string): Promise<LeetCodeProblem | null> {
    const clean = slugOrId.trim().toLowerCase();
    const match = this.problems.find(
      (p) =>
        p.titleSlug.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.frontendQuestionId === clean
    );
    return match || null;
  }

  public async getDailyChallenge(): Promise<LeetCodeDailyChallenge> {
    const today = new Date().toISOString().split('T')[0];
    // Deterministic selection based on day number
    const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const problem = this.problems[dayNumber % this.problems.length] || this.problems[0];

    return {
      date: today,
      link: problem.url,
      problem,
    };
  }

  public async getUserProfile(username: string): Promise<LeetCodeUserProfile> {
    const clean = username.trim();
    // Deterministic fallback mock profile for demonstrations & testing
    return {
      username: clean,
      realName: clean,
      ranking: 124500,
      solvedTotal: 15,
      solvedEasy: 8,
      solvedMedium: 6,
      solvedHard: 1,
      totalSubmissions: 35,
      contestRating: 1540,
      contestGlobalRanking: 32410,
      contestAttended: 4,
      contestTopPercentage: 18.5,
      streak: 5,
      recentSubmissions: [
        {
          title: 'Two Sum',
          titleSlug: 'two-sum',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          statusDisplay: 'Accepted',
          lang: 'cpp',
        },
        {
          title: 'Valid Parentheses',
          titleSlug: 'valid-parentheses',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          statusDisplay: 'Accepted',
          lang: 'cpp',
        },
      ],
      fetchedAt: new Date().toISOString(),
      isCached: false,
      source: 'fallback',
    };
  }
}

// ---------------------------------------------------------------------------
// 2. OFFICIAL LEETCODE GRAPHQL ADAPTER PROVIDER
// ---------------------------------------------------------------------------
export class LeetCodeOfficialGraphQLProvider implements ILeetCodeProvider {
  private fallbackProvider: LocalCuratedLeetCodeProvider;
  private endpoint = 'https://leetcode.com/graphql';

  constructor(fallbackProvider = new LocalCuratedLeetCodeProvider()) {
    this.fallbackProvider = fallbackProvider;
  }

  private async fetchGraphQL(query: string, variables: Record<string, any> = {}, timeoutMs = 4000): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          Referer: 'https://leetcode.com',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`LeetCode GraphQL error HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0]?.message || 'GraphQL error returned from LeetCode');
      }

      return json.data;
    } finally {
      clearTimeout(timer);
    }
  }

  public async getAvailableTags(): Promise<LeetCodeTopicTag[]> {
    return this.fallbackProvider.getAvailableTags();
  }

  public async getProblems(filter: LeetCodeProblemFilter): Promise<PaginatedLeetCodeProblems> {
    // Try GraphQL problemsetQuestionList if available, or fall back to curated
    const cacheKey = `problems_${JSON.stringify(filter)}`;
    const cached = providerCache.get<PaginatedLeetCodeProblems>(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(
            categorySlug: $categorySlug
            limit: $limit
            skip: $skip
            filters: $filters
          ) {
            total: totalNum
            questions: data {
              frontendQuestionId: questionFrontendId
              title
              titleSlug
              difficulty
              isPaidOnly: paidOnly
              acRate
              topicTags {
                name
                slug
              }
            }
          }
        }
      `;

      const limit = filter.limit || 20;
      const skip = ((filter.page || 1) - 1) * limit;
      const filters: any = {};
      if (filter.difficulty && filter.difficulty !== 'All') {
        filters.difficulty = filter.difficulty.toUpperCase();
      }
      if (filter.search) {
        filters.searchKeywords = filter.search;
      }
      if (filter.topicTags && filter.topicTags.length > 0) {
        filters.tags = filter.topicTags;
      }

      const data = await this.fetchGraphQL(query, { categorySlug: '', limit, skip, filters }, 4000);
      const qList = data?.problemsetQuestionList;

      if (qList && Array.isArray(qList.questions)) {
        const problems: LeetCodeProblem[] = qList.questions.map((q: any) => ({
          id: q.frontendQuestionId,
          frontendQuestionId: q.frontendQuestionId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty as LeetCodeDifficulty,
          topicTags: Array.isArray(q.topicTags) ? q.topicTags.map((t: any) => t.name) : [],
          paidOnly: Boolean(q.isPaidOnly),
          acceptanceRate: Math.round((q.acRate || 0) * 10) / 10,
          url: `https://leetcode.com/problems/${q.titleSlug}/`,
          source: 'leetcode_graphql',
        }));

        const total = qList.total || problems.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const availableTags = await this.fallbackProvider.getAvailableTags();

        const result: PaginatedLeetCodeProblems = {
          problems,
          total,
          page: filter.page || 1,
          limit,
          totalPages,
          availableTags,
          difficultyCounts: {
            all: total,
            easy: Math.round(total * 0.3),
            medium: Math.round(total * 0.5),
            hard: Math.round(total * 0.2),
          },
        };

        providerCache.set(cacheKey, result, 15 * 60 * 1000); // 15 min TTL
        return result;
      }
    } catch (err: any) {
      console.warn('[LeetCode GraphQL] Problem set query failed, using fallback curated dataset:', err.message);
    }

    return this.fallbackProvider.getProblems(filter);
  }

  public async getProblemDetail(slugOrId: string): Promise<LeetCodeProblem | null> {
    const cleanSlug = slugOrId.trim().toLowerCase();
    const cacheKey = `problem_detail_${cleanSlug}`;
    const cached = providerCache.get<LeetCodeProblem>(cacheKey);
    if (cached) return cached;

    // First check local curated problem which already has starter code and test cases
    const local = await this.fallbackProvider.getProblemDetail(cleanSlug);
    if (local && local.description && local.starterCode) {
      return local;
    }

    try {
      const query = `
        query questionContent($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            content
            hints
            topicTags {
              name
              slug
            }
          }
        }
      `;

      const data = await this.fetchGraphQL(query, { titleSlug: cleanSlug }, 4000);
      const q = data?.question;
      if (q) {
        // Strip excessive HTML if present to keep clean markdown
        const rawContent = q.content || '';
        const cleanContent = rawContent
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .trim();

        const merged: LeetCodeProblem = {
          id: q.questionFrontendId || cleanSlug,
          frontendQuestionId: q.questionFrontendId || '?',
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty as LeetCodeDifficulty,
          topicTags: Array.isArray(q.topicTags) ? q.topicTags.map((t: any) => t.name) : local?.topicTags || [],
          paidOnly: Boolean(q.isPaidOnly),
          acceptanceRate: local?.acceptanceRate || 50.0,
          url: `https://leetcode.com/problems/${q.titleSlug}/`,
          source: 'leetcode_graphql',
          description: cleanContent || local?.description,
          hints: q.hints?.length ? q.hints : local?.hints,
          examples: local?.examples || [],
          constraints: local?.constraints || [],
          starterCode: local?.starterCode || {},
        };

        providerCache.set(cacheKey, merged, 30 * 60 * 1000); // 30 min TTL
        return merged;
      }
    } catch (err: any) {
      console.warn(`[LeetCode GraphQL] Problem detail query for "${cleanSlug}" failed:`, err.message);
    }

    return local;
  }

  public async getDailyChallenge(): Promise<LeetCodeDailyChallenge> {
    const cacheKey = 'daily_challenge';
    const cached = providerCache.get<LeetCodeDailyChallenge>(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query questionOfToday {
          activeDailyCodingChallengeQuestion {
            date
            link
            question {
              questionFrontendId
              title
              titleSlug
              difficulty
              topicTags {
                name
              }
            }
          }
        }
      `;

      const data = await this.fetchGraphQL(query, {}, 4000);
      const daily = data?.activeDailyCodingChallengeQuestion;

      if (daily && daily.question) {
        const fullDetail = await this.getProblemDetail(daily.question.titleSlug);
        const result: LeetCodeDailyChallenge = {
          date: daily.date,
          link: `https://leetcode.com${daily.link}`,
          problem: fullDetail || {
            id: daily.question.questionFrontendId,
            frontendQuestionId: daily.question.questionFrontendId,
            title: daily.question.title,
            titleSlug: daily.question.titleSlug,
            difficulty: daily.question.difficulty as LeetCodeDifficulty,
            topicTags: daily.question.topicTags.map((t: any) => t.name),
            paidOnly: false,
            acceptanceRate: 50,
            url: `https://leetcode.com${daily.link}`,
            source: 'leetcode_graphql',
          },
        };

        providerCache.set(cacheKey, result, 60 * 60 * 1000); // 1 hour TTL
        return result;
      }
    } catch (err: any) {
      console.warn('[LeetCode GraphQL] Daily challenge query failed, using fallback:', err.message);
    }

    return this.fallbackProvider.getDailyChallenge();
  }

  public async getUserProfile(username: string): Promise<LeetCodeUserProfile> {
    const clean = username.trim();
    const cacheKey = `user_profile_${clean.toLowerCase()}`;
    const cached = providerCache.get<LeetCodeUserProfile>(cacheKey);
    if (cached) return { ...cached, isCached: true };

    try {
      const query = `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              userAvatar
              ranking
              reputation
            }
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
          }
          userContestRanking(username: $username) {
            rating
            globalRanking
            attendedContestsCount
            topPercentage
          }
          recentSubmissionList(username: $username, limit: 10) {
            title
            titleSlug
            timestamp
            statusDisplay
            lang
          }
        }
      `;

      const data = await this.fetchGraphQL(query, { username: clean }, 5000);
      const user = data?.matchedUser;

      if (!user) {
        throw new Error(`User "${clean}" not found on LeetCode.`);
      }

      const acNums = user.submitStatsGlobal?.acSubmissionNum || [];
      const allAc = acNums.find((x: any) => x.difficulty === 'All')?.count || 0;
      const easyAc = acNums.find((x: any) => x.difficulty === 'Easy')?.count || 0;
      const medAc = acNums.find((x: any) => x.difficulty === 'Medium')?.count || 0;
      const hardAc = acNums.find((x: any) => x.difficulty === 'Hard')?.count || 0;

      const contest = data?.userContestRanking;
      const recents = Array.isArray(data?.recentSubmissionList)
        ? data.recentSubmissionList.map((s: any) => ({
            title: s.title,
            titleSlug: s.titleSlug,
            timestamp: new Date(parseInt(s.timestamp, 10) * 1000).toISOString(),
            statusDisplay: s.statusDisplay,
            lang: s.lang,
          }))
        : [];

      const profile: LeetCodeUserProfile = {
        username: user.username,
        realName: user.profile?.realName || user.username,
        avatarUrl: user.profile?.userAvatar,
        ranking: user.profile?.ranking,
        reputation: user.profile?.reputation,
        solvedTotal: allAc,
        solvedEasy: easyAc,
        solvedMedium: medAc,
        solvedHard: hardAc,
        contestRating: contest?.rating ? Math.round(contest.rating) : undefined,
        contestGlobalRanking: contest?.globalRanking,
        contestAttended: contest?.attendedContestsCount,
        contestTopPercentage: contest?.topPercentage,
        recentSubmissions: recents,
        streak: recents.length > 0 ? Math.min(recents.length, 7) : 0,
        fetchedAt: new Date().toISOString(),
        isCached: false,
        source: 'live_api',
      };

      providerCache.set(cacheKey, profile, 10 * 60 * 1000); // 10 min TTL
      return profile;
    } catch (err: any) {
      console.warn(`[LeetCode GraphQL] User profile lookup for "${clean}" failed:`, err.message);
      // Fallback
      const fb = await this.fallbackProvider.getUserProfile(clean);
      return {
        ...fb,
        source: 'fallback',
      };
    }
  }
}

// Default exported provider singleton
export const leetCodeProvider: ILeetCodeProvider = new LeetCodeOfficialGraphQLProvider();
