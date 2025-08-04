// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Query parameters
    const exam_type = searchParams.get('exam_type');
    const subject_id = searchParams.get('subject_id');
    const difficulty = searchParams.get('difficulty');
    const is_free = searchParams.get('is_free');
    const is_featured = searchParams.get('is_featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    // Build query
    let query = supabase
      .from('courses')
      .select(`
        *,
        subjects(*),
        users!primary_instructor_id(
          id,
          name,
          email,
          faculty_profiles(*)
        )
      `)
      .eq('status', 'published')
      .range((page - 1) * limit, page * limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // Apply filters
    if (exam_type) query = query.eq('exam_type', exam_type);
    if (subject_id) query = query.eq('subject_id', subject_id);
    if (difficulty) query = query.eq('difficulty_level', parseInt(difficulty));
    if (is_free === 'true') query = query.eq('is_free', true);
    if (is_featured === 'true') query = query.eq('is_featured', true);

    const { data: courses, error, count } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (exam_type) countQuery = countQuery.eq('exam_type', exam_type);
    if (subject_id) countQuery = countQuery.eq('subject_id', subject_id);
    if (difficulty) countQuery = countQuery.eq('difficulty_level', parseInt(difficulty));
    if (is_free === 'true') countQuery = countQuery.eq('is_free', true);
    if (is_featured === 'true') countQuery = countQuery.eq('is_featured', true);

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['instructor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const courseData = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'description', 'subject_id', 'exam_type'];
    for (const field of requiredFields) {
      if (!courseData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create course
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        primary_instructor_id: user.id,
        slug: generateSlug(courseData.title)
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ course }, { status: 201 });

  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

// app/api/courses/[id]/enroll/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { course_id } = await request.json();

    // Check if course exists and enrollment is open
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check enrollment conditions
    const now = new Date();
    const enrollmentEnd = new Date(course.enrollment_end_date);

    if (now > enrollmentEnd) {
      return NextResponse.json(
        { error: 'Enrollment period has ended' },
        { status: 400 }
      );
    }

    if (course.current_enrollment >= course.max_students) {
      return NextResponse.json(
        { error: 'Course is full' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id,
        enrollment_type: course.is_free ? 'free' : 'paid',
        amount_paid: course.is_free ? 0 : course.discounted_fee || course.fee,
        status: course.is_free ? 'active' : 'pending'
      })
      .select()
      .single();

    if (enrollmentError) throw enrollmentError;

    // Update course enrollment count
    await supabase
      .from('courses')
      .update({ current_enrollment: course.current_enrollment + 1 })
      .eq('id', course_id);

    return NextResponse.json({ enrollment }, { status: 201 });

  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// app/api/quizzes/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const subject_id = searchParams.get('subject_id');
    const category_id = searchParams.get('category_id');
    const difficulty = searchParams.get('difficulty');
    const is_public = searchParams.get('is_public');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('quizzes')
      .select(`
        *,
        subjects(*),
        quiz_categories(*),
        users!created_by(name)
      `)
      .eq('status', 'published')
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (subject_id) query = query.eq('subject_id', subject_id);
    if (category_id) query = query.eq('category_id', category_id);
    if (difficulty) query = query.eq('difficulty_level', parseInt(difficulty));
    if (is_public === 'true') query = query.eq('is_public', true);

    const { data: quizzes, error } = await query;
    if (error) throw error;

    return NextResponse.json({ quizzes });

  } catch (error) {
    console.error('Quizzes API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// app/api/student/dashboard/stats/route.ts
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
      completed_courses: enrollments.filter(e => e.status === 'completed').length,
      active_courses: enrollments.filter(e => e.status === 'active').length,
      total_study_hours: analytics.reduce((sum, a) => sum + (a.total_study_time || 0), 0) / 60,
      flashcards_due: flashcards.length,
      quiz_attempts_today: quizAttempts.length,
      current_streak: calculateStudyStreak(analytics),
      average_score: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.average_quiz_score || 0), 0) / analytics.length 
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

// app/api/faculty/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const subject_id = searchParams.get('subject_id');
    const specialization = searchParams.get('specialization');
    const is_featured = searchParams.get('is_featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    let query = supabase
      .from('faculty_profiles')
      .select(`
        *,
        users(*)
      `)
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .range((page - 1) * limit, page * limit - 1)
      .order('total_students_taught', { ascending: false });

    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`);
    }
    if (is_featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: faculty, error } = await query;
    if (error) throw error;

    return NextResponse.json({ faculty });

  } catch (error) {
    console.error('Faculty API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty' },
      { status: 500 }
    );
  }
}

// app/api/payments/create-order/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency, type, reference_id } = await request.json();

    // Create payment transaction record
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        transaction_type: type,
        reference_id,
        amount,
        currency: currency || 'INR',
        status: 'pending',
        payment_gateway: 'razorpay'
      })
      .select()
      .single();

    if (error) throw error;

    // Create Razorpay order (mock implementation)
    const razorpayOrder = {
      id: `order_${Date.now()}`,
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      status: 'created'
    };

    // Update transaction with gateway order ID
    await supabase
      .from('payment_transactions')
      .update({ gateway_order_id: razorpayOrder.id })
      .eq('id', transaction.id);

    return NextResponse.json({
      order: razorpayOrder,
      transaction_id: transaction.id
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

// app/api/analytics/user/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Fetch analytics data
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
        .order('created_at')
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

function generateLearninginsights(analytics: any[], reasoningSessions: any[]) {
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
        description: 'Your reasoning depth has improved significantly. You're thinking more analytically!'
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

// Export all route handlers
export { GET, POST };
