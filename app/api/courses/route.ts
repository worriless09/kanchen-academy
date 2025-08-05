// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
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
    const supabase = await createClient();

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
    .replace(/^-+|-+$/g, '');
}



