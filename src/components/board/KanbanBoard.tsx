'use client';

import { useState, useMemo } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Github, FlaskConical, ArrowUpDown } from 'lucide-react';
import { BoardColumn } from './BoardColumn';
import { ProjectModal } from '@/components/project/ProjectModal';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { useSchedulingEstimate } from '@/hooks/useSchedulingEstimate';
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
  const [sortByMeeting, setSortByMeeting] = useState(false);

  // Compute scheduling estimates for all projects
  const allProjects = useMemo(() => boards.flatMap((b) => b.projects), [boards]);
  const estimates = useMemo(() => {
    const map: Record<string, SchedulingEstimate> = {};
    for (const p of allProjects) {
      if (p.next_meeting_date || p.estimated_hours_remaining) {
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

  // Apply meeting date sort
  const sortedBoards = useMemo(() => {
    if (!sortByMeeting) return boards;

    return boards.map((board) => ({
      ...board,
      projects: [...board.projects].sort((a, b) => {
        if (a.next_meeting_date && !b.next_meeting_date) return -1;
        if (!a.next_meeting_date && b.next_meeting_date) return 1;
        if (a.next_meeting_date && b.next_meeting_date) {
          return new Date(a.next_meeting_date).getTime() - new Date(b.next_meeting_date).getTime();
        }
        return a.position - b.position;
      }),
    }));
  }, [boards, sortByMeeting]);

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
    if (selectedProject) {
      await editProject(selectedProject.id, data);
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
            onClick={() => setSortByMeeting(!sortByMeeting)}
            className={`text-zinc-400 border-zinc-700 hover:bg-zinc-800 ${sortByMeeting ? 'bg-zinc-800 text-zinc-200' : ''}`}
          >
            <ArrowUpDown className="w-4 h-4 mr-1" />
            {sortByMeeting ? 'Meeting Date' : 'Sort'}
          </Button>
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

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full">
            {sortedBoards.map((board) => (
              <BoardColumn
                key={board.id}
                board={board}
                onAddProject={handleAddProject}
                onSelectProject={handleSelectProject}
                schedulingEstimates={estimates}
              />
            ))}
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
  if (!p.next_meeting_date) return 'no_deadline';

  const now = new Date();
  const meeting = new Date(p.next_meeting_date);
  const daysUntil = (meeting.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const hoursRemaining = p.estimated_hours_remaining || 0;
  const hoursAvailable = daysUntil * 6; // 6 productive hours per day

  if (hoursRemaining <= 0) return 'on_track';
  if (hoursAvailable >= hoursRemaining * 1.5) return 'on_track';
  if (hoursAvailable >= hoursRemaining) return 'at_risk';
  return 'behind';
}
