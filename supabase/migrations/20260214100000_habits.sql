-- Habits tracking: standalone habits with daily completion heatmap

-- Habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#10b981',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit completions (one per habit per day)
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

-- Indexes
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date);
CREATE INDEX idx_habit_completions_habit ON habit_completions(habit_id);

-- Reuse existing update_updated_at trigger
CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on habits" ON habits FOR ALL USING (true);
CREATE POLICY "Allow all on habit_completions" ON habit_completions FOR ALL USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions;
