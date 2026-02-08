import { NextRequest, NextResponse } from 'next/server';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting, getUpcomingMeetings, updateProject } from '@/lib/supabase';
import type { Project } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const upcoming = searchParams.get('upcoming');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    if (upcoming === 'true') {
      const meetings = await getUpcomingMeetings(projectId);
      return NextResponse.json({ meetings });
    }

    const meetings = await getMeetings(projectId);
    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Meetings GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const meeting = await createMeeting(body);

    // Update next_meeting_date on project
    const upcoming = await getUpcomingMeetings(body.project_id);
    if (upcoming.length > 0) {
      await updateProject(body.project_id, {
        next_meeting_date: upcoming[0].meeting_date,
      } as Partial<Project>);
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Meeting create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const meeting = await updateMeeting(id, updates);

    // Update next_meeting_date on project
    const upcoming = await getUpcomingMeetings(meeting.project_id);
    await updateProject(meeting.project_id, {
      next_meeting_date: upcoming.length > 0 ? upcoming[0].meeting_date : null,
    } as Partial<Project>);

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Meeting update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await deleteMeeting(id);

    // Update next_meeting_date on project
    if (projectId) {
      const upcoming = await getUpcomingMeetings(projectId);
      await updateProject(projectId, {
        next_meeting_date: upcoming.length > 0 ? upcoming[0].meeting_date : null,
      } as Partial<Project>);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meeting delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
