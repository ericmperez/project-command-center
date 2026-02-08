// Database types for Project Command Center

export type ProjectType = 'personal' | 'client' | 'coding';

export interface Board {
  id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Project {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  project_type: ProjectType;
  status: string | null;
  position: number;

  // GitHub integration
  github_repo: string | null;
  github_last_commit: GitHubCommit | null;
  github_open_issues: number | null;
  github_open_prs: number | null;
  github_last_synced: string | null;

  // Client/project notes
  client_name: string | null;
  client_notes: string | null;
  next_steps: string | null;

  // Cached/denormalized fields
  completion_percentage: number;
  total_time_seconds: number;
  next_meeting_date: string | null;
  estimated_hours_remaining: number | null;
  suggested_start_date: string | null;

  created_at: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  calendar_name: string | null;
  project_id: string | null;
  synced_at: string;
}

// Checklist
export interface ChecklistItem {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  source: 'manual' | 'github';
  github_issue_number: number | null;
  github_issue_url: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Time tracking
export interface TimeSession {
  id: string;
  project_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

// Meetings
export type MeetingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  project_id: string;
  calendar_event_id: string | null;
  title: string;
  client_name: string | null;
  meeting_date: string;
  meeting_end: string | null;
  notes: string | null;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
}

// Scheduling
export interface SchedulingEstimate {
  remainingTasks: number;
  avgTimePerTask: number;
  estimatedHoursRemaining: number;
  suggestedStartDate: string | null;
  nextMeetingDate: string | null;
  status: 'on_track' | 'behind' | 'at_risk' | 'no_deadline';
}

// Meeting prep
export interface MeetingPrepData {
  meetingTitle: string;
  meetingDate: string;
  completedTasksSinceLastMeeting: ChecklistItem[];
  commitsSinceLastMeeting: GitHubCommit[];
  timeSpentSinceLastMeeting: number;
  lastMeetingDate: string | null;
}

// UI Types
export interface BoardWithProjects extends Board {
  projects: Project[];
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}

// Form types for creating/editing projects
export interface ProjectFormData {
  title: string;
  description: string;
  project_type: ProjectType;
  github_repo: string;
  client_name: string;
  client_notes: string;
  next_steps: string;
}

// GitHub repo from API
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  visibility: string;
  updated_at: string;
  pushed_at: string | null;
  stargazers_count: number;
  open_issues_count: number;
  default_branch: string;
}

// GitHub issue from API
export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
}

// Gamification
export type XpEventType = 'task_complete' | 'time_session' | 'project_complete' | 'daily_goal_bonus';

export interface GamificationProfile {
  id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  daily_goal: number;
  weekly_goal: number;
  created_at: string;
  updated_at: string;
}

export interface XpEvent {
  id: string;
  event_type: XpEventType;
  xp_amount: number;
  project_id: string | null;
  reference_id: string | null;
  created_at: string;
}

// Prompt generation
export interface GeneratedPrompt {
  label: string;
  prompt: string;
}
