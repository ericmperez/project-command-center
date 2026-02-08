'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockMeetings } from '@/lib/mock-data';
import type { Meeting, MeetingPrepData, GitHubCommit, ChecklistItem } from '@/lib/types';

const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

export function useMeetings(projectId: string | null) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const upcomingMeetings = meetings.filter((m) => m.status === 'upcoming');
  const pastMeetings = meetings.filter((m) => m.status !== 'upcoming');

  const loadMeetings = useCallback(async () => {
    if (!projectId) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        setDemoMode(true);
        setMeetings(mockMeetings.filter((m) => m.project_id === projectId));
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/meetings?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (err) {
      console.error('Error loading meetings:', err);
      setDemoMode(true);
      setMeetings(mockMeetings.filter((m) => m.project_id === projectId));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Realtime subscription
  useEffect(() => {
    if (demoMode || !isSupabaseConfigured() || !projectId) return;

    let channel: ReturnType<typeof import('@/lib/supabase').supabase.channel> | null = null;

    const setup = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        channel = supabase
          .channel(`meetings-${projectId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meetings',
              filter: `project_id=eq.${projectId}`,
            },
            () => loadMeetings()
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to set up meetings subscription:', err);
      }
    };

    setup();

    return () => {
      if (channel) {
        import('@/lib/supabase').then(({ supabase }) => supabase.removeChannel(channel!));
      }
    };
  }, [loadMeetings, demoMode, projectId]);

  const addMeeting = useCallback(async (meeting: Partial<Meeting>) => {
    if (!projectId) return;

    if (demoMode) {
      const newMeeting: Meeting = {
        id: `meeting-${Date.now()}`,
        project_id: projectId,
        calendar_event_id: null,
        title: meeting.title || 'New Meeting',
        client_name: meeting.client_name || null,
        meeting_date: meeting.meeting_date || new Date().toISOString(),
        meeting_end: meeting.meeting_end || null,
        notes: meeting.notes || null,
        status: 'upcoming',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMeetings((prev) => [newMeeting, ...prev]);
      return;
    }

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meeting, project_id: projectId }),
      });

      if (res.ok) {
        await loadMeetings();
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
    }
  }, [projectId, demoMode, loadMeetings]);

  const updateMeetingStatus = useCallback(async (meetingId: string, updates: Partial<Meeting>) => {
    if (demoMode) {
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, ...updates } : m))
      );
      return;
    }

    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meetingId, ...updates }),
      });

      if (res.ok) {
        await loadMeetings();
      }
    } catch (err) {
      console.error('Error updating meeting:', err);
    }
  }, [demoMode, loadMeetings]);

  const removeMeeting = useCallback(async (meetingId: string) => {
    if (demoMode) {
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      return;
    }

    try {
      const res = await fetch(`/api/meetings?id=${meetingId}&projectId=${projectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadMeetings();
      }
    } catch (err) {
      console.error('Error deleting meeting:', err);
    }
  }, [projectId, demoMode, loadMeetings]);

  const getMeetingPrep = useCallback(async (
    meetingId: string,
    repoString: string | null,
    checklistItems: ChecklistItem[]
  ): Promise<MeetingPrepData | null> => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return null;

    // Find last completed meeting
    const completedMeetings = meetings
      .filter((m) => m.status === 'completed')
      .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());

    const lastMeetingDate = completedMeetings.length > 0 ? completedMeetings[0].meeting_date : null;

    // Get completed tasks since last meeting
    const completedTasksSinceLastMeeting = lastMeetingDate
      ? checklistItems.filter(
          (item) => item.is_completed && new Date(item.updated_at) > new Date(lastMeetingDate)
        )
      : checklistItems.filter((item) => item.is_completed);

    // Get commits since last meeting
    let commitsSinceLastMeeting: GitHubCommit[] = [];
    if (repoString && lastMeetingDate) {
      try {
        const res = await fetch(
          `/api/github/issues?repo=${encodeURIComponent(repoString)}&since=${encodeURIComponent(lastMeetingDate)}`
        );
        if (res.ok) {
          const data = await res.json();
          commitsSinceLastMeeting = data.commits || [];
        }
      } catch {
        // Silently fail for commits
      }
    }

    return {
      meetingTitle: meeting.title,
      meetingDate: meeting.meeting_date,
      completedTasksSinceLastMeeting,
      commitsSinceLastMeeting,
      timeSpentSinceLastMeeting: 0,
      lastMeetingDate,
    };
  }, [meetings]);

  return {
    meetings,
    upcomingMeetings,
    pastMeetings,
    loading,
    addMeeting,
    updateMeeting: updateMeetingStatus,
    deleteMeeting: removeMeeting,
    getMeetingPrep,
    refresh: loadMeetings,
  };
}
