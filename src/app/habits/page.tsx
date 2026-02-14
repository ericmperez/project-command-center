'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/useHabits';
import { useGamification } from '@/hooks/useGamification';
import { StatsBar } from '@/components/gamification/StatsBar';
import { HeatmapGrid } from '@/components/habits/HeatmapGrid';
import { HabitsList } from '@/components/habits/HabitsList';
import { HabitsStats } from '@/components/habits/HabitsStats';
import packageJson from '../../../package.json';

export default function HabitsPage() {
  const habits = useHabits();
  const gamification = useGamification();

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <span className="font-semibold text-zinc-200">Habits</span>

          <div className="hidden md:flex items-center ml-4">
            <StatsBar
              profile={gamification.profile}
              dailyCompleted={gamification.dailyCompleted}
              dailyGoal={gamification.dailyGoal}
              weeklyCompleted={gamification.weeklyCompleted}
              weeklyGoal={gamification.weeklyGoal}
              loading={gamification.loading}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {habits.loading ? (
            <div className="text-center text-zinc-500 py-20">Loading habits...</div>
          ) : (
            <>
              {/* Stats */}
              <HabitsStats
                heatmapData={habits.heatmapData}
                habits={habits.habits}
                completionsToday={habits.completionsToday}
              />

              {/* Heatmap */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 overflow-x-auto">
                <h2 className="text-sm font-medium text-zinc-400 mb-4">Activity</h2>
                <HeatmapGrid data={habits.heatmapData} />
              </div>

              {/* Habits List */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h2 className="text-sm font-medium text-zinc-400 mb-3">Today&apos;s Habits</h2>
                <HabitsList
                  habits={habits.habits}
                  completionsToday={habits.completionsToday}
                  completionLogs={habits.completionLogs}
                  onToggle={habits.toggleCompletion}
                  onCreate={habits.createHabit}
                  onDelete={habits.deleteHabit}
                  onFetchLog={habits.fetchLog}
                  onUpdateNotes={habits.updateNotes}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Version Footer */}
      <footer className="px-6 py-1.5 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-600 text-right">
        v{packageJson.version}
      </footer>
    </div>
  );
}
