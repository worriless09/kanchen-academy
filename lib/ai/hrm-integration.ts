import { hrmClient } from '@/lib/services/hrm-client';

export class HRMEducationService {
  
  async analyzeStudentReasoning(
    userId: string,
    questionResponse: {
      question_id: string;
      response: string;
      confidence: number;
      time_taken: number;
      reasoning_steps: string[];
    }
  ) {
    const analysis = await hrmClient.analyzeReasoning({
      user_id: userId,
      problem_type: 'quiz',
      input_data: {
        quality_score: questionResponse.confidence * 5,
        response_time: questionResponse.time_taken,
        confidence_level: questionResponse.confidence,
        reasoning_steps: questionResponse.reasoning_steps,
        conceptual_understanding: this.calculateUnderstanding(questionResponse),
      },
      context: {
        subject: 'UPSC_General_Studies',
        difficulty_level: 0.7,
        session_context: {
          session_id: `study_${Date.now()}`,
          fatigue_level: 0.3,
        }
      }
    });

    return {
      reasoning_depth: analysis.reasoning_depth,
      pattern_recognition: analysis.pattern_recognition,
      cognitive_load: analysis.cognitive_load,
      recommendations: analysis.learning_insights.study_recommendations,
      next_difficulty: analysis.recommended_difficulty,
    };
  }

  async generateAdaptiveQuiz(
    userId: string,
    topic: string,
    userProfile: {
      reasoning_level: number;
      strengths: string[];
      weaknesses: string[];
    }
  ) {
    return await hrmClient.generateQuiz({
      user_id: userId,
      topic,
      difficulty_level: userProfile.reasoning_level,
      question_count: 10,
      question_types: ['mcq', 'analytical'],
      content_source: {
        reference_materials: ['NCERT', 'Laxmikanth', 'Current Affairs'],
        learning_objectives: [`Master ${topic} concepts`, 'Apply reasoning skills'],
      },
      user_profile: userProfile,
    });
  }

  private calculateUnderstanding(response: any): number {
    // Custom logic for Indian exam patterns
    let understanding = response.confidence;
    
    if (response.reasoning_steps.length > 2) {
      understanding += 0.2; // Bonus for step-by-step thinking
    }
    
    if (response.time_taken < 30000) { // Less than 30 seconds
      understanding -= 0.1; // Might be guessing
    }
    
    return Math.max(0, Math.min(1, understanding));
  }
}
