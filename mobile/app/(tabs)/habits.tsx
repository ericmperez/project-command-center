import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { useHabits } from '../../hooks/useHabits';
import { HeatmapGrid } from '../../components/HeatmapGrid';
import { HabitRow } from '../../components/HabitRow';

export default function HabitsScreen() {
  const {
    habits,
    heatmapData,
    completionsToday,
    completionLogs,
    loading,
    createHabit,
    toggleCompletion,
    fetchLog,
    updateNotes,
    refresh,
  } = useHabits();

  const [refreshing, setRefreshing] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCreateHabit = async () => {
    if (newHabitName.trim()) {
      await createHabit(newHabitName.trim());
      setNewHabitName('');
    }
  };

  // Stats
  const totalCompletions = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const todayCount = Object.values(completionsToday).filter(Boolean).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalCompletions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {todayCount}/{habits.length}
              </Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{habits.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          {/* Heatmap */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.heatmapContainer}>
              <HeatmapGrid data={heatmapData} />
            </View>
          </View>

          {/* Habits List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&apos;s Habits</Text>
            <View style={styles.listCard}>
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  completed={completionsToday[habit.id] ?? false}
                  completionLog={completionLogs[habit.id]}
                  onToggle={(notes) => toggleCompletion(habit.id, notes)}
                  onFetchLog={() => fetchLog(habit.id)}
                  onUpdateNotes={(completionId, notes) =>
                    updateNotes(completionId, habit.id, notes)
                  }
                />
              ))}

              {habits.length === 0 && (
                <Text style={styles.emptyText}>No habits yet. Add one below!</Text>
              )}

              {/* Add habit input */}
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newHabitName}
                  onChangeText={setNewHabitName}
                  placeholder="Add a habit..."
                  placeholderTextColor="#52525b"
                  onSubmitEditing={handleCreateHabit}
                  returnKeyType="done"
                />
                {newHabitName.trim() ? (
                  <Pressable onPress={handleCreateHabit} style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
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
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#f0f0ff',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#a0a0b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  heatmapContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
  },
  listCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyText: {
    color: '#52525b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
  },
  addInput: {
    flex: 1,
    color: '#e0e0f0',
    fontSize: 15,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10b981',
    borderRadius: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
