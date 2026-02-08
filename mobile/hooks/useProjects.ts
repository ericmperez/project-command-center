import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Board, Project, BoardWithProjects } from '../lib/types';

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

  return { boards, loading, refresh: load };
}
