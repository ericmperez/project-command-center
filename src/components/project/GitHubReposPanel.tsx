'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Github,
  ExternalLink,
  Lock,
  Globe,
  RefreshCw,
  AlertCircle,
  Search,
  Plus,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { GitHubRepo } from '@/lib/types';

interface GitHubReposPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRepos: Set<string>;
  onAddAsProject: (repo: GitHubRepo) => Promise<void>;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-400',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-400',
  Dart: 'bg-cyan-400',
  HTML: 'bg-orange-400',
  CSS: 'bg-purple-400',
  Shell: 'bg-emerald-400',
  Ruby: 'bg-red-400',
  Go: 'bg-sky-400',
  Rust: 'bg-amber-600',
  Java: 'bg-red-500',
  Swift: 'bg-orange-500',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
}

export function GitHubReposPanel({ open, onOpenChange, existingRepos, onAddAsProject }: GitHubReposPanelProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addingRepoId, setAddingRepoId] = useState<number | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/github/repos');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch repos');
      }
      const data = await res.json();
      setRepos(data.repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && repos.length === 0) {
      fetchRepos();
    }
  }, [open]);

  const handleAddRepo = async (repo: GitHubRepo, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingRepoId(repo.id);
    try {
      await onAddAsProject(repo);
    } finally {
      setAddingRepoId(null);
    }
  };

  const filtered = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const privateCount = repos.filter((r) => r.visibility === 'private').length;
  const publicCount = repos.filter((r) => r.visibility === 'public').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-700 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Github className="w-5 h-5" />
            GitHub Repositories
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {repos.length > 0
              ? `${repos.length} repos — ${privateCount} private, ${publicCount} public`
              : 'Loading your repositories...'}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm text-zinc-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRepos} className="border-zinc-700">
              Retry
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 max-h-[55vh]">
            <div className="space-y-1 pr-3">
              {filtered.map((repo) => {
                const isOnBoard = existingRepos.has(repo.full_name);
                const isAdding = addingRepoId === repo.id;

                return (
                  <div
                    key={repo.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-zinc-200 group-hover:text-zinc-50 truncate hover:underline"
                        >
                          {repo.name}
                        </a>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            repo.visibility === 'private'
                              ? 'border-zinc-600 text-zinc-500'
                              : 'border-zinc-600 text-zinc-400'
                          }`}
                        >
                          {repo.visibility === 'private' ? (
                            <Lock className="w-2.5 h-2.5 mr-0.5" />
                          ) : (
                            <Globe className="w-2.5 h-2.5 mr-0.5" />
                          )}
                          {repo.visibility}
                        </Badge>
                      </div>

                      {repo.description && (
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-1.5">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                LANGUAGE_COLORS[repo.language] || 'bg-zinc-500'
                              }`}
                            />
                            {repo.language}
                          </span>
                        )}
                        {repo.open_issues_count > 0 && (
                          <span>{repo.open_issues_count} issues</span>
                        )}
                        <span>Updated {formatDate(repo.pushed_at || repo.updated_at)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isOnBoard ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] px-2 py-0.5">
                          <Check className="w-3 h-3 mr-1" />
                          On Board
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleAddRepo(repo, e)}
                          disabled={isAdding}
                          className="text-xs h-7 px-2.5 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                        >
                          {isAdding ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              Add to Board
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && !loading && (
                <p className="text-center text-sm text-zinc-600 py-8">
                  No repos match &ldquo;{search}&rdquo;
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
