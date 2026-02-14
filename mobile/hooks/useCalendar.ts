import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../lib/types';

export function useCalendar() {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

      const [todayRes, upcomingRes] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .gte('start_time', todayStart)
          .lt('start_time', todayEnd)
          .order('start_time'),
        supabase
          .from('calendar_events')
          .select('*')
          .gte('start_time', todayEnd)
          .lt('start_time', weekEnd)
          .order('start_time'),
      ]);

      if (todayRes.error) throw todayRes.error;
      if (upcomingRes.error) throw upcomingRes.error;

      setTodayEvents(todayRes.data ?? []);
      setUpcomingEvents(upcomingRes.data ?? []);
    } catch (err) {
      console.error('useCalendar load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('calendar-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { todayEvents, upcomingEvents, loading, refresh: load };
}
