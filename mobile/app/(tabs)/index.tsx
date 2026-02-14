import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useGamification } from '../../hooks/useGamification';
import { useProjects } from '../../hooks/useProjects';
import { useCalendar } from '../../hooks/useCalendar';
import { XpBar } from '../../components/XpBar';
import { StatsCard } from '../../components/StatsCard';
import { supabase } from '../../lib/supabase';
import type { Meeting } from '../../lib/types';

export default function DashboardScreen() {
  const {
    profile,
    dailyCompleted,
    dailyGoal,
    weeklyCompleted,
    weeklyGoal,
    loading: gamLoading,
    xpProgress,
    refresh: refreshGam,
  } = useGamification();

  const { boards, loading: projLoading, refresh: refreshProj } = useProjects();
  const { todayEvents, upcomingEvents, refresh: refreshCal } = useCalendar();

  const [upcomingMeetings, setUpcomingMeetings] = useState<(Meeting & { project_title?: string })[]>([]);

  const [refreshing, setRefreshing] = React.useState(false);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, projects(title)')
        .eq('status', 'upcoming')
        .gte('meeting_date', new Date().toISOString())
        .order('meeting_date')
        .limit(5);

      if (error) throw error;

      const meetings = (data ?? []).map((m: Record<string, unknown>) => ({
        ...m,
        project_title: (m.projects as Record<string, string> | null)?.title,
      }));
      setUpcomingMeetings(meetings);
    } catch (err) {
      console.error('loadMeetings error:', err);
    } finally {
      setMeetingsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGam(), refreshProj(), refreshCal(), loadMeetings()]);
    setRefreshing(false);
  };

  const loading = gamLoading || projLoading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6c5ce7"
        />
      }
    >
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <XpBar
            level={xpProgress.level}
            progressPercent={xpProgress.progressPercent}
            progressXp={xpProgress.progressXp}
            nextLevelXp={xpProgress.nextLevelXp}
            currentLevelXp={xpProgress.currentLevelXp}
            totalXp={profile?.total_xp ?? 0}
          />

          <View style={styles.statsRow}>
            <StatsCard
              icon="🔥"
              label="Streak"
              value={`${profile?.current_streak ?? 0}`}
              subValue={`Best: ${profile?.longest_streak ?? 0}`}
            />
            <StatsCard
              icon="🎯"
              label="Daily"
              value={`${dailyCompleted}/${dailyGoal}`}
            />
            <StatsCard
              icon="📅"
              label="Weekly"
              value={`${weeklyCompleted}/${weeklyGoal}`}
            />
          </View>

          {/* Today's Calendar Events */}
          {todayEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Today</Text>
              {todayEvents.map((event) => {
                const start = new Date(event.start_time);
                const end = new Date(event.end_time);
                return (
                  <View key={event.id} style={styles.eventCard}>
                    <Text style={styles.eventTime}>
                      {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.calendar_name && (
                      <Text style={styles.eventCalendar}>{event.calendar_name}</Text>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {upcomingEvents.slice(0, 5).map((event) => {
                const start = new Date(event.start_time);
                return (
                  <View key={event.id} style={styles.eventCard}>
                    <Text style={styles.eventTime}>
                      {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' '}
                      {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Upcoming Meetings */}
          {upcomingMeetings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
              {upcomingMeetings.map((meeting) => {
                const date = new Date(meeting.meeting_date);
                return (
                  <View key={meeting.id} style={styles.meetingCard}>
                    <View style={styles.meetingLeft}>
                      <Text style={styles.meetingTitle}>{meeting.title}</Text>
                      {meeting.project_title && (
                        <Text style={styles.meetingProject}>{meeting.project_title}</Text>
                      )}
                    </View>
                    <Text style={styles.meetingDate}>
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                );
              })}
            </>
          )}

          <Text style={styles.sectionTitle}>Boards</Text>
          {boards.map((board) => (
            <View key={board.id} style={styles.boardCard}>
              <View style={styles.boardHeader}>
                <Text style={styles.boardName}>{board.name}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{board.projects.length}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: '#a0a0b8',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  // Calendar events
  eventCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  eventTime: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTitle: {
    color: '#e0e0f0',
    fontSize: 15,
    fontWeight: '500',
  },
  eventCalendar: {
    color: '#666680',
    fontSize: 11,
    marginTop: 2,
  },
  // Meetings
  meetingCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetingLeft: {
    flex: 1,
    marginRight: 12,
  },
  meetingTitle: {
    color: '#e0e0f0',
    fontSize: 15,
    fontWeight: '500',
  },
  meetingProject: {
    color: '#666680',
    fontSize: 12,
    marginTop: 2,
  },
  meetingDate: {
    color: '#a0a0b8',
    fontSize: 13,
    fontWeight: '600',
  },
  // Boards
  boardCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boardName: {
    color: '#e0e0f0',
    fontSize: 16,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    color: '#a0a0b8',
    fontSize: 13,
    fontWeight: '600',
  },
});
