import { NextRequest, NextResponse } from 'next/server';
import { getChecklistItems, getTimeSessions, getUpcomingMeetings, updateProject } from '@/lib/supabase';
import { calculateSchedulingEstimate } from '@/lib/scheduling';
import type { Project } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const [items, sessions, upcoming] = await Promise.all([
      getChecklistItems(projectId),
      getTimeSessions(projectId),
      getUpcomingMeetings(projectId),
    ]);

    const nextMeetingDate = upcoming.length > 0 ? upcoming[0].meeting_date : null;

    const estimate = calculateSchedulingEstimate(items, sessions, nextMeetingDate);

    // Cache on project row
    await updateProject(projectId, {
      estimated_hours_remaining: estimate.estimatedHoursRemaining,
      suggested_start_date: estimate.suggestedStartDate,
      next_meeting_date: nextMeetingDate,
    } as Partial<Project>);

    return NextResponse.json({ estimate });
  } catch (error) {
    console.error('Scheduling estimate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
