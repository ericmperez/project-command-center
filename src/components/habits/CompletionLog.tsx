'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { HabitCompletion } from '@/lib/types';

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

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = (completionId: string) => {
    onUpdateNotes(completionId, editText);
    setEditingId(null);
    setEditText('');
  };

  if (completions.length === 0) {
    return (
      <div className="px-10 py-3 text-xs text-zinc-500">
        No completions yet.
      </div>
    );
  }

  return (
    <div className="px-10 py-2 max-h-48 overflow-y-auto space-y-1">
      {completions.map((c) => (
        <div
          key={c.id}
          className="flex items-start gap-2 text-xs py-1 group"
        >
          <span className="text-zinc-500 shrink-0 w-24">
            {formatDate(c.completed_date)}
          </span>

          {editingId === c.id ? (
            <div className="flex-1 flex items-center gap-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(c.id);
                  if (e.key === 'Escape') cancelEdit();
                }}
                autoFocus
                className="flex-1 bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 outline-none border border-zinc-600 focus:border-emerald-500"
                placeholder="Add a note..."
              />
              <button
                onClick={() => saveEdit(c.id)}
                className="p-0.5 text-emerald-400 hover:text-emerald-300"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={cancelEdit}
                className="p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <span className="flex-1 text-zinc-400">
                {c.notes || <span className="text-zinc-600 italic">No note</span>}
              </span>
              <button
                onClick={() => startEdit(c)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
