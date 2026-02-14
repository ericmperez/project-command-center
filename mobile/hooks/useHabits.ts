import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  XP_VALUES,
  getLevelFromXp,
  computeStreak,
  computeHabitStreak,
  getHabitStreakBonus,
} from '../lib/gamification';
import type { Habit, HabitCompletion, HeatmapDay } from '../lib/types';

interface HabitsState {
  habits: Habit[];
  heatmapData: HeatmapDay[];
  completionsToday: Record<string, boolean>;
  loading: boolean;
}

export function useHabits() {
  const [state, setState] = useState<HabitsState>({
    habits: [],
    heatmapData: [],
    completionsToday: {},
    loading: true,
  });

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 364);
      const startStr = startDate.toISOString().split('T')[0];

      const [habitsRes, completionsRes, todayRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('is_archived', false)
          .order('position'),
        supabase
          .from('habit_completions')
          .select('completed_date')
          .gte('completed_date', startStr)
          .lte('completed_date', today),
        supabase
          .from('habit_completions')
          .select('*')
          .eq('completed_date', today),
      ]);

      const habits: Habit[] = habitsRes.data ?? [];

      // Build heatmap
      const counts: Record<string, number> = {};
      for (const row of completionsRes.data ?? []) {
        counts[row.completed_date] = (counts[row.completed_date] || 0) + 1;
      }
      const heatmapData = Object.entries(counts).map(([date, count]) => ({ date, count }));

      // Build today map
      const todayMap: Record<string, boolean> = {};
      for (const row of (todayRes.data ?? []) as HabitCompletion[]) {
        todayMap[row.habit_id] = true;
      }

      setState({
        habits,
        heatmapData,
        completionsToday: todayMap,
        loading: false,
      });
    } catch (err) {
      console.error('useHabits load error:', err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('habits-mobile-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_completions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const createHabit = useCallback(
    async (name: string, icon?: string, color?: string) => {
      const { data: existing } = await supabase
        .from('habits')
        .select('position')
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      await supabase.from('habits').insert({
        name,
        icon: icon || '',
        color: color || '#10b981',
        position: nextPosition,
      });

      await loadData();
    },
    [loadData]
  );

  const toggleCompletion = useCallback(
    async (habitId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const wasCompleted = state.completionsToday[habitId];

      // Optimistic update
      setState((prev) => ({
        ...prev,
        completionsToday: {
          ...prev.completionsToday,
          [habitId]: !wasCompleted,
        },
      }));

      const referenceId = `habit_${habitId}_${today}`;

      if (wasCompleted) {
        // Remove completion
        await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', today);

        // Revoke XP
        const { data: xpEvent } = await supabase
          .from('xp_events')
          .select('*')
          .eq('reference_id', referenceId)
          .maybeSingle();

        if (xpEvent) {
          await supabase.from('xp_events').delete().eq('reference_id', referenceId);

          const { data: profile } = await supabase
            .from('gamification_profile')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (profile) {
            const newTotalXp = Math.max(0, profile.total_xp - xpEvent.xp_amount);
            await supabase
              .from('gamification_profile')
              .update({
                total_xp: newTotalXp,
                level: getLevelFromXp(newTotalXp),
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);
          }
        }
      } else {
        // Add completion
        await supabase.from('habit_completions').insert({
          habit_id: habitId,
          completed_date: today,
        });

        // Award XP
        const { data: existing } = await supabase
          .from('xp_events')
          .select('id')
          .eq('reference_id', referenceId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('xp_events').insert({
            event_type: 'habit_complete',
            xp_amount: XP_VALUES.habit_complete,
            project_id: null,
            reference_id: referenceId,
          });

          const { data: profile } = await supabase
            .from('gamification_profile')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (profile) {
            let newTotalXp = profile.total_xp + XP_VALUES.habit_complete;
            const streakResult = computeStreak(profile.last_active_date, profile.current_streak);

            // Check streak milestones
            const { data: completionRows } = await supabase
              .from('habit_completions')
              .select('completed_date')
              .eq('habit_id', habitId)
              .order('completed_date', { ascending: false });

            const dates = (completionRows ?? []).map((r: { completed_date: string }) => r.completed_date);
            const habitStreak = computeHabitStreak(dates, today);
            const streakBonus = getHabitStreakBonus(habitStreak);

            if (streakBonus > 0) {
              const bonusRef = `habit_streak_${habitId}_${habitStreak}d`;
              const { data: existingBonus } = await supabase
                .from('xp_events')
                .select('id')
                .eq('reference_id', bonusRef)
                .maybeSingle();

              if (!existingBonus) {
                await supabase.from('xp_events').insert({
                  event_type: 'habit_complete',
                  xp_amount: streakBonus,
                  project_id: null,
                  reference_id: bonusRef,
                });
                newTotalXp += streakBonus;
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
          }
        }
      }

      await loadData();
    },
    [state.completionsToday, loadData]
  );

  const deleteHabitById = useCallback(
    async (habitId: string) => {
      await supabase.from('habits').delete().eq('id', habitId);
      await loadData();
    },
    [loadData]
  );

  return {
    ...state,
    createHabit,
    toggleCompletion,
    deleteHabit: deleteHabitById,
    refresh: loadData,
  };
}
