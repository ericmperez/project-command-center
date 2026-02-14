import { NextRequest, NextResponse } from 'next/server';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  getHeatmapData,
  getTodayCompletions,
  getHabitCompletionDates,
  getHabitCompletions,
  updateCompletionNotes,
  createXpEvent,
  deleteXpEventByReference,
  getXpEventByReference,
  getGamificationProfile,
  updateGamificationProfile,
} from '@/lib/supabase';
import {
  getLevelFromXp,
  computeStreak,
  computeHabitStreak,
  getHabitStreakBonus,
  XP_VALUES,
} from '@/lib/gamification';

// GET /api/habits — habits, heatmap (52 weeks), today completions
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);
    const startStr = startDate.toISOString().split('T')[0];

    const [habits, heatmapData, todayCompletions] = await Promise.all([
      getHabits(),
      getHeatmapData(startStr, today),
      getTodayCompletions(today),
    ]);

    return NextResponse.json({
      habits,
      heatmapData,
      todayCompletions,
    });
  } catch (error) {
    console.error('Habits GET error:', error);
    return NextResponse.json({ error: 'Failed to load habits data' }, { status: 500 });
  }
}

// POST /api/habits — create, toggle, update, delete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === 'create') {
      const { name, icon, color } = body;
      const habit = await createHabit({ name, icon, color });
      return NextResponse.json({ habit });
    }

    if (action === 'get_log') {
      const { habit_id } = body;
      const completions = await getHabitCompletions(habit_id);
      return NextResponse.json({ completions });
    }

    if (action === 'update_notes') {
      const { completion_id, notes } = body;
      const completion = await updateCompletionNotes(completion_id, notes);
      return NextResponse.json({ completion });
    }

    if (action === 'toggle') {
      const { habit_id, date, notes } = body;
      const today = date || new Date().toISOString().split('T')[0];
      const result = await toggleHabitCompletion(habit_id, today, notes);

      const referenceId = `habit_${habit_id}_${today}`;

      if (result.completed) {
        // Award XP
        const existing = await getXpEventByReference(referenceId);
        if (!existing) {
          await createXpEvent({
            event_type: 'habit_complete',
            xp_amount: XP_VALUES.habit_complete,
            project_id: null,
            reference_id: referenceId,
          });

          // Update profile
          const profile = await getGamificationProfile();
          if (profile) {
            let newTotalXp = profile.total_xp + XP_VALUES.habit_complete;
            const streakResult = computeStreak(profile.last_active_date, profile.current_streak);

            // Check streak milestones
            const completionDates = await getHabitCompletionDates(habit_id);
            const habitStreak = computeHabitStreak(completionDates, today);
            const streakBonus = getHabitStreakBonus(habitStreak);

            if (streakBonus > 0) {
              const bonusRef = `habit_streak_${habit_id}_${habitStreak}d`;
              const existingBonus = await getXpEventByReference(bonusRef);
              if (!existingBonus) {
                await createXpEvent({
                  event_type: 'habit_complete',
                  xp_amount: streakBonus,
                  project_id: null,
                  reference_id: bonusRef,
                });
                newTotalXp += streakBonus;
              }
            }

            const newLevel = getLevelFromXp(newTotalXp);
            await updateGamificationProfile(profile.id, {
              total_xp: newTotalXp,
              level: newLevel,
              current_streak: streakResult.current_streak,
              longest_streak: Math.max(profile.longest_streak, streakResult.longest_streak),
              last_active_date: streakResult.last_active_date,
            });
          }
        }
      } else {
        // Revoke XP
        const deleted = await deleteXpEventByReference(referenceId);
        if (deleted) {
          const profile = await getGamificationProfile();
          if (profile) {
            const newTotalXp = Math.max(0, profile.total_xp - deleted.xp_amount);
            const newLevel = getLevelFromXp(newTotalXp);
            await updateGamificationProfile(profile.id, { total_xp: newTotalXp, level: newLevel });
          }
        }
      }

      return NextResponse.json({ completed: result.completed });
    }

    if (action === 'update') {
      const { id, updates } = body;
      const habit = await updateHabit(id, updates);
      return NextResponse.json({ habit });
    }

    if (action === 'delete') {
      const { id } = body;
      await deleteHabit(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Habits POST error:', error);
    return NextResponse.json({ error: 'Failed to process habits action' }, { status: 500 });
  }
}
