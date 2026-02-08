import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useGamification } from '../../hooks/useGamification';
import { useProjects } from '../../hooks/useProjects';
import { XpBar } from '../../components/XpBar';
import { StatsCard } from '../../components/StatsCard';

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

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGam(), refreshProj()]);
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
