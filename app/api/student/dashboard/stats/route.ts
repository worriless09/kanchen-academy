// app/api/student/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch dashboard statistics
    const [
      enrollmentsResult,
      analyticsResult,
      flashcardsResult,
      quizAttemptsResult
    ] = await Promise.all([
      // Enrollments
      supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('user_id', user.id),

      // Study analytics for current week
      supabase
        .from('user_study_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false }),

      // Due flashcards
      supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review_date', new Date().toISOString().split('T')[0]),

      // Recent quiz attempts
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', new Date().toISOString().split('T')[0])
    ]);

    const enrollments = enrollmentsResult.data || [];
    const analytics = analyticsResult.data || [];
    const flashcards = flashcardsResult.data || [];
    const quizAttempts = quizAttemptsResult.data || [];

    // Calculate statistics
    const stats = {
      total_courses: enrollments.length,
      completed_courses: enrollments.filter((e: { status: string; }) => e.status === 'completed').length,
      active_courses: enrollments.filter((e: { status: string; }) => e.status === 'active').length,
      total_study_hours: analytics.reduce((sum: any, a: { total_study_time: any; }) => sum + (a.total_study_time || 0), 0) / 60,
      flashcards_due: flashcards.length,
      quiz_attempts_today: quizAttempts.length,
      current_streak: calculateStudyStreak(analytics),
      average_score: analytics.length > 0 
        ? analytics.reduce((sum: any, a: { average_quiz_score: any; }) => sum + (a.average_quiz_score || 0), 0) / analytics.length 
        : 0,
      reasoning_improvement: calculateReasoningImprovement(analytics),
      weekly_goal_progress: calculateWeeklyGoalProgress(analytics)
    };

    // Get recent activity
    const recent_activity = await getRecentActivity(supabase, user.id);

    // Get upcoming events
    const upcoming_events = await getUpcomingEvents(supabase, user.id);

    // Get study goals
    const study_goals = await getStudyGoals(supabase, user.id);

    return NextResponse.json({
      stats,
      recent_activity,
      upcoming_events,
      study_goals
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

function calculateStudyStreak(analytics: any[]): number {
  if (analytics.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < analytics.length; i++) {
    const date = analytics[i].date;
    const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    if (date === expectedDate && analytics[i].total_study_time > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateReasoningImprovement(analytics: any[]): number {
  if (analytics.length < 2) return 0;

  const recent = analytics.slice(0, 3);
  const older = analytics.slice(-3);

  const recentAvg = recent.reduce((sum, a) => sum + (a.average_reasoning_depth || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, a) => sum + (a.average_reasoning_depth || 0), 0) / older.length;

  return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
}

function calculateWeeklyGoalProgress(analytics: any[]): number {
  const weeklyGoal = 25 * 60; // 25 hours in minutes
  const thisWeekStudyTime = analytics.reduce((sum, a) => sum + (a.total_study_time || 0), 0);

  return Math.min(100, (thisWeekStudyTime / weeklyGoal) * 100);
}

async function getRecentActivity(supabase: any, userId: string) {
  // This would fetch recent activities from multiple sources
  // For brevity, returning mock data
  return [
    {
      id: '1',
      type: 'course_progress',
      title: 'Completed lesson: Indian Constitution',
      description: 'UPSC General Studies - Module 2',
      timestamp: new Date().toISOString()
    }
  ];
}

async function getUpcomingEvents(supabase: any, userId: string) {
  // Fetch upcoming events
  return [];
}

async function getStudyGoals(supabase: any, userId: string) {
  // Fetch study goals
  return [];
}