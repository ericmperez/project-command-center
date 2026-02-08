'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockChecklistItems } from '@/lib/mock-data';
import type { ChecklistItem, XpEventType } from '@/lib/types';

const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

export type XpChangeCallback = (
  action: 'award' | 'revoke',
  eventType: XpEventType,
  referenceId: string,
  projectId: string
) => void;

export function useChecklist(projectId: string | null, onXpChange?: XpChangeCallback) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const loadItems = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        setDemoMode(true);
        setItems(mockChecklistItems.filter((i) => i.project_id === projectId));
        setLoading(false);
        return;
      }

      const { getChecklistItems } = await import('@/lib/supabase');
      const data = await getChecklistItems(projectId);
      setItems(data);
    } catch (err) {
      console.error('Error loading checklist items:', err);
      setDemoMode(true);
      setItems(mockChecklistItems.filter((i) => i.project_id === projectId));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Realtime subscription
  useEffect(() => {
    if (demoMode || !isSupabaseConfigured() || !projectId) return;

    let channel: ReturnType<typeof import('@/lib/supabase').supabase.channel> | null = null;

    const setup = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        channel = supabase
          .channel(`checklist-${projectId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'checklist_items',
              filter: `project_id=eq.${projectId}`,
            },
            () => loadItems()
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to set up checklist subscription:', err);
      }
    };

    setup();

    return () => {
      if (channel) {
        import('@/lib/supabase').then(({ supabase }) => supabase.removeChannel(channel!));
      }
    };
  }, [loadItems, demoMode, projectId]);

  const addItem = useCallback(async (title: string) => {
    if (!projectId) return;

    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      project_id: projectId,
      title,
      is_completed: false,
      source: 'manual',
      github_issue_number: null,
      github_issue_url: null,
      position: items.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (demoMode) {
      setItems((prev) => [...prev, newItem]);
      return;
    }

    try {
      const { createChecklistItem, updateProject } = await import('@/lib/supabase');
      const created = await createChecklistItem({
        project_id: projectId,
        title,
        position: items.length,
      });
      setItems((prev) => [...prev, created]);

      // Update completion percentage
      const newTotal = items.length + 1;
      const newCompleted = items.filter((i) => i.is_completed).length;
      const pct = Math.round((newCompleted / newTotal) * 100);
      await updateProject(projectId, { completion_percentage: pct } as Partial<import('@/lib/types').Project>);
    } catch (err) {
      console.error('Error creating checklist item:', err);
    }
  }, [projectId, items, demoMode]);

  const toggleItem = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !projectId) return;

    const newCompleted = !item.is_completed;

    if (demoMode) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_completed: newCompleted } : i))
      );
      // Fire gamification callback
      if (onXpChange) {
        if (newCompleted) {
          onXpChange('award', 'task_complete', itemId, projectId);
        } else {
          onXpChange('revoke', 'task_complete', itemId, projectId);
        }
      }
      return;
    }

    try {
      const { updateChecklistItem, updateProject } = await import('@/lib/supabase');
      await updateChecklistItem(itemId, { is_completed: newCompleted });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_completed: newCompleted } : i))
      );

      // Update completion percentage
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, is_completed: newCompleted } : i
      );
      const completed = updatedItems.filter((i) => i.is_completed).length;
      const pct = Math.round((completed / updatedItems.length) * 100);
      await updateProject(projectId, { completion_percentage: pct } as Partial<import('@/lib/types').Project>);

      // Fire gamification callback
      if (onXpChange) {
        if (newCompleted) {
          onXpChange('award', 'task_complete', itemId, projectId);
        } else {
          onXpChange('revoke', 'task_complete', itemId, projectId);
        }
      }
    } catch (err) {
      console.error('Error toggling checklist item:', err);
    }
  }, [items, projectId, demoMode, onXpChange]);

  const deleteItem = useCallback(async (itemId: string) => {
    if (!projectId) return;

    if (demoMode) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      return;
    }

    try {
      const { deleteChecklistItem, updateProject } = await import('@/lib/supabase');
      await deleteChecklistItem(itemId);
      const remaining = items.filter((i) => i.id !== itemId);
      setItems(remaining);

      // Update completion percentage
      const completed = remaining.filter((i) => i.is_completed).length;
      const pct = remaining.length > 0 ? Math.round((completed / remaining.length) * 100) : 0;
      await updateProject(projectId, { completion_percentage: pct } as Partial<import('@/lib/types').Project>);
    } catch (err) {
      console.error('Error deleting checklist item:', err);
    }
  }, [items, projectId, demoMode]);

  const syncGitHubIssues = useCallback(async (repoString: string) => {
    if (!projectId) return;

    try {
      const res = await fetch(`/api/github/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, repoString, syncIssues: true }),
      });

      if (res.ok) {
        await loadItems();
      }
    } catch (err) {
      console.error('Error syncing GitHub issues:', err);
    }
  }, [projectId, loadItems]);

  return {
    items,
    loading,
    completedCount,
    totalCount,
    completionPercentage,
    addItem,
    toggleItem,
    deleteItem,
    syncGitHubIssues,
    refresh: loadItems,
  };
}
