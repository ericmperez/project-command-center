'use client';

import { Clock } from 'lucide-react';

interface ActiveTimerBadgeProps {
  formattedElapsed: string;
  isTracking: boolean;
}

export function ActiveTimerBadge({ formattedElapsed, isTracking }: ActiveTimerBadgeProps) {
  if (!isTracking) return null;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <Clock className="w-3 h-3 text-emerald-400" />
      <span className="text-xs font-mono text-emerald-400">{formattedElapsed}</span>
    </div>
  );
}
