'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMockBoardsWithProjects, mockProjects } from '@/lib/mock-data';
import type { Project, BoardWithProjects, ProjectFormData } from '@/lib/types';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

export function useProjects() {
  const [boards, setBoards] = useState<BoardWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Load all boards and projects
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        // Use mock data in demo mode
        setDemoMode(true);
        setBoards(getMockBoardsWithProjects());
        setLoading(false);
        return;
      }

      // Dynamic import to avoid errors when Supabase isn't configured
      const { getBoards, getProjects } = await import('@/lib/supabase');

      const [boardsData, projectsData] = await Promise.all([
        getBoards(),
        getProjects(),
      ]);

      // Group projects by board
      const boardsWithProjects: BoardWithProjects[] = boardsData.map((board) => ({
        ...board,
        projects: projectsData
          .filter((p) => p.board_id === board.id)
          .sort((a, b) => a.position - b.position),
      }));

      setBoards(boardsWithProjects);
    } catch (err) {
      // If Supabase fails, fall back to demo mode
      console.error('Error loading data, falling back to demo mode:', err);
      setDemoMode(true);
      setBoards(getMockBoardsWithProjects());
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up realtime subscription (only if not in demo mode)
  useEffect(() => {
    if (demoMode || !isSupabaseConfigured()) return;

    let channel: ReturnType<typeof import('@/lib/supabase').supabase.channel> | null = null;

    const setupSubscription = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        channel = supabase
          .channel('projects-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'projects' },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to set up realtime subscription:', err);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        import('@/lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel!);
        });
      }
    };
  }, [loadData, demoMode]);

  // Add a new project
  const addProject = useCallback(async (boardId: string, data: ProjectFormData) => {
    const board = boards.find((b) => b.id === boardId);
    const maxPosition = board?.projects.length || 0;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      board_id: boardId,
      title: data.title,
      description: data.description || null,
      project_type: data.project_type,
      status: null,
      position: maxPosition,
      github_repo: data.github_repo || null,
      github_last_commit: null,
      github_open_issues: null,
      github_open_prs: null,
      github_last_synced: null,
      client_name: data.client_name || null,
      client_notes: data.client_notes || null,
      next_steps: data.next_steps || null,
      completion_percentage: 0,
      total_time_seconds: 0,
      next_meeting_date: null,
      estimated_hours_remaining: null,
      suggested_start_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (demoMode) {
      // Just update local state in demo mode
      setBoards((prev) =>
        prev.map((board) =>
          board.id === boardId
            ? { ...board, projects: [...board.projects, newProject] }
            : board
        )
      );
      return newProject;
    }

    try {
      const { createProject } = await import('@/lib/supabase');
      const created = await createProject({
        board_id: boardId,
        title: data.title,
        description: data.description || null,
        project_type: data.project_type,
        github_repo: data.github_repo || null,
        client_name: data.client_name || null,
        client_notes: data.client_notes || null,
        next_steps: data.next_steps || null,
        position: maxPosition,
      });

      setBoards((prev) =>
        prev.map((board) =>
          board.id === boardId
            ? { ...board, projects: [...board.projects, created] }
            : board
        )
      );

      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  }, [boards, demoMode]);

  // Update an existing project
  const editProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    if (demoMode) {
      // Just update local state in demo mode
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          projects: board.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
          ),
        }))
      );
      return { ...updates, id: projectId } as Project;
    }

    try {
      const { updateProject } = await import('@/lib/supabase');
      const updated = await updateProject(projectId, updates);

      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          projects: board.projects.map((p) =>
            p.id === projectId ? { ...p, ...updated } : p
          ),
        }))
      );

      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  }, [demoMode]);

  // Delete a project
  const removeProject = useCallback(async (projectId: string) => {
    if (demoMode) {
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          projects: board.projects.filter((p) => p.id !== projectId),
        }))
      );
      return;
    }

    try {
      const { deleteProject } = await import('@/lib/supabase');
      await deleteProject(projectId);

      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          projects: board.projects.filter((p) => p.id !== projectId),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  }, [demoMode]);

  // Move a project between boards or reorder within a board
  const moveProject = useCallback(async (
    projectId: string,
    sourceBoardId: string,
    destBoardId: string,
    sourceIndex: number,
    destIndex: number
  ) => {
    // Create optimistic update first for smooth UX
    const newBoards = boards.map(b => ({ ...b, projects: [...b.projects] }));
    const sourceBoard = newBoards.find((b) => b.id === sourceBoardId);
    const destBoard = newBoards.find((b) => b.id === destBoardId);

    if (!sourceBoard || !destBoard) return;

    // Remove from source
    const [movedProject] = sourceBoard.projects.splice(sourceIndex, 1);
    movedProject.board_id = destBoardId;

    // Insert at destination
    destBoard.projects.splice(destIndex, 0, movedProject);

    // Update positions for affected projects
    const updates: { id: string; position: number; board_id: string }[] = [];

    sourceBoard.projects.forEach((p, i) => {
      p.position = i;
      updates.push({ id: p.id, position: i, board_id: sourceBoardId });
    });

    destBoard.projects.forEach((p, i) => {
      p.position = i;
      updates.push({ id: p.id, position: i, board_id: destBoardId });
    });

    // Optimistic update
    setBoards(newBoards);

    // In demo mode, we're done
    if (demoMode) return;

    // Persist to database
    try {
      const { updateProjectPositions } = await import('@/lib/supabase');
      await updateProjectPositions(updates);
    } catch (err) {
      // Revert on error
      loadData();
      setError(err instanceof Error ? err.message : 'Failed to move project');
    }
  }, [boards, loadData, demoMode]);

  return {
    boards,
    loading,
    error,
    demoMode,
    addProject,
    editProject,
    removeProject,
    moveProject,
    refresh: loadData,
  };
}
