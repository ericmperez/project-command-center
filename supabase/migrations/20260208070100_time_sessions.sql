-- Time Sessions - Auto-tracked work sessions
CREATE TABLE IF NOT EXISTS time_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_sessions_project_id ON time_sessions(project_id);

-- RLS
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on time_sessions" ON time_sessions;
CREATE POLICY "Allow all on time_sessions" ON time_sessions FOR ALL USING (true) WITH CHECK (true);

-- Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'time_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE time_sessions;
    END IF;
END $$;
