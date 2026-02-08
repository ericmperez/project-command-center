# Project Command Center

A Trello-like dashboard for managing all your projects, calendar, and GitHub repos with client notes and status tracking.

## Features

- **Kanban Board**: Drag-and-drop project cards between columns (Backlog, In Progress, Review, Done)
- **GitHub Integration**: See last commit, open issues, and PRs for each project
- **Client Notes**: Track client requirements, expectations, and next steps
- **Calendar Sidebar**: View events synced from Apple Calendar

## Quick Start

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql` (creates tables + default boards)
   - `supabase/migrations/002_seed_projects.sql` (seeds your existing projects)
3. Go to **Project Settings > API** and copy your project URL and anon key

### 2. Configure environment

Copy your Supabase credentials to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

For GitHub integration, create a [Personal Access Token](https://github.com/settings/tokens) with `repo` scope:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

### 3. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Apple Calendar Sync (Optional)

To sync events from Apple Calendar:

1. Install icalBuddy:
   ```bash
   brew install ical-buddy
   ```

2. Edit `scripts/com.commandcenter.calendar.plist` with your Supabase credentials

3. Install the launch agent:
   ```bash
   cp scripts/com.commandcenter.calendar.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.commandcenter.calendar.plist
   ```

Events will sync every 30 minutes.

## Tech Stack

- **Framework**: Next.js 15 + React 19 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Drag & Drop**: @hello-pangea/dnd
- **Database**: Supabase (PostgreSQL)
- **GitHub**: Octokit

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard
│   └── api/
│       ├── github/sync/      # GitHub sync endpoint
│       └── calendar/events/  # Calendar API
├── components/
│   ├── board/                # Kanban components
│   ├── project/              # Project modal & widgets
│   └── calendar/             # Calendar sidebar
├── hooks/                    # React hooks
└── lib/                      # Utilities & types
```
