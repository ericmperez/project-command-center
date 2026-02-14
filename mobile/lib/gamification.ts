// Pure gamification functions: XP values, level thresholds, streak logic
// Copied from web app — zero platform dependencies

import type { XpEventType } from './types';

// ============ XP Values ============

export const XP_VALUES: Record<XpEventType, number> = {
  task_complete: 10,
  time_session: 5,       // per 30-min block
  project_complete: 50,
  daily_goal_bonus: 25,
  habit_complete: 15,
};

// ============ Level Thresholds ============

const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
};

export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= 5) return LEVEL_THRESHOLDS[level];
  // Level 6+: 1000 + (level - 5) * 600
  return 1000 + (level - 5) * 600;
}

export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  while (getXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function getXpProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
} {
  const level = getLevelFromXp(totalXp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const progressXp = totalXp - currentLevelXp;
  const range = nextLevelXp - currentLevelXp;
  const progressPercent = range > 0 ? Math.min(100, Math.round((progressXp / range) * 100)) : 0;

  return { level, currentLevelXp, nextLevelXp, progressXp, progressPercent };
}

// ============ Streak Logic ============

export function computeStreak(
  lastActiveDate: string | null,
  currentStreak: number,
  today: Date = new Date()
): { current_streak: number; longest_streak: number; last_active_date: string } {
  const todayStr = formatDate(today);

  if (!lastActiveDate) {
    // First ever activity
    return {
      current_streak: 1,
      longest_streak: Math.max(currentStreak, 1),
      last_active_date: todayStr,
    };
  }

  if (lastActiveDate === todayStr) {
    // Already active today — no change
    return {
      current_streak: currentStreak,
      longest_streak: currentStreak,
      last_active_date: todayStr,
    };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  if (lastActiveDate === yesterdayStr) {
    // Consecutive day
    const newStreak = currentStreak + 1;
    return {
      current_streak: newStreak,
      longest_streak: newStreak,
      last_active_date: todayStr,
    };
  }

  // Streak broken
  return {
    current_streak: 1,
    longest_streak: currentStreak,
    last_active_date: todayStr,
  };
}

// ============ Daily / Weekly Counting ============

export function getDayBounds(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const start = d.toISOString();
  d.setDate(d.getDate() + 1);
  const end = d.toISOString();
  return { start, end };
}

export function getWeekBounds(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  // Start of week = Monday
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // 0=Sun -> go back 6
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  const start = d.toISOString();
  const end = new Date(d);
  end.setDate(end.getDate() + 7);
  return { start, end: end.toISOString() };
}

export function countTaskCompletes(events: { event_type: string }[]): number {
  return events.filter((e) => e.event_type === 'task_complete').length;
}

// ============ Time Session XP ============

export function getTimeSessionXp(durationSeconds: number): number {
  const blocks = Math.floor(durationSeconds / 1800); // 30 min = 1800s
  return blocks * XP_VALUES.time_session;
}

// ============ Habit Streak ============

/**
 * Compute consecutive-day streak from a sorted array of completion dates.
 * Dates should be YYYY-MM-DD strings. Returns streak counting backwards from `today`.
 */
export function computeHabitStreak(completionDates: string[], today: string): number {
  if (completionDates.length === 0) return 0;

  const unique = [...new Set(completionDates)].sort().reverse();
  // Must include today to have a current streak
  if (unique[0] !== today) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T00:00:00');
    const curr = new Date(unique[i] + 'T00:00:00');
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Return bonus XP for habit streak milestones.
 * Only awards bonus at exact milestone thresholds.
 */
export function getHabitStreakBonus(consecutiveDays: number): number {
  const milestones: Record<number, number> = {
    7: 50,
    14: 100,
    30: 200,
    60: 500,
    100: 1000,
  };
  return milestones[consecutiveDays] ?? 0;
}

// ============ Helpers ============

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
