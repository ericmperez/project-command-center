# Project Command Center

Personal project management dashboard with kanban board, time tracking, meetings, gamification, and smart scheduling.

## Architecture

- **Web app**: Next.js 16 + Supabase, deployed on Vercel at https://project-command-center-zeta.vercel.app
- **Mobile app**: Expo React Native in `mobile/`, runs via Expo Go on iOS
- **Database**: Supabase (PostgreSQL) — both apps connect directly to the same database
- **Realtime sync**: Supabase Realtime subscriptions keep web and mobile in sync

## Key Rule

All changes must work on both the web app and the mobile app. They share the same Supabase backend — any new tables, columns, or data changes must be reflected in both codebases.

## Project Structure

```
src/                          # Next.js web app
  app/                        # App router pages + API routes
  lib/
    supabase.ts               # Supabase client + data access functions
    types.ts                  # All TypeScript types
    gamification.ts           # Pure gamification functions (XP, levels, streaks)
  hooks/                      # React hooks (useGamification, useTimeTracking, etc.)

mobile/                       # Expo React Native app
  app/                        # expo-router screens (tabs + project detail)
  lib/
    supabase.ts               # Mobile Supabase client (AsyncStorage)
    types.ts                  # Subset of web types (keep in sync with src/lib/types.ts)
    gamification.ts           # Copy of web gamification.ts (pure functions, keep identical)
    format.ts                 # Duration formatting helpers
  hooks/                      # Mobile hooks (useProjects, useChecklist, useGamification, useTimeSessions)
  components/                 # XpBar, StatsCard, ProjectCard, ChecklistItemRow

supabase/
  migrations/                 # SQL migrations (pushed via `supabase db push`)
```

## Database Tables

boards, projects, checklist_items, time_sessions, meetings, calendar_events, gamification_profile, xp_events

## Environment Variables

### Web (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GITHUB_TOKEN`

### Mobile (mobile/.env)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Vercel
All three vars are set on Vercel production environment.

## Commands

- **Web dev**: `npm run dev` (from root)
- **Mobile dev**: `cd mobile && npx expo start --ios`
- **Deploy web**: Push to `main` branch (auto-deploys via Vercel Git integration), or `npx vercel --prod`
- **DB migrations**: `supabase db push` (from root, linked to project `enhdcftidikihhbpiify`)

## Important Notes

- Root `tsconfig.json` excludes `mobile/` to prevent Next.js build from picking up Expo files
- `mobile/lib/gamification.ts` is a verbatim copy of `src/lib/gamification.ts` — if you change one, change both
- `mobile/lib/types.ts` is a subset of `src/lib/types.ts` — new types needed by mobile must be added there too
- Gamification tables require explicit `GRANT ALL ... TO anon, authenticated` in migrations (see `20260208090000_gamification_grants.sql`)
- Mobile gamification hook does XP award/revoke directly via Supabase (not through API routes)
