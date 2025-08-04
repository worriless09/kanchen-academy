// lib/algorithms/hrm-spaced-repetition.ts

import { SpacedRepetitionEngine, FlashcardProgress, ReviewResponse, ReviewResult } from './spaced-repetition';
import { HRMClient, ReasoningRequest, ReasoningResponse } from '../services/hrm-client';

/**
 * HRM-Enhanced Spaced Repetition System
 * Combines traditional Hermann Ebbinghaus algorithm with Hierarchical Reasoning Model insights
 */

export interface HRMFlashcardProgress extends FlashcardProgress {
  // HRM-specific fields
  reasoning_depth_history: number[];
  pattern_recognition_history: number[];
  cognitive_load_history: number[];
  adaptive_difficulty_level: number;
  learning_trajectory: {
    reasoning_strengths: string[];
    improvement_areas: string[];
    study_recommendations: string[];
    optimal_study_time: number;
  };
  hrm_confidence_score: number;
  personalized_interval_multiplier: number;
}

export interface HRMReviewResponse extends ReviewResponse {
  // Additional HRM data
  reasoning_steps: string[];
  conceptual_understanding: number; // 0-1 scale
  problem_solving_approach: 'analytical' | 'intuitive' | 'mixed';
  metacognitive_awareness: number; // 0-1 scale
}

export interface HRMReviewResult extends ReviewResult {
  hrm_analysis: ReasoningResponse;
  adaptive_recommendations: {
    next_difficulty_level: number;
    study_focus_areas: string[];
    optimal_review_time: string;
    complementary_topics: string[];
  };
  learning_insights: {
    cognitive_load_assessment: 'low' | 'moderate' | 'high';
    reasoning_pattern_evolution: string;
    mastery_prediction: number;
    retention_confidence: number;
  };
}

export class HRMSpacedRepetitionEngine extends SpacedRepetitionEngine {
  private static hrmClient = new HRMClient();

  /**
   * Enhanced review calculation using HRM insights
   */
  static async calculateHRMEnhancedReview(
    userId: string,
    flashcardId: string,
    currentProgress: HRMFlashcardProgress | null,
    reviewResponse: HRMReviewResponse,
    context: {
      subject: string;
      topic: string;
      difficulty_level: number;
      session_context: any;
    }
  ): Promise<HRMReviewResult> {

    // Step 1: Get traditional SM-2 calculation
    const traditionalResult = this.calculateNextReview(currentProgress, reviewResponse);

    // Step 2: Get HRM reasoning analysis
    const hrmAnalysis = await this.getHRMAnalysis(
      userId,
      flashcardId,
      reviewResponse,
      context,
      currentProgress
    );

    // Step 3: Apply HRM-based adaptations
    const adaptedResult = await this.applyHRMAdaptations(
      traditionalResult,
      hrmAnalysis,
      currentProgress,
      context
    );

    // Step 4: Update HRM-specific progress data
    const enhancedProgress = this.updateHRMProgress(
      adaptedResult.updated_progress as HRMFlashcardProgress,
      hrmAnalysis,
      reviewResponse
    );

    // Step 5: Generate adaptive recommendations
    const adaptiveRecommendations = this.generateAdaptiveRecommendations(
      hrmAnalysis,
      enhancedProgress,
      context
    );

    // Step 6: Generate learning insights
    const learningInsights = this.generateLearningInsights(
      hrmAnalysis,
      enhancedProgress
    );

    return {
      ...adaptedResult,
      updated_progress: enhancedProgress,
      hrm_analysis: hrmAnalysis,
      adaptive_recommendations,
      learning_insights
    };
  }

  /**
   * Get HRM reasoning analysis for the review
   */
  private static async getHRMAnalysis(
    userId: string,
    flashcardId: string,
    response: HRMReviewResponse,
    context: any,
    progress: HRMFlashcardProgress | null
  ): Promise<ReasoningResponse> {

    const reasoningRequest: ReasoningRequest = {
      user_id: userId,
      problem_type: 'flashcard',
      input_data: {
        flashcard_id: flashcardId,
        question_complexity: context.difficulty_level,
        response_time: response.response_time,
        quality_score: response.quality,
        confidence_level: response.confidence_level,
        reasoning_steps: response.reasoning_steps,
        conceptual_understanding: response.conceptual_understanding,
        problem_solving_approach: response.problem_solving_approach,
        hints_used: response.hints_used,
        partial_correct: response.partial_correct,
        metacognitive_awareness: response.metacognitive_awareness
      },
      context: {
        subject: context.subject,
        topic: context.topic,
        difficulty_level: context.difficulty_level,
        user_history: {
          previous_performance: progress?.quality_responses || [],
          reasoning_depth_history: progress?.reasoning_depth_history || [],
          pattern_recognition_history: progress?.pattern_recognition_history || [],
          success_rate: progress?.success_rate || 0,
          average_response_time: progress?.average_response_time || 30000,
          difficulty_trend: progress?.difficulty_trend || 'stable'
        },
        session_context: context.session_context
      },
      session_id: `${userId}-${flashcardId}-${Date.now()}`
    };

    try {
      return await this.hrmClient.analyzeReasoning(reasoningRequest);
    } catch (error) {
      console.error('HRM analysis failed, falling back to default values:', error);

      // Fallback analysis if HRM service is unavailable
      return {
        reasoning_depth: response.quality / 5,
        pattern_recognition: response.confidence_level,
        cognitive_load: Math.min(1.0, response.response_time / 60000), // Normalize to 1 minute
        recommended_difficulty: context.difficulty_level,
        learning_insights: {
          reasoning_strengths: response.quality >= 4 ? ['Good recall'] : [],
          improvement_areas: response.quality < 3 ? ['Review needed'] : [],
          study_recommendations: ['Continue regular practice'],
          optimal_study_time: 30
        },
        adaptive_factors: {
          difficulty_multiplier: 1.0,
          interval_adjustment: 1.0,
          confidence_factor: response.confidence_level,
          retention_prediction: response.quality / 5
        },
        processing_time_ms: 0
      };
    }
  }

  /**
   * Apply HRM-based adaptations to traditional SM-2 results
   */
  private static async applyHRMAdaptations(
    traditionalResult: ReviewResult,
    hrmAnalysis: ReasoningResponse,
    progress: HRMFlashcardProgress | null,
    context: any
  ): Promise<ReviewResult> {

    let adaptedResult = { ...traditionalResult };
    const { adaptive_factors, recommended_difficulty, cognitive_load } = hrmAnalysis;

    // 1. Adjust interval based on reasoning depth
    let intervalMultiplier = 1.0;

    if (hrmAnalysis.reasoning_depth > 0.8 && hrmAnalysis.pattern_recognition > 0.7) {
      // Strong reasoning - extend intervals
      intervalMultiplier = adaptive_factors.interval_adjustment * 1.3;
    } else if (hrmAnalysis.reasoning_depth < 0.5) {
      // Weak reasoning - shorten intervals
      intervalMultiplier = adaptive_factors.interval_adjustment * 0.7;
    } else {
      intervalMultiplier = adaptive_factors.interval_adjustment;
    }

    // 2. Adjust for cognitive load
    if (cognitive_load > 0.8) {
      intervalMultiplier *= 0.8; // Review sooner if high cognitive load
    } else if (cognitive_load < 0.3) {
      intervalMultiplier *= 1.2; // Extend if low cognitive load
    }

    // 3. Apply confidence factor
    intervalMultiplier *= adaptive_factors.confidence_factor;

    // 4. Consider user's learning trajectory
    if (progress?.learning_trajectory) {
      const improvementRate = this.calculateImprovementRate(progress);
      if (improvementRate > 0.2) {
        intervalMultiplier *= 1.15; // Reward improvement
      } else if (improvementRate < -0.2) {
        intervalMultiplier *= 0.85; // Support struggling learners
      }
    }

    // 5. Apply personalized interval multiplier if available
    if (progress?.personalized_interval_multiplier) {
      intervalMultiplier *= progress.personalized_interval_multiplier;
    }

    // Calculate final adapted interval
    const adaptedInterval = Math.round(
      Math.max(1, Math.min(365, traditionalResult.interval_days * intervalMultiplier))
    );

    // Update next review date
    const adaptedDate = new Date();
    adaptedDate.setDate(adaptedDate.getDate() + adaptedInterval);

    // Adjust ease factor based on HRM insights
    const adaptedEaseFactor = Math.max(1.3, 
      traditionalResult.ease_factor * adaptive_factors.difficulty_multiplier
    );

    adaptedResult.interval_days = adaptedInterval;
    adaptedResult.next_review_date = adaptedDate;
    adaptedResult.ease_factor = adaptedEaseFactor;

    // Update performance feedback with HRM insights
    adaptedResult.performance_feedback = this.generateHRMEnhancedFeedback(
      hrmAnalysis,
      adaptedResult.performance_feedback,
      adaptedInterval
    );

    // Enhanced study analytics
    adaptedResult.study_analytics = {
      ...adaptedResult.study_analytics,
      reasoning_quality: hrmAnalysis.reasoning_depth,
      pattern_recognition: hrmAnalysis.pattern_recognition,
      cognitive_efficiency: 1 - cognitive_load,
      adaptive_difficulty: recommended_difficulty
    };

    return adaptedResult;
  }

  /**
   * Update HRM-specific progress data
   */
  private static updateHRMProgress(
    progress: HRMFlashcardProgress,
    hrmAnalysis: ReasoningResponse,
    response: HRMReviewResponse
  ): HRMFlashcardProgress {

    const updatedProgress = { ...progress };

    // Update HRM-specific histories (keep last 20 entries)
    updatedProgress.reasoning_depth_history = [
      ...progress.reasoning_depth_history.slice(-19),
      hrmAnalysis.reasoning_depth
    ];

    updatedProgress.pattern_recognition_history = [
      ...progress.pattern_recognition_history.slice(-19),
      hrmAnalysis.pattern_recognition
    ];

    updatedProgress.cognitive_load_history = [
      ...progress.cognitive_load_history.slice(-19),
      hrmAnalysis.cognitive_load
    ];

    // Update adaptive difficulty level
    updatedProgress.adaptive_difficulty_level = hrmAnalysis.recommended_difficulty;

    // Update learning trajectory
    updatedProgress.learning_trajectory = hrmAnalysis.learning_insights;

    // Update HRM confidence score
    updatedProgress.hrm_confidence_score = hrmAnalysis.adaptive_factors.confidence_factor;

    // Calculate and update personalized interval multiplier
    updatedProgress.personalized_interval_multiplier = this.calculatePersonalizedMultiplier(
      updatedProgress,
      hrmAnalysis
    );

    return updatedProgress;
  }

  /**
   * Calculate improvement rate from progress history
   */
  private static calculateImprovementRate(progress: HRMFlashcardProgress): number {
    const recentDepth = progress.reasoning_depth_history.slice(-5);
    const olderDepth = progress.reasoning_depth_history.slice(-10, -5);

    if (recentDepth.length === 0 || olderDepth.length === 0) return 0;

    const recentAvg = recentDepth.reduce((sum, d) => sum + d, 0) / recentDepth.length;
    const olderAvg = olderDepth.reduce((sum, d) => sum + d, 0) / olderDepth.length;

    return (recentAvg - olderAvg) / olderAvg;
  }

  /**
   * Calculate personalized interval multiplier
   */
  private static calculatePersonalizedMultiplier(
    progress: HRMFlashcardProgress,
    hrmAnalysis: ReasoningResponse
  ): number {

    let multiplier = 1.0;

    // Factor 1: Reasoning consistency
    const reasoningConsistency = this.calculateConsistency(progress.reasoning_depth_history);
    if (reasoningConsistency > 0.8) {
      multiplier *= 1.1; // Consistent learners can handle longer intervals
    }

    // Factor 2: Pattern recognition improvement
    const patternImprovement = this.calculateImprovement(progress.pattern_recognition_history);
    if (patternImprovement > 0.1) {
      multiplier *= 1.05;
    }

    // Factor 3: Cognitive load management
    const avgCognitiveLoad = progress.cognitive_load_history.length > 0
      ? progress.cognitive_load_history.reduce((sum, load) => sum + load, 0) / progress.cognitive_load_history.length
      : 0.5;

    if (avgCognitiveLoad < 0.4) {
      multiplier *= 1.15; // Low cognitive load = can handle more
    } else if (avgCognitiveLoad > 0.8) {
      multiplier *= 0.9; // High cognitive load = need more support
    }

    // Ensure reasonable bounds
    return Math.max(0.5, Math.min(2.0, multiplier));
  }

  /**
   * Calculate consistency of a metric over time
   */
  private static calculateConsistency(history: number[]): number {
    if (history.length < 3) return 0.5;

    const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (stdDev / mean));
  }

  /**
   * Calculate improvement trend
   */
  private static calculateImprovement(history: number[]): number {
    if (history.length < 2) return 0;

    const recent = history.slice(-3);
    const older = history.slice(0, 3);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    return recentAvg - olderAvg;
  }

  /**
   * Generate HRM-enhanced performance feedback
   */
  private static generateHRMEnhancedFeedback(
    hrmAnalysis: ReasoningResponse,
    originalFeedback: any,
    intervalDays: number
  ) {

    const { reasoning_depth, pattern_recognition, learning_insights } = hrmAnalysis;

    let enhancedMessage = originalFeedback.message;
    let recommendation = originalFeedback.next_session_recommendation;

    // Add reasoning-specific feedback
    if (reasoning_depth > 0.8) {
      enhancedMessage += " Your analytical approach shows excellent depth of understanding.";
    } else if (reasoning_depth < 0.4) {
      enhancedMessage += " Consider breaking down complex problems into smaller steps.";
      recommendation = `Review in ${intervalDays} days. Focus on step-by-step problem solving.`;
    }

    // Add pattern recognition feedback
    if (pattern_recognition > 0.7) {
      enhancedMessage += " Great pattern recognition skills!";
    } else if (pattern_recognition < 0.5) {
      enhancedMessage += " Practice identifying recurring themes and patterns.";
    }

    // Add specific study recommendations
    if (learning_insights.study_recommendations.length > 0) {
      recommendation += ` Focus areas: ${learning_insights.study_recommendations.join(', ')}.`;
    }

    return {
      ...originalFeedback,
      message: enhancedMessage,
      next_session_recommendation: recommendation,
      hrm_insights: {
        reasoning_depth: reasoning_depth,
        pattern_recognition: pattern_recognition,
        key_strengths: learning_insights.reasoning_strengths,
        improvement_areas: learning_insights.improvement_areas
      }
    };
  }

  /**
   * Generate adaptive recommendations
   */
  private static generateAdaptiveRecommendations(
    hrmAnalysis: ReasoningResponse,
    progress: HRMFlashcardProgress,
    context: any
  ) {

    const recommendations = {
      next_difficulty_level: hrmAnalysis.recommended_difficulty,
      study_focus_areas: [...hrmAnalysis.learning_insights.improvement_areas],
      optimal_review_time: this.calculateOptimalReviewTime(hrmAnalysis, progress),
      complementary_topics: this.generateComplementaryTopics(hrmAnalysis, context)
    };

    return recommendations;
  }

  /**
   * Calculate optimal review time based on HRM analysis
   */
  private static calculateOptimalReviewTime(
    hrmAnalysis: ReasoningResponse,
    progress: HRMFlashcardProgress
  ): string {

    const baseTime = hrmAnalysis.learning_insights.optimal_study_time || 30;
    const cognitiveLoad = hrmAnalysis.cognitive_load;

    let optimalTime = baseTime;

    // Adjust based on cognitive load
    if (cognitiveLoad > 0.8) {
      optimalTime = Math.min(20, baseTime * 0.7); // Shorter sessions for high load
    } else if (cognitiveLoad < 0.3) {
      optimalTime = Math.max(45, baseTime * 1.3); // Longer sessions for low load
    }

    // Consider user's average response time
    const avgResponseMinutes = (progress.average_response_time || 30000) / 60000;
    if (avgResponseMinutes > 2) {
      optimalTime *= 0.8; // Reduce for slower learners
    }

    const hours = Math.floor(optimalTime / 60);
    const minutes = optimalTime % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} minutes`;
    }
  }

  /**
   * Generate complementary topics for study
   */
  private static generateComplementaryTopics(
    hrmAnalysis: ReasoningResponse,
    context: any
  ): string[] {

    const complementaryTopics: string[] = [];

    // Based on reasoning weaknesses
    if (hrmAnalysis.reasoning_depth < 0.5) {
      complementaryTopics.push(`${context.subject} - Problem Solving Techniques`);
      complementaryTopics.push(`${context.subject} - Step-by-step Analysis`);
    }

    if (hrmAnalysis.pattern_recognition < 0.5) {
      complementaryTopics.push(`${context.subject} - Pattern Recognition Exercises`);
      complementaryTopics.push(`${context.subject} - Classification Problems`);
    }

    // Based on high cognitive load
    if (hrmAnalysis.cognitive_load > 0.8) {
      complementaryTopics.push(`${context.subject} - Fundamentals Review`);
      complementaryTopics.push(`${context.subject} - Concept Clarification`);
    }

    return complementaryTopics.slice(0, 3); // Limit to 3 recommendations
  }

  /**
   * Generate learning insights
   */
  private static generateLearningInsights(
    hrmAnalysis: ReasoningResponse,
    progress: HRMFlashcardProgress
  ) {

    // Assess cognitive load
    let cognitiveLoadAssessment: 'low' | 'moderate' | 'high';
    if (hrmAnalysis.cognitive_load < 0.4) {
      cognitiveLoadAssessment = 'low';
    } else if (hrmAnalysis.cognitive_load > 0.7) {
      cognitiveLoadAssessment = 'high';
    } else {
      cognitiveLoadAssessment = 'moderate';
    }

    // Analyze reasoning pattern evolution
    const reasoningPatternEvolution = this.analyzeReasoningEvolution(progress);

    // Predict mastery level
    const masteryPrediction = this.predictMastery(hrmAnalysis, progress);

    // Calculate retention confidence
    const retentionConfidence = this.calculateRetentionConfidence(hrmAnalysis, progress);

    return {
      cognitive_load_assessment: cognitiveLoadAssessment,
      reasoning_pattern_evolution: reasoningPatternEvolution,
      mastery_prediction: masteryPrediction,
      retention_confidence: retentionConfidence
    };
  }

  /**
   * Analyze reasoning pattern evolution
   */
  private static analyzeReasoningEvolution(progress: HRMFlashcardProgress): string {

    if (progress.reasoning_depth_history.length < 3) {
      return "Insufficient data for pattern analysis";
    }

    const recent = progress.reasoning_depth_history.slice(-3);
    const older = progress.reasoning_depth_history.slice(0, 3);

    const recentAvg = recent.reduce((sum, d) => sum + d, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d, 0) / older.length;

    const improvement = recentAvg - olderAvg;

    if (improvement > 0.2) {
      return "Strong upward trend in reasoning ability";
    } else if (improvement > 0.1) {
      return "Gradual improvement in analytical skills";
    } else if (improvement < -0.1) {
      return "Declining pattern - may need additional support";
    } else {
      return "Stable reasoning performance";
    }
  }

  /**
   * Predict mastery level
   */
  private static predictMastery(
    hrmAnalysis: ReasoningResponse,
    progress: HRMFlashcardProgress
  ): number {

    const currentMastery = (hrmAnalysis.reasoning_depth + hrmAnalysis.pattern_recognition) / 2;
    const consistencyBonus = this.calculateConsistency(progress.reasoning_depth_history) * 0.2;
    const improvementBonus = this.calculateImprovement(progress.reasoning_depth_history) * 0.3;

    const predictedMastery = Math.min(1.0, currentMastery + consistencyBonus + improvementBonus);

    return Math.round(predictedMastery * 100) / 100;
  }

  /**
   * Calculate retention confidence
   */
  private static calculateRetentionConfidence(
    hrmAnalysis: ReasoningResponse,
    progress: HRMFlashcardProgress
  ): number {

    const baseConfidence = hrmAnalysis.adaptive_factors.retention_prediction;
    const consistencyBonus = this.calculateConsistency(progress.quality_responses) * 0.3;
    const reasoningBonus = hrmAnalysis.reasoning_depth * 0.2;

    const retentionConfidence = Math.min(1.0, baseConfidence + consistencyBonus + reasoningBonus);

    return Math.round(retentionConfidence * 100) / 100;
  }

  /**
   * Get HRM-enhanced due cards with priority ranking
   */
  static getHRMPrioritizedDueCards(
    progressList: HRMFlashcardProgress[]
  ): (HRMFlashcardProgress & { priority_score: number; priority_reason: string })[] {

    const dueCards = this.getDueCards(progressList) as HRMFlashcardProgress[];

    return dueCards.map(progress => {
      const priorityScore = this.calculatePriorityScore(progress);
      const priorityReason = this.getPriorityReason(progress);

      return {
        ...progress,
        priority_score: priorityScore,
        priority_reason: priorityReason
      };
    }).sort((a, b) => b.priority_score - a.priority_score);
  }

  /**
   * Calculate priority score for card review
   */
  private static calculatePriorityScore(progress: HRMFlashcardProgress): number {

    let score = 0;

    // Factor 1: Overdue urgency
    const daysOverdue = Math.max(0, 
      (Date.now() - progress.next_review_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    score += Math.min(50, daysOverdue * 10);

    // Factor 2: Difficulty and struggling areas
    if (progress.success_rate < 0.5) {
      score += 30;
    }

    // Factor 3: Recent reasoning performance
    const recentReasoning = progress.reasoning_depth_history.slice(-3);
    if (recentReasoning.length > 0) {
      const avgReasoning = recentReasoning.reduce((sum, r) => sum + r, 0) / recentReasoning.length;
      if (avgReasoning < 0.5) {
        score += 25;
      }
    }

    // Factor 4: Cognitive load concerns
    const recentCognitiveLoad = progress.cognitive_load_history.slice(-3);
    if (recentCognitiveLoad.length > 0) {
      const avgLoad = recentCognitiveLoad.reduce((sum, l) => sum + l, 0) / recentCognitiveLoad.length;
      if (avgLoad > 0.8) {
        score += 20;
      }
    }

    // Factor 5: Inconsistent performance
    const consistencyScore = this.calculateConsistency(progress.quality_responses);
    if (consistencyScore < 0.5) {
      score += 15;
    }

    return Math.round(score);
  }

  /**
   * Get priority reason for display
   */
  private static getPriorityReason(progress: HRMFlashcardProgress): string {

    const daysOverdue = Math.max(0, 
      (Date.now() - progress.next_review_date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue > 2) {
      return `${Math.ceil(daysOverdue)} days overdue`;
    }

    if (progress.success_rate < 0.5) {
      return "Low success rate - needs attention";
    }

    const recentReasoning = progress.reasoning_depth_history.slice(-3);
    if (recentReasoning.length > 0) {
      const avgReasoning = recentReasoning.reduce((sum, r) => sum + r, 0) / recentReasoning.length;
      if (avgReasoning < 0.5) {
        return "Weak reasoning performance";
      }
    }

    return "Regular review due";
  }
}

// Export utilities for HRM-enhanced system
export const HRMSpacedRepetitionUtils = {

  /**
   * Format HRM insights for display
   */
  formatHRMInsights: (progress: HRMFlashcardProgress) => {

    const latestReasoning = progress.reasoning_depth_history.slice(-1)[0] || 0;
    const latestPattern = progress.pattern_recognition_history.slice(-1)[0] || 0;
    const latestCognitiveLoad = progress.cognitive_load_history.slice(-1)[0] || 0;

    return {
      reasoning_level: latestReasoning > 0.8 ? 'Excellent' : 
                     latestReasoning > 0.6 ? 'Good' : 
                     latestReasoning > 0.4 ? 'Fair' : 'Needs Work',
      pattern_recognition: latestPattern > 0.8 ? 'Strong' : 
                          latestPattern > 0.6 ? 'Moderate' : 'Weak',
      cognitive_load: latestCognitiveLoad > 0.8 ? 'High' : 
                     latestCognitiveLoad > 0.4 ? 'Moderate' : 'Low',
      learning_trend: progress.difficulty_trend,
      confidence: progress.hrm_confidence_score > 0.8 ? 'High' : 
                 progress.hrm_confidence_score > 0.5 ? 'Moderate' : 'Low'
    };
  },

  /**
   * Get study session recommendations
   */
  getStudySessionRecommendations: (progressList: HRMFlashcardProgress[]) => {

    const dueCards = progressList.filter(p => new Date(p.next_review_date) <= new Date());
    const strugglingCards = dueCards.filter(p => p.success_rate < 0.6);
    const highCognitiveLoadCards = dueCards.filter(p => {
      const recentLoad = p.cognitive_load_history.slice(-3);
      return recentLoad.length > 0 && 
             recentLoad.reduce((sum, l) => sum + l, 0) / recentLoad.length > 0.7;
    });

    return {
      total_due: dueCards.length,
      high_priority: strugglingCards.length,
      cognitive_rest_needed: highCognitiveLoadCards.length,
      recommended_session_size: Math.min(20, Math.max(5, dueCards.length)),
      estimated_time: `${Math.ceil(dueCards.length * 1.5)} minutes`,
      session_advice: strugglingCards.length > 5 
        ? "Focus on struggling concepts today" 
        : highCognitiveLoadCards.length > 5 
        ? "Take breaks between difficult cards"
        : "Regular review session"
    };
  }
};
