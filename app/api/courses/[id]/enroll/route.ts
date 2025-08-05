// app/api/courses/[id]/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';



export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

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