import { Octokit } from 'octokit';
import type { GitHubCommit, GitHubIssue } from './types';

// Initialize Octokit with personal access token
// Token should be set in .env.local as GITHUB_TOKEN
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface GitHubRepoData {
  lastCommit: GitHubCommit | null;
  openIssues: number;
  openPRs: number;
  defaultBranch: string;
}

/**
 * Parse a GitHub repo string into owner and repo name
 * @param repoString - Format: "owner/repo" or full URL
 */
export function parseRepoString(repoString: string): { owner: string; repo: string } | null {
  // Handle full GitHub URLs
  const urlMatch = repoString.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace('.git', '') };
  }

  // Handle owner/repo format
  const parts = repoString.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  return null;
}

/**
 * Fetch comprehensive data about a GitHub repository
 */
export async function fetchRepoData(repoString: string): Promise<GitHubRepoData | null> {
  const parsed = parseRepoString(repoString);
  if (!parsed) return null;

  const { owner, repo } = parsed;

  try {
    // Fetch repo info, commits, issues, and PRs in parallel
    const [repoInfo, commits, issues, prs] = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listCommits({ owner, repo, per_page: 1 }),
      octokit.rest.issues.listForRepo({ owner, repo, state: 'open', per_page: 1 }),
      octokit.rest.pulls.list({ owner, repo, state: 'open', per_page: 100 }),
    ]);

    const lastCommit = commits.data[0];

    return {
      lastCommit: lastCommit ? {
        sha: lastCommit.sha.substring(0, 7),
        message: lastCommit.commit.message.split('\n')[0], // First line only
        author: lastCommit.commit.author?.name || 'Unknown',
        date: lastCommit.commit.author?.date || new Date().toISOString(),
        branch: repoInfo.data.default_branch,
      } : null,
      openIssues: repoInfo.data.open_issues_count - prs.data.length, // Issues count includes PRs
      openPRs: prs.data.length,
      defaultBranch: repoInfo.data.default_branch,
    };
  } catch (error) {
    console.error(`Error fetching repo data for ${repoString}:`, error);
    return null;
  }
}

/**
 * Fetch recent commits for a repository
 */
export async function fetchRecentCommits(
  repoString: string,
  count: number = 5
): Promise<GitHubCommit[]> {
  const parsed = parseRepoString(repoString);
  if (!parsed) return [];

  const { owner, repo } = parsed;

  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: count,
    });

    return data.map((commit) => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || new Date().toISOString(),
      branch: '', // Would need separate API call per commit
    }));
  } catch (error) {
    console.error(`Error fetching commits for ${repoString}:`, error);
    return [];
  }
}

/**
 * Fetch issues for a repository
 */
export async function fetchRepoIssues(
  repoString: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubIssue[]> {
  const parsed = parseRepoString(repoString);
  if (!parsed) return [];

  const { owner, repo } = parsed;

  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: 100,
    });

    // Filter out pull requests (GitHub API returns PRs as issues too)
    return data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        html_url: issue.html_url,
      }));
  } catch (error) {
    console.error(`Error fetching issues for ${repoString}:`, error);
    return [];
  }
}

/**
 * Fetch commits since a given date
 */
export async function fetchCommitsSince(
  repoString: string,
  sinceDate: string
): Promise<GitHubCommit[]> {
  const parsed = parseRepoString(repoString);
  if (!parsed) return [];

  const { owner, repo } = parsed;

  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: sinceDate,
      per_page: 100,
    });

    return data.map((commit) => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || new Date().toISOString(),
      branch: '',
    }));
  } catch (error) {
    console.error(`Error fetching commits since ${sinceDate} for ${repoString}:`, error);
    return [];
  }
}

/**
 * Check if the GitHub token is configured and valid
 */
export async function validateGitHubToken(): Promise<boolean> {
  if (!process.env.GITHUB_TOKEN) {
    return false;
  }

  try {
    await octokit.rest.users.getAuthenticated();
    return true;
  } catch {
    return false;
  }
}
