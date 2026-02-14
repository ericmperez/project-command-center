'use client';

import { useState } from 'react';
import { Check, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { Habit, HabitCompletion } from '@/lib/types';
import { CompletionLog } from './CompletionLog';

interface HabitsListProps {
  habits: Habit[];
  completionsToday: Record<string, boolean>;
  completionLogs: Record<string, HabitCompletion[]>;
  onToggle: (habitId: string, notes?: string) => void;
  onCreate: (name: string, icon?: string) => void;
  onDelete: (habitId: string) => void;
  onFetchLog: (habitId: string) => void;
  onUpdateNotes: (completionId: string, habitId: string, notes: string) => void;
}

const EMOJI_OPTIONS = ['🧘', '💪', '📖', '✏️', '🏃', '💧', '🎵', '🧹', '💤', '🥗'];

export function HabitsList({
  habits,
  completionsToday,
  completionLogs,
  onToggle,
  onCreate,
  onDelete,
  onFetchLog,
  onUpdateNotes,
}: HabitsListProps) {
  const [newName, setNewName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string | null>(null);
  const [noteHabitId, setNoteHabitId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim(), selectedEmoji || undefined);
      setNewName('');
      setSelectedEmoji('');
      setShowEmojiPicker(false);
    }
  };

  const handleToggle = (habitId: string) => {
    const isCompleted = completionsToday[habitId];
    if (isCompleted) {
      // Uncompleting - no note needed
      onToggle(habitId);
    } else {
      // Completing - show note input
      setNoteHabitId(habitId);
      setNoteInput('');
    }
  };

  const submitNote = (habitId: string) => {
    onToggle(habitId, noteInput || undefined);
    setNoteHabitId(null);
    setNoteInput(null);
  };

  const toggleExpand = (habitId: string) => {
    if (expandedHabitId === habitId) {
      setExpandedHabitId(null);
    } else {
      setExpandedHabitId(habitId);
      onFetchLog(habitId);
    }
  };

  return (
    <div className="space-y-1">
      {habits.map((habit) => {
        const completed = completionsToday[habit.id] ?? false;
        const isExpanded = expandedHabitId === habit.id;
        const showNoteInput = noteHabitId === habit.id;
        const log = completionLogs[habit.id];

        return (
          <div key={habit.id}>
            <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
              {/* Expand/collapse button */}
              <button
                onClick={() => toggleExpand(habit.id)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Toggle button */}
              <button
                onClick={() => handleToggle(habit.id)}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  completed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-zinc-600 hover:border-emerald-500/50'
                }`}
              >
                {completed && <Check className="w-4 h-4" />}
              </button>

              {/* Icon */}
              {habit.icon && <span className="text-lg">{habit.icon}</span>}

              {/* Name */}
              <span
                className={`flex-1 text-sm ${
                  completed ? 'text-zinc-400 line-through' : 'text-zinc-200'
                }`}
              >
                {habit.name}
              </span>

              {/* Delete (on hover) */}
              <button
                onClick={() => onDelete(habit.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Note input when completing */}
            {showNoteInput && (
              <div className="flex items-center gap-2 px-10 py-2">
                <input
                  type="text"
                  value={noteInput || ''}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNote(habit.id);
                    if (e.key === 'Escape') {
                      submitNote(habit.id); // complete without note
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1.5 outline-none border border-zinc-600 focus:border-emerald-500"
                  placeholder="Add a note (optional, Enter to save)..."
                />
                <button
                  onClick={() => submitNote(habit.id)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setNoteHabitId(null);
                    setNoteInput(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Skip
                </button>
              </div>
            )}

            {/* Completion log */}
            {isExpanded && (
              <CompletionLog
                completions={log || []}
                onUpdateNotes={(completionId, notes) =>
                  onUpdateNotes(completionId, habit.id, notes)
                }
              />
            )}
          </div>
        );
      })}

      {/* Add habit */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 mt-2"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="w-7 h-7 rounded-full border border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 hover:border-zinc-400 hover:text-zinc-300 transition-colors text-sm"
        >
          {selectedEmoji || <Plus className="w-3.5 h-3.5" />}
        </button>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a habit..."
          className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none"
        />
        {newName.trim() && (
          <button
            type="submit"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Add
          </button>
        )}
      </form>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setSelectedEmoji(emoji === selectedEmoji ? '' : emoji);
                setShowEmojiPicker(false);
              }}
              className={`w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-700 transition-colors ${
                selectedEmoji === emoji ? 'bg-zinc-700 ring-1 ring-emerald-500' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
