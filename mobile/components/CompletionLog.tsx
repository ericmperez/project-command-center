import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import type { HabitCompletion } from '../lib/types';

interface CompletionLogProps {
  completions: HabitCompletion[];
  onUpdateNotes: (completionId: string, notes: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CompletionLog({ completions, onUpdateNotes }: CompletionLogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const startEdit = (completion: HabitCompletion) => {
    setEditingId(completion.id);
    setEditText(completion.notes || '');
  };

  const saveEdit = (completionId: string) => {
    onUpdateNotes(completionId, editText);
    setEditingId(null);
    setEditText('');
  };

  if (completions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No completions yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={completions}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      style={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.date}>{formatDate(item.completed_date)}</Text>

          {editingId === item.id ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
                autoFocus
                placeholder="Add a note..."
                placeholderTextColor="#52525b"
                onSubmitEditing={() => saveEdit(item.id)}
                returnKeyType="done"
              />
              <Pressable onPress={() => saveEdit(item.id)} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditingId(null);
                  setEditText('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.noteArea} onPress={() => startEdit(item)}>
              <Text style={item.notes ? styles.noteText : styles.noNoteText}>
                {item.notes || 'Tap to add note'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: 200,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyText: {
    color: '#52525b',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 8,
  },
  date: {
    color: '#71717a',
    fontSize: 12,
    width: 90,
    paddingTop: 2,
  },
  noteArea: {
    flex: 1,
  },
  noteText: {
    color: '#a0a0b8',
    fontSize: 12,
  },
  noNoteText: {
    color: '#3f3f46',
    fontSize: 12,
    fontStyle: 'italic',
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#27272a',
    color: '#e0e0f0',
    fontSize: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  saveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cancelText: {
    color: '#71717a',
    fontSize: 11,
  },
});
