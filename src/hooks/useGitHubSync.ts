'use client';

import { useState, useCallback } from 'react';
import type { Project } from '@/lib/types';

interface SyncResult {
  projectId: string;
  success: boolean;
  error?: string;
}

export function useGitHubSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Sync a single project's GitHub data
  const syncProject = useCallback(async (project: Project): Promise<SyncResult> => {
    if (!project.github_repo) {
      return { projectId: project.id, success: false, error: 'No GitHub repo configured' };
    }

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          repoString: project.github_repo,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to sync');
      }

      return { projectId: project.id, success: true };
    } catch (err) {
      return {
        projectId: project.id,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }, []);

  // Sync all projects with GitHub repos
  const syncAllProjects = useCallback(async (projects: Project[]): Promise<SyncResult[]> => {
    setSyncing(true);

    const projectsWithRepos = projects.filter((p) => p.github_repo);
    const results: SyncResult[] = [];

    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < projectsWithRepos.length; i += batchSize) {
      const batch = projectsWithRepos.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(syncProject));
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < projectsWithRepos.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setSyncing(false);
    setLastSynced(new Date());

    return results;
  }, [syncProject]);

  return {
    syncProject,
    syncAllProjects,
    syncing,
    lastSynced,
  };
}
