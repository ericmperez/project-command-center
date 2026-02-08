'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Timer, TrendingUp, RefreshCw } from 'lucide-react';
import { formatDuration } from '@/hooks/useTimeTracking';
import type { TimeSession } from '@/lib/types';

interface TimeTrackingTabProps {
  sessions: TimeSession[];
  totalTime: number;
  formattedTotal: string;
  formattedAvg: string;
  loading: boolean;
  isTracking: boolean;
  formattedElapsed: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TimeTrackingTab({
  sessions,
  totalTime,
  formattedTotal,
  formattedAvg,
  loading,
  isTracking,
  formattedElapsed,
}: TimeTrackingTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-mono text-zinc-100">{formattedTotal}</p>
          <p className="text-[10px] text-zinc-500">Total Time</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
          <Timer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-mono text-zinc-100">{formattedAvg}</p>
          <p className="text-[10px] text-zinc-500">Avg Session</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-mono text-zinc-100">{sessions.length}</p>
          <p className="text-[10px] text-zinc-500">Sessions</p>
        </div>
      </div>

      {/* Active session indicator */}
      {isTracking && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm text-emerald-400">Active session</span>
          <span className="text-sm font-mono text-emerald-300 ml-auto">{formattedElapsed}</span>
        </div>
      )}

      {/* Session history */}
      <div>
        <h4 className="text-sm font-medium text-zinc-400 mb-2">Session History</h4>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-zinc-600 py-4 text-center">
                No sessions recorded yet. Sessions are auto-tracked when you open a project.
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 px-3 rounded bg-zinc-800/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-300 truncate">
                      {session.notes || formatDate(session.start_time)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {formatTime(session.start_time)}
                      {session.end_time && ` - ${formatTime(session.end_time)}`}
                    </p>
                  </div>
                  <span className="text-sm font-mono text-zinc-400 shrink-0 ml-3">
                    {session.duration_seconds
                      ? formatDuration(session.duration_seconds)
                      : 'Active'}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
