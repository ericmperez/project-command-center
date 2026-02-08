'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Github, ExternalLink, RefreshCw } from 'lucide-react';
import type { ChecklistItem } from '@/lib/types';

interface ChecklistTabProps {
  items: ChecklistItem[];
  completionPercentage: number;
  completedCount: number;
  totalCount: number;
  loading: boolean;
  githubRepo: string | null;
  onAddItem: (title: string) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onSyncGitHub: (repoString: string) => void;
}

export function ChecklistTab({
  items,
  completionPercentage,
  completedCount,
  totalCount,
  loading,
  githubRepo,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onSyncGitHub,
}: ChecklistTabProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleAdd = () => {
    if (!newItemTitle.trim()) return;
    onAddItem(newItemTitle.trim());
    setNewItemTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleSync = async () => {
    if (!githubRepo) return;
    setSyncing(true);
    await onSyncGitHub(githubRepo);
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Progress</span>
          <span className="text-zinc-300 font-medium">
            {completionPercentage}% ({completedCount}/{totalCount})
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Add item input */}
      <div className="flex gap-2">
        <Input
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newItemTitle.trim()}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* GitHub sync button */}
      {githubRepo && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="w-full text-zinc-400 border-zinc-700 hover:bg-zinc-800"
        >
          <Github className="w-4 h-4 mr-2" />
          {syncing ? 'Syncing...' : 'Sync GitHub Issues'}
        </Button>
      )}

      {/* Checklist items */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-1">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-600 py-4 text-center">
              No checklist items yet. Add one above.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 px-2 rounded hover:bg-zinc-800/50 group"
              >
                <button
                  onClick={() => onToggleItem(item.id)}
                  className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                    item.is_completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {item.is_completed && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <span
                  className={`flex-1 text-sm ${
                    item.is_completed ? 'text-zinc-500 line-through' : 'text-zinc-200'
                  }`}
                >
                  {item.title}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.source === 'github' && item.github_issue_url && (
                    <a
                      href={item.github_issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-500 hover:text-zinc-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {item.source === 'github' && (
                  <Github className="w-3 h-3 text-zinc-600 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
