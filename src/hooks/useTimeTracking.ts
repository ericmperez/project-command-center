'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { mockTimeSessions } from '@/lib/mock-data';
import type { TimeSession } from '@/lib/types';

const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function useTimeTracking(projectId: string | null, isOpen: boolean) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSessionRef = useRef<TimeSession | null>(null);

  // Keep ref in sync
  activeSessionRef.current = activeSession;

  const loadSessions = useCallback(async () => {
    if (!projectId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        setDemoMode(true);
        const projectSessions = mockTimeSessions.filter((s) => s.project_id === projectId);
        setSessions(projectSessions);
        setTotalTime(projectSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0));
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/time-sessions?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setActiveSession(data.active || null);
        setTotalTime(data.totalTime || 0);
      }
    } catch (err) {
      console.error('Error loading time sessions:', err);
      setDemoMode(true);
      const projectSessions = mockTimeSessions.filter((s) => s.project_id === projectId);
      setSessions(projectSessions);
      setTotalTime(projectSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load sessions when projectId changes
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auto-start session when modal opens
  useEffect(() => {
    if (!isOpen || !projectId || demoMode) return;

    let sessionId: string | null = null;

    const startSession = async () => {
      try {
        const res = await fetch('/api/time-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });

        if (res.ok) {
          const data = await res.json();
          setActiveSession(data.session);
          sessionId = data.session.id;
        }
      } catch (err) {
        console.error('Error starting time session:', err);
      }
    };

    startSession();

    return () => {
      // Auto-end session when modal closes
      if (sessionId) {
        const endSession = async () => {
          try {
            await fetch('/api/time-sessions', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, projectId }),
            });
          } catch (err) {
            console.error('Error ending time session:', err);
          }
        };

        endSession();
        setActiveSession(null);
        setElapsedSeconds(0);
        // Reload sessions after ending
        loadSessions();
      }
    };
  }, [isOpen, projectId, demoMode, loadSessions]);

  // Demo mode timer
  useEffect(() => {
    if (!isOpen || !demoMode || !projectId) return;

    setElapsedSeconds(0);
    setActiveSession({
      id: `demo-session-${Date.now()}`,
      project_id: projectId,
      start_time: new Date().toISOString(),
      end_time: null,
      duration_seconds: null,
      notes: null,
      created_at: new Date().toISOString(),
    });

    return () => {
      setActiveSession(null);
      setElapsedSeconds(0);
    };
  }, [isOpen, demoMode, projectId]);

  // Live elapsed time counter
  useEffect(() => {
    if (!activeSession) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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

  // beforeunload handler for browser close
  useEffect(() => {
    if (!activeSession || demoMode) return;

    const handleBeforeUnload = () => {
      if (activeSessionRef.current && projectId) {
        const body = JSON.stringify({
          sessionId: activeSessionRef.current.id,
          projectId,
        });
        navigator.sendBeacon('/api/time-sessions', new Blob([body], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSession, demoMode, projectId]);

  const formattedElapsed = formatDuration(elapsedSeconds);
  const formattedTotal = formatDuration(totalTime);

  const avgSessionSeconds =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length)
      : 0;
  const formattedAvg = formatDuration(avgSessionSeconds);

  return {
    sessions,
    activeSession,
    elapsedSeconds,
    formattedElapsed,
    totalTime,
    formattedTotal,
    avgSessionSeconds,
    formattedAvg,
    loading,
    isTracking: !!activeSession,
    refresh: loadSessions,
  };
}

export { formatDuration };
