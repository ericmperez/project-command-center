-- Meetings - Client meetings linked to projects
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    client_name TEXT,
    meeting_date TIMESTAMPTZ NOT NULL,
    meeting_end TIMESTAMPTZ,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS meetings_updated_at ON meetings;
CREATE TRIGGER meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on meetings" ON meetings;
CREATE POLICY "Allow all on meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);

-- Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'meetings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
    END IF;
END $$;
