import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';

export async function GET() {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GitHub token not configured' },
      { status: 401 }
    );
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      affiliation: 'owner',
    });

    const mapped = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      visibility: repo.visibility,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      stargazers_count: repo.stargazers_count,
      open_issues_count: repo.open_issues_count,
      default_branch: repo.default_branch,
    }));

    return NextResponse.json({ repos: mapped });
  } catch (error) {
    console.error('Error fetching repos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch repos' },
      { status: 500 }
    );
  }
}
