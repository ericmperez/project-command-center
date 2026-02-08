-- Fix: grant anon/authenticated access to gamification tables
-- Resolves PGRST205 "Could not find table in schema cache" error
GRANT ALL ON gamification_profile TO anon, authenticated;
GRANT ALL ON xp_events TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
