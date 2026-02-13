'use client';

import { Droppable } from '@hello-pangea/dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import type { BoardWithProjects, Project, SchedulingEstimate } from '@/lib/types';

interface BoardColumnProps {
  board: BoardWithProjects;
  onAddProject: (boardId: string) => void;
  onSelectProject: (project: Project) => void;
  schedulingEstimates?: Record<string, SchedulingEstimate>;
  workRanks?: Record<string, 'most' | 'least'>;
  fullWidth?: boolean;
}

const columnColors: Record<string, { bg: string; border: string; badge: string }> = {
  'Backlog': {
    bg: 'bg-zinc-900/50',
    border: 'border-zinc-700',
    badge: 'bg-zinc-700 text-zinc-300',
  },
  'In Progress': {
    bg: 'bg-blue-950/30',
    border: 'border-blue-800/50',
    badge: 'bg-blue-600 text-blue-100',
  },
  'Review': {
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/50',
    badge: 'bg-amber-600 text-amber-100',
  },
  'Done': {
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800/50',
    badge: 'bg-emerald-600 text-emerald-100',
  },
};

export function BoardColumn({ board, onAddProject, onSelectProject, schedulingEstimates, workRanks, fullWidth }: BoardColumnProps) {
  const colors = columnColors[board.name] || columnColors['Backlog'];
  const projectCount = board.projects.length;

  return (
    <div
      className={`
        flex flex-col rounded-lg border
        ${fullWidth ? 'w-full' : 'w-72 shrink-0'}
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-200 text-sm">{board.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
            {projectCount}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          onClick={() => onAddProject(board.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={board.id}>
        {(provided, snapshot) => (
          <ScrollArea className="flex-1 p-2">
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                min-h-[200px] rounded-md transition-colors
                ${snapshot.isDraggingOver ? 'bg-zinc-800/50' : ''}
              `}
            >
              {board.projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onClick={() => onSelectProject(project)}
                  schedulingEstimate={schedulingEstimates?.[project.id]}
                  workRank={workRanks?.[project.id]}
                />
              ))}
              {provided.placeholder}

              {/* Empty state */}
              {projectCount === 0 && !snapshot.isDraggingOver && (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
                  <p className="text-sm">No projects</p>
                  <button
                    onClick={() => onAddProject(board.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-400 mt-1"
                  >
                    Add one &rarr;
                  </button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </div>
  );
}
