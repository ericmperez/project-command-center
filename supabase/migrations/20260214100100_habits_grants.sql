-- Grant anon/authenticated access to habit tables
GRANT ALL ON habits TO anon, authenticated;
GRANT ALL ON habit_completions TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
