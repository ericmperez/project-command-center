import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { ChecklistItem } from '../lib/types';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: () => void;
}

export function ChecklistItemRow({ item, onToggle }: ChecklistItemRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onToggle}
    >
      <View style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}>
        {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text
        style={[styles.title, item.is_completed && styles.titleCompleted]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {item.source === 'github' && (
        <Text style={styles.githubBadge}>GH</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4a4a66',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#e0e0f0',
    fontSize: 15,
    flex: 1,
  },
  titleCompleted: {
    color: '#666680',
    textDecorationLine: 'line-through',
  },
  githubBadge: {
    color: '#a0a0b8',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: '#2d2d44',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
});
