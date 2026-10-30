import { DailyPlan, ProblemAttempt } from '../types';

export interface HeatmapDay {
  dateStr: string; // YYYY-MM-DD
  dateLabel: string; // "Oct 28, 2026"
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  weekIndex: number; // 0 to 17 (17 is current week)
  minutes: number;
  solvedCount: number;
  attemptCount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  tooltip: string;
}

export interface PracticedTopicSummary {
  topic: string;
  totalMinutes: number;
  totalHours: string;
  streakDays: number;
  colorDot: string;
  problemsSolved: number;
}

export interface PracticeSessionRecord {
  id: string;
  topic: string;
  notes: string;
  durationMinutes: number;
  dateStr: string;
  relativeDate: string; // "Today", "Yesterday", "2 days ago"
  statusDot: string; // color dot
}

export interface PracticeHeatmapAnalysis {
  weeks: HeatmapDay[][]; // 18 weeks, each containing 7 days (Sun to Sat)
  totalHours: string;
  totalMinutes: number;
  currentStreakDays: number;
  weeklyGoalPercent: number; // e.g. 75
  weeklyMinutesTarget: number;
  weeklyMinutesActual: number;
  topTopics: PracticedTopicSummary[];
  recentSessions: PracticeSessionRecord[];
  lastSessionText: string; // e.g. "Yesterday — 45 min"
}

const TOPIC_COLOR_PALETTE = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#dc2626', // Red
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#0891b2', // Cyan
];

/**
 * Computes an 18-week practice activity matrix and SkillTrack analytics matching Reference Image 2.
 */
export function computePracticeHeatmap(
  attempts: ProblemAttempt[] = [],
  dailyPlans: DailyPlan[] = [],
  weeklyMinutesGoal: number = 300,
  referenceDate?: Date
): PracticeHeatmapAnalysis {
  const ref = referenceDate || new Date();
  const todayStr = ref.toISOString().split('T')[0];

  // 1. Index attempts and daily plan minutes by date YYYY-MM-DD
  const dateMinutes: Record<string, number> = {};
  const dateSolved: Record<string, number> = {};
  const dateAttempts: Record<string, number> = {};
  const topicMinutes: Record<string, number> = {};
  const topicSolved: Record<string, number> = {};
  const topicDates: Record<string, Set<string>> = {};

  for (const a of attempts) {
    const dStr = (a.endedAt || a.startedAt || '').split('T')[0];
    if (dStr) {
      const mins = Math.max(1, Math.round((a.timeSpentSeconds || 60) / 60));
      dateMinutes[dStr] = (dateMinutes[dStr] || 0) + mins;
      dateAttempts[dStr] = (dateAttempts[dStr] || 0) + 1;

      const isSolved =
        a.officialVerdict === 'OK' ||
        a.outcome === 'solved_independently' ||
        a.outcome === 'solved_with_hints';

      if (isSolved) {
        dateSolved[dStr] = (dateSolved[dStr] || 0) + 1;
      }

      // Track primary topic
      const primaryTag = (a.tags && a.tags.length > 0 ? a.tags[0] : 'General Practice')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      topicMinutes[primaryTag] = (topicMinutes[primaryTag] || 0) + mins;
      if (isSolved) {
        topicSolved[primaryTag] = (topicSolved[primaryTag] || 0) + 1;
      }
      if (!topicDates[primaryTag]) topicDates[primaryTag] = new Set();
      topicDates[primaryTag].add(dStr);
    }
  }

  // Also accumulate daily plan actual minutes if not captured by attempts
  for (const p of dailyPlans) {
    if (p.date && p.actualMinutes > 0) {
      if (!dateMinutes[p.date]) {
        dateMinutes[p.date] = p.actualMinutes;
      }
    }
  }

  // 2. Build 18 weeks calendar grid (18 columns × 7 rows, starting from Sunday)
  // Find current week's Sunday
  const currentDayOfWeek = ref.getDay(); // 0 = Sun, 6 = Sat
  const currentWeekEnd = new Date(ref);
  currentWeekEnd.setDate(ref.getDate() + (6 - currentDayOfWeek));

  const startDate = new Date(currentWeekEnd);
  startDate.setDate(currentWeekEnd.getDate() - (18 * 7 - 1)); // 18 weeks ago Sunday

  const weeks: HeatmapDay[][] = [];
  let totalMinutesAllTime = 0;

  for (let w = 0; w < 18; w++) {
    const weekDays: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + (w * 7 + d));
      const cellDateStr = cellDate.toISOString().split('T')[0];

      const mins = dateMinutes[cellDateStr] || 0;
      const solved = dateSolved[cellDateStr] || 0;
      const atts = dateAttempts[cellDateStr] || 0;
      const isToday = cellDateStr === todayStr;

      totalMinutesAllTime += mins;

      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (mins >= 120) intensity = 4;
      else if (mins >= 60) intensity = 3;
      else if (mins >= 30) intensity = 2;
      else if (mins > 0) intensity = 1;

      const dateLabel = cellDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const tooltip =
        mins > 0
          ? `${dateLabel}: ${mins} min${solved > 0 ? `, ${solved} solved` : ''}`
          : `${dateLabel}: No practice activity`;

      weekDays.push({
        dateStr: cellDateStr,
        dateLabel,
        dayOfWeek: d,
        weekIndex: w,
        minutes: mins,
        solvedCount: solved,
        attemptCount: atts,
        intensity,
        isToday,
        tooltip,
      });
    }
    weeks.push(weekDays);
  }

  // 3. Compute Current Streak
  let streak = 0;
  let checkDate = new Date(ref);

  // Check today first; if not practiced today, check starting from yesterday
  const todayMins = dateMinutes[todayStr] || 0;
  if (todayMins > 0) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if practiced yesterday
    const yDate = new Date(ref);
    yDate.setDate(yDate.getDate() - 1);
    const yStr = yDate.toISOString().split('T')[0];
    if ((dateMinutes[yStr] || 0) > 0) {
      checkDate = yDate;
    } else {
      checkDate = null as any;
    }
  }

  if (checkDate) {
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if ((dateMinutes[dStr] || 0) > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 4. Compute Weekly Goal Progress (Current Week Monday to Sunday or Sun to Sat)
  const currentWeekDays = weeks[17] || [];
  const currentWeekMinutes = currentWeekDays.reduce((acc, day) => acc + day.minutes, 0);
  const targetWeekly = Math.max(60, weeklyMinutesGoal);
  const weeklyGoalPercent = Math.min(100, Math.round((currentWeekMinutes / targetWeekly) * 100));

  // 5. Build Top Topics Summaries
  const sortedTopics = Object.entries(topicMinutes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Default CP Topics fallback if user has empty attempts
  if (sortedTopics.length === 0) {
    sortedTopics.push(['Implementation', 0]);
    sortedTopics.push(['Binary Search', 0]);
    sortedTopics.push(['Dynamic Programming', 0]);
  }

  const topTopics: PracticedTopicSummary[] = sortedTopics.map(([topic, mins], idx) => {
    const datesSet = topicDates[topic] || new Set();
    // Compute topic streak
    let tStreak = 0;
    const tCheck = new Date(ref);
    if (datesSet.has(todayStr)) {
      tStreak++;
      tCheck.setDate(tCheck.getDate() - 1);
    }
    while (datesSet.has(tCheck.toISOString().split('T')[0])) {
      tStreak++;
      tCheck.setDate(tCheck.getDate() - 1);
    }

    return {
      topic,
      totalMinutes: mins,
      totalHours: (mins / 60).toFixed(1) + 'h',
      streakDays: tStreak || (mins > 0 ? 1 : 0),
      colorDot: TOPIC_COLOR_PALETTE[idx % TOPIC_COLOR_PALETTE.length],
      problemsSolved: topicSolved[topic] || 0,
    };
  });

  // 6. Build Recent Sessions List
  const recentSessions: PracticeSessionRecord[] = [];
  const sortedAttempts = [...attempts].sort((a, b) => {
    return new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime();
  });

  for (const att of sortedAttempts.slice(0, 6)) {
    const dStr = (att.endedAt || att.startedAt || '').split('T')[0];
    const mins = Math.max(1, Math.round((att.timeSpentSeconds || 60) / 60));
    const attDate = new Date(att.startedAt || Date.now());
    const diffDays = Math.floor((ref.getTime() - attDate.getTime()) / (86400 * 1000));

    let relDate = 'Today';
    if (diffDays === 1) relDate = 'Yesterday';
    else if (diffDays > 1) relDate = `${diffDays} days ago`;

    const topic = (att.tags && att.tags.length > 0 ? att.tags[0] : 'Implementation')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const note =
      att.approachNotes ||
      att.mistakeSummary ||
      `Practiced ${att.name || 'problem'}. Verdict: ${att.officialVerdict || (att.outcome?.includes('solved') ? 'Accepted' : 'In Progress')}.`;

    recentSessions.push({
      id: att.id,
      topic,
      notes: note,
      durationMinutes: mins,
      dateStr: dStr,
      relativeDate: relDate,
      statusDot: att.officialVerdict === 'OK' ? '#059669' : '#d97706',
    });
  }

  // Last Session Subtext
  let lastSessionText = 'No sessions recorded yet';
  if (recentSessions.length > 0) {
    const first = recentSessions[0];
    lastSessionText = `${first.relativeDate} — ${first.durationMinutes} min`;
  }

  const totalHoursStr = (totalMinutesAllTime / 60).toFixed(1) + 'h';

  return {
    weeks,
    totalHours: totalHoursStr,
    totalMinutes: totalMinutesAllTime,
    currentStreakDays: streak,
    weeklyGoalPercent,
    weeklyMinutesTarget: targetWeekly,
    weeklyMinutesActual: currentWeekMinutes,
    topTopics,
    recentSessions,
    lastSessionText,
  };
}
