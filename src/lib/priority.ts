import type { Project, SchedulingEstimate } from './types';

export interface PriorityScore {
  total: number;
  urgency: number;
  workload: number;
  momentum: number;
  scheduleRisk: number;
}

/**
 * Calculate a 0-100 priority score for a project.
 * Higher score = higher priority = sorted to top of column.
 */
export function calculatePriorityScore(
  project: Project,
  scheduleStatus?: SchedulingEstimate['status']
): PriorityScore {
  const urgency = calculateUrgency(project);
  const workload = calculateWorkload(project);
  const momentum = calculateMomentum(project);
  const scheduleRisk = calculateScheduleRisk(project, scheduleStatus);

  return {
    total: urgency + workload + momentum + scheduleRisk,
    urgency,
    workload,
    momentum,
    scheduleRisk,
  };
}

/** Urgency: 0-40 points based on nearest deadline */
function calculateUrgency(project: Project): number {
  // Use the earliest of target_completion_date and next_meeting_date
  const deadlines = [project.target_completion_date, project.next_meeting_date]
    .filter(Boolean)
    .map((d) => new Date(d!).getTime());

  if (deadlines.length === 0) return 10; // no deadline

  const nearest = Math.min(...deadlines);
  const now = Date.now();
  const daysUntil = (nearest - now) / (1000 * 60 * 60 * 24);

  if (daysUntil < 0) return 40;   // overdue
  if (daysUntil < 1) return 38;   // <1 day
  if (daysUntil < 3) return 34;   // <3 days
  if (daysUntil < 7) return 28;   // <1 week
  if (daysUntil < 14) return 22;  // <2 weeks
  if (daysUntil < 30) return 16;  // <1 month
  return 8;                        // 30+ days
}

/** Workload: 0-25 points based on remaining hours + completion stage */
function calculateWorkload(project: Project): number {
  // Hours remaining: 0-15 points (more hours = higher priority)
  const hours = project.estimated_hours_remaining ?? 0;
  let hoursScore: number;
  if (hours >= 20) hoursScore = 15;
  else if (hours >= 10) hoursScore = 12;
  else if (hours >= 5) hoursScore = 9;
  else if (hours >= 1) hoursScore = 6;
  else hoursScore = 2;

  // Completion stage: 0-10 points (in-progress projects score highest)
  const pct = project.completion_percentage;
  let stageScore: number;
  if (pct >= 1 && pct <= 89) stageScore = 10;    // actively in progress
  else if (pct >= 90) stageScore = 7;              // nearly done — push to finish
  else stageScore = 3;                             // 0% — not started

  return hoursScore + stageScore;
}

/** Momentum: 0-15 points based on recency + GitHub activity */
function calculateMomentum(project: Project): number {
  // Recency: 0-10 points
  const daysSinceUpdate = (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  let recencyScore: number;
  if (daysSinceUpdate < 1) recencyScore = 10;
  else if (daysSinceUpdate < 3) recencyScore = 8;
  else if (daysSinceUpdate < 7) recencyScore = 5;
  else if (daysSinceUpdate < 14) recencyScore = 3;
  else recencyScore = 1;

  // GitHub activity boost: 0-5 points
  let githubBoost = 0;
  if (project.github_last_commit) {
    const commitDays = (Date.now() - new Date(project.github_last_commit.date).getTime()) / (1000 * 60 * 60 * 24);
    if (commitDays < 1) githubBoost = 5;
    else if (commitDays < 3) githubBoost = 3;
    else if (commitDays < 7) githubBoost = 1;
  }

  return recencyScore + githubBoost;
}

/** Schedule Risk: 0-20 points */
function calculateScheduleRisk(
  project: Project,
  scheduleStatus?: SchedulingEstimate['status']
): number {
  // If we have an explicit schedule status, use it
  if (scheduleStatus) {
    switch (scheduleStatus) {
      case 'behind': return 20;
      case 'at_risk': return 14;
      case 'on_track': return 6;
      case 'no_deadline': return 3;
    }
  }

  // Derive from target_completion_date if available
  const deadline = project.target_completion_date || project.next_meeting_date;
  if (!deadline) return 3;

  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const daysUntil = (deadlineMs - now) / (1000 * 60 * 60 * 24);
  const hoursRemaining = project.estimated_hours_remaining ?? 0;
  const hoursAvailable = daysUntil * 6; // 6 productive hours per day

  if (hoursRemaining <= 0) return 6;
  if (hoursAvailable >= hoursRemaining * 1.5) return 6;   // on_track
  if (hoursAvailable >= hoursRemaining) return 14;          // at_risk
  return 20;                                                 // behind
}

/**
 * Sort projects by priority score (highest first).
 * Tiebreaker: earlier target date, then original position.
 */
export function sortProjectsByPriority(
  projects: Project[],
  estimates?: Record<string, SchedulingEstimate>
): Project[] {
  return [...projects].sort((a, b) => {
    const scoreA = calculatePriorityScore(a, estimates?.[a.id]?.status);
    const scoreB = calculatePriorityScore(b, estimates?.[b.id]?.status);

    // Higher score first
    if (scoreA.total !== scoreB.total) {
      return scoreB.total - scoreA.total;
    }

    // Tiebreaker: earlier target date first
    const dateA = a.target_completion_date ? new Date(a.target_completion_date).getTime() : Infinity;
    const dateB = b.target_completion_date ? new Date(b.target_completion_date).getTime() : Infinity;
    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Final tiebreaker: original position
    return a.position - b.position;
  });
}
