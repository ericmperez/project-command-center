import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Project } from '../lib/types';

const TYPE_COLORS: Record<string, string> = {
  personal: '#00b894',
  client: '#fdcb6e',
  coding: '#6c5ce7',
};

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const badgeColor = TYPE_COLORS[project.project_type] ?? '#a0a0b8';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {project.title}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: badgeColor + '22' }]}>
          <Text style={[styles.typeText, { color: badgeColor }]}>
            {project.project_type}
          </Text>
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
});
