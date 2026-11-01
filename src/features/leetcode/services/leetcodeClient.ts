import {
  LeetCodeDailyChallenge,
  LeetCodeProblem,
  LeetCodeProblemFilter,
  PaginatedLeetCodeProblems,
  LeetCodeTopicTag,
  LeetCodeUserProfile,
  UserLeetCodeProgress,
  LeetCodeAdaptiveRecommendation,
} from '../types/leetcode.types';
import { supabase } from '../../../services/supabase';

const LEETCODE_STORAGE_KEY = 'climb1600_leetcode_progress';
const LEETCODE_PROFILE_KEY = 'climb1600_leetcode_username';

class LeetCodeClient {
  private localProgressCache: Map<string, UserLeetCodeProgress> | null = null;

  // Local Storage Helpers
  public getLocalProgressMap(): Map<string, UserLeetCodeProgress> {
    if (this.localProgressCache) return this.localProgressCache;
    const map = new Map<string, UserLeetCodeProgress>();
    if (typeof window === 'undefined') {
      this.localProgressCache = map;
      return map;
    }

    try {
      const raw = localStorage.getItem(LEETCODE_STORAGE_KEY);
      if (raw) {
        const list: UserLeetCodeProgress[] = JSON.parse(raw);
        for (const item of list) {
          map.set(item.problemSlug, item);
        }
      }
    } catch (e) {
      console.warn('Failed reading leetcode progress from localStorage:', e);
    }
    this.localProgressCache = map;
    return map;
  }

  private persistLocalProgress(): void {
    if (typeof window === 'undefined' || !this.localProgressCache) return;
    try {
      const list = Array.from(this.localProgressCache.values());
      localStorage.setItem(LEETCODE_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed persisting leetcode progress:', e);
    }
  }

  // 1. Fetch Paginated Problems from API
  public async getProblems(filter: LeetCodeProblemFilter = {}): Promise<PaginatedLeetCodeProblems> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (filter.difficulty && filter.difficulty !== 'All') params.set('difficulty', filter.difficulty);
    if (filter.topicTags && filter.topicTags.length > 0) params.set('tags', filter.topicTags.join(','));
    if (filter.sortBy) params.set('sortBy', filter.sortBy);
    if (filter.sortOrder) params.set('sortOrder', filter.sortOrder);
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));

    try {
      const res = await fetch(`/api/leetcode/problems?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('Fetch leetcode problems failed, falling back to local provider:', err.message);
      // Fallback direct provider call in client bundle
      const { leetCodeProvider } = await import('./leetcodeProvider');
      return await leetCodeProvider.getProblems(filter);
    }
  }

  // 2. Fetch Single Problem Detail
  public async getProblemDetail(slug: string): Promise<LeetCodeProblem | null> {
    try {
      const res = await fetch(`/api/leetcode/problem/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.problem || null;
    } catch (err: any) {
      console.warn(`Fetch problem detail for "${slug}" failed:`, err.message);
      const { leetCodeProvider } = await import('./leetcodeProvider');
      return await leetCodeProvider.getProblemDetail(slug);
    }
  }

  // 3. Fetch Daily Challenge
  public async getDailyChallenge(): Promise<LeetCodeDailyChallenge> {
    try {
      const res = await fetch('/api/leetcode/daily');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.daily;
    } catch (err: any) {
      const { leetCodeProvider } = await import('./leetcodeProvider');
      return await leetCodeProvider.getDailyChallenge();
    }
  }

  // 4. Fetch Available Topic Tags
  public async getAvailableTags(): Promise<LeetCodeTopicTag[]> {
    try {
      const res = await fetch('/api/leetcode/tags');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.tags || [];
    } catch {
      const { leetCodeProvider } = await import('./leetcodeProvider');
      return await leetCodeProvider.getAvailableTags();
    }
  }

  // 5. Fetch Public User Profile
  public async getUserProfile(username: string): Promise<LeetCodeUserProfile> {
    const res = await fetch(`/api/leetcode/profile/${encodeURIComponent(username.trim())}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch profile for "${username}"`);
    }
    const data = await res.json();
    return data.profile;
  }

  // 6. Fetch Adaptive Recommendations
  public async getRecommendations(): Promise<LeetCodeAdaptiveRecommendation> {
    try {
      const res = await fetch('/api/leetcode/recommendations');
      if (res.ok) {
        const data = await res.json();
        return data.recommendations;
      }
    } catch {}

    const { leetCodeProvider } = await import('./leetcodeProvider');
    const daily = await leetCodeProvider.getDailyChallenge();
    return {
      dailyProblem: daily.problem,
      weakTopicProblems: [daily.problem],
      dueRevisions: [],
      challengeProblem: daily.problem,
      focusTopic: daily.problem.topicTags[0] || 'Array',
      minimumDailyGoal: {
        problem: daily.problem,
        targetMinutes: 20,
      },
    };
  }

  // 7. Get All User Progress
  public getAllProgress(): UserLeetCodeProgress[] {
    return Array.from(this.getLocalProgressMap().values());
  }

  public getProgress(problemSlug: string): UserLeetCodeProgress | undefined {
    return this.getLocalProgressMap().get(problemSlug);
  }

  // 8. Save or Update Progress
  public async saveProgress(progress: UserLeetCodeProgress): Promise<UserLeetCodeProgress> {
    const map = this.getLocalProgressMap();
    const existing = map.get(progress.problemSlug) || {
      problemSlug: progress.problemSlug,
      status: 'unsolved',
      bookmark: false,
    };

    const updated: UserLeetCodeProgress = {
      ...existing,
      ...progress,
      lastAttemptedAt: progress.lastAttemptedAt || new Date().toISOString(),
    };

    if (progress.status === 'solved' && !updated.solvedAt) {
      updated.solvedAt = new Date().toISOString();
    }

    map.set(progress.problemSlug, updated);
    this.persistLocalProgress();

    // Async sync with backend if session is active
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        fetch('/api/leetcode/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify(updated),
        }).catch(() => {});
      }
    } catch {}

    return updated;
  }

  // 9. Bookmark Toggle Helper
  public async toggleBookmark(problemSlug: string): Promise<boolean> {
    const map = this.getLocalProgressMap();
    const existing = map.get(problemSlug) || {
      problemSlug,
      status: 'unsolved',
      bookmark: false,
    };

    const nextState = !existing.bookmark;
    await this.saveProgress({
      ...existing,
      bookmark: nextState,
    });

    return nextState;
  }

  // 10. Saved LeetCode Username
  public getSavedUsername(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LEETCODE_PROFILE_KEY);
  }

  public setSavedUsername(username: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LEETCODE_PROFILE_KEY, username.trim());
  }
}

export const leetCodeClient = new LeetCodeClient();
