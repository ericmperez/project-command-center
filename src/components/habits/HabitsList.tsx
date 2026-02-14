'use client';

import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { Habit } from '@/lib/types';

interface HabitsListProps {
  habits: Habit[];
  completionsToday: Record<string, boolean>;
  onToggle: (habitId: string) => void;
  onCreate: (name: string, icon?: string) => void;
  onDelete: (habitId: string) => void;
}

const EMOJI_OPTIONS = ['🧘', '💪', '📖', '✏️', '🏃', '💧', '🎵', '🧹', '💤', '🥗'];

export function HabitsList({
  habits,
  completionsToday,
  onToggle,
  onCreate,
  onDelete,
}: HabitsListProps) {
  const [newName, setNewName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim(), selectedEmoji || undefined);
      setNewName('');
      setSelectedEmoji('');
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="space-y-1">
      {habits.map((habit) => {
        const completed = completionsToday[habit.id] ?? false;
        return (
          <div
            key={habit.id}
            className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            {/* Toggle button */}
            <button
              onClick={() => onToggle(habit.id)}
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
