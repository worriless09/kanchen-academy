// app/api/analytics/user/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Fetch analytics data in parallel
    const [analyticsResult, reasoningResult] = await Promise.all([
      supabase
        .from('user_study_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date'),
      
      supabase
        .from('reasoning_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at'),
    ]);

    const analytics = analyticsResult.data || [];
    const reasoningSessions = reasoningResult.data || [];

    // Process data for insights
    const insights = generateLearningInsights(analytics, reasoningSessions);

    return NextResponse.json({
      analytics,
      reasoning_sessions: reasoningSessions,
      insights
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function generateLearningInsights(analytics: any[], reasoningSessions: any[]) {
  const insights = [];

  // Calculate average performance
  const avgScore = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + (a.average_quiz_score || 0), 0) / analytics.length
    : 0;

  if (avgScore > 80) {
    insights.push({
      id: '1',
      type: 'strength',
      title: 'Excellent Quiz Performance',
      description: `Your average score is ${Math.round(avgScore)}%. Keep up the great work!`
    });
  } else if (avgScore < 60) {
    insights.push({
      id: '2',
      type: 'weakness',
      title: 'Quiz Performance Needs Improvement',
      description: `Your average score is ${Math.round(avgScore)}%. Focus on weak areas.`,
      action_text: 'View Weak Topics',
      action_url: '/analytics/weak-topics'
    });
  }

  // Check reasoning improvement
  if (reasoningSessions.length >= 2) {
    const recent = reasoningSessions.slice(-5);
    const recentAvgReasoning = recent.reduce((sum, s) => sum + (s.reasoning_depth || 0), 0) / recent.length;

    if (recentAvgReasoning > 0.7) {
      insights.push({
        id: '3',
        type: 'strength',
        title: 'Strong Analytical Thinking',
        description: 'Your reasoning depth has improved significantly. You are thinking more analytically!'
      });
    }
  }

  // Study consistency
  const studyDays = analytics.filter(a => a.total_study_time > 0).length;
  const consistency = studyDays / analytics.length;

  if (consistency > 0.8) {
    insights.push({
      id: '4',
      type: 'strength',
      title: 'Excellent Study Consistency',
      description: `You've studied ${Math.round(consistency * 100)}% of days. Consistency is key to success!`
    });
  } else if (consistency < 0.5) {
    insights.push({
      id: '5',
      type: 'recommendation',
      title: 'Improve Study Consistency',
      description: 'Try to study a little every day rather than cramming.',
      action_text: 'Set Study Reminders',
      action_url: '/settings/reminders'
    });
  }

  return insights;
}

