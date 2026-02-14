import type { ChecklistItem, TimeSession, Meeting, ProjectActivity } from '../lib/types';

export function computeProjectActivity(
  items: ChecklistItem[],
  sessions: TimeSession[],
  meetings: Meeting[],
  nextSteps: string | null
): ProjectActivity {
  // Find last activity
  let lastActivity: ProjectActivity['lastActivity'] = null;

  // Most recently completed task
  const completedItems = items
    .filter((i) => i.is_completed)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  if (completedItems.length > 0) {
    lastActivity = {
      type: 'task',
      description: `Completed "${completedItems[0].title}"`,
      timestamp: completedItems[0].updated_at,
    };
  }

  // Most recent time session
  const completedSessions = sessions.filter((s) => s.end_time != null);
  if (completedSessions.length > 0) {
    const latest = completedSessions[0]; // Already sorted desc by start_time
    if (!lastActivity || latest.start_time > lastActivity.timestamp) {
      lastActivity = {
        type: 'time_session',
        description: latest.notes || `Session on ${new Date(latest.start_time).toLocaleDateString()}`,
        timestamp: latest.start_time,
      };
    }
  }

  // Find next step
  let nextStep: ProjectActivity['nextStep'] = null;

  // First incomplete task
  const incompleteTasks = items.filter((i) => !i.is_completed);
  if (incompleteTasks.length > 0) {
    nextStep = {
      type: 'task',
      description: incompleteTasks[0].title,
    };
  } else if (nextSteps) {
    // First line from next_steps
    const firstLine = nextSteps.split('\n').map((l) => l.replace(/^[-*•]\s*/, '').trim()).find(Boolean);
    if (firstLine) {
      nextStep = {
        type: 'next_steps',
        description: firstLine,
      };
    }
  }

  // Check for upcoming meeting
  const upcomingMeetings = meetings
    .filter((m) => m.status === 'upcoming' && m.meeting_date >= new Date().toISOString())
    .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));

  if (upcomingMeetings.length > 0 && !nextStep) {
    nextStep = {
      type: 'meeting',
      description: `Meeting: ${upcomingMeetings[0].title}`,
    };
  }

  if (!nextStep) {
    nextStep = {
      type: 'fallback',
      description: 'No tasks remaining',
    };
  }

  return { lastActivity, nextStep };
}
