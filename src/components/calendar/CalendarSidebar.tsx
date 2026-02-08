'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, RefreshCw, ExternalLink, Link2 } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarEvent } from '@/lib/types';

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function EventItem({ event }: { event: CalendarEvent }) {
  const startTime = formatTime(event.start_time);
  const endTime = event.end_time ? formatTime(event.end_time) : null;

  return (
    <div className="flex gap-3 py-2">
      <div className="flex flex-col items-center text-xs text-zinc-500 w-14 shrink-0">
        <span>{startTime}</span>
        {endTime && (
          <>
            <span className="text-[10px]">to</span>
            <span>{endTime}</span>
          </>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate">{event.title}</p>
        <div className="flex items-center gap-2">
          {event.calendar_name && (
            <p className="text-xs text-zinc-500 truncate">{event.calendar_name}</p>
          )}
          {event.project_id && (
            <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
              <Link2 className="w-2.5 h-2.5" />
              linked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarSidebar() {
  const { todaysEvents, upcomingEvents, loading, refresh } = useCalendar();
  const [expanded, setExpanded] = useState(false);

  // Group upcoming events by date
  const upcomingByDate = upcomingEvents.reduce((acc, event) => {
    const date = formatDate(event.start_time);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Filter out today's events from upcoming
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const futureEvents = Object.entries(upcomingByDate)
    .filter(([date]) => date !== today)
    .slice(0, expanded ? undefined : 3);

  // Count events linked to projects
  const linkedCount = upcomingEvents.filter((e) => e.project_id).length;

  return (
    <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
      <CardHeader className="pb-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            Calendar
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
            onClick={refresh}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden px-4 pb-4">
        <ScrollArea className="h-full">
          {/* Today's Events */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Today</span>
            </div>

            {todaysEvents.length === 0 ? (
              <p className="text-xs text-zinc-600 py-2">No events today</p>
            ) : (
              <div className="space-y-1">
                {todaysEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-zinc-800 mb-4" />

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500">Upcoming</span>
              {Object.keys(upcomingByDate).length > 3 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400"
                >
                  {expanded ? 'Show less' : 'Show all'}
                </button>
              )}
            </div>

            {futureEvents.length === 0 ? (
              <p className="text-xs text-zinc-600 py-2">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {futureEvents.map(([date, events]) => (
                  <div key={date}>
                    <p className="text-[11px] text-zinc-500 mb-1">{date}</p>
                    <div className="space-y-1">
                      {events.map((event) => (
                        <EventItem key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked events summary */}
          {linkedCount > 0 && (
            <>
              <Separator className="bg-zinc-800 my-4" />
              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                {linkedCount} event{linkedCount !== 1 ? 's' : ''} linked to projects
              </div>
            </>
          )}
        </ScrollArea>
      </CardContent>

      {/* Footer - Open Calendar App */}
      <div className="p-3 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-between text-xs text-zinc-500 hover:text-zinc-300 h-8"
          onClick={() => {
            // This opens Apple Calendar on macOS
            window.open('webcal://');
          }}
        >
          <span>Open Calendar</span>
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}
