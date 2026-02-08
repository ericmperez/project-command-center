import { NextRequest, NextResponse } from 'next/server';
import { supabase, getTodaysEvents, getCalendarEvents } from '@/lib/supabase';

// GET - Fetch calendar events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter'); // 'today' or 'upcoming'

    let events;
    if (filter === 'today') {
      events = await getTodaysEvents();
    } else {
      events = await getCalendarEvents();
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Add/update calendar events (used by the sync script)
export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'events must be an array' },
        { status: 400 }
      );
    }

    // Upsert all events
    const { data, error } = await supabase.client
      .from('calendar_events')
      .upsert(
        events.map((event) => ({
          ...event,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      )
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error upserting calendar events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save events' },
      { status: 500 }
    );
  }
}

// DELETE - Remove old events (cleanup endpoint)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const beforeDate = searchParams.get('before');

    if (!beforeDate) {
      return NextResponse.json(
        { error: 'before date parameter required' },
        { status: 400 }
      );
    }

    const { error, count } = await supabase.client
      .from('calendar_events')
      .delete()
      .lt('end_time', beforeDate);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deleted: count || 0,
    });
  } catch (error) {
    console.error('Error deleting old events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete events' },
      { status: 500 }
    );
  }
}
