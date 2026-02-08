-- Additive columns on projects for cached/denormalized data
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_time_seconds INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS next_meeting_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_hours_remaining NUMERIC;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS suggested_start_date TIMESTAMPTZ;

-- Add project_id to calendar_events for linking events to projects
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON calendar_events(project_id);
