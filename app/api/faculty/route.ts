// app/api/faculty/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


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
