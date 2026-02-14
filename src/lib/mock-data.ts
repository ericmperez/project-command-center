// Mock data for demo mode (when Supabase is not configured)

import type { Board, Project, CalendarEvent, BoardWithProjects, ChecklistItem, TimeSession, Meeting, GamificationProfile, XpEvent, Habit, HabitCompletion, HeatmapDay } from './types';

const now = new Date().toISOString();

export const mockBoards: Board[] = [
  { id: 'board-1', name: 'Backlog', position: 0, created_at: now },
  { id: 'board-2', name: 'In Progress', position: 1, created_at: now },
  { id: 'board-3', name: 'Review', position: 2, created_at: now },
  { id: 'board-4', name: 'Done', position: 3, created_at: now },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    board_id: 'board-1',
    title: 'Driver Verification App',
    description: 'Empty repo, fresh start. Driver verification app project.',
    project_type: 'coding',
    status: null,
    position: 0,
    github_repo: 'ericmperez/driverVerificationApp',
    github_last_commit: null,
    github_open_issues: 0,
    github_open_prs: 0,
    github_last_synced: null,
    github_commit_count: 0,
    github_lines_of_code: 0,
    client_name: null,
    client_notes: null,
    next_steps: 'Set up initial project structure and define requirements',
    completion_percentage: 0,
    total_time_seconds: 0,
    next_meeting_date: null,
    estimated_hours_remaining: null,
    suggested_start_date: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'proj-2',
    board_id: 'board-2',
    title: 'Ora Pro Nobis',
    description: 'Catholic prayer screen time app. iOS 17+, SwiftUI, SwiftData. MVVM + singleton services pattern.',
    project_type: 'personal',
    status: null,
    position: 0,
    github_repo: null,
    github_last_commit: null,
    github_open_issues: null,
    github_open_prs: null,
    github_last_synced: null,
    github_commit_count: 0,
    github_lines_of_code: 0,
    client_name: null,
    client_notes: 'Personal project. Key features: prayer tracking, screen time integration, bilingual support (EN/ES).',
    next_steps: 'Continue iOS development with SwiftUI',
    completion_percentage: 40,
    total_time_seconds: 7200,
    next_meeting_date: null,
    estimated_hours_remaining: 12,
    suggested_start_date: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'proj-3',
    board_id: 'board-2',
    title: 'JayFe Trucking Dashboard',
    description: 'Fleet management dashboard. Next.js 16, React 19, Supabase, Firebase Auth, Stripe, shadcn/ui.',
    project_type: 'client',
    status: null,
    position: 1,
    github_repo: 'ericmperez/jayfetruckingdashboard',
    github_last_commit: {
      sha: 'a1b2c3d',
      message: 'Update dashboard layout',
      author: 'ericmperez',
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      branch: 'main',
    },
    github_open_issues: 3,
    github_open_prs: 1,
    github_last_synced: now,
    github_commit_count: 142,
    github_lines_of_code: 85400,
    client_name: 'JayFe Trucking',
    client_notes: 'Fleet management dashboard for trucking company. Current version: v1.24.8.',
    next_steps: 'Review current version and plan next features',
    completion_percentage: 65,
    total_time_seconds: 28800,
    next_meeting_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    estimated_hours_remaining: 8,
    suggested_start_date: new Date(Date.now() - 86400000).toISOString(),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'proj-4',
    board_id: 'board-3',
    title: 'Project Command Center',
    description: 'This app! Trello-like dashboard for managing projects.',
    project_type: 'coding',
    status: null,
    position: 0,
    github_repo: null,
    github_last_commit: null,
    github_open_issues: null,
    github_open_prs: null,
    github_last_synced: null,
    github_commit_count: 45,
    github_lines_of_code: 12300,
    client_name: null,
    client_notes: null,
    next_steps: 'Connect to Supabase for persistence',
    completion_percentage: 80,
    total_time_seconds: 14400,
    next_meeting_date: null,
    estimated_hours_remaining: 4,
    suggested_start_date: null,
    created_at: now,
    updated_at: now,
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Team standup',
    start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    end_time: new Date(Date.now() + 5400000).toISOString(),
    calendar_name: 'Work',
    project_id: null,
    synced_at: now,
  },
  {
    id: 'event-2',
    title: 'Code review session',
    start_time: new Date(Date.now() + 14400000).toISOString(), // 4 hours from now
    end_time: new Date(Date.now() + 18000000).toISOString(),
    calendar_name: 'Work',
    project_id: null,
    synced_at: now,
  },
  {
    id: 'event-3',
    title: 'Client call - JayFe',
    start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 90000000).toISOString(),
    calendar_name: 'Clients',
    project_id: 'proj-3',
    synced_at: now,
  },
];

export const mockChecklistItems: ChecklistItem[] = [
  // JayFe Trucking Dashboard checklist
  {
    id: 'check-1',
    project_id: 'proj-3',
    title: 'Set up Stripe payment integration',
    is_completed: true,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-2',
    project_id: 'proj-3',
    title: 'Add driver management CRUD',
    is_completed: true,
    source: 'github',
    github_issue_number: 12,
    github_issue_url: 'https://github.com/ericmperez/jayfetruckingdashboard/issues/12',
    position: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-3',
    project_id: 'proj-3',
    title: 'Implement fleet tracking map view',
    is_completed: false,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 2,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-4',
    project_id: 'proj-3',
    title: 'Add invoice generation',
    is_completed: false,
    source: 'github',
    github_issue_number: 15,
    github_issue_url: 'https://github.com/ericmperez/jayfetruckingdashboard/issues/15',
    position: 3,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-5',
    project_id: 'proj-3',
    title: 'Fix responsive layout on mobile',
    is_completed: false,
    source: 'github',
    github_issue_number: 18,
    github_issue_url: 'https://github.com/ericmperez/jayfetruckingdashboard/issues/18',
    position: 4,
    created_at: now,
    updated_at: now,
  },
  // Project Command Center checklist
  {
    id: 'check-6',
    project_id: 'proj-4',
    title: 'Set up Supabase schema',
    is_completed: true,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-7',
    project_id: 'proj-4',
    title: 'Build Kanban board UI',
    is_completed: true,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-8',
    project_id: 'proj-4',
    title: 'Add GitHub integration',
    is_completed: true,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 2,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-9',
    project_id: 'proj-4',
    title: 'Add progress tracking',
    is_completed: true,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 3,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-10',
    project_id: 'proj-4',
    title: 'Connect to Supabase for persistence',
    is_completed: false,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 4,
    created_at: now,
    updated_at: now,
  },
  // Ora Pro Nobis checklist
  {
    id: 'check-11',
    project_id: 'proj-2',
    title: 'Design prayer tracking UI',
    is_completed: true,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-12',
    project_id: 'proj-2',
    title: 'Implement SwiftData models',
    is_completed: true,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-13',
    project_id: 'proj-2',
    title: 'Add screen time integration',
    is_completed: false,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 2,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-14',
    project_id: 'proj-2',
    title: 'Add bilingual support (EN/ES)',
    is_completed: false,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 3,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'check-15',
    project_id: 'proj-2',
    title: 'Submit to App Store',
    is_completed: false,
    source: 'manual',
    github_issue_number: null,
    github_issue_url: null,
    position: 4,
    created_at: now,
    updated_at: now,
  },
];

export const mockTimeSessions: TimeSession[] = [
  {
    id: 'session-1',
    project_id: 'proj-3',
    start_time: new Date(Date.now() - 86400000 * 3).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 3 + 7200000).toISOString(),
    duration_seconds: 7200,
    notes: 'Set up Stripe integration',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'session-2',
    project_id: 'proj-3',
    start_time: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 2 + 10800000).toISOString(),
    duration_seconds: 10800,
    notes: 'Driver management CRUD',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'session-3',
    project_id: 'proj-3',
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() - 86400000 + 10800000).toISOString(),
    duration_seconds: 10800,
    notes: 'Dashboard layout improvements',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'session-4',
    project_id: 'proj-4',
    start_time: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    duration_seconds: 7200,
    notes: 'Initial kanban board setup',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'session-5',
    project_id: 'proj-4',
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() - 86400000 + 7200000).toISOString(),
    duration_seconds: 7200,
    notes: 'GitHub integration and syncing',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'session-6',
    project_id: 'proj-2',
    start_time: new Date(Date.now() - 86400000 * 4).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 4 + 3600000).toISOString(),
    duration_seconds: 3600,
    notes: 'Prayer tracking UI design',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'session-7',
    project_id: 'proj-2',
    start_time: new Date(Date.now() - 86400000 * 3).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString(),
    duration_seconds: 3600,
    notes: 'SwiftData model implementation',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const mockMeetings: Meeting[] = [
  {
    id: 'meeting-1',
    project_id: 'proj-3',
    calendar_event_id: 'event-3',
    title: 'JayFe Sprint Review',
    client_name: 'JayFe Trucking',
    meeting_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    meeting_end: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
    notes: 'Review sprint progress, demo new features',
    status: 'upcoming',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'meeting-2',
    project_id: 'proj-3',
    calendar_event_id: null,
    title: 'JayFe Kickoff Meeting',
    client_name: 'JayFe Trucking',
    meeting_date: new Date(Date.now() - 86400000 * 7).toISOString(),
    meeting_end: new Date(Date.now() - 86400000 * 7 + 3600000).toISOString(),
    notes: 'Discussed project scope, timeline, and deliverables',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export function getMockBoardsWithProjects(): BoardWithProjects[] {
  return mockBoards.map((board) => ({
    ...board,
    projects: mockProjects
      .filter((p) => p.board_id === board.id)
      .sort((a, b) => a.position - b.position),
  }));
}

// ============ Gamification Mock Data ============

export const mockGamificationProfile: GamificationProfile = {
  id: 'gam-profile-1',
  total_xp: 0,
  level: 1,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  daily_goal: 5,
  weekly_goal: 20,
  created_at: now,
  updated_at: now,
};

export let mockXpEvents: XpEvent[] = [];

// ============ Habits Mock Data ============

export const mockHabits: Habit[] = [];

export const mockHabitCompletions: HabitCompletion[] = [];

export function getMockHeatmapData(): HeatmapDay[] {
  return [];
}

export function getMockTodayCompletions(): Record<string, boolean> {
  return {};
}

// Check if we're in demo mode
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
