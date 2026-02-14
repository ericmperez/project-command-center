import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, Pressable,
  Keyboard, Linking, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useChecklist } from '../../hooks/useChecklist';
import { useGamification } from '../../hooks/useGamification';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useMeetings } from '../../hooks/useMeetings';
import { useProjects } from '../../hooks/useProjects';
import { ChecklistItemRow } from '../../components/ChecklistItemRow';
import { MeetingRow } from '../../components/MeetingRow';
import { formatHours } from '../../lib/format';
import { generatePrompts } from '../../lib/prompt-generator';
import type { Project, ChecklistItem } from '../../lib/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projLoading, setProjLoading] = useState(true);

  const { items, loading: checkLoading, toggleItem, addItem, deleteItem } = useChecklist(id!);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { awardXP, revokeXP } = useGamification();
  const { editProject } = useProjects();

  // Time tracking
  const {
    sessions, formattedElapsed,
    formattedTotal, loading: timeLoading,
    startSession, stopSession, isTracking,
  } = useTimeTracking(id!);
  const [stopNotes, setStopNotes] = useState('');
  const [showStopNotes, setShowStopNotes] = useState(false);

  // Meetings
  const {
    upcoming: upcomingMeetings, past: pastMeetings,
    addMeeting, updateMeetingStatus, deleteMeeting,
  } = useMeetings(id!);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [showPastMeetings, setShowPastMeetings] = useState(false);

  // Notes editing
  const [editingClientName, setEditingClientName] = useState('');
  const [editingClientNotes, setEditingClientNotes] = useState('');
  const [editingNextSteps, setEditingNextSteps] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const loadProject = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (project) {
      setEditingClientName(project.client_name ?? '');
      setEditingClientNotes(project.client_notes ?? '');
      setEditingNextSteps(project.next_steps ?? '');
    }
  }, [project]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProject();
    setRefreshing(false);
  };

  const handleToggle = async (item: ChecklistItem) => {
    const wasCompleted = item.is_completed;
    await toggleItem(item);

    if (!wasCompleted) {
      await awardXP('task_complete', item.id, id);
    } else {
      await revokeXP(item.id);
    }
  };

  const handleStopSession = async () => {
    if (showStopNotes) {
      await stopSession(stopNotes.trim() || undefined);
      setStopNotes('');
      setShowStopNotes(false);
    } else {
      setShowStopNotes(true);
    }
  };

  const handleAddMeeting = async () => {
    if (!meetingTitle.trim() || !meetingDate.trim()) return;
    await addMeeting({ title: meetingTitle.trim(), meeting_date: meetingDate.trim() });
    setMeetingTitle('');
    setMeetingDate('');
    setShowMeetingForm(false);
  };

  const handleSaveNotes = async (field: 'client_name' | 'client_notes' | 'next_steps', value: string) => {
    if (!project) return;
    const trimmed = value.trim() || null;
    if (trimmed === (project[field] ?? null)) return;
    await editProject(project.id, { [field]: trimmed } as Partial<Project>);
    setProject((prev) => prev ? { ...prev, [field]: trimmed } : prev);
  };

  const loading = projLoading || checkLoading || timeLoading;

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Prompt generation
  const prompts = project ? generatePrompts(project) : [];

  return (
    <>
      <Stack.Screen options={{ title: project?.title ?? 'Project' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
                  onDelete={() => deleteItem(item.id)}
                />
              ))
            )}

            {/* Time Tracking */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Time Tracking</Text>
            <View style={styles.timeCard}>
              {isTracking ? (
                <>
                  <Text style={styles.timerDisplay}>{formattedElapsed}</Text>
                  {showStopNotes && (
                    <TextInput
                      style={[styles.addTaskInput, { marginBottom: 10 }]}
                      placeholder="Session notes (optional)"
                      placeholderTextColor="#666680"
                      value={stopNotes}
                      onChangeText={setStopNotes}
                      returnKeyType="done"
                    />
                  )}
                  <Pressable style={styles.stopButton} onPress={handleStopSession}>
                    <Text style={styles.timerButtonText}>
                      {showStopNotes ? 'Confirm Stop' : 'Stop Timer'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.startButton} onPress={startSession}>
                  <Text style={styles.timerButtonText}>Start Timer</Text>
                </Pressable>
              )}
              <View style={[styles.timeRow, { marginTop: 12 }]}>
                <Text style={styles.timeLabel}>Total Time</Text>
                <Text style={styles.timeValue}>{formattedTotal}</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Sessions</Text>
                <Text style={styles.timeValue}>{sessions.length}</Text>
              </View>
            </View>

            {/* Recent Sessions */}
            {sessions.slice(0, 5).map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionDate}>
                    {new Date(session.start_time).toLocaleDateString()}
                  </Text>
                  {session.notes && (
                    <Text style={styles.sessionNotes} numberOfLines={1}>{session.notes}</Text>
                  )}
                </View>
                <Text style={styles.sessionDuration}>
                  {session.duration_seconds ? formatHours(session.duration_seconds) : 'Active'}
                </Text>
              </View>
            ))}

            {/* Meetings */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Meetings</Text>
            {!showMeetingForm ? (
              <Pressable style={styles.addMeetingButton} onPress={() => setShowMeetingForm(true)}>
                <Text style={styles.addMeetingButtonText}>+ Add Meeting</Text>
              </Pressable>
            ) : (
              <View style={styles.meetingForm}>
                <TextInput
                  style={styles.addTaskInput}
                  placeholder="Meeting title"
                  placeholderTextColor="#666680"
                  value={meetingTitle}
                  onChangeText={setMeetingTitle}
                />
                <TextInput
                  style={[styles.addTaskInput, { marginTop: 8 }]}
                  placeholder="YYYY-MM-DD HH:MM"
                  placeholderTextColor="#666680"
                  value={meetingDate}
                  onChangeText={setMeetingDate}
                />
                <View style={styles.meetingFormButtons}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => { setShowMeetingForm(false); setMeetingTitle(''); setMeetingDate(''); }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.startButton, { flex: 1 }]}
                    onPress={handleAddMeeting}
                  >
                    <Text style={styles.timerButtonText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {upcomingMeetings.length === 0 && pastMeetings.length === 0 ? (
              <Text style={styles.emptyText}>No meetings</Text>
            ) : (
              <>
                {upcomingMeetings.map((m) => (
                  <MeetingRow
                    key={m.id}
                    meeting={m}
                    onUpdateStatus={updateMeetingStatus}
                    onDelete={deleteMeeting}
                  />
                ))}
                {pastMeetings.length > 0 && (
                  <>
                    <Pressable onPress={() => setShowPastMeetings(!showPastMeetings)}>
                      <Text style={styles.pastMeetingsToggle}>
                        {showPastMeetings ? 'Hide' : 'Show'} Past Meetings ({pastMeetings.length})
                      </Text>
                    </Pressable>
                    {showPastMeetings && pastMeetings.map((m) => (
                      <MeetingRow
                        key={m.id}
                        meeting={m}
                        onUpdateStatus={updateMeetingStatus}
                        onDelete={deleteMeeting}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {/* GitHub Info */}
            {project?.github_repo && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>GitHub</Text>
                <View style={styles.githubCard}>
                  <Pressable onPress={() => Linking.openURL(`https://github.com/${project.github_repo}`)}>
                    <Text style={styles.githubRepo}>{project.github_repo}</Text>
                  </Pressable>
                  {project.github_last_commit && (
                    <View style={styles.commitInfo}>
                      <Text style={styles.commitMessage} numberOfLines={2}>
                        {project.github_last_commit.message}
                      </Text>
                      <Text style={styles.commitMeta}>
                        {project.github_last_commit.author} on {project.github_last_commit.branch}
                        {' - '}{new Date(project.github_last_commit.date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.githubStats}>
                    {project.github_commit_count > 0 && (
                      <Text style={styles.githubStat}>
                        {project.github_commit_count} commits
                      </Text>
                    )}
                    {project.github_lines_of_code > 0 && (
                      <Text style={styles.githubStat}>
                        {project.github_lines_of_code.toLocaleString()} LOC
                      </Text>
                    )}
                    {(project.github_open_issues ?? 0) > 0 && (
                      <Text style={styles.githubStat}>
                        {project.github_open_issues} issues
                      </Text>
                    )}
                    {(project.github_open_prs ?? 0) > 0 && (
                      <Text style={styles.githubStat}>
                        {project.github_open_prs} PRs
                      </Text>
                    )}
                  </View>
                  {project.github_last_synced && (
                    <Text style={styles.lastSynced}>
                      Synced {new Date(project.github_last_synced).toLocaleString()}
                    </Text>
                  )}
                </View>
              </>
            )}

            {/* Notes */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>Client Name</Text>
              <TextInput
                style={styles.notesInput}
                value={editingClientName}
                onChangeText={setEditingClientName}
                onBlur={() => handleSaveNotes('client_name', editingClientName)}
                placeholder="Client name"
                placeholderTextColor="#666680"
              />

              <Text style={styles.notesLabel}>Client Notes</Text>
              <TextInput
                style={[styles.notesInput, styles.multilineInput]}
                value={editingClientNotes}
                onChangeText={setEditingClientNotes}
                onBlur={() => handleSaveNotes('client_notes', editingClientNotes)}
                placeholder="Notes about the client"
                placeholderTextColor="#666680"
                multiline
              />

              <Text style={styles.notesLabel}>Next Steps</Text>
              <TextInput
                style={[styles.notesInput, styles.multilineInput]}
                value={editingNextSteps}
                onChangeText={setEditingNextSteps}
                onBlur={() => handleSaveNotes('next_steps', editingNextSteps)}
                placeholder="Next steps (one per line)"
                placeholderTextColor="#666680"
                multiline
              />
            </View>

            {/* Prompt Generator */}
            {prompts.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Prompts</Text>
                {prompts.map((p, i) => (
                  <View key={i} style={[styles.promptCard, p.label === 'Full Context' && styles.promptCardHighlight]}>
                    <Text style={styles.promptLabel}>{p.label}</Text>
                    <Pressable
                      style={styles.copyButton}
                      onPress={() => {
                        Clipboard.setStringAsync(p.prompt);
                        Alert.alert('Copied', 'Prompt copied to clipboard');
                      }}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            )}
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
  // Time tracking
  timeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timerDisplay: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  startButton: {
    backgroundColor: '#00b894',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  timerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  sessionNotes: {
    color: '#666680',
    fontSize: 11,
    marginTop: 2,
  },
  sessionDuration: {
    color: '#e0e0f0',
    fontSize: 13,
    fontWeight: '500',
  },
  // Meetings
  addMeetingButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  addMeetingButtonText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
  },
  meetingForm: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  meetingFormButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cancelButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  cancelButtonText: {
    color: '#a0a0b8',
    fontSize: 14,
    fontWeight: '600',
  },
  pastMeetingsToggle: {
    color: '#6c5ce7',
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 8,
  },
  // GitHub
  githubCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  githubRepo: {
    color: '#6c5ce7',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  commitInfo: {
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
    paddingTop: 10,
    marginBottom: 8,
  },
  commitMessage: {
    color: '#e0e0f0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  commitMeta: {
    color: '#666680',
    fontSize: 11,
  },
  githubStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  githubStat: {
    color: '#a0a0b8',
    fontSize: 12,
    backgroundColor: '#2d2d44',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lastSynced: {
    color: '#4a4a66',
    fontSize: 10,
    marginTop: 8,
  },
  // Notes
  notesCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notesLabel: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 12,
  },
  notesInput: {
    backgroundColor: '#0d0d1a',
    borderRadius: 8,
    padding: 12,
    color: '#e0e0f0',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Prompts
  promptCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promptCardHighlight: {
    borderWidth: 1,
    borderColor: '#6c5ce7',
  },
  promptLabel: {
    color: '#e0e0f0',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
