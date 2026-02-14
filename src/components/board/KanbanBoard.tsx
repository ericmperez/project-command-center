'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Github, FlaskConical } from 'lucide-react';
import { BoardColumn } from './BoardColumn';
import { ProjectModal } from '@/components/project/ProjectModal';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { useSchedulingEstimate } from '@/hooks/useSchedulingEstimate';
import { useProjectActivity } from '@/hooks/useProjectActivity';
import { sortProjectsByPriority } from '@/lib/priority';
import type { Project, ProjectFormData, BoardWithProjects, SchedulingEstimate, XpEventType } from '@/lib/types';

interface ProjectsState {
  boards: BoardWithProjects[];
  loading: boolean;
  error: string | null;
  demoMode: boolean;
  addProject: (boardId: string, data: ProjectFormData) => Promise<Project | undefined>;
  editProject: (projectId: string, updates: Partial<Project>) => Promise<Project>;
  removeProject: (projectId: string) => Promise<void>;
  moveProject: (projectId: string, sourceBoardId: string, destBoardId: string, sourceIndex: number, destIndex: number) => Promise<void>;
  refresh: () => Promise<void>;
}

interface KanbanBoardProps {
  projectsState: ProjectsState;
  onXpChange?: (action: 'award' | 'revoke', eventType: XpEventType, referenceId: string, projectId: string) => void;
}

export function KanbanBoard({ projectsState, onXpChange }: KanbanBoardProps) {
  const { boards, loading, error, demoMode, addProject, editProject, removeProject, moveProject, refresh } = projectsState;
  const { syncAllProjects, syncing } = useGitHubSync();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetBoardId, setTargetBoardId] = useState<string | null>(null);
  const [activeMobileColumn, setActiveMobileColumn] = useState(0);

  // Swipe gesture handling for mobile column navigation
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swipe left → next column
        setActiveMobileColumn((prev) => Math.min(prev + 1, boards.length - 1));
      } else {
        // Swipe right → previous column
        setActiveMobileColumn((prev) => Math.max(prev - 1, 0));
      }
    }
  }, [boards.length]);

  // Compute scheduling estimates for all projects
  const allProjects = useMemo(() => boards.flatMap((b) => b.projects), [boards]);
  const activityMap = useProjectActivity(allProjects, demoMode);
  const estimates = useMemo(() => {
    const map: Record<string, SchedulingEstimate> = {};
    for (const p of allProjects) {
      if (p.next_meeting_date || p.target_completion_date || p.estimated_hours_remaining) {
        map[p.id] = {
          remainingTasks: 0,
          avgTimePerTask: 0,
          estimatedHoursRemaining: p.estimated_hours_remaining || 0,
          suggestedStartDate: p.suggested_start_date,
          nextMeetingDate: p.next_meeting_date,
          status: getStatusFromProject(p),
        };
      }
    }
    return map;
  }, [allProjects]);

  // Compute most/least worked project rankings by commits + lines of code
  const workRanks = useMemo(() => {
    const map: Record<string, 'most' | 'least'> = {};
    if (allProjects.length < 2) return map;

    // Score = commits + LOC (normalized: commits weighted more heavily)
    const scored = allProjects.map((p) => ({
      id: p.id,
      score: p.github_commit_count * 1000 + p.github_lines_of_code,
    }));

    scored.sort((a, b) => b.score - a.score);

    const most = scored[0];
    const least = scored[scored.length - 1];

    if (most && most.score > 0) map[most.id] = 'most';
    if (least && least.id !== most.id) map[least.id] = 'least';

    return map;
  }, [allProjects]);

  // Apply priority sort
  const sortedBoards = useMemo(() => {
    return boards.map((board) => ({
      ...board,
      projects: sortProjectsByPriority(board.projects, estimates),
    }));
  }, [boards, estimates]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    moveProject(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  // Open modal for new project
  const handleAddProject = (boardId: string) => {
    setSelectedProject(null);
    setTargetBoardId(boardId);
    setIsModalOpen(true);
  };

  // Open modal to view/edit existing project
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setTargetBoardId(null);
    setIsModalOpen(true);
  };

  // Save project (create or update)
  const handleSaveProject = async (data: ProjectFormData) => {
    const saveData = {
      ...data,
      target_completion_date: data.target_completion_date
        ? new Date(data.target_completion_date).toISOString()
        : null,
    };
    if (selectedProject) {
      await editProject(selectedProject.id, saveData);
    } else if (targetBoardId) {
      await addProject(targetBoardId, data);
    }
    setIsModalOpen(false);
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (selectedProject) {
      await removeProject(selectedProject.id);
      setIsModalOpen(false);
    }
  };

  // Sync all GitHub repos
  const handleSyncGitHub = async () => {
    const allProjects = boards.flatMap((b) => b.projects);
    await syncAllProjects(allProjects);
    refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
        <p className="mb-4">Error: {error}</p>
        <Button variant="outline" onClick={refresh}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-sm">
          <FlaskConical className="w-4 h-4" />
          <span>Demo Mode - Data is not persisted. Configure Supabase in .env.local to save your projects.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-100">Projects</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGitHub}
            disabled={syncing}
            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
          >
            <Github className="w-4 h-4 mr-2" />
            {syncing ? 'Syncing...' : 'Sync GitHub'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const firstBoard = boards[0];
              if (firstBoard) handleAddProject(firstBoard.id);
            }}
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Project
          </Button>
        </div>
      </div>

      {/* Mobile Column Tabs */}
      <div className="flex md:hidden border-b border-zinc-800 overflow-x-auto">
        {sortedBoards.map((board, index) => (
          <button
            key={board.id}
            onClick={() => setActiveMobileColumn(index)}
            className={`flex-1 min-w-0 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
              ${activeMobileColumn === index
                ? 'text-zinc-100 border-b-2 border-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            {board.name}
            <span className="ml-1.5 text-xs opacity-60">{board.projects.length}</span>
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4 md:p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Desktop: all columns */}
          <div className="hidden md:flex gap-4 h-full">
            {sortedBoards.map((board) => (
              <BoardColumn
                key={board.id}
                board={board}
                onAddProject={handleAddProject}
                onSelectProject={handleSelectProject}
                schedulingEstimates={estimates}
                workRanks={workRanks}
                projectActivities={activityMap}
              />
            ))}
          </div>
          {/* Mobile: single column with swipe */}
          <div
            className="flex md:hidden h-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {sortedBoards[activeMobileColumn] && (
              <BoardColumn
                key={sortedBoards[activeMobileColumn].id}
                board={sortedBoards[activeMobileColumn]}
                onAddProject={handleAddProject}
                onSelectProject={handleSelectProject}
                schedulingEstimates={estimates}
                workRanks={workRanks}
                projectActivities={activityMap}
                fullWidth
              />
            )}
          </div>
        </DragDropContext>
      </div>

      {/* Project Modal */}
      <ProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        project={selectedProject}
        onSave={handleSaveProject}
        onDelete={selectedProject ? handleDeleteProject : undefined}
        onXpChange={onXpChange}
      />
    </div>
  );
}

function getStatusFromProject(p: Project): SchedulingEstimate['status'] {
  // Use the earlier of next_meeting_date and target_completion_date
  const deadlines = [p.next_meeting_date, p.target_completion_date].filter(Boolean) as string[];
  if (deadlines.length === 0) return 'no_deadline';

  const now = new Date();
  const earliest = deadlines.reduce((a, b) => (new Date(a) < new Date(b) ? a : b));
  const daysUntil = (new Date(earliest).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const hoursRemaining = p.estimated_hours_remaining || 0;
  const hoursAvailable = daysUntil * 6; // 6 productive hours per day

  if (hoursRemaining <= 0) return 'on_track';
  if (hoursAvailable >= hoursRemaining * 1.5) return 'on_track';
  if (hoursAvailable >= hoursRemaining) return 'at_risk';
  return 'behind';
}
