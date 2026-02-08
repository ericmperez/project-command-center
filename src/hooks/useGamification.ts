'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockGamificationProfile, mockXpEvents } from '@/lib/mock-data';
import {
  getLevelFromXp,
  getXpProgress,
  computeStreak,
  getDayBounds,
  getWeekBounds,
  countTaskCompletes,
  XP_VALUES,
} from '@/lib/gamification';
import type { GamificationProfile, XpEvent, XpEventType } from '@/lib/types';

const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

interface GamificationState {
  profile: GamificationProfile | null;
  dailyCompleted: number;
  dailyGoal: number;
  weeklyCompleted: number;
  weeklyGoal: number;
  loading: boolean;
  xpProgress: ReturnType<typeof getXpProgress>;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    profile: null,
    dailyCompleted: 0,
    dailyGoal: 5,
    weeklyCompleted: 0,
    weeklyGoal: 20,
    loading: true,
    xpProgress: getXpProgress(0),
  });
  const [demoMode, setDemoMode] = useState(false);
  // Keep mutable demo state in a ref-like pattern
  const [demoProfile, setDemoProfile] = useState<GamificationProfile>({ ...mockGamificationProfile });
  const [demoEvents, setDemoEvents] = useState<XpEvent[]>([...mockXpEvents]);

  const loadStats = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setDemoMode(true);
      const { start: dayStart, end: dayEnd } = getDayBounds();
      const { start: weekStart, end: weekEnd } = getWeekBounds();

      const todayEvents = demoEvents.filter(
        (e) => e.created_at >= dayStart && e.created_at < dayEnd
      );
      const weekEvts = demoEvents.filter(
        (e) => e.created_at >= weekStart && e.created_at < weekEnd
      );

      setState({
        profile: demoProfile,
        dailyCompleted: countTaskCompletes(todayEvents),
        dailyGoal: demoProfile.daily_goal,
        weeklyCompleted: countTaskCompletes(weekEvts),
        weeklyGoal: demoProfile.weekly_goal,
        loading: false,
        xpProgress: getXpProgress(demoProfile.total_xp),
      });
      return;
    }

    try {
      const res = await fetch('/api/gamification');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setState({
        profile: data.profile,
        dailyCompleted: data.daily.completed,
        dailyGoal: data.daily.goal,
        weeklyCompleted: data.weekly.completed,
        weeklyGoal: data.weekly.goal,
        loading: false,
        xpProgress: getXpProgress(data.profile.total_xp),
      });
    } catch (err) {
      console.error('Error loading gamification stats:', err);
      setDemoMode(true);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [demoProfile, demoEvents]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const awardXP = useCallback(
    async (eventType: XpEventType, referenceId?: string, projectId?: string) => {
      if (demoMode) {
        // Check dedup
        if (referenceId && demoEvents.some((e) => e.reference_id === referenceId)) {
          return;
        }

        const xpAmount = XP_VALUES[eventType];
        const newEvent: XpEvent = {
          id: `xp-${Date.now()}`,
          event_type: eventType,
          xp_amount: xpAmount,
          project_id: projectId || null,
          reference_id: referenceId || null,
          created_at: new Date().toISOString(),
        };

        const newEvents = [...demoEvents, newEvent];
        let newTotalXp = demoProfile.total_xp + xpAmount;

        // Update streak
        const streakResult = computeStreak(
          demoProfile.last_active_date,
          demoProfile.current_streak
        );

        // Check daily goal bonus
        if (eventType === 'task_complete') {
          const { start: dayStart, end: dayEnd } = getDayBounds();
          const todayTasks = newEvents.filter(
            (e) => e.event_type === 'task_complete' && e.created_at >= dayStart && e.created_at < dayEnd
          );
          if (todayTasks.length === demoProfile.daily_goal) {
            const bonusEvent: XpEvent = {
              id: `xp-bonus-${Date.now()}`,
              event_type: 'daily_goal_bonus',
              xp_amount: XP_VALUES.daily_goal_bonus,
              project_id: null,
              reference_id: `daily_bonus_${new Date().toISOString().split('T')[0]}`,
              created_at: new Date().toISOString(),
            };
            newEvents.push(bonusEvent);
            newTotalXp += XP_VALUES.daily_goal_bonus;
          }
        }

        const newLevel = getLevelFromXp(newTotalXp);
        const updatedProfile: GamificationProfile = {
          ...demoProfile,
          total_xp: newTotalXp,
          level: newLevel,
          current_streak: streakResult.current_streak,
          longest_streak: Math.max(demoProfile.longest_streak, streakResult.longest_streak),
          last_active_date: streakResult.last_active_date,
          updated_at: new Date().toISOString(),
        };

        setDemoProfile(updatedProfile);
        setDemoEvents(newEvents);

        // Recompute state
        const { start: dayStart, end: dayEnd } = getDayBounds();
        const { start: weekStart, end: weekEnd } = getWeekBounds();
        const todayEvts = newEvents.filter((e) => e.created_at >= dayStart && e.created_at < dayEnd);
        const weekEvts = newEvents.filter((e) => e.created_at >= weekStart && e.created_at < weekEnd);

        setState({
          profile: updatedProfile,
          dailyCompleted: countTaskCompletes(todayEvts),
          dailyGoal: updatedProfile.daily_goal,
          weeklyCompleted: countTaskCompletes(weekEvts),
          weeklyGoal: updatedProfile.weekly_goal,
          loading: false,
          xpProgress: getXpProgress(newTotalXp),
        });
        return;
      }

      try {
        await fetch('/api/gamification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'award',
            event_type: eventType,
            project_id: projectId,
            reference_id: referenceId,
          }),
        });
        await loadStats();
      } catch (err) {
        console.error('Error awarding XP:', err);
      }
    },
    [demoMode, demoProfile, demoEvents, loadStats]
  );

  const revokeXP = useCallback(
    async (referenceId: string) => {
      if (demoMode) {
        const event = demoEvents.find((e) => e.reference_id === referenceId);
        if (!event) return;

        const newEvents = demoEvents.filter((e) => e.reference_id !== referenceId);
        const newTotalXp = Math.max(0, demoProfile.total_xp - event.xp_amount);
        const newLevel = getLevelFromXp(newTotalXp);

        const updatedProfile: GamificationProfile = {
          ...demoProfile,
          total_xp: newTotalXp,
          level: newLevel,
          updated_at: new Date().toISOString(),
        };

        setDemoProfile(updatedProfile);
        setDemoEvents(newEvents);

        const { start: dayStart, end: dayEnd } = getDayBounds();
        const { start: weekStart, end: weekEnd } = getWeekBounds();
        const todayEvts = newEvents.filter((e) => e.created_at >= dayStart && e.created_at < dayEnd);
        const weekEvts = newEvents.filter((e) => e.created_at >= weekStart && e.created_at < weekEnd);

        setState({
          profile: updatedProfile,
          dailyCompleted: countTaskCompletes(todayEvts),
          dailyGoal: updatedProfile.daily_goal,
          weeklyCompleted: countTaskCompletes(weekEvts),
          weeklyGoal: updatedProfile.weekly_goal,
          loading: false,
          xpProgress: getXpProgress(newTotalXp),
        });
        return;
      }

      try {
        await fetch('/api/gamification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'revoke', reference_id: referenceId }),
        });
        await loadStats();
      } catch (err) {
        console.error('Error revoking XP:', err);
      }
    },
    [demoMode, demoProfile, demoEvents, loadStats]
  );

  return {
    ...state,
    awardXP,
    revokeXP,
    refresh: loadStats,
  };
}
