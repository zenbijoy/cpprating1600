import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserLeetCodeProgress, LeetCodePersonalStatus } from '../types/leetcode.types';
import { leetCodeClient } from '../services/leetcodeClient';
import { CURATED_LEETCODE_PROBLEMS } from '../data/curatedLeetcodeProblems';

export function useLeetCodeProgress() {
  const [progressMap, setProgressMap] = useState<Map<string, UserLeetCodeProgress>>(
    () => new Map(leetCodeClient.getLocalProgressMap())
  );

  const refresh = useCallback(() => {
    setProgressMap(new Map(leetCodeClient.getLocalProgressMap()));
  }, []);

  const progressList = useMemo(() => Array.from(progressMap.values()), [progressMap]);

  // Solved counts and breakdowns
  const stats = useMemo(() => {
    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;
    let totalAttempted = 0;

    for (const item of progressList) {
      if (item.status === 'solved') {
        totalSolved++;
        // Lookup difficulty
        const prob = CURATED_LEETCODE_PROBLEMS.find((p) => p.titleSlug === item.problemSlug);
        if (prob) {
          if (prob.difficulty === 'Easy') easySolved++;
          else if (prob.difficulty === 'Medium') mediumSolved++;
          else if (prob.difficulty === 'Hard') hardSolved++;
        } else {
          mediumSolved++;
        }
      } else if (item.status === 'attempted') {
        totalAttempted++;
      }
    }

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalAttempted,
      bookmarkCount: progressList.filter((p) => p.bookmark).length,
    };
  }, [progressList]);

  // Bookmarks list
  const bookmarks = useMemo(() => {
    return progressList.filter((p) => p.bookmark);
  }, [progressList]);

  // Revision queue (problems marked for review, attempted but gave up, or with low recall)
  const revisionQueue = useMemo(() => {
    return progressList.filter(
      (p) =>
        (p.status === 'attempted' || (p.difficultyOfRecall && p.difficultyOfRecall <= 3)) &&
        p.status !== 'solved'
    );
  }, [progressList]);

  const toggleBookmark = useCallback(
    async (problemSlug: string) => {
      await leetCodeClient.toggleBookmark(problemSlug);
      refresh();
    },
    [refresh]
  );

  const updateStatus = useCallback(
    async (problemSlug: string, status: LeetCodePersonalStatus, selfReported = true) => {
      await leetCodeClient.saveProgress({
        problemSlug,
        status,
        bookmark: progressMap.get(problemSlug)?.bookmark || false,
        selfReported,
      });
      refresh();
    },
    [progressMap, refresh]
  );

  const saveNotes = useCallback(
    async (problemSlug: string, personalNotes: string, mistakeCategory?: string) => {
      await leetCodeClient.saveProgress({
        problemSlug,
        status: progressMap.get(problemSlug)?.status || 'attempted',
        bookmark: progressMap.get(problemSlug)?.bookmark || false,
        personalNotes,
        mistakeCategory,
      });
      refresh();
    },
    [progressMap, refresh]
  );

  return {
    progressMap,
    progressList,
    stats,
    bookmarks,
    revisionQueue,
    refresh,
    toggleBookmark,
    updateStatus,
    saveNotes,
  };
}
