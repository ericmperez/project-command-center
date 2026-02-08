import { NextRequest, NextResponse } from 'next/server';
import { fetchRepoIssues } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoString = searchParams.get('repo');
    const state = (searchParams.get('state') || 'open') as 'open' | 'closed' | 'all';

    if (!repoString) {
      return NextResponse.json(
        { error: 'Missing repo parameter' },
        { status: 400 }
      );
    }

    const issues = await fetchRepoIssues(repoString, state);

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('GitHub issues fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
