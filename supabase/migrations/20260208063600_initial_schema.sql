-- filepath: /Users/ericperez/Projects/project-command-center/supabase/migrations/001_initial_schema.sql
-- Project Command Center - Initial Schema

-- ======================
-- BOARDS (Kanban columns)
-- ======================
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================
-- PROJECTS
-- ======================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL DEFAULT 'personal' CHECK (project_type IN ('personal', 'client', 'coding')),
    status TEXT,
    position INTEGER NOT NULL DEFAULT 0,

    -- GitHub integration
    github_repo TEXT,
    github_last_commit JSONB,
    github_open_issues INTEGER,
    github_open_prs INTEGER,
    github_last_synced TIMESTAMPTZ,

    -- Client / project notes
    client_name TEXT,
    client_notes TEXT,
    next_steps TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast board lookups
CREATE INDEX IF NOT EXISTS idx_projects_board_id ON projects(board_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ======================
-- CALENDAR EVENTS
-- ======================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    calendar_name TEXT,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================
-- SEED DEFAULT BOARDS
-- ======================
INSERT INTO boards (name, position) VALUES
    ('Backlog', 0),
    ('In Progress', 1),
    ('Review', 2),
    ('Done', 3)
ON CONFLICT (name) DO NOTHING;

-- ======================
-- ROW LEVEL SECURITY
-- ======================
-- Enable RLS (but allow anon access for this personal dashboard)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon/authenticated users (personal app, no multi-tenancy)
DROP POLICY IF EXISTS "Allow all on boards" ON boards;
CREATE POLICY "Allow all on boards" ON boards FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all on projects" ON projects;
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all on calendar_events" ON calendar_events;
CREATE POLICY "Allow all on calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);

-- ======================
-- REALTIME
-- ======================
-- Enable realtime for projects (for live board updates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    END IF;
END $$;
