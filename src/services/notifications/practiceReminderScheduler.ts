import { SupabaseClient } from '@supabase/supabase-js';
import { getLocalTimeInTimezone, isInQuietHours } from './quietHours';
import { jobProcessor } from './jobProcessor';

export class PracticeReminderScheduler {
  /**
   * Evaluates practice reminders, streaks, incomplete goals, and due revisions for all active users.
   */
  async evaluateReminders(supabase: SupabaseClient): Promise<{
    evaluatedUsers: number;
    remindersScheduled: number;
    cancelledJobs: number;
  }> {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, current_day, daily_minutes, updated_at');

    if (error || !users) {
      return { evaluatedUsers: 0, remindersScheduled: 0, cancelledJobs: 0 };
    }

    let remindersScheduled = 0;
    let cancelledJobs = 0;
    const now = new Date();

    for (const user of users) {
      const prefs = await jobProcessor.getUserPreferences(supabase, user.id);
      if (!prefs.categories_enabled.practice && !prefs.categories_enabled.streak) {
        continue;
      }

      const localTime = getLocalTimeInTimezone(now, prefs.timezone);
      const todayDateStr = localTime.dateString;

      // 1. Incomplete daily goal check & cancellation
      // Check user's daily plan for today
      const { data: plan } = await supabase
        .from('user_daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayDateStr)
        .maybeSingle();

      const targetMinutes = plan?.target_minutes || user.daily_minutes || 45;
      const actualMinutes = plan?.actual_minutes || 0;
      const isCompleted = plan?.status === 'completed' || actualMinutes >= targetMinutes;

      if (isCompleted) {
        // Obsolete reminder cancellation: if daily goal is completed, cancel any pending incomplete-goal reminders!
        const cancelled = await jobProcessor.cancelObsoleteJobs(supabase, user.id, ['daily_goal.incomplete']);
        cancelledJobs += cancelled;
      } else {
        // If it's evening in the user's timezone (e.g. >= 19:00 local time) and goal is incomplete:
        if (localTime.hours >= 19 && localTime.hours <= 22 && prefs.categories_enabled.practice) {
          const remainingMinutes = Math.max(1, targetMinutes - actualMinutes);
          const idempotencyKey = `daily_goal_incomplete_${user.id}_${todayDateStr}_h${localTime.hours}`;

          const res = await jobProcessor.scheduleJob(supabase, {
            userId: user.id,
            jobType: 'daily_goal.incomplete',
            idempotencyKey,
            scheduledFor: now,
            payload: {
              userId: user.id,
              dayNumber: user.current_day || 1,
              targetMinutes,
              actualMinutes,
              remainingMinutes,
              date: todayDateStr,
            },
          });

          if (res.scheduled) remindersScheduled++;
        }
      }

      // 2. Preferred practice time reminder
      if (prefs.categories_enabled.practice) {
        const [prefHour, prefMin] = (prefs.preferred_practice_time || '20:00').split(':').map((s) => parseInt(s, 10));
        // If current hour matches user's preferred practice hour and minute is within first 15 mins of hour
        if (localTime.hours === prefHour && localTime.minutes < 30) {
          const idempotencyKey = `practice_pref_time_${user.id}_${todayDateStr}`;
          const res = await jobProcessor.scheduleJob(supabase, {
            userId: user.id,
            jobType: 'practice.reminder_due',
            idempotencyKey,
            scheduledFor: now,
            payload: {
              userId: user.id,
              reminderType: 'daily_preferred_time',
              preferredTime: prefs.preferred_practice_time,
              dayNumber: user.current_day || 1,
            },
          });

          if (res.scheduled) remindersScheduled++;
        }
      }

      // 3. Due Mistake Notebook Revision
      if (prefs.categories_enabled.practice) {
        const { data: dueMistake } = await supabase
          .from('user_mistakes')
          .select('*')
          .eq('user_id', user.id)
          .lte('next_review_date', todayDateStr)
          .eq('status', 'due')
          .order('next_review_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (dueMistake) {
          const idempotencyKey = `revision_due_${user.id}_${dueMistake.id}_${todayDateStr}`;
          const res = await jobProcessor.scheduleJob(supabase, {
            userId: user.id,
            jobType: 'revision.due',
            idempotencyKey,
            scheduledFor: now,
            payload: {
              userId: user.id,
              mistakeId: dueMistake.id,
              problemName: dueMistake.problem_name,
              problemId: dueMistake.problem_id,
              category: dueMistake.category,
              daysOverdue: 0,
            },
          });

          if (res.scheduled) remindersScheduled++;
        }
      }

      // 4. Streak At-Risk check
      if (prefs.categories_enabled.streak) {
        // Late evening: >= 20:00 local time
        if (localTime.hours >= 20 && !isCompleted) {
          const hoursRemainingInDay = 24 - (localTime.hours + localTime.minutes / 60);
          const idempotencyKey = `streak_risk_${user.id}_${todayDateStr}`;

          const res = await jobProcessor.scheduleJob(supabase, {
            userId: user.id,
            jobType: 'streak.at_risk',
            idempotencyKey,
            scheduledFor: now,
            payload: {
              userId: user.id,
              currentStreak: 1, // At risk of breaking
              hoursRemaining: hoursRemainingInDay,
              lastActiveDate: todayDateStr,
            },
          });

          if (res.scheduled) remindersScheduled++;
        }
      }
    }

    return {
      evaluatedUsers: users.length,
      remindersScheduled,
      cancelledJobs,
    };
  }
}

export const practiceReminderScheduler = new PracticeReminderScheduler();
