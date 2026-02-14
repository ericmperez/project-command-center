-- Add commit count and lines of code columns to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS github_commit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS github_lines_of_code integer NOT NULL DEFAULT 0;
