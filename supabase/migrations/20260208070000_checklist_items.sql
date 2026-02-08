-- Checklist Items - Sub-tasks per project
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'github')),
    github_issue_number INTEGER,
    github_issue_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_project_id ON checklist_items(project_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS checklist_items_updated_at ON checklist_items;
CREATE TRIGGER checklist_items_updated_at
    BEFORE UPDATE ON checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on checklist_items" ON checklist_items;
CREATE POLICY "Allow all on checklist_items" ON checklist_items FOR ALL USING (true) WITH CHECK (true);

-- Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'checklist_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
    END IF;
END $$;
