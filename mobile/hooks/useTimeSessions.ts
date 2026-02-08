import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TimeSession } from '../lib/types';

export function useTimeSessions(projectId: string) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const list: TimeSession[] = data ?? [];
      setSessions(list);

      const total = list.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
      setTotalSeconds(total);
    } catch (err) {
      console.error('useTimeSessions load error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`time-sessions-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_sessions', filter: `project_id=eq.${projectId}` },
        () => { load(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, load]);

  return { sessions, totalSeconds, loading, refresh: load };
}
