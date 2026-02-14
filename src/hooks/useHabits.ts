'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  mockHabits,
  mockHabitCompletions,
  getMockHeatmapData,
  getMockTodayCompletions,
  isDemoMode,
} from '@/lib/mock-data';
import { XP_VALUES, computeHabitStreak, getHabitStreakBonus } from '@/lib/gamification';
import type { Habit, HeatmapDay, HabitCompletion } from '@/lib/types';

const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

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
  const [demoMode, setDemoMode] = useState(false);
  const [demoHabits, setDemoHabits] = useState<Habit[]>([...mockHabits]);
  const [demoCompletions, setDemoCompletions] = useState<HabitCompletion[]>([...mockHabitCompletions]);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setDemoMode(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayMap: Record<string, boolean> = {};
      for (const c of demoCompletions) {
        if (c.completed_date === todayStr) {
          todayMap[c.habit_id] = true;
        }
      }

      // Build heatmap from demo completions
      const counts: Record<string, number> = {};
      for (const c of demoCompletions) {
        counts[c.completed_date] = (counts[c.completed_date] || 0) + 1;
      }
      const heatmap = Object.entries(counts).map(([date, count]) => ({ date, count }));

      setState({
        habits: demoHabits.filter((h) => !h.is_archived),
        heatmapData: heatmap,
        completionsToday: todayMap,
        loading: false,
      });
      return;
    }

    try {
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const todayMap: Record<string, boolean> = {};
      for (const c of data.todayCompletions || []) {
        todayMap[c.habit_id] = true;
      }

      setState({
        habits: data.habits,
        heatmapData: data.heatmapData,
        completionsToday: todayMap,
        loading: false,
      });
    } catch (err) {
      console.error('Error loading habits:', err);
      setDemoMode(true);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [demoHabits, demoCompletions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let channel: ReturnType<typeof import('@/lib/supabase').supabase.channel> | null = null;

    (async () => {
      const { supabase } = await import('@/lib/supabase');
      channel = supabase.channel('habits-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_completions' }, () => {
          loadData();
        })
        .subscribe();
    })();

    return () => {
      if (channel) {
        import('@/lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel!);
        });
      }
    };
  }, [loadData]);

  const createHabit = useCallback(
    async (name: string, icon?: string, color?: string) => {
      if (demoMode) {
        const newHabit: Habit = {
          id: `habit-${Date.now()}`,
          name,
          icon: icon || '',
          color: color || '#10b981',
          is_archived: false,
          position: demoHabits.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setDemoHabits((prev) => [...prev, newHabit]);
        return;
      }

      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name, icon, color }),
      });
      await loadData();
    },
    [demoMode, demoHabits, loadData]
  );

  const toggleCompletion = useCallback(
    async (habitId: string) => {
      const today = new Date().toISOString().split('T')[0];

      if (demoMode) {
        const isCompleted = state.completionsToday[habitId];

        // Optimistic update
        setState((prev) => ({
          ...prev,
          completionsToday: {
            ...prev.completionsToday,
            [habitId]: !isCompleted,
          },
        }));

        if (isCompleted) {
          // Remove completion
          setDemoCompletions((prev) =>
            prev.filter((c) => !(c.habit_id === habitId && c.completed_date === today))
          );
        } else {
          // Add completion
          setDemoCompletions((prev) => [
            ...prev,
            {
              id: `comp-${Date.now()}`,
              habit_id: habitId,
              completed_date: today,
              created_at: new Date().toISOString(),
            },
          ]);
        }
        return;
      }

      // Optimistic update
      const wasCompleted = state.completionsToday[habitId];
      setState((prev) => ({
        ...prev,
        completionsToday: {
          ...prev.completionsToday,
          [habitId]: !wasCompleted,
        },
      }));

      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', habit_id: habitId, date: today }),
      });
      await loadData();
    },
    [demoMode, state.completionsToday, loadData]
  );

  const deleteHabitById = useCallback(
    async (habitId: string) => {
      if (demoMode) {
        setDemoHabits((prev) => prev.filter((h) => h.id !== habitId));
        setDemoCompletions((prev) => prev.filter((c) => c.habit_id !== habitId));
        return;
      }

      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: habitId }),
      });
      await loadData();
    },
    [demoMode, loadData]
  );

  const updateHabitById = useCallback(
    async (habitId: string, updates: Partial<Habit>) => {
      if (demoMode) {
        setDemoHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h))
        );
        return;
      }

      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: habitId, updates }),
      });
      await loadData();
    },
    [demoMode, loadData]
  );

  return {
    ...state,
    createHabit,
    toggleCompletion,
    deleteHabit: deleteHabitById,
    updateHabit: updateHabitById,
    refresh: loadData,
  };
}
