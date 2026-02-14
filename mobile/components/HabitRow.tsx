import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import type { Habit, HabitCompletion } from '../lib/types';
import { CompletionLog } from './CompletionLog';

interface HabitRowProps {
  habit: Habit;
  completed: boolean;
  completionLog?: HabitCompletion[];
  onToggle: (notes?: string) => void;
  onFetchLog: () => void;
  onUpdateNotes: (completionId: string, notes: string) => void;
}

export function HabitRow({
  habit,
  completed,
  completionLog,
  onToggle,
  onFetchLog,
  onUpdateNotes,
}: HabitRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handlePress = () => {
    if (completed) {
      // Uncomplete
      onToggle();
    } else {
      // Show note input before completing
      setShowNoteInput(true);
      setNoteText('');
    }
  };

  const submitNote = () => {
    onToggle(noteText || undefined);
    setShowNoteInput(false);
    setNoteText('');
  };

  const toggleExpand = () => {
    if (!expanded) {
      onFetchLog();
    }
    setExpanded(!expanded);
  };

  return (
    <View>
      <View style={styles.container}>
        {/* Expand chevron */}
        <Pressable onPress={toggleExpand} style={styles.chevron}>
          <Text style={styles.chevronText}>{expanded ? '▾' : '▸'}</Text>
        </Pressable>

        {/* Toggle circle */}
        <Pressable onPress={handlePress}>
          <View
            style={[
              styles.toggle,
              completed && styles.toggleCompleted,
            ]}
          >
            {completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>

        {/* Icon */}
        {habit.icon ? <Text style={styles.icon}>{habit.icon}</Text> : null}

        {/* Name */}
        <Pressable style={styles.nameArea} onPress={toggleExpand}>
          <Text style={[styles.name, completed && styles.nameCompleted]}>
            {habit.name}
          </Text>
        </Pressable>
      </View>

      {/* Note input when completing */}
      {showNoteInput && (
        <View style={styles.noteInputRow}>
          <TextInput
            style={styles.noteInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Add a note (optional)..."
            placeholderTextColor="#52525b"
            autoFocus
            onSubmitEditing={submitNote}
            returnKeyType="done"
          />
          <Pressable onPress={submitNote} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowNoteInput(false);
              setNoteText('');
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      )}

      {/* Completion log */}
      {expanded && (
        <CompletionLog
          completions={completionLog || []}
          onUpdateNotes={onUpdateNotes}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  chevron: {
    width: 16,
    alignItems: 'center',
  },
  chevronText: {
    color: '#52525b',
    fontSize: 12,
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
  nameArea: {
    flex: 1,
  },
  name: {
    color: '#e0e0f0',
    fontSize: 15,
  },
  nameCompleted: {
    color: '#71717a',
    textDecorationLine: 'line-through',
  },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingBottom: 8,
    gap: 8,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#27272a',
    color: '#e0e0f0',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  doneButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  skipText: {
    color: '#71717a',
    fontSize: 12,
  },
});
