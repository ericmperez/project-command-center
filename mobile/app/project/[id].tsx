import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, Pressable, Keyboard } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useChecklist } from '../../hooks/useChecklist';
import { useGamification } from '../../hooks/useGamification';
import { useTimeSessions } from '../../hooks/useTimeSessions';
import { ChecklistItemRow } from '../../components/ChecklistItemRow';
import { formatHours } from '../../lib/format';
import type { Project, ChecklistItem } from '../../lib/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projLoading, setProjLoading] = useState(true);

  const { items, loading: checkLoading, toggleItem, addItem } = useChecklist(id!);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { awardXP, revokeXP } = useGamification();
  const { totalSeconds, sessions, loading: timeLoading } = useTimeSessions(id!);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (err) {
      console.error('loadProject error:', err);
    } finally {
      setProjLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProject();
    setRefreshing(false);
  };

  const handleToggle = async (item: ChecklistItem) => {
    const wasCompleted = item.is_completed;
    await toggleItem(item);

    if (!wasCompleted) {
      // Completing → award XP
      await awardXP('task_complete', item.id, id);
    } else {
      // Uncompleting → revoke XP
      await revokeXP(item.id);
    }
  };

  const loading = projLoading || checkLoading || timeLoading;

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <Stack.Screen options={{ title: project?.title ?? 'Project' }} />
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
            {/* Project Info */}
            {project && (
              <View style={styles.infoCard}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                {project.description && (
                  <Text style={styles.description}>{project.description}</Text>
                )}
                {project.next_steps && (
                  <View style={styles.nextSteps}>
                    <Text style={styles.nextStepsLabel}>Next Steps</Text>
                    <Text style={styles.nextStepsText}>{project.next_steps}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Completion Bar */}
            <View style={styles.completionCard}>
              <View style={styles.completionHeader}>
                <Text style={styles.completionLabel}>Completion</Text>
                <Text style={styles.completionPct}>{completionPct}%</Text>
              </View>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${completionPct}%` }]} />
              </View>
              <Text style={styles.completionCount}>
                {completedCount} of {totalCount} tasks
              </Text>
            </View>

            {/* Checklist */}
            <Text style={styles.sectionTitle}>Checklist</Text>
            <View style={styles.addTaskRow}>
              <TextInput
                style={styles.addTaskInput}
                placeholder="Add a task..."
                placeholderTextColor="#666680"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                onSubmitEditing={() => {
                  const title = newTaskTitle.trim();
                  if (title) {
                    addItem(title);
                    setNewTaskTitle('');
                    Keyboard.dismiss();
                  }
                }}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.addTaskButton, !newTaskTitle.trim() && styles.addTaskButtonDisabled]}
                onPress={() => {
                  const title = newTaskTitle.trim();
                  if (title) {
                    addItem(title);
                    setNewTaskTitle('');
                    Keyboard.dismiss();
                  }
                }}
                disabled={!newTaskTitle.trim()}
              >
                <Text style={styles.addTaskButtonText}>+</Text>
              </Pressable>
            </View>
            {items.length === 0 ? (
              <Text style={styles.emptyText}>No checklist items</Text>
            ) : (
              items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggle(item)}
                />
              ))
            )}

            {/* Time Summary */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Time Tracking</Text>
            <View style={styles.timeCard}>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Total Time</Text>
                <Text style={styles.timeValue}>{formatHours(totalSeconds)}</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Sessions</Text>
                <Text style={styles.timeValue}>{sessions.length}</Text>
              </View>
            </View>

            {/* Recent Sessions */}
            {sessions.slice(0, 5).map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <Text style={styles.sessionDate}>
                  {new Date(session.start_time).toLocaleDateString()}
                </Text>
                <Text style={styles.sessionDuration}>
                  {session.duration_seconds ? formatHours(session.duration_seconds) : 'Active'}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: '#a0a0b8',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  projectTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#a0a0b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  nextSteps: {
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
    paddingTop: 12,
  },
  nextStepsLabel: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  nextStepsText: {
    color: '#e0e0f0',
    fontSize: 14,
    lineHeight: 20,
  },
  completionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionLabel: {
    color: '#e0e0f0',
    fontSize: 14,
    fontWeight: '600',
  },
  completionPct: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: '700',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#2d2d44',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    borderRadius: 4,
  },
  completionCount: {
    color: '#666680',
    fontSize: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  addTaskRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  addTaskInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0f0',
    fontSize: 15,
  },
  addTaskButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskButtonDisabled: {
    opacity: 0.4,
  },
  addTaskButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  emptyText: {
    color: '#666680',
    fontSize: 14,
    marginBottom: 16,
  },
  timeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeLabel: {
    color: '#a0a0b8',
    fontSize: 14,
  },
  timeValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  sessionDate: {
    color: '#a0a0b8',
    fontSize: 13,
  },
  sessionDuration: {
    color: '#e0e0f0',
    fontSize: 13,
    fontWeight: '500',
  },
});
