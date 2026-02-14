'use client';

import { useState, useCallback } from 'react';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { GitHubReposPanel } from '@/components/project/GitHubReposPanel';
import { StatsBar } from '@/components/gamification/StatsBar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Command, Keyboard, Github, CalendarCheck } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useGamification } from '@/hooks/useGamification';
import type { GitHubRepo, ProjectFormData, XpEventType } from '@/lib/types';
import packageJson from '../../package.json';

export default function Home() {
  const [reposPanelOpen, setReposPanelOpen] = useState(false);
  const projectsState = useProjects();
  const gamification = useGamification();

  // Repos already tracked on the board (by github_repo full_name)
  const existingRepos = new Set(
    projectsState.boards
      .flatMap((b) => b.projects)
      .map((p) => p.github_repo)
      .filter(Boolean) as string[]
  );

  // Add a GitHub repo as a new project in the first board (Backlog)
  const handleAddRepoAsProject = async (repo: GitHubRepo) => {
    const backlogBoard = projectsState.boards[0];
    if (!backlogBoard) return;

    const data: ProjectFormData = {
      title: repo.name,
      description: repo.description || '',
      project_type: 'coding',
      github_repo: repo.full_name,
      client_name: '',
      client_notes: '',
      next_steps: '',
    };

    await projectsState.addProject(backlogBoard.id, data);
  };

  // XP change handler passed down to checklist toggle
  const handleXpChange = useCallback(
    (action: 'award' | 'revoke', eventType: XpEventType, referenceId: string, projectId: string) => {
      if (action === 'award') {
        gamification.awardXP(eventType, referenceId, projectId);
      } else {
        gamification.revokeXP(referenceId);
      }
    },
    [gamification]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Command className="w-5 h-5 text-zinc-400" />
              <span className="font-semibold text-zinc-200">
                Project Command Center
              </span>
            </div>

            {/* Gamification StatsBar */}
            <div className="hidden md:flex items-center ml-4">
              <StatsBar
                profile={gamification.profile}
                dailyCompleted={gamification.dailyCompleted}
                dailyGoal={gamification.dailyGoal}
                weeklyCompleted={gamification.weeklyCompleted}
                weeklyGoal={gamification.weeklyGoal}
                loading={gamification.loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/habits">
              <Button
                variant="outline"
                size="sm"
                className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                Habits
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReposPanelOpen(true)}
              className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
            >
              <Github className="w-4 h-4 mr-2" />
              Repos
            </Button>
            {/* Keyboard shortcuts hint */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-600">
              <Keyboard className="w-3 h-3" />
              <span>n: new project</span>
              <span className="text-zinc-700">•</span>
              <span>/: search</span>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <main className="flex-1 overflow-hidden">
          <KanbanBoard projectsState={projectsState} onXpChange={handleXpChange} />
        </main>

        {/* Version Footer */}
        <footer className="px-6 py-1.5 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-600 text-right">
          v{packageJson.version}
        </footer>
      </div>

      {/* Calendar Sidebar */}
      <aside className="w-72 border-l border-zinc-800 hidden lg:block">
        <CalendarSidebar />
      </aside>

      {/* GitHub Repos Panel */}
      <GitHubReposPanel
        open={reposPanelOpen}
        onOpenChange={setReposPanelOpen}
        existingRepos={existingRepos}
        onAddAsProject={handleAddRepoAsProject}
      />
    </div>
  );
}
