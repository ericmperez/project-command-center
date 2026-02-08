'use client';

import { CalendarClock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { SchedulingEstimate } from '@/lib/types';

interface ScheduleBadgeProps {
  estimate: SchedulingEstimate | null;
  compact?: boolean;
}

const statusConfig = {
  on_track: {
    icon: CheckCircle,
    label: 'On Track',
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cardClass: 'text-emerald-400',
  },
  at_risk: {
    icon: Clock,
    label: 'At Risk',
    className: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    cardClass: 'text-amber-400',
  },
  behind: {
    icon: AlertTriangle,
    label: 'Behind Schedule',
    className: 'text-red-400 bg-red-500/10 border-red-500/20',
    cardClass: 'text-red-400',
  },
  no_deadline: {
    icon: CalendarClock,
    label: '',
    className: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    cardClass: 'text-zinc-500',
  },
};

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ScheduleBadge({ estimate, compact = false }: ScheduleBadgeProps) {
  if (!estimate || estimate.status === 'no_deadline') return null;

  const config = statusConfig[estimate.status];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-[10px] ${config.cardClass}`}>
        <Icon className="w-2.5 h-2.5" />
        <span>
          {estimate.suggestedStartDate
            ? `Start by ${formatShortDate(estimate.suggestedStartDate)}`
            : config.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>
        {estimate.suggestedStartDate
          ? `Start by ${formatShortDate(estimate.suggestedStartDate)}`
          : config.label}
      </span>
      {estimate.estimatedHoursRemaining > 0 && (
        <span className="opacity-70">
          ({estimate.estimatedHoursRemaining}h remaining)
        </span>
      )}
    </div>
  );
}
