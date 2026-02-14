import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChecklistItem } from '../lib/types';

export function useChecklist(projectId: string) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('project_id', projectId)
        .order('position');

      if (error) throw error;
      setItems(data ?? []);
    } catch (err) {
      console.error('useChecklist load error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`checklist-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checklist_items', filter: `project_id=eq.${projectId}` },
        () => { load(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, load]);

  const toggleItem = useCallback(
    async (item: ChecklistItem) => {
      const newCompleted = !item.is_completed;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: newCompleted } : i))
      );

      try {
        const { error } = await supabase
          .from('checklist_items')
          .update({ is_completed: newCompleted, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        if (error) throw error;

        // Update project completion percentage
        const { data: allItems } = await supabase
          .from('checklist_items')
          .select('is_completed')
          .eq('project_id', projectId);

        if (allItems && allItems.length > 0) {
          const completed = allItems.filter((i) => i.is_completed).length;
          const pct = Math.round((completed / allItems.length) * 100);
          await supabase
            .from('projects')
            .update({ completion_percentage: pct, updated_at: new Date().toISOString() })
            .eq('id', projectId);
        }
      } catch (err) {
        console.error('toggleItem error:', err);
        // Revert optimistic update
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_completed: !newCompleted } : i))
        );
      }
    },
    [projectId]
  );

  const addItem = useCallback(
    async (title: string) => {
      const position = items.length;
      try {
        const { error } = await supabase
          .from('checklist_items')
          .insert({
            project_id: projectId,
            title,
            is_completed: false,
            source: 'manual',
            position,
          });

        if (error) throw error;
        await load();
      } catch (err) {
        console.error('addItem error:', err);
      }
    },
    [projectId, items.length, load]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      // Optimistic update
      setItems((prev) => prev.filter((i) => i.id !== itemId));

      try {
        const { error } = await supabase
          .from('checklist_items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;

        // Recalculate completion percentage
        const { data: allItems } = await supabase
          .from('checklist_items')
          .select('is_completed')
          .eq('project_id', projectId);

        const pct =
          allItems && allItems.length > 0
            ? Math.round(allItems.filter((i) => i.is_completed).length / allItems.length * 100)
            : 0;

        await supabase
          .from('projects')
          .update({ completion_percentage: pct, updated_at: new Date().toISOString() })
          .eq('id', projectId);
      } catch (err) {
        console.error('deleteItem error:', err);
        await load(); // Revert by reloading
      }
    },
    [projectId, load]
  );

  return { items, loading, toggleItem, addItem, deleteItem, refresh: load };
}
