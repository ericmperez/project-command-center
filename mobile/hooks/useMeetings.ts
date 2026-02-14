import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Meeting, MeetingStatus } from '../lib/types';

export function useMeetings(projectId: string) {
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [past, setPast] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('project_id', projectId)
        .order('meeting_date', { ascending: true });

      if (error) throw error;

      const meetings: Meeting[] = data ?? [];
      const now = new Date().toISOString();

      setUpcoming(meetings.filter((m) => m.status === 'upcoming' && m.meeting_date >= now));
      setPast(meetings.filter((m) => m.status !== 'upcoming' || m.meeting_date < now));
    } catch (err) {
      console.error('useMeetings load error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`meetings-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings', filter: `project_id=eq.${projectId}` },
        () => { load(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, load]);

  const addMeeting = useCallback(
    async ({ title, meeting_date }: { title: string; meeting_date: string }) => {
      try {
        const { error } = await supabase.from('meetings').insert({
          project_id: projectId,
          title,
          meeting_date,
          status: 'upcoming',
        });

        if (error) throw error;

        // Update project's next_meeting_date
        await updateNextMeetingDate();
        await load();
      } catch (err) {
        console.error('addMeeting error:', err);
      }
    },
    [projectId, load, updateNextMeetingDate]
  );

  const updateMeetingStatus = useCallback(
    async (meetingId: string, status: MeetingStatus) => {
      try {
        const { error } = await supabase
          .from('meetings')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', meetingId);

        if (error) throw error;
        await updateNextMeetingDate();
        await load();
      } catch (err) {
        console.error('updateMeetingStatus error:', err);
      }
    },
    [load, updateNextMeetingDate]
  );

  const deleteMeeting = useCallback(
    async (meetingId: string) => {
      try {
        const { error } = await supabase
          .from('meetings')
          .delete()
          .eq('id', meetingId);

        if (error) throw error;
        await updateNextMeetingDate();
        await load();
      } catch (err) {
        console.error('deleteMeeting error:', err);
      }
    },
    [load, updateNextMeetingDate]
  );

  const updateNextMeetingDate = useCallback(async () => {
    const { data } = await supabase
      .from('meetings')
      .select('meeting_date')
      .eq('project_id', projectId)
      .eq('status', 'upcoming')
      .gte('meeting_date', new Date().toISOString())
      .order('meeting_date')
      .limit(1);

    const nextDate = data && data.length > 0 ? data[0].meeting_date : null;

    await supabase
      .from('projects')
      .update({ next_meeting_date: nextDate, updated_at: new Date().toISOString() })
      .eq('id', projectId);
  }, [projectId]);

  return { upcoming, past, loading, addMeeting, updateMeetingStatus, deleteMeeting, refresh: load };
}
