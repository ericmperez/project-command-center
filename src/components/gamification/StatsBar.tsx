'use client';

import type { GamificationProfile } from '@/lib/types';
import { getXpProgress } from '@/lib/gamification';

interface StatsBarProps {
  profile: GamificationProfile | null;
  dailyCompleted: number;
  dailyGoal: number;
  weeklyCompleted: number;
  weeklyGoal: number;
  loading: boolean;
}

export function StatsBar({
  profile,
  dailyCompleted,
  dailyGoal,
  loading,
}: StatsBarProps) {
  if (loading || !profile) {
    return (
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="animate-pulse">Loading stats...</span>
      </div>
    );
  }

  const { level, progressPercent, currentLevelXp, nextLevelXp } = getXpProgress(profile.total_xp);

  // Build daily goal dots (max 10 visible dots)
  const dotsToShow = Math.min(dailyGoal, 10);
  const filledDots = Math.min(dailyCompleted, dotsToShow);
  const dailyHit = dailyCompleted >= dailyGoal;

  return (
    <div className="flex items-center gap-4 text-xs">
      {/* Level Badge */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50">
        <span className="text-amber-400">&#9733;</span>
        <span className="font-semibold text-zinc-200">Lvl {level}</span>
      </div>

      {/* XP Progress */}
      <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50">
        <span className="text-zinc-400 tabular-nums">{profile.total_xp.toLocaleString()} XP</span>
        <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-zinc-500 tabular-nums">{nextLevelXp.toLocaleString()}</span>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50">
        <span className={profile.current_streak > 0 ? 'text-orange-400' : 'text-zinc-600'}>
          &#128293;
        </span>
        <span className={`font-semibold tabular-nums ${profile.current_streak > 0 ? 'text-zinc-200' : 'text-zinc-500'}`}>
          {profile.current_streak}
        </span>
      </div>

      {/* Daily Goal */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: dotsToShow }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i < filledDots
                  ? dailyHit
                    ? 'bg-emerald-400'
                    : 'bg-blue-400'
                  : 'bg-zinc-600'
              }`}
            />
          ))}
        </div>
        <span className={`tabular-nums ${dailyHit ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}`}>
          {dailyCompleted}/{dailyGoal}
        </span>
      </div>
    </div>
  );
}
