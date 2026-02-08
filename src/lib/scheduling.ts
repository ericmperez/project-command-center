import type { ChecklistItem, TimeSession, SchedulingEstimate } from './types';

const PRODUCTIVE_HOURS_PER_DAY = 6;

export function calculateSchedulingEstimate(
  items: ChecklistItem[],
  sessions: TimeSession[],
  nextMeetingDate: string | null
): SchedulingEstimate {
  const completedTasks = items.filter((i) => i.is_completed);
  const remainingTasks = items.filter((i) => !i.is_completed);

  // Calculate average time per completed task
  const completedSessions = sessions.filter((s) => s.duration_seconds != null);
  const totalTimeSpent = completedSessions.reduce(
    (sum, s) => sum + (s.duration_seconds || 0),
    0
  );

  // Avg time per task in hours (default to 2h if no data)
  const avgTimePerTask =
    completedTasks.length > 0 && totalTimeSpent > 0
      ? totalTimeSpent / completedTasks.length / 3600
      : 2;

  const estimatedHoursRemaining = remainingTasks.length * avgTimePerTask;

  // Calculate suggested start date working backwards from next meeting
  let suggestedStartDate: string | null = null;
  let status: SchedulingEstimate['status'] = 'no_deadline';

  if (nextMeetingDate) {
    const meetingDate = new Date(nextMeetingDate);
    const daysNeeded = Math.ceil(estimatedHoursRemaining / PRODUCTIVE_HOURS_PER_DAY);
    const startDate = new Date(meetingDate);
    startDate.setDate(startDate.getDate() - daysNeeded);
    suggestedStartDate = startDate.toISOString();

    const now = new Date();
    const daysUntilMeeting = Math.ceil(
      (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const productiveHoursAvailable = daysUntilMeeting * PRODUCTIVE_HOURS_PER_DAY;

    if (estimatedHoursRemaining <= 0) {
      status = 'on_track';
    } else if (productiveHoursAvailable >= estimatedHoursRemaining * 1.5) {
      status = 'on_track';
    } else if (productiveHoursAvailable >= estimatedHoursRemaining) {
      status = 'at_risk';
    } else {
      status = 'behind';
    }
  }

  return {
    remainingTasks: remainingTasks.length,
    avgTimePerTask: Math.round(avgTimePerTask * 10) / 10,
    estimatedHoursRemaining: Math.round(estimatedHoursRemaining * 10) / 10,
    suggestedStartDate,
    nextMeetingDate,
    status,
  };
}
