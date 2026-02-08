'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockCalendarEvents } from '@/lib/mock-data';
import type { CalendarEvent } from '@/lib/types';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

export function useCalendar() {
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setDemoMode(true);
        // Filter mock events for today
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));

        const todayEvents = mockCalendarEvents.filter((e) => {
          const eventDate = new Date(e.start_time);
          return eventDate >= todayStart && eventDate <= todayEnd;
        });

        setTodaysEvents(todayEvents);
        setUpcomingEvents(mockCalendarEvents);
        setLoading(false);
        return;
      }

      const { getTodaysEvents, getCalendarEvents } = await import('@/lib/supabase');

      const [today, upcoming] = await Promise.all([
        getTodaysEvents(),
        getCalendarEvents(),
      ]);

      setTodaysEvents(today);
      setUpcomingEvents(upcoming);
    } catch (err) {
      // Fall back to mock data
      console.error('Error loading calendar events, using mock data:', err);
      setDemoMode(true);
      setTodaysEvents(mockCalendarEvents.slice(0, 2));
      setUpcomingEvents(mockCalendarEvents);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Set up realtime subscription for calendar updates (only if not demo mode)
  useEffect(() => {
    if (demoMode || !isSupabaseConfigured()) return;

    let channel: ReturnType<typeof import('@/lib/supabase').supabase.channel> | null = null;

    const setupSubscription = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        channel = supabase
          .channel('calendar-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'calendar_events' },
            () => {
              loadEvents();
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to set up calendar subscription:', err);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        import('@/lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel!);
        });
      }
    };
  }, [loadEvents, demoMode]);

  return {
    todaysEvents,
    upcomingEvents,
    loading,
    error,
    demoMode,
    refresh: loadEvents,
  };
}
