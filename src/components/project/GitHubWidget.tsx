'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  GitCommit,
  AlertCircle,
  GitPullRequest,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';
import type { Project } from '@/lib/types';

interface GitHubWidgetProps {
  project: Project;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export function GitHubWidget({ project }: GitHubWidgetProps) {
  const [syncing, setSyncing] = useState(false);
  const lastCommit = project.github_last_commit;
  const repoUrl = `https://github.com/${project.github_repo}`;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          repoString: project.github_repo,
        }),
      });
      // Note: UI will update via realtime subscription
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardContent className="p-4 space-y-4">
        {/* Header with repo link and sync button */}
        <div className="flex items-center justify-between">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            <span className="font-mono">{project.github_repo}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="text-zinc-500 hover:text-zinc-300 h-7"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing' : 'Sync'}
          </Button>
        </div>

        {/* Last Commit */}
        {lastCommit && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <GitCommit className="w-3 h-3" />
              <span>Latest Commit</span>
            </div>
            <div className="pl-5 space-y-1">
              <p className="text-sm text-zinc-300 line-clamp-2">
                {lastCommit.message}
              </p>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="font-mono">{lastCommit.sha}</span>
                <span>by {lastCommit.author}</span>
                <span>{formatDate(lastCommit.date)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Branch */}
        {lastCommit?.branch && (
          <div className="flex items-center gap-2 text-xs">
            <GitBranch className="w-3 h-3 text-zinc-500" />
            <span className="font-mono text-zinc-400">{lastCommit.branch}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-6 pt-2 border-t border-zinc-700">
          {/* Open Issues */}
          <a
            href={`${repoUrl}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:text-amber-300 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-300">
              {project.github_open_issues ?? 0} Issues
            </span>
          </a>

          {/* Open PRs */}
          <a
            href={`${repoUrl}/pulls`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:text-purple-300 transition-colors"
          >
            <GitPullRequest className="w-4 h-4 text-purple-400" />
            <span className="text-zinc-300">
              {project.github_open_prs ?? 0} PRs
            </span>
          </a>
        </div>

        {/* Last Synced */}
        {project.github_last_synced && (
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <Clock className="w-2.5 h-2.5" />
            Synced {formatTimeAgo(project.github_last_synced)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
