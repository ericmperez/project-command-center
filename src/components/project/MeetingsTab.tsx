'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, CheckCircle, XCircle, FileText, RefreshCw } from 'lucide-react';
import { MeetingPrepView } from './MeetingPrepView';
import type { Meeting, MeetingPrepData, ChecklistItem } from '@/lib/types';

interface MeetingsTabProps {
  meetings: Meeting[];
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
  loading: boolean;
  clientName: string | null;
  githubRepo: string | null;
  checklistItems: ChecklistItem[];
  onAddMeeting: (meeting: Partial<Meeting>) => void;
  onUpdateMeeting: (meetingId: string, updates: Partial<Meeting>) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onGetMeetingPrep: (meetingId: string, repoString: string | null, items: ChecklistItem[]) => Promise<MeetingPrepData | null>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export function MeetingsTab({
  upcomingMeetings,
  pastMeetings,
  loading,
  clientName,
  githubRepo,
  checklistItems,
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onGetMeetingPrep,
}: MeetingsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [prepData, setPrepData] = useState<MeetingPrepData | null>(null);
  const [loadingPrep, setLoadingPrep] = useState(false);

  const handleAdd = () => {
    if (!title.trim() || !meetingDate) return;
    onAddMeeting({
      title: title.trim(),
      meeting_date: new Date(meetingDate).toISOString(),
      client_name: clientName,
    });
    setTitle('');
    setMeetingDate('');
    setShowForm(false);
  };

  const handlePrep = async (meetingId: string) => {
    setLoadingPrep(true);
    const data = await onGetMeetingPrep(meetingId, githubRepo, checklistItems);
    setPrepData(data);
    setLoadingPrep(false);
  };

  if (prepData) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPrepData(null)}
          className="text-zinc-400 hover:text-zinc-200 mb-2"
        >
          &larr; Back to meetings
        </Button>
        <MeetingPrepView data={prepData} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add meeting form */}
      {showForm ? (
        <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
          <Input
            type="datetime-local"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!title.trim() || !meetingDate}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              Add Meeting
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-full text-zinc-400 border-zinc-700 hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Meeting
        </Button>
      )}

      {/* Upcoming meetings */}
      <div>
        <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Upcoming
        </h4>
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-zinc-600 py-2 text-center">No upcoming meetings</p>
            ) : (
              upcomingMeetings.map((meeting) => (
                <MeetingItem
                  key={meeting.id}
                  meeting={meeting}
                  onUpdate={onUpdateMeeting}
                  onDelete={onDeleteMeeting}
                  onPrep={handlePrep}
                  loadingPrep={loadingPrep}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {pastMeetings.length > 0 && (
        <>
          <Separator className="bg-zinc-800" />

          {/* Past meetings */}
          <div>
            <h4 className="text-sm font-medium text-zinc-500 mb-2">Past</h4>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {pastMeetings.map((meeting) => (
                  <MeetingItem
                    key={meeting.id}
                    meeting={meeting}
                    onUpdate={onUpdateMeeting}
                    onDelete={onDeleteMeeting}
                    onPrep={handlePrep}
                    loadingPrep={loadingPrep}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}

function MeetingItem({
  meeting,
  onUpdate,
  onDelete,
  onPrep,
  loadingPrep,
}: {
  meeting: Meeting;
  onUpdate: (id: string, updates: Partial<Meeting>) => void;
  onDelete: (id: string) => void;
  onPrep: (id: string) => void;
  loadingPrep: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded bg-zinc-800/30 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm text-zinc-200 truncate">{meeting.title}</p>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${statusColors[meeting.status]}`}
          >
            {meeting.status}
          </Badge>
        </div>
        <p className="text-[11px] text-zinc-500">{formatDate(meeting.meeting_date)}</p>
        {meeting.notes && (
          <p className="text-[11px] text-zinc-600 truncate mt-0.5">{meeting.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {meeting.status === 'upcoming' && (
          <>
            <button
              onClick={() => onPrep(meeting.id)}
              disabled={loadingPrep}
              className="p-1 text-zinc-500 hover:text-blue-400"
              title="Prep"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdate(meeting.id, { status: 'completed' })}
              className="p-1 text-zinc-500 hover:text-emerald-400"
              title="Mark completed"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdate(meeting.id, { status: 'cancelled' })}
              className="p-1 text-zinc-500 hover:text-amber-400"
              title="Cancel"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <button
          onClick={() => onDelete(meeting.id)}
          className="p-1 text-zinc-500 hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
