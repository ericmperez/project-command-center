'use client';

import { useState, useEffect, useCallback } from 'react';
import { calculateSchedulingEstimate } from '@/lib/scheduling';
import { mockChecklistItems, mockTimeSessions } from '@/lib/mock-data';
import type { SchedulingEstimate, ChecklistItem, TimeSession } from '@/lib/types';

const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

export function useSchedulingEstimate(
  projectId: string | null,
  checklistItems?: ChecklistItem[],
  sessions?: TimeSession[],
  nextMeetingDate?: string | null
) {
  const [estimate, setEstimate] = useState<SchedulingEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateEstimate = useCallback(async () => {
    if (!projectId) {
      setEstimate(null);
      return;
    }

    setLoading(true);

    try {
      // If we have data passed in, use it directly (demo mode or parent already has data)
      if (checklistItems && sessions) {
        const result = calculateSchedulingEstimate(
          checklistItems,
          sessions,
          nextMeetingDate || null
        );
        setEstimate(result);
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        const items = mockChecklistItems.filter((i) => i.project_id === projectId);
        const sess = mockTimeSessions.filter((s) => s.project_id === projectId);
        const mockProject = (await import('@/lib/mock-data')).mockProjects.find(
          (p) => p.id === projectId
        );
        const result = calculateSchedulingEstimate(
          items,
          sess,
          mockProject?.next_meeting_date || null
        );
        setEstimate(result);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/scheduling/estimate?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setEstimate(data.estimate);
      }
    } catch (err) {
      console.error('Error calculating scheduling estimate:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, checklistItems, sessions, nextMeetingDate]);

  useEffect(() => {
    calculateEstimate();
  }, [calculateEstimate]);

  return { estimate, loading, refresh: calculateEstimate };
}
