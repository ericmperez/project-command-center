'use client';

import { Separator } from '@/components/ui/separator';
import { CheckCircle, GitCommit, Clock } from 'lucide-react';
import { formatDuration } from '@/hooks/useTimeTracking';
import type { MeetingPrepData } from '@/lib/types';

interface MeetingPrepViewProps {
  data: MeetingPrepData;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MeetingPrepView({ data }: MeetingPrepViewProps) {
  return (
    <div className="space-y-4">
      {/* Meeting header */}
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <h3 className="text-base font-medium text-zinc-100">{data.meetingTitle}</h3>
        <p className="text-sm text-zinc-400 mt-1">{formatDate(data.meetingDate)}</p>
        {data.lastMeetingDate && (
          <p className="text-xs text-zinc-500 mt-1">
            Since last meeting: {formatDate(data.lastMeetingDate)}
          </p>
        )}
      </div>

      {/* Completed tasks */}
      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Completed Tasks ({data.completedTasksSinceLastMeeting.length})
        </h4>
        {data.completedTasksSinceLastMeeting.length === 0 ? (
          <p className="text-sm text-zinc-600 pl-6">No tasks completed since last meeting</p>
        ) : (
          <ul className="space-y-1 pl-6">
            {data.completedTasksSinceLastMeeting.map((task) => (
              <li key={task.id} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5 shrink-0">&bull;</span>
                {task.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Commits */}
      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-purple-400" />
          Recent Commits ({data.commitsSinceLastMeeting.length})
        </h4>
        {data.commitsSinceLastMeeting.length === 0 ? (
          <p className="text-sm text-zinc-600 pl-6">No commits since last meeting</p>
        ) : (
          <ul className="space-y-1 pl-6">
            {data.commitsSinceLastMeeting.map((commit) => (
              <li key={commit.sha} className="text-sm text-zinc-300 flex items-start gap-2">
                <code className="text-[10px] text-purple-400 bg-zinc-800 px-1 rounded mt-0.5 shrink-0">
                  {commit.sha}
                </code>
                <span className="truncate">{commit.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Time spent */}
      <div>
        <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Time Spent
        </h4>
        <p className="text-sm text-zinc-400 pl-6">
          {data.timeSpentSinceLastMeeting > 0
            ? formatDuration(data.timeSpentSinceLastMeeting)
            : 'No time tracked since last meeting'}
        </p>
      </div>
    </div>
  );
}
