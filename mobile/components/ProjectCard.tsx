import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Project, ProjectActivity } from '../lib/types';
import type { SchedulingEstimate } from '../lib/types';
import { ScheduleBadge } from './ScheduleBadge';

const TYPE_COLORS: Record<string, string> = {
  personal: '#00b894',
  client: '#fdcb6e',
  coding: '#6c5ce7',
};

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onLongPress?: () => void;
  scheduleStatus?: SchedulingEstimate['status'];
  activity?: ProjectActivity | null;
}

export function ProjectCard({ project, onPress, onLongPress, scheduleStatus, activity }: ProjectCardProps) {
  const badgeColor = TYPE_COLORS[project.project_type] ?? '#a0a0b8';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {project.title}
        </Text>
        <View style={styles.badges}>
          {scheduleStatus && scheduleStatus !== 'no_deadline' && (
            <ScheduleBadge status={scheduleStatus} />
          )}
          <View style={[styles.typeBadge, { backgroundColor: badgeColor + '22' }]}>
            <Text style={[styles.typeText, { color: badgeColor }]}>
              {project.project_type}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.progressRow}>
        <View style={styles.barBackground}>
          <View
            style={[styles.barFill, { width: `${project.completion_percentage}%`, backgroundColor: badgeColor }]}
          />
        </View>
        <Text style={styles.percent}>{project.completion_percentage}%</Text>
      </View>

      {/* GitHub stats */}
      {project.github_repo && (
        <View style={styles.githubRow}>
          {project.github_commit_count > 0 && (
            <Text style={styles.statText}>{project.github_commit_count} commits</Text>
          )}
          {project.github_lines_of_code > 0 && (
            <Text style={styles.statText}>{project.github_lines_of_code.toLocaleString()} LOC</Text>
          )}
          {(project.github_open_issues ?? 0) > 0 && (
            <Text style={styles.statText}>{project.github_open_issues} issues</Text>
          )}
          {(project.github_open_prs ?? 0) > 0 && (
            <Text style={styles.statText}>{project.github_open_prs} PRs</Text>
          )}
          {project.github_last_commit && (
            <Text style={styles.commitText} numberOfLines={1}>
              {project.github_last_commit.message}
            </Text>
          )}
        </View>
      )}

      {/* Activity info */}
      {activity?.lastActivity && (
        <Text style={styles.activityText} numberOfLines={1}>
          Last: {activity.lastActivity.description}
        </Text>
      )}
      {activity?.nextStep && (
        <Text style={styles.nextStepText} numberOfLines={1}>
          Next: {activity.nextStep.description}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#2d2d44',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  percent: {
    color: '#a0a0b8',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 36,
    textAlign: 'right',
  },
  githubRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  statText: {
    color: '#a0a0b8',
    fontSize: 10,
    backgroundColor: '#2d2d44',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commitText: {
    color: '#666680',
    fontSize: 10,
    flex: 1,
  },
  activityText: {
    color: '#666680',
    fontSize: 11,
    marginTop: 6,
  },
  nextStepText: {
    color: '#6c5ce7',
    fontSize: 11,
    marginTop: 2,
  },
});
