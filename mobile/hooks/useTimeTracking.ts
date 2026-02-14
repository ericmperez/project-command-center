import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useGamification } from './useGamification';
import type { TimeSession } from '../lib/types';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function useTimeTracking(projectId: string) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { awardXP } = useGamification();

  const loadSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const list: TimeSession[] = data ?? [];
      setSessions(list);

      // Detect active session (no end_time)
      const active = list.find((s) => s.end_time == null) ?? null;
      setActiveSession(active);

      const total = list.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
      setTotalTime(total);
    } catch (err) {
      console.error('useTimeTracking load error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSessions();

    const channel = supabase
      .channel(`time-tracking-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_sessions', filter: `project_id=eq.${projectId}` },
        () => { loadSessions(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, loadSessions]);

  // Live elapsed time counter
  useEffect(() => {
    if (!activeSession) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeSession.start_time).getTime();

    const tick = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSession]);

  const startSession = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('time_sessions')
        .insert({
          project_id: projectId,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setActiveSession(data);
    } catch (err) {
      console.error('startSession error:', err);
    }
  }, [projectId]);

  const stopSession = useCallback(async (notes?: string) => {
    if (!activeSession) return;

    try {
      const endTime = new Date();
      const startTime = new Date(activeSession.start_time);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const { error } = await supabase
        .from('time_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
          notes: notes || null,
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      // Update project total_time_seconds
      const { data: allSessions } = await supabase
        .from('time_sessions')
        .select('duration_seconds')
        .eq('project_id', projectId)
        .not('duration_seconds', 'is', null);

      if (allSessions) {
        const totalSeconds = allSessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
        await supabase
          .from('projects')
          .update({ total_time_seconds: totalSeconds, updated_at: new Date().toISOString() })
          .eq('id', projectId);
      }

      // Award XP for the session
      await awardXP('time_session', activeSession.id, projectId);

      setActiveSession(null);
      setElapsedSeconds(0);
      await loadSessions();
    } catch (err) {
      console.error('stopSession error:', err);
    }
  }, [activeSession, projectId, awardXP, loadSessions]);

  const formattedElapsed = formatDuration(elapsedSeconds);
  const formattedTotal = formatDuration(totalTime);

  return {
    sessions,
    activeSession,
    elapsedSeconds,
    formattedElapsed,
    totalTime,
    formattedTotal,
    loading,
    isTracking: !!activeSession,
    startSession,
    stopSession,
    refresh: loadSessions,
  };
}
