// app/api/flashcards/review/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  HRMSpacedRepetitionEngine, 
  HRMFlashcardProgress, 
  HRMReviewResponse 
} from '@/lib/algorithms/hrm-spaced-repetition';
import { hrmClient } from '@/lib/services/hrm-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      flashcard_id, 
      quality, 
      response_time, 
      confidence_level, 
      hints_used, 
      reasoning_steps,
      context 
    } = body;

    // Validate input
    if (!flashcard_id || quality === undefined || !response_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current progress
    const { data: currentProgress, error: progressError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('flashcard_id', flashcard_id)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Error fetching progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Create review response
    const reviewResponse: HRMReviewResponse = {
      quality,
      response_time,
      confidence_level: confidence_level || 0.5,
      hints_used: hints_used || 0,
      partial_correct: quality >= 2 && quality < 4,
      reasoning_steps: reasoning_steps || [],
      conceptual_understanding: Math.max(0, Math.min(1, (quality + (confidence_level || 0.5) * 5) / 10)),
      problem_solving_approach: (reasoning_steps?.length || 0) > 2 ? 'analytical' : 'intuitive',
      metacognitive_awareness: hints_used === 0 && (confidence_level || 0) > 0.7 ? 0.8 : 0.5
    };

    // Calculate next review using HRM
    const reviewResult = await HRMSpacedRepetitionEngine.calculateHRMEnhancedReview(
      user.id,
      flashcard_id,
      currentProgress as HRMFlashcardProgress,
      reviewResponse,
      {
        subject: context?.subject || 'general',
        topic: context?.topic || 'general',
        difficulty_level: context?.difficulty_level || 0.5,
        session_context: context?.session_context || {}
      }
    );

    // Update progress in database
    const progressData = {
      user_id: user.id,
      flashcard_id,
      ease_factor: reviewResult.updated_progress.ease_factor,
      interval_days: reviewResult.updated_progress.interval_days,
      repetitions: reviewResult.updated_progress.repetitions,
      next_review_date: reviewResult.updated_progress.next_review_date.toISOString().split('T')[0],
      last_reviewed_at: new Date().toISOString(),
      quality_responses: reviewResult.updated_progress.quality_responses,
      total_reviews: reviewResult.updated_progress.total_reviews,
      success_rate: reviewResult.updated_progress.success_rate,
      average_response_time: reviewResult.updated_progress.average_response_time,
      difficulty_trend: reviewResult.updated_progress.difficulty_trend,
      reasoning_score: reviewResult.hrm_analysis.reasoning_depth,
      adaptive_difficulty: reviewResult.hrm_analysis.recommended_difficulty,
      learning_trajectory: reviewResult.hrm_analysis.learning_insights,
      cognitive_load_history: [
        ...(currentProgress?.cognitive_load_history || []).slice(-19),
        reviewResult.hrm_analysis.cognitive_load
      ]
    };

    const { error: updateError } = await supabase
      .from('user_flashcard_progress')
      .upsert(progressData, {
        onConflict: 'user_id,flashcard_id'
      });

    if (updateError) {
      console.error('Error updating progress:', updateError);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    // Store reasoning session
    const sessionData = {
      user_id: user.id,
      session_type: 'flashcard',
      content_id: flashcard_id,
      reasoning_depth: reviewResult.hrm_analysis.reasoning_depth,
      pattern_recognition: reviewResult.hrm_analysis.pattern_recognition,
      cognitive_strengths: reviewResult.hrm_analysis.learning_insights.reasoning_strengths,
      improvement_areas: reviewResult.hrm_analysis.learning_insights.improvement_areas,
      recommended_difficulty: reviewResult.hrm_analysis.recommended_difficulty,
      duration_seconds: Math.round(response_time / 1000),
      confidence_level: confidence_level || 0.5
    };

    await supabase.from('reasoning_sessions').insert(sessionData);

    return NextResponse.json({
      success: true,
      next_review_date: reviewResult.next_review_date,
      interval_days: reviewResult.interval_days,
      performance_feedback: reviewResult.performance_feedback,
      study_analytics: reviewResult.study_analytics,
      adaptive_recommendations: reviewResult.adaptive_recommendations,
      learning_insights: reviewResult.learning_insights
    });

  } catch (error) {
    console.error('Review processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// app/api/flashcards/due/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deck_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('user_flashcard_progress')
      .select(`
        *,
        flashcards (
          id,
          front_text,
          back_text,
          difficulty,
          reasoning_type,
          cognitive_load,
          tags,
          flashcard_decks (
            id,
            title,
            category
          )
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_date', new Date().toISOString().split('T')[0])
      .order('next_review_date', { ascending: true })
      .limit(limit);

    if (deckId) {
      query = query.eq('flashcards.deck_id', deckId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching due cards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch due cards' },
        { status: 500 }
      );
    }

    // Process with HRM prioritization
    const prioritizedCards = data?.map(progress => {
      const priorityScore = calculatePriorityScore(progress);
      return {
        ...progress,
        priority_score: priorityScore,
        priority_reason: getPriorityReason(progress)
      };
    }).sort((a, b) => b.priority_score - a.priority_score);

    return NextResponse.json({
      cards: prioritizedCards || [],
      total_due: prioritizedCards?.length || 0,
      high_priority_count: prioritizedCards?.filter(c => c.priority_score > 50).length || 0
    });

  } catch (error) {
    console.error('Error in due cards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculatePriorityScore(progress: any): number {
  let score = 0;

  const daysOverdue = Math.max(0, 
    (Date.now() - new Date(progress.next_review_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.min(50, daysOverdue * 10);

  if (progress.success_rate < 0.5) score += 30;
  if (progress.reasoning_score < 0.5) score += 25;
  if (progress.difficulty_trend === 'declining') score += 20;

  return Math.round(score);
}

function getPriorityReason(progress: any): string {
  const daysOverdue = Math.max(0, 
    (Date.now() - new Date(progress.next_review_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysOverdue > 2) return `${Math.ceil(daysOverdue)} days overdue`;
  if (progress.success_rate < 0.5) return "Low success rate";
  if (progress.reasoning_score < 0.5) return "Weak reasoning";
  return "Regular review due";
}
