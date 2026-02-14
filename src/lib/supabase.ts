import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Board, Project, CalendarEvent, ChecklistItem, TimeSession, Meeting, GamificationProfile, XpEvent, XpEventType, Habit, HabitCompletion, HeatmapDay } from './types';

// Supabase client configuration
// These values should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create the Supabase client (will be null if not configured)
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Export the getter for external use
export const supabase = {
  get client() {
    return getSupabase();
  },
  // Allow direct channel access for realtime
  channel: (name: string) => getSupabase().channel(name),
  removeChannel: (channel: ReturnType<SupabaseClient['channel']>) => getSupabase().removeChannel(channel),
};

// ============ Board Operations ============

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase.client
    .from('boards')
    .select('*')
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function createBoard(name: string, position: number): Promise<Board> {
  const { data, error } = await supabase.client
    .from('boards')
    .insert({ name, position })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ Project Operations ============

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.client
    .from('projects')
    .select('*')
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function getProjectsByBoard(boardId: string): Promise<Project[]> {
  const { data, error } = await supabase.client
    .from('projects')
    .select('*')
    .eq('board_id', boardId)
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase.client
    .from('projects')
    .insert({
      ...project,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  const { data, error } = await supabase.client
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.client
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function moveProject(
  projectId: string,
  newBoardId: string,
  newPosition: number
): Promise<void> {
  const { error } = await supabase.client
    .from('projects')
    .update({
      board_id: newBoardId,
      position: newPosition,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) throw error;
}

export async function updateProjectPositions(
  updates: { id: string; position: number; board_id: string }[]
): Promise<void> {
  // Batch update positions using a transaction-like approach
  const promises = updates.map(({ id, position, board_id }) =>
    supabase.client
      .from('projects')
      .update({ position, board_id, updated_at: new Date().toISOString() })
      .eq('id', id)
  );

  await Promise.all(promises);
}

// ============ Calendar Operations ============

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase.client
    .from('calendar_events')
    .select('*')
    .gte('start_time', today.toISOString())
    .order('start_time')
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function getTodaysEvents(): Promise<CalendarEvent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase.client
    .from('calendar_events')
    .select('*')
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .order('start_time');

  if (error) throw error;
  return data || [];
}

export async function upsertCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const { data, error } = await supabase.client
    .from('calendar_events')
    .upsert(event, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function linkCalendarEventToProject(eventId: string, projectId: string): Promise<CalendarEvent> {
  const { data, error } = await supabase.client
    .from('calendar_events')
    .update({ project_id: projectId })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ Checklist Operations ============

export async function getChecklistItems(projectId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase.client
    .from('checklist_items')
    .select('*')
    .eq('project_id', projectId)
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function createChecklistItem(item: Partial<ChecklistItem>): Promise<ChecklistItem> {
  const { data, error } = await supabase.client
    .from('checklist_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChecklistItem(
  id: string,
  updates: Partial<ChecklistItem>
): Promise<ChecklistItem> {
  const { data, error } = await supabase.client
    .from('checklist_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.client
    .from('checklist_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateChecklistPositions(
  updates: { id: string; position: number }[]
): Promise<void> {
  const promises = updates.map(({ id, position }) =>
    supabase.client
      .from('checklist_items')
      .update({ position })
      .eq('id', id)
  );
  await Promise.all(promises);
}

// ============ Time Session Operations ============

export async function startTimeSession(projectId: string): Promise<TimeSession> {
  const { data, error } = await supabase.client
    .from('time_sessions')
    .insert({
      project_id: projectId,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endTimeSession(id: string, notes?: string): Promise<TimeSession> {
  const endTime = new Date();
  const { data: session } = await supabase.client
    .from('time_sessions')
    .select('start_time')
    .eq('id', id)
    .single();

  const startTime = session ? new Date(session.start_time) : endTime;
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  const { data, error } = await supabase.client
    .from('time_sessions')
    .update({
      end_time: endTime.toISOString(),
      duration_seconds: durationSeconds,
      ...(notes ? { notes } : {}),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTimeSessions(projectId: string): Promise<TimeSession[]> {
  const { data, error } = await supabase.client
    .from('time_sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveSession(projectId: string): Promise<TimeSession | null> {
  const { data, error } = await supabase.client
    .from('time_sessions')
    .select('*')
    .eq('project_id', projectId)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProjectTotalTime(projectId: string): Promise<number> {
  const { data, error } = await supabase.client
    .from('time_sessions')
    .select('duration_seconds')
    .eq('project_id', projectId)
    .not('duration_seconds', 'is', null);

  if (error) throw error;
  return (data || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
}

// ============ Meeting Operations ============

export async function getMeetings(projectId: string): Promise<Meeting[]> {
  const { data, error } = await supabase.client
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('meeting_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUpcomingMeetings(projectId: string): Promise<Meeting[]> {
  const { data, error } = await supabase.client
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'upcoming')
    .gte('meeting_date', new Date().toISOString())
    .order('meeting_date');

  if (error) throw error;
  return data || [];
}

export async function createMeeting(meeting: Partial<Meeting>): Promise<Meeting> {
  const { data, error } = await supabase.client
    .from('meetings')
    .insert(meeting)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMeeting(
  id: string,
  updates: Partial<Meeting>
): Promise<Meeting> {
  const { data, error } = await supabase.client
    .from('meetings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase.client
    .from('meetings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getLastMeetingForProject(projectId: string): Promise<Meeting | null> {
  const { data, error } = await supabase.client
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .order('meeting_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============ Gamification Operations ============

export async function getGamificationProfile(): Promise<GamificationProfile | null> {
  const { data, error } = await supabase.client
    .from('gamification_profile')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateGamificationProfile(
  id: string,
  updates: Partial<GamificationProfile>
): Promise<GamificationProfile> {
  const { data, error } = await supabase.client
    .from('gamification_profile')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createXpEvent(event: {
  event_type: XpEventType;
  xp_amount: number;
  project_id?: string | null;
  reference_id?: string | null;
}): Promise<XpEvent> {
  const { data, error } = await supabase.client
    .from('xp_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteXpEventByReference(referenceId: string): Promise<XpEvent | null> {
  // Return the deleted event so we can subtract XP
  const { data: existing } = await supabase.client
    .from('xp_events')
    .select('*')
    .eq('reference_id', referenceId)
    .maybeSingle();

  if (!existing) return null;

  const { error } = await supabase.client
    .from('xp_events')
    .delete()
    .eq('reference_id', referenceId);

  if (error) throw error;
  return existing;
}

export async function getXpEventByReference(referenceId: string): Promise<XpEvent | null> {
  const { data, error } = await supabase.client
    .from('xp_events')
    .select('*')
    .eq('reference_id', referenceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getXpEventsInRange(start: string, end: string): Promise<XpEvent[]> {
  const { data, error } = await supabase.client
    .from('xp_events')
    .select('*')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============ Habit Operations ============

export async function getHabits(): Promise<Habit[]> {
  const { data, error } = await supabase.client
    .from('habits')
    .select('*')
    .eq('is_archived', false)
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function createHabit(habit: { name: string; icon?: string; color?: string }): Promise<Habit> {
  const { data: existing } = await supabase.client
    .from('habits')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase.client
    .from('habits')
    .insert({
      name: habit.name,
      icon: habit.icon || '',
      color: habit.color || '#10b981',
      position: nextPosition,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
  const { data, error } = await supabase.client
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.client
    .from('habits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleHabitCompletion(
  habitId: string,
  date: string
): Promise<{ completed: boolean; completion: HabitCompletion | null }> {
  const { data: existing } = await supabase.client
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .eq('completed_date', date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.client
      .from('habit_completions')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return { completed: false, completion: null };
  } else {
    const { data, error } = await supabase.client
      .from('habit_completions')
      .insert({ habit_id: habitId, completed_date: date })
      .select()
      .single();

    if (error) throw error;
    return { completed: true, completion: data };
  }
}

export async function getHeatmapData(startDate: string, endDate: string): Promise<HeatmapDay[]> {
  const { data: completions, error } = await supabase.client
    .from('habit_completions')
    .select('completed_date')
    .gte('completed_date', startDate)
    .lte('completed_date', endDate);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of completions || []) {
    counts[row.completed_date] = (counts[row.completed_date] || 0) + 1;
  }

  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

export async function getTodayCompletions(today: string): Promise<HabitCompletion[]> {
  const { data, error } = await supabase.client
    .from('habit_completions')
    .select('*')
    .eq('completed_date', today);

  if (error) throw error;
  return data || [];
}

// ============ Batch Queries (for project activity) ============

export async function getAllChecklistItems(): Promise<ChecklistItem[]> {
  const { data, error } = await supabase.client
    .from('checklist_items')
    .select('*')
    .order('project_id')
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function getRecentTimeSessions(limit: number = 50): Promise<TimeSession[]> {
  const { data, error } = await supabase.client
    .from('time_sessions')
    .select('*')
    .not('end_time', 'is', null)
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getUpcomingMeetingsAll(): Promise<Meeting[]> {
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  const { data, error } = await supabase.client
    .from('meetings')
    .select('*')
    .eq('status', 'upcoming')
    .gte('meeting_date', new Date().toISOString())
    .lte('meeting_date', twoDaysFromNow.toISOString())
    .order('meeting_date');

  if (error) throw error;
  return data || [];
}

export async function getHabitCompletionDates(habitId: string): Promise<string[]> {
  const { data, error } = await supabase.client
    .from('habit_completions')
    .select('completed_date')
    .eq('habit_id', habitId)
    .order('completed_date', { ascending: false });

  if (error) throw error;
  return (data || []).map((r) => r.completed_date);
}
