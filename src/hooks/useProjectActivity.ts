'use client';

import { useState, useEffect, useMemo } from 'react';
import { mockChecklistItems, mockTimeSessions, mockMeetings } from '@/lib/mock-data';
import type { Project, ProjectActivity, ChecklistItem, TimeSession, Meeting } from '@/lib/types';

const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

function computeActivityMap(
  projects: Project[],
  checklistItems: ChecklistItem[],
  timeSessions: TimeSession[],
  meetings: Meeting[]
): Map<string, ProjectActivity> {
  const map = new Map<string, ProjectActivity>();

  // Group data by project
  const itemsByProject = new Map<string, ChecklistItem[]>();
  for (const item of checklistItems) {
    const list = itemsByProject.get(item.project_id) || [];
    list.push(item);
    itemsByProject.set(item.project_id, list);
  }

  const sessionsByProject = new Map<string, TimeSession[]>();
  for (const session of timeSessions) {
    const list = sessionsByProject.get(session.project_id) || [];
    list.push(session);
    sessionsByProject.set(session.project_id, list);
  }

  const meetingsByProject = new Map<string, Meeting[]>();
  for (const meeting of meetings) {
    const list = meetingsByProject.get(meeting.project_id) || [];
    list.push(meeting);
    meetingsByProject.set(meeting.project_id, list);
  }

  for (const project of projects) {
    const items = itemsByProject.get(project.id) || [];
    const sessions = sessionsByProject.get(project.id) || [];
    const projectMeetings = meetingsByProject.get(project.id) || [];

    // --- Compute lastActivity ---
    // Candidates: last completed task, last time session, last commit
    const candidates: { type: 'task' | 'time_session' | 'commit'; description: string; timestamp: string }[] = [];

    // Last completed task (by updated_at)
    const completedTasks = items.filter((i) => i.is_completed);
    if (completedTasks.length > 0) {
      const lastTask = completedTasks.reduce((a, b) =>
        new Date(a.updated_at) > new Date(b.updated_at) ? a : b
      );
      candidates.push({
        type: 'task',
        description: `Completed "${lastTask.title}"`,
        timestamp: lastTask.updated_at,
      });
    }

    // Last time session (already sorted desc)
    if (sessions.length > 0) {
      const lastSession = sessions[0];
      const desc = lastSession.notes
        ? `Worked on: ${lastSession.notes}`
        : 'Work session';
      candidates.push({
        type: 'time_session',
        description: desc,
        timestamp: lastSession.end_time || lastSession.start_time,
      });
    }

    // Last commit
    if (project.github_last_commit) {
      candidates.push({
        type: 'commit',
        description: `Commit: ${project.github_last_commit.message}`,
        timestamp: project.github_last_commit.date,
      });
    }

    // Pick most recent
    let lastActivity: ProjectActivity['lastActivity'] = null;
    if (candidates.length > 0) {
      candidates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      lastActivity = candidates[0];
    }

    // --- Compute nextStep ---
    let nextStep: ProjectActivity['nextStep'] = null;

    // 1. First uncompleted task (by position)
    const uncompletedTasks = items
      .filter((i) => !i.is_completed)
      .sort((a, b) => a.position - b.position);
    if (uncompletedTasks.length > 0) {
      nextStep = {
        type: 'task',
        description: uncompletedTasks[0].title,
      };
    }
    // 2. next_steps field
    else if (project.next_steps) {
      nextStep = {
        type: 'next_steps',
        description: project.next_steps,
      };
    }
    // 3. Upcoming meeting
    else if (projectMeetings.length > 0) {
      const nextMeeting = projectMeetings[0]; // already sorted ascending
      const meetingDate = new Date(nextMeeting.meeting_date);
      const formatted = meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      nextStep = {
        type: 'meeting',
        description: `${nextMeeting.title} — ${formatted}`,
      };
    }
    // 4. Fallback
    else {
      nextStep = {
        type: 'fallback',
        description: 'Add tasks to get started',
      };
    }

    map.set(project.id, { lastActivity, nextStep });
  }

  return map;
}

export function useProjectActivity(projects: Project[], demoMode: boolean) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [timeSessions, setTimeSessions] = useState<TimeSession[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (projects.length === 0) return;

    if (demoMode || !isSupabaseConfigured()) {
      setChecklistItems(mockChecklistItems);
      setTimeSessions(mockTimeSessions);
      setMeetings(mockMeetings.filter((m) => m.status === 'upcoming'));
      setLoaded(true);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const { getAllChecklistItems, getRecentTimeSessions, getUpcomingMeetingsAll } =
          await import('@/lib/supabase');

        const [items, sessions, mtgs] = await Promise.all([
          getAllChecklistItems(),
          getRecentTimeSessions(100),
          getUpcomingMeetingsAll(),
        ]);

        if (!cancelled) {
          setChecklistItems(items);
          setTimeSessions(sessions);
          setMeetings(mtgs);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to fetch project activity data:', err);
        // Fall back to empty — cards will show "Updated X ago" fallback
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [projects.length, demoMode]);

  const activityMap = useMemo(() => {
    if (!loaded || projects.length === 0) return new Map<string, ProjectActivity>();
    return computeActivityMap(projects, checklistItems, timeSessions, meetings);
  }, [projects, checklistItems, timeSessions, meetings, loaded]);

  return activityMap;
}
