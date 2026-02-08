-- Gamification: XP, Levels, Streaks, Daily/Weekly Goals

-- Single profile row for gamification state
CREATE TABLE gamification_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  daily_goal INTEGER NOT NULL DEFAULT 5,
  weekly_goal INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XP event log
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,  -- 'task_complete', 'time_session', 'project_complete', 'daily_goal_bonus'
  xp_amount INTEGER NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  reference_id TEXT,         -- source item ID (checklist_item_id, time_session_id) for dedup
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial profile
INSERT INTO gamification_profile (daily_goal, weekly_goal) VALUES (5, 20);

-- RLS
ALTER TABLE gamification_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on gamification_profile" ON gamification_profile FOR ALL USING (true);
CREATE POLICY "Allow all on xp_events" ON xp_events FOR ALL USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE xp_events;

-- Indexes for daily/weekly queries
CREATE INDEX idx_xp_events_created ON xp_events(created_at);
CREATE INDEX idx_xp_events_ref ON xp_events(reference_id);
