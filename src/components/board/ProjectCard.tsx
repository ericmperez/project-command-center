'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, AlertCircle, GitPullRequest, Clock, Calendar, Timer, Flame, Snowflake, CornerDownRight, ArrowRight } from 'lucide-react';
import { ScheduleBadge } from '@/components/project/ScheduleBadge';
import type { Project, ProjectActivity, SchedulingEstimate } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: () => void;
  schedulingEstimate?: SchedulingEstimate | null;
  workRank?: 'most' | 'least';
  activity?: ProjectActivity;
}

const projectTypeBadgeColors: Record<string, string> = {
  personal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  client: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  coding: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatTotalTime(seconds: number): string {
  if (seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatMeetingDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMeetingUrgency(dateString: string): string {
  const now = new Date();
  const meeting = new Date(dateString);
  const hoursUntil = (meeting.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < 24) return 'text-red-400';
  if (hoursUntil < 48) return 'text-amber-400';
  return 'text-zinc-400';
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const workRankStyles = {
  most: {
    border: 'border-l-orange-500',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    label: 'Most active',
    Icon: Flame,
  },
  least: {
    border: 'border-l-sky-500',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    label: 'Least active',
    Icon: Snowflake,
  },
};

export function ProjectCard({ project, index, onClick, schedulingEstimate, workRank, activity }: ProjectCardProps) {
  const hasGitHub = !!project.github_repo;
  const lastCommit = project.github_last_commit;
  const hasCompletion = project.completion_percentage > 0;
  const hasTotalTime = project.total_time_seconds > 0;
  const hasNextMeeting = !!project.next_meeting_date;
  const hasGitHubStats = project.github_commit_count > 0 || project.github_lines_of_code > 0;
  const rankStyle = workRank ? workRankStyles[workRank] : null;

  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className="mb-2"
        >
          <Card
            className={`
              cursor-pointer transition-all duration-200
              hover:ring-2 hover:ring-zinc-600 hover:bg-zinc-800/80
              ${snapshot.isDragging ? 'ring-2 ring-zinc-500 shadow-xl rotate-2' : ''}
              bg-zinc-900 border-zinc-800
              ${rankStyle ? `border-l-2 ${rankStyle.border}` : ''}
            `}
          >
            {/* Completion progress bar */}
            {hasCompletion && (
              <div className="w-full h-1 bg-zinc-800 rounded-t-lg overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${project.completion_percentage}%` }}
                />
              </div>
            )}

            <CardHeader className="p-3 space-y-2">
              {/* Header with title and type badge */}
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium text-zinc-100 leading-tight">
                  {project.title}
                </CardTitle>
                <div className="flex items-center gap-1 shrink-0">
                  {rankStyle && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${rankStyle.badge}`}
                    >
                      <rankStyle.Icon className="w-2.5 h-2.5 mr-0.5" />
                      {rankStyle.label}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${projectTypeBadgeColors[project.project_type]}`}
                  >
                    {project.project_type}
                  </Badge>
                </div>
              </div>

              {/* Description preview */}
              {project.description && (
                <CardDescription className="text-xs text-zinc-500 line-clamp-2">
                  {project.description}
                </CardDescription>
              )}

              {/* Client name */}
              {project.client_name && (
                <p className="text-xs text-amber-400/80">
                  Client: {project.client_name}
                </p>
              )}

              {/* Completion percentage */}
              {hasCompletion && (
                <div className="text-[11px] text-emerald-400">
                  {project.completion_percentage}% complete
                </div>
              )}

              {/* Info row: time + meeting */}
              {(hasTotalTime || hasNextMeeting) && (
                <div className="flex items-center gap-3 text-[11px]">
                  {hasTotalTime && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Timer className="w-3 h-3" />
                      {formatTotalTime(project.total_time_seconds)}
                    </span>
                  )}
                  {hasNextMeeting && (
                    <span className={`flex items-center gap-1 ${getMeetingUrgency(project.next_meeting_date!)}`}>
                      <Calendar className="w-3 h-3" />
                      {formatMeetingDate(project.next_meeting_date!)}
                    </span>
                  )}
                </div>
              )}

              {/* Commits & LOC stats */}
              {hasGitHubStats && (
                <div className="flex items-center gap-3 text-[11px]">
                  {project.github_commit_count > 0 && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <GitBranch className="w-3 h-3" />
                      {formatCompact(project.github_commit_count)} commits
                    </span>
                  )}
                  {project.github_lines_of_code > 0 && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      {formatCompact(project.github_lines_of_code)} LOC
                    </span>
                  )}
                </div>
              )}

              {/* Schedule badge */}
              <ScheduleBadge estimate={schedulingEstimate || null} compact />

              {/* GitHub stats row */}
              {hasGitHub && (
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-1 border-t border-zinc-800">
                  {/* Last commit */}
                  {lastCommit && (
                    <div className="flex items-center gap-1 truncate">
                      <GitBranch className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lastCommit.message}</span>
                    </div>
                  )}

                  {/* Issues and PRs */}
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    {(project.github_open_issues ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        {project.github_open_issues}
                      </span>
                    )}
                    {(project.github_open_prs ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-purple-400">
                        <GitPullRequest className="w-3 h-3" />
                        {project.github_open_prs}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Activity: Left off + Next step */}
              {activity?.lastActivity || activity?.nextStep ? (
                <div className="space-y-0.5 pt-0.5">
                  {activity.lastActivity && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <CornerDownRight className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{activity.lastActivity.description}</span>
                      <span className="shrink-0 ml-auto text-zinc-600">{formatTimeAgo(activity.lastActivity.timestamp)}</span>
                    </div>
                  )}
                  {activity.nextStep && (
                    <div className={`flex items-center gap-1 text-[10px] ${activity.nextStep.type === 'fallback' ? 'text-zinc-600' : 'text-violet-400'}`}>
                      <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{activity.nextStep.description}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                  <Clock className="w-2.5 h-2.5" />
                  Updated {formatTimeAgo(project.updated_at)}
                </div>
              )}
            </CardHeader>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
