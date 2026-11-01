import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LeetCodeDifficulty,
  LeetCodeProblemFilter,
  PaginatedLeetCodeProblems,
  LeetCodeTopicTag,
} from '../types/leetcode.types';
import { leetCodeClient } from '../services/leetcodeClient';

export function useLeetCodeProblems(initialFilter: LeetCodeProblemFilter = {}) {
  const [filter, setFilter] = useState<LeetCodeProblemFilter>({
    search: '',
    difficulty: 'All',
    topicTags: [],
    sortBy: 'id',
    sortOrder: 'asc',
    page: 1,
    limit: 20,
    ...initialFilter,
  });

  const [data, setData] = useState<PaginatedLeetCodeProblems>({
    problems: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    availableTags: [],
    difficultyCounts: { all: 0, easy: 0, medium: 0, hard: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<number>(0);

  const fetchProblems = useCallback(async () => {
    const runId = ++abortRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await leetCodeClient.getProblems(filter);
      if (runId === abortRef.current) {
        setData(res);
      }
    } catch (err: any) {
      if (runId === abortRef.current) {
        setError(err.message || 'Failed to load LeetCode problems');
      }
    } finally {
      if (runId === abortRef.current) {
        setLoading(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const setSearch = useCallback((search: string) => {
    setFilter((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setDifficulty = useCallback((difficulty: 'All' | LeetCodeDifficulty) => {
    setFilter((prev) => ({ ...prev, difficulty, page: 1 }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilter((prev) => {
      const exists = prev.topicTags?.includes(tag);
      const nextTags = exists
        ? prev.topicTags?.filter((t) => t !== tag)
        : [...(prev.topicTags || []), tag];
      return { ...prev, topicTags: nextTags, page: 1 };
    });
  }, []);

  const clearTags = useCallback(() => {
    setFilter((prev) => ({ ...prev, topicTags: [], page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: 'id' | 'title' | 'difficulty' | 'acceptanceRate', sortOrder: 'asc' | 'desc') => {
    setFilter((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilter((prev) => ({ ...prev, page }));
  }, []);

  return {
    problems: data.problems,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    availableTags: data.availableTags,
    difficultyCounts: data.difficultyCounts,
    filter,
    loading,
    error,
    refetch: fetchProblems,
    setSearch,
    setDifficulty,
    toggleTag,
    clearTags,
    setSort,
    setPage,
  };
}
