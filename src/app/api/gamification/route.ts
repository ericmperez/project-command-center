import { NextRequest, NextResponse } from 'next/server';
import {
  getGamificationProfile,
  updateGamificationProfile,
  createXpEvent,
  deleteXpEventByReference,
  getXpEventByReference,
  getXpEventsInRange,
} from '@/lib/supabase';
import {
  getLevelFromXp,
  computeStreak,
  getDayBounds,
  getWeekBounds,
  countTaskCompletes,
  XP_VALUES,
} from '@/lib/gamification';
import type { XpEventType } from '@/lib/types';

// GET /api/gamification — profile + today/week stats
export async function GET() {
  try {
    const profile = await getGamificationProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No gamification profile found' }, { status: 404 });
    }

    const { start: dayStart, end: dayEnd } = getDayBounds();
    const { start: weekStart, end: weekEnd } = getWeekBounds();

    const [todayEvents, weekEvents] = await Promise.all([
      getXpEventsInRange(dayStart, dayEnd),
      getXpEventsInRange(weekStart, weekEnd),
    ]);

    const dailyCompleted = countTaskCompletes(todayEvents);
    const weeklyCompleted = countTaskCompletes(weekEvents);

    return NextResponse.json({
      profile,
      daily: { completed: dailyCompleted, goal: profile.daily_goal },
      weekly: { completed: weeklyCompleted, goal: profile.weekly_goal },
    });
  } catch (error) {
    console.error('Gamification GET error:', error);
    return NextResponse.json({ error: 'Failed to load gamification data' }, { status: 500 });
  }
}

// POST /api/gamification — award or revoke XP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, event_type, project_id, reference_id } = body as {
      action: 'award' | 'revoke';
      event_type: XpEventType;
      project_id?: string;
      reference_id?: string;
    };

    const profile = await getGamificationProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No gamification profile found' }, { status: 404 });
    }

    if (action === 'revoke') {
      // Remove XP event by reference_id and subtract XP
      if (!reference_id) {
        return NextResponse.json({ error: 'reference_id required for revoke' }, { status: 400 });
      }
      const deleted = await deleteXpEventByReference(reference_id);
      if (deleted) {
        const newTotalXp = Math.max(0, profile.total_xp - deleted.xp_amount);
        const newLevel = getLevelFromXp(newTotalXp);
        await updateGamificationProfile(profile.id, { total_xp: newTotalXp, level: newLevel });
      }
      return NextResponse.json({ success: true });
    }

    // Award XP
    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    }

    // Dedup: skip if event already exists for this reference_id
    if (reference_id) {
      const existing = await getXpEventByReference(reference_id);
      if (existing) {
        return NextResponse.json({ success: true, duplicate: true });
      }
    }

    const xpAmount = XP_VALUES[event_type] ?? 0;

    // Create XP event
    await createXpEvent({
      event_type,
      xp_amount: xpAmount,
      project_id: project_id || null,
      reference_id: reference_id || null,
    });

    let newTotalXp = profile.total_xp + xpAmount;

    // Update streak
    const streakResult = computeStreak(
      profile.last_active_date,
      profile.current_streak
    );

    // Check if daily goal was just hit (for bonus)
    let dailyBonusAwarded = false;
    if (event_type === 'task_complete') {
      const { start: dayStart, end: dayEnd } = getDayBounds();
      const todayEvents = await getXpEventsInRange(dayStart, dayEnd);
      const dailyCompleted = countTaskCompletes(todayEvents);

      if (dailyCompleted === profile.daily_goal) {
        // Award daily goal bonus
        await createXpEvent({
          event_type: 'daily_goal_bonus',
          xp_amount: XP_VALUES.daily_goal_bonus,
          project_id: null,
          reference_id: `daily_bonus_${new Date().toISOString().split('T')[0]}`,
        });
        newTotalXp += XP_VALUES.daily_goal_bonus;
        dailyBonusAwarded = true;
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

    return NextResponse.json({
      success: true,
      xp_awarded: xpAmount,
      daily_bonus: dailyBonusAwarded,
      total_xp: newTotalXp,
      level: newLevel,
    });
  } catch (error) {
    console.error('Gamification POST error:', error);
    return NextResponse.json({ error: 'Failed to process gamification event' }, { status: 500 });
  }
}
