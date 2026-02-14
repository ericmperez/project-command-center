'use client';

import type { HeatmapDay, Habit } from '@/lib/types';

interface HabitsStatsProps {
  heatmapData: HeatmapDay[];
  habits: Habit[];
  completionsToday: Record<string, boolean>;
}

export function HabitsStats({ heatmapData, habits, completionsToday }: HabitsStatsProps) {
  const totalCompletions = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const todayCount = Object.values(completionsToday).filter(Boolean).length;
  const activeHabits = habits.length;

  // Compute longest streak across all days
  const sortedDates = heatmapData
    .filter((d) => d.count > 0)
    .map((d) => d.date)
    .sort();

  let longestStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  const stats = [
    { label: 'Total', value: totalCompletions.toString(), sub: 'this year' },
    { label: 'Longest Streak', value: `${longestStreak}d`, sub: 'consecutive' },
    { label: 'Today', value: `${todayCount}/${activeHabits}`, sub: 'completed' },
    { label: 'Active', value: activeHabits.toString(), sub: 'habits' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2"
        >
          <div className="text-lg font-bold text-zinc-100 tabular-nums">{stat.value}</div>
          <div className="text-[11px] text-zinc-500">
            {stat.label} <span className="text-zinc-600">{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
