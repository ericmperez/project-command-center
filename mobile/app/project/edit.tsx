import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Pressable, Alert, Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useProjects } from '../../hooks/useProjects';
import type { Project, ProjectType } from '../../lib/types';

const PROJECT_TYPES: ProjectType[] = ['personal', 'client', 'coding'];

export default function EditProjectScreen() {
  const { projectId, boardId } = useLocalSearchParams<{ projectId?: string; boardId?: string }>();
  const router = useRouter();
  const { addProject, editProject } = useProjects();

  const isEditing = !!projectId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('personal');
  const [githubRepo, setGithubRepo] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProject = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !data) return;
    const p = data as Project;
    setTitle(p.title);
    setDescription(p.description ?? '');
    setProjectType(p.project_type);
    setGithubRepo(p.github_repo ?? '');
    setClientName(p.client_name ?? '');
    setClientNotes(p.client_notes ?? '');
    setNextSteps(p.next_steps ?? '');
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Title is required');
      return;
    }

    setSaving(true);
    Keyboard.dismiss();

    try {
      if (isEditing) {
        await editProject(projectId!, {
          title: title.trim(),
          description: description.trim() || null,
          project_type: projectType,
          github_repo: githubRepo.trim() || null,
          client_name: clientName.trim() || null,
          client_notes: clientNotes.trim() || null,
          next_steps: nextSteps.trim() || null,
        } as Partial<Project>);
      } else {
        const targetBoardId = boardId;
        if (!targetBoardId) {
          // Default to first board
          const { data: boards } = await supabase
            .from('boards')
            .select('id')
            .order('position')
            .limit(1);
          if (!boards || boards.length === 0) {
            Alert.alert('Error', 'No boards found');
            setSaving(false);
            return;
          }
          await addProject(boards[0].id, {
            title: title.trim(),
            description: description.trim(),
            project_type: projectType,
            github_repo: githubRepo.trim(),
            client_name: clientName.trim(),
            client_notes: clientNotes.trim(),
            next_steps: nextSteps.trim(),
          });
        } else {
          await addProject(targetBoardId, {
            title: title.trim(),
            description: description.trim(),
            project_type: projectType,
            github_repo: githubRepo.trim(),
            client_name: clientName.trim(),
            client_notes: clientNotes.trim(),
            next_steps: nextSteps.trim(),
          });
        }
      }
      router.back();
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? 'Edit Project' : 'New Project' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Project title"
          placeholderTextColor="#666680"
          autoFocus={!isEditing}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Project description"
          placeholderTextColor="#666680"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.segmentedRow}>
          {PROJECT_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.segment, projectType === type && styles.segmentActive]}
              onPress={() => setProjectType(type)}
            >
              <Text style={[styles.segmentText, projectType === type && styles.segmentTextActive]}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>GitHub Repo</Text>
        <TextInput
          style={styles.input}
          value={githubRepo}
          onChangeText={setGithubRepo}
          placeholder="owner/repo"
          placeholderTextColor="#666680"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Client Name</Text>
        <TextInput
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholder="Client name"
          placeholderTextColor="#666680"
        />

        <Text style={styles.label}>Client Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={clientNotes}
          onChangeText={setClientNotes}
          placeholder="Notes about the client or project"
          placeholderTextColor="#666680"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Next Steps</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={nextSteps}
          onChangeText={setNextSteps}
          placeholder="Next steps (one per line)"
          placeholderTextColor="#666680"
          multiline
          numberOfLines={4}
        />

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </Text>
        </Pressable>
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
  label: {
    color: '#a0a0b8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0f0',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#6c5ce722',
    borderColor: '#6c5ce7',
  },
  segmentText: {
    color: '#a0a0b8',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  segmentTextActive: {
    color: '#6c5ce7',
  },
  saveButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
