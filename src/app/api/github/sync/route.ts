import { NextRequest, NextResponse } from 'next/server';
import { fetchRepoData, fetchRepoIssues } from '@/lib/github';
import { updateProject, createChecklistItem, getChecklistItems } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { projectId, repoString, syncIssues } = await request.json();

    if (!projectId || !repoString) {
      return NextResponse.json(
        { error: 'Missing projectId or repoString' },
        { status: 400 }
      );
    }

    // Fetch GitHub data
    const repoData = await fetchRepoData(repoString);

    if (!repoData) {
      return NextResponse.json(
        { error: 'Failed to fetch repository data. Check if the repo exists and token has access.' },
        { status: 404 }
      );
    }

    // Update project in Supabase
    const updated = await updateProject(projectId, {
      github_last_commit: repoData.lastCommit,
      github_open_issues: repoData.openIssues,
      github_open_prs: repoData.openPRs,
      github_commit_count: repoData.commitCount,
      github_lines_of_code: repoData.linesOfCode,
      github_last_synced: new Date().toISOString(),
    });

    // Optionally sync GitHub issues as checklist items
    if (syncIssues) {
      try {
        const [openIssues, closedIssues] = await Promise.all([
          fetchRepoIssues(repoString, 'open'),
          fetchRepoIssues(repoString, 'closed'),
        ]);

        const allIssues = [...openIssues, ...closedIssues];
        const existingItems = await getChecklistItems(projectId);
        const existingIssueNumbers = new Set(
          existingItems
            .filter((i) => i.source === 'github' && i.github_issue_number)
            .map((i) => i.github_issue_number)
        );

        // Upsert issues as checklist items
        for (const issue of allIssues) {
          if (!existingIssueNumbers.has(issue.number)) {
            await createChecklistItem({
              project_id: projectId,
              title: issue.title,
              is_completed: issue.state === 'closed',
              source: 'github',
              github_issue_number: issue.number,
              github_issue_url: issue.html_url,
              position: existingItems.length + allIssues.indexOf(issue),
            });
          }
        }

        // Update completion percentage
        const updatedItems = await getChecklistItems(projectId);
        const completed = updatedItems.filter((i) => i.is_completed).length;
        const pct = updatedItems.length > 0 ? Math.round((completed / updatedItems.length) * 100) : 0;
        await updateProject(projectId, { completion_percentage: pct } as Parameters<typeof updateProject>[1]);
      } catch (syncErr) {
        console.error('Error syncing issues:', syncErr);
        // Don't fail the whole request if issue sync fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lastCommit: repoData.lastCommit,
        openIssues: repoData.openIssues,
        openPRs: repoData.openPRs,
        syncedAt: updated.github_last_synced,
      },
    });
  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch sync endpoint - sync multiple repos
export async function PUT(request: NextRequest) {
  try {
    const { projects } = await request.json();

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { error: 'projects must be an array' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      projects.map(async ({ projectId, repoString }) => {
        const repoData = await fetchRepoData(repoString);

        if (!repoData) {
          throw new Error(`Failed to fetch ${repoString}`);
        }

        await updateProject(projectId, {
          github_last_commit: repoData.lastCommit,
          github_open_issues: repoData.openIssues,
          github_open_prs: repoData.openPRs,
          github_commit_count: repoData.commitCount,
          github_lines_of_code: repoData.linesOfCode,
          github_last_synced: new Date().toISOString(),
        });

        return { projectId, success: true };
      })
    );

    const summary = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        projectId: projects[index].projectId,
        success: false,
        error: result.reason?.message || 'Unknown error',
      };
    });

    return NextResponse.json({ results: summary });
  } catch (error) {
    console.error('Batch GitHub sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
