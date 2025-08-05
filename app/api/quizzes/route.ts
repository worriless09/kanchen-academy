// app/api/quizzes/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
