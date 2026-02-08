import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  XP_VALUES,
  getLevelFromXp,
  getXpProgress,
  computeStreak,
  getDayBounds,
  getWeekBounds,
  countTaskCompletes,
} from '../lib/gamification';
import type { GamificationProfile, XpEventType } from '../lib/types';

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
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [dailyCompleted, setDailyCompleted] = useState(0);
  const [weeklyCompleted, setWeeklyCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  const xpProgress = getXpProgress(profile?.total_xp ?? 0);

  const loadStats = useCallback(async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('gamification_profile')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) return;

      setProfile(profileData);

      // Fetch daily/weekly task_complete counts
      const { start: dayStart, end: dayEnd } = getDayBounds();
      const { start: weekStart, end: weekEnd } = getWeekBounds();

      const [todayRes, weekRes] = await Promise.all([
        supabase
          .from('xp_events')
          .select('event_type')
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd),
        supabase
          .from('xp_events')
          .select('event_type')
          .gte('created_at', weekStart)
          .lt('created_at', weekEnd),
      ]);

      setDailyCompleted(countTaskCompletes(todayRes.data ?? []));
      setWeeklyCompleted(countTaskCompletes(weekRes.data ?? []));
    } catch (err) {
      console.error('useGamification load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel('gamification-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gamification_profile' }, () => {
        loadStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'xp_events' }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStats]);

  const awardXP = useCallback(
    async (eventType: XpEventType, referenceId?: string, projectId?: string) => {
      if (!profile) return;

      // Dedup check
      if (referenceId) {
        const { data: existing } = await supabase
          .from('xp_events')
          .select('id')
          .eq('reference_id', referenceId)
          .maybeSingle();

        if (existing) return; // Already awarded
      }

      const xpAmount = XP_VALUES[eventType] ?? 0;

      // Create XP event
      await supabase.from('xp_events').insert({
        event_type: eventType,
        xp_amount: xpAmount,
        project_id: projectId ?? null,
        reference_id: referenceId ?? null,
      });

      let newTotalXp = profile.total_xp + xpAmount;

      // Update streak
      const streakResult = computeStreak(profile.last_active_date, profile.current_streak);

      // Check daily goal bonus
      if (eventType === 'task_complete') {
        const { start: dayStart, end: dayEnd } = getDayBounds();
        const { data: todayEvents } = await supabase
          .from('xp_events')
          .select('event_type')
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd);

        const dailyCount = countTaskCompletes(todayEvents ?? []);

        if (dailyCount === profile.daily_goal) {
          const bonusRef = `daily_bonus_${new Date().toISOString().split('T')[0]}`;
          await supabase.from('xp_events').insert({
            event_type: 'daily_goal_bonus',
            xp_amount: XP_VALUES.daily_goal_bonus,
            project_id: null,
            reference_id: bonusRef,
          });
          newTotalXp += XP_VALUES.daily_goal_bonus;
        }
      }

      const newLevel = getLevelFromXp(newTotalXp);

      await supabase
        .from('gamification_profile')
        .update({
          total_xp: newTotalXp,
          level: newLevel,
          current_streak: streakResult.current_streak,
          longest_streak: Math.max(profile.longest_streak, streakResult.longest_streak),
          last_active_date: streakResult.last_active_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      await loadStats();
    },
    [profile, loadStats]
  );

  const revokeXP = useCallback(
    async (referenceId: string) => {
      if (!profile) return;

      // Find and delete the XP event
      const { data: existing } = await supabase
        .from('xp_events')
        .select('*')
        .eq('reference_id', referenceId)
        .maybeSingle();

      if (!existing) return;

      await supabase.from('xp_events').delete().eq('reference_id', referenceId);

      const newTotalXp = Math.max(0, profile.total_xp - existing.xp_amount);
      const newLevel = getLevelFromXp(newTotalXp);

      await supabase
        .from('gamification_profile')
        .update({
          total_xp: newTotalXp,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      await loadStats();
    },
    [profile, loadStats]
  );

  return {
    profile,
    dailyCompleted,
    dailyGoal: profile?.daily_goal ?? 5,
    weeklyCompleted,
    weeklyGoal: profile?.weekly_goal ?? 20,
    loading,
    xpProgress,
    awardXP,
    revokeXP,
    refresh: loadStats,
  };
}
