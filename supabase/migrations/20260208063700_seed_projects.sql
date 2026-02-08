-- Seed Projects for Eric Perez
-- Pre-populate with known projects from MEMORY.md

-- Get the "In Progress" board ID
DO $$
DECLARE
    backlog_id UUID;
    in_progress_id UUID;
BEGIN
    -- Get board IDs
    SELECT id INTO backlog_id FROM boards WHERE name = 'Backlog' LIMIT 1;
    SELECT id INTO in_progress_id FROM boards WHERE name = 'In Progress' LIMIT 1;

    -- Insert Driver Verification App
    INSERT INTO projects (
        board_id,
        title,
        description,
        project_type,
        position,
        github_repo,
        next_steps
    ) VALUES (
        backlog_id,
        'Driver Verification App',
        'Empty repo, fresh start. Driver verification app project.',
        'coding',
        0,
        'ericmperez/driverVerificationApp',
        'Set up initial project structure and define requirements'
    ) ON CONFLICT DO NOTHING;

    -- Insert Ora Pro Nobis
    INSERT INTO projects (
        board_id,
        title,
        description,
        project_type,
        position,
        client_notes,
        next_steps
    ) VALUES (
        in_progress_id,
        'Ora Pro Nobis',
        'Catholic prayer screen time app. iOS 17+, SwiftUI, SwiftData. MVVM + singleton services pattern. Bundle ID: com.thedigitalbasement.orapronobis. Bilingual (EN/ES).',
        'personal',
        0,
        'Personal project. Key features: prayer tracking, screen time integration, bilingual support.',
        'Continue iOS development with SwiftUI'
    ) ON CONFLICT DO NOTHING;

    -- Insert JayFe Trucking Dashboard
    INSERT INTO projects (
        board_id,
        title,
        description,
        project_type,
        position,
        github_repo,
        client_name,
        client_notes,
        next_steps
    ) VALUES (
        in_progress_id,
        'JayFe Trucking Dashboard',
        'Fleet management dashboard. Next.js 16, React 19, Supabase, Firebase Auth, Stripe, shadcn/ui. v1.24.8.',
        'client',
        1,
        'ericmperez/jayfetruckingdashboard',
        'JayFe Trucking',
        'Fleet management dashboard for trucking company. Current version: v1.24.8.',
        'Review current version and plan next features'
    ) ON CONFLICT DO NOTHING;

END $$;
