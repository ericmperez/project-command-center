import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Habit } from '../lib/types';

interface HabitRowProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
}

export function HabitRow({ habit, completed, onToggle }: HabitRowProps) {
  return (
    <Pressable onPress={onToggle} style={styles.container}>
      {/* Toggle circle */}
      <View
        style={[
          styles.toggle,
          completed && styles.toggleCompleted,
        ]}
      >
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Icon */}
      {habit.icon ? <Text style={styles.icon}>{habit.icon}</Text> : null}

      {/* Name */}
      <Text style={[styles.name, completed && styles.nameCompleted]}>
        {habit.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#52525b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  icon: {
    fontSize: 18,
  },
  name: {
    flex: 1,
    color: '#e0e0f0',
    fontSize: 15,
  },
  nameCompleted: {
    color: '#71717a',
    textDecorationLine: 'line-through',
  },
});
