// Subset of web types for mobile app

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
  client_name: string | null;
  next_steps: string | null;
  github_commit_count: number;
  github_lines_of_code: number;
  completion_percentage: number;
  total_time_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  source: 'manual' | 'github';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSession {
  id: string;
  project_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export type XpEventType = 'task_complete' | 'time_session' | 'project_complete' | 'daily_goal_bonus' | 'habit_complete';

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

// Habits
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface BoardWithProjects extends Board {
  projects: Project[];
}
