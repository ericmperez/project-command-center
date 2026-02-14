import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Board, Project, BoardWithProjects, ProjectFormData } from '../lib/types';

export function useProjects() {
  const [boards, setBoards] = useState<BoardWithProjects[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [boardsRes, projectsRes] = await Promise.all([
        supabase.from('boards').select('*').order('position'),
        supabase.from('projects').select('*').order('position'),
      ]);

      if (boardsRes.error) throw boardsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const boardList: Board[] = boardsRes.data ?? [];
      const projectList: Project[] = projectsRes.data ?? [];

      const grouped: BoardWithProjects[] = boardList.map((board) => ({
        ...board,
        projects: projectList.filter((p) => p.board_id === board.id),
      }));

      setBoards(grouped);
    } catch (err) {
      console.error('useProjects load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const addProject = useCallback(
    async (boardId: string, data: Partial<ProjectFormData>) => {
      try {
        // Get max position in board
        const { data: existing } = await supabase
          .from('projects')
          .select('position')
          .eq('board_id', boardId)
          .order('position', { ascending: false })
          .limit(1);

        const position = existing && existing.length > 0 ? existing[0].position + 1 : 0;

        const { error } = await supabase.from('projects').insert({
          board_id: boardId,
          title: data.title || 'Untitled Project',
          description: data.description || null,
          project_type: data.project_type || 'personal',
          github_repo: data.github_repo || null,
          client_name: data.client_name || null,
          client_notes: data.client_notes || null,
          next_steps: data.next_steps || null,
          position,
        });

        if (error) throw error;
        await load();
      } catch (err) {
        console.error('addProject error:', err);
      }
    },
    [load]
  );

  const editProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', projectId);

        if (error) throw error;
        await load();
      } catch (err) {
        console.error('editProject error:', err);
      }
    },
    [load]
  );

  const removeProject = useCallback(
    async (projectId: string) => {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (error) throw error;
        await load();
      } catch (err) {
        console.error('removeProject error:', err);
      }
    },
    [load]
  );

  const moveProject = useCallback(
    async (projectId: string, newBoardId: string) => {
      try {
        // Get max position in target board
        const { data: existing } = await supabase
          .from('projects')
          .select('position')
          .eq('board_id', newBoardId)
          .order('position', { ascending: false })
          .limit(1);

        const position = existing && existing.length > 0 ? existing[0].position + 1 : 0;

        const { error } = await supabase
          .from('projects')
          .update({ board_id: newBoardId, position, updated_at: new Date().toISOString() })
          .eq('id', projectId);

        if (error) throw error;
        await load();
      } catch (err) {
        console.error('moveProject error:', err);
      }
    },
    [load]
  );

  return { boards, loading, refresh: load, addProject, editProject, removeProject, moveProject };
}
