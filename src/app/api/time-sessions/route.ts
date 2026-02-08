import { NextRequest, NextResponse } from 'next/server';
import { startTimeSession, endTimeSession, getTimeSessions, getActiveSession, getProjectTotalTime, updateProject } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const sessions = await getTimeSessions(projectId);
    const active = await getActiveSession(projectId);
    const totalTime = await getProjectTotalTime(projectId);

    return NextResponse.json({ sessions, active, totalTime });
  } catch (error) {
    console.error('Time sessions GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Close any orphaned sessions (>12h)
    const active = await getActiveSession(projectId);
    if (active) {
      const startTime = new Date(active.start_time).getTime();
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;

      if (now - startTime > twelveHours) {
        await endTimeSession(active.id, 'Auto-closed: orphaned session');
      } else {
        // Return existing active session
        return NextResponse.json({ session: active });
      }
    }

    const session = await startTimeSession(projectId);
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Time session start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, notes, projectId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await endTimeSession(sessionId, notes);

    // Update cached total_time_seconds on project
    if (projectId) {
      const totalTime = await getProjectTotalTime(projectId);
      await updateProject(projectId, { total_time_seconds: totalTime } as Partial<import('@/lib/types').Project>);
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Time session end error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
