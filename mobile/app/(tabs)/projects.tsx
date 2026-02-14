import React from 'react';
import {
  View, Text, SectionList, StyleSheet, RefreshControl, Pressable, ActionSheetIOS, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useProjects } from '../../hooks/useProjects';
import { ProjectCard } from '../../components/ProjectCard';
import type { Project } from '../../lib/types';

type SortMode = 'default' | 'meeting' | 'updated';
const SORT_LABELS: Record<SortMode, string> = {
  default: 'Default',
  meeting: 'By Meeting',
  updated: 'By Updated',
};
const SORT_CYCLE: SortMode[] = ['default', 'meeting', 'updated'];

export default function ProjectsScreen() {
  const { boards, loading, refresh, removeProject, moveProject } = useProjects();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [sortMode, setSortMode] = React.useState<SortMode>('default');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const cycleSortMode = () => {
    const idx = SORT_CYCLE.indexOf(sortMode);
    setSortMode(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
  };

  const sortProjects = (projects: Project[]): Project[] => {
    if (sortMode === 'meeting') {
      return [...projects].sort((a, b) => {
        if (!a.next_meeting_date && !b.next_meeting_date) return 0;
        if (!a.next_meeting_date) return 1;
        if (!b.next_meeting_date) return -1;
        return a.next_meeting_date.localeCompare(b.next_meeting_date);
      });
    }
    if (sortMode === 'updated') {
      return [...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    }
    return projects;
  };

  const sections = boards
    .filter((b) => b.projects.length > 0)
    .map((board) => ({
      title: board.name,
      boardId: board.id,
      data: sortProjects(board.projects),
    }));

  const handleLongPress = (project: Project) => {
    const boardNames = boards.map((b) => b.name);
    const options = ['Edit', 'Move to Board...', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;

    ActionSheetIOS.showActionSheetWithOptions(
      { options, destructiveButtonIndex, cancelButtonIndex, title: project.title },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          router.push(`/project/edit?projectId=${project.id}`);
        } else if (buttonIndex === 1) {
          const boardOptions = [...boardNames, 'Cancel'];
          ActionSheetIOS.showActionSheetWithOptions(
            { options: boardOptions, cancelButtonIndex: boardOptions.length - 1, title: 'Move to Board' },
            (boardIndex) => {
              if (boardIndex < boards.length) {
                const targetBoard = boards[boardIndex];
                if (targetBoard.id !== project.board_id) {
                  moveProject(project.id, targetBoard.id);
                }
              }
            }
          );
        } else if (buttonIndex === 2) {
          Alert.alert(
            'Delete Project',
            `Are you sure you want to delete "${project.title}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => removeProject(project.id) },
            ]
          );
        }
      }
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable onPress={cycleSortMode} style={styles.headerButton}>
                <Text style={styles.sortLabel}>{SORT_LABELS[sortMode]}</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/project/edit')} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>+</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <SectionList<Project>
        style={styles.container}
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => router.push(`/project/${item.id}`)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6c5ce7"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects yet</Text>
          </View>
        }
      />
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#a0a0b8',
    fontSize: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    color: '#6c5ce7',
    fontSize: 28,
    fontWeight: '600',
  },
  sortLabel: {
    color: '#a0a0b8',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#666680',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#666680',
    fontSize: 16,
  },
});
