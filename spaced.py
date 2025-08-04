# Generate core spaced repetition algorithm
spaced_repetition_code = """// lib/algorithms/spaced-repetition.ts

/**
 * Hermann Ebbinghaus Spaced Repetition Implementation (SM-2 Algorithm)
 * Based on the original SuperMemo-2 algorithm with enhancements for educational use
 */

export interface FlashcardProgress {
  flashcard_id: string;
  user_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: Date;
  last_reviewed_at: Date | null;
  quality_responses: number[];
  total_reviews: number;
  success_rate: number;
  average_response_time: number;
  difficulty_trend: 'improving' | 'stable' | 'declining';
}

export interface ReviewResponse {
  quality: number; // 0-5 quality scale
  response_time: number; // in milliseconds
  confidence_level: number; // 0-1 scale
  hints_used: number;
  partial_correct: boolean;
}

export interface ReviewResult {
  updated_progress: FlashcardProgress;
  next_review_date: Date;
  interval_days: number;
  ease_factor: number;
  performance_feedback: {
    level: 'excellent' | 'good' | 'fair' | 'poor';
    message: string;
    next_session_recommendation: string;
  };
  study_analytics: {
    retention_rate: number;
    mastery_level: number;
    estimated_memory_strength: number;
  };
}

export class SpacedRepetitionEngine {
  
  /**
   * Calculate next review schedule using enhanced SM-2 algorithm
   */
  static calculateNextReview(
    currentProgress: FlashcardProgress | null,
    reviewResponse: ReviewResponse
  ): ReviewResult {
    
    // Initialize default progress if first review
    const progress = currentProgress || this.initializeProgress();
    
    // Calculate quality-adjusted score
    const adjustedQuality = this.calculateAdjustedQuality(reviewResponse, progress);
    
    // Update progress data
    const updatedProgress = this.updateProgressData(progress, reviewResponse, adjustedQuality);
    
    // Calculate next interval using SM-2 algorithm
    const { interval_days, ease_factor } = this.calculateSM2Interval(
      updatedProgress,
      adjustedQuality
    );
    
    // Set next review date
    const next_review_date = new Date();
    next_review_date.setDate(next_review_date.getDate() + interval_days);
    
    // Update progress with new values
    updatedProgress.interval_days = interval_days;
    updatedProgress.ease_factor = ease_factor;
    updatedProgress.next_review_date = next_review_date;
    updatedProgress.last_reviewed_at = new Date();
    
    // Generate performance feedback
    const performance_feedback = this.generatePerformanceFeedback(adjustedQuality, updatedProgress);
    
    // Calculate study analytics
    const study_analytics = this.calculateStudyAnalytics(updatedProgress);
    
    return {
      updated_progress: updatedProgress,
      next_review_date,
      interval_days,
      ease_factor,
      performance_feedback,
      study_analytics
    };
  }
  
  /**
   * Initialize default progress for new flashcard
   */
  private static initializeProgress(): FlashcardProgress {
    return {
      flashcard_id: '',
      user_id: '',
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      next_review_date: new Date(),
      last_reviewed_at: null,
      quality_responses: [],
      total_reviews: 0,
      success_rate: 0,
      average_response_time: 0,
      difficulty_trend: 'stable'
    };
  }
  
  /**
   * Calculate quality-adjusted score based on response time and confidence
   */
  private static calculateAdjustedQuality(
    response: ReviewResponse,
    progress: FlashcardProgress
  ): number {
    let adjustedQuality = response.quality;
    
    // Adjust for response time (faster = higher quality)
    const avgResponseTime = progress.average_response_time || 30000; // 30 seconds default
    const timeRatio = response.response_time / avgResponseTime;
    
    if (timeRatio < 0.5) {
      adjustedQuality += 0.3; // Quick response bonus
    } else if (timeRatio > 2.0) {
      adjustedQuality -= 0.2; // Slow response penalty
    }
    
    // Adjust for confidence level
    const confidenceAdjustment = (response.confidence_level - 0.5) * 0.4;
    adjustedQuality += confidenceAdjustment;
    
    // Adjust for hints used
    if (response.hints_used > 0) {
      adjustedQuality -= response.hints_used * 0.3;
    }
    
    // Partial credit adjustment
    if (response.partial_correct && response.quality < 3) {
      adjustedQuality += 0.5;
    }
    
    // Ensure quality stays within bounds
    return Math.max(0, Math.min(5, adjustedQuality));
  }
  
  /**
   * Update progress data with new review
   */
  private static updateProgressData(
    progress: FlashcardProgress,
    response: ReviewResponse,
    adjustedQuality: number
  ): FlashcardProgress {
    
    const updatedProgress = { ...progress };
    
    // Update quality responses history
    updatedProgress.quality_responses = [
      ...progress.quality_responses.slice(-19), // Keep last 20 responses
      adjustedQuality
    ];
    
    // Update total reviews
    updatedProgress.total_reviews += 1;
    
    // Update success rate
    const successfulReviews = updatedProgress.quality_responses.filter(q => q >= 3).length;
    updatedProgress.success_rate = successfulReviews / updatedProgress.quality_responses.length;
    
    // Update average response time
    const totalTime = progress.average_response_time * (progress.total_reviews - 1) + response.response_time;
    updatedProgress.average_response_time = totalTime / updatedProgress.total_reviews;
    
    // Update difficulty trend
    updatedProgress.difficulty_trend = this.calculateDifficultyTrend(updatedProgress.quality_responses);
    
    return updatedProgress;
  }
  
  /**
   * Calculate SM-2 interval and ease factor
   */
  private static calculateSM2Interval(
    progress: FlashcardProgress,
    quality: number
  ): { interval_days: number; ease_factor: number } {
    
    let { ease_factor, interval_days, repetitions } = progress;
    
    // SM-2 Algorithm core logic
    if (quality < 3) {
      // Failed recall - reset learning process
      repetitions = 0;
      interval_days = 1;
    } else {
      // Successful recall
      repetitions += 1;
      
      if (repetitions === 1) {
        interval_days = 6;
      } else if (repetitions === 2) {
        interval_days = 6;
      } else {
        // Use ease factor for subsequent intervals
        interval_days = Math.round(interval_days * ease_factor);
      }
    }
    
    // Update ease factor based on quality
    const easeFactor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    ease_factor = Math.max(1.3, easeFactor); // Minimum ease factor of 1.3
    
    // Apply difficulty trend adjustment
    if (progress.difficulty_trend === 'improving') {
      interval_days = Math.round(interval_days * 1.2);
    } else if (progress.difficulty_trend === 'declining') {
      interval_days = Math.round(interval_days * 0.8);
    }
    
    // Ensure reasonable bounds
    interval_days = Math.max(1, Math.min(365, interval_days));
    
    return { interval_days, ease_factor };
  }
  
  /**
   * Calculate difficulty trend from recent responses
   */
  private static calculateDifficultyTrend(qualityResponses: number[]): 'improving' | 'stable' | 'declining' {
    if (qualityResponses.length < 3) return 'stable';
    
    const recent = qualityResponses.slice(-5); // Last 5 responses
    const older = qualityResponses.slice(-10, -5); // Previous 5 responses
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, q) => sum + q, 0) / recent.length;
    const olderAvg = older.reduce((sum, q) => sum + q, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.3) return 'improving';
    if (difference < -0.3) return 'declining';
    return 'stable';
  }
  
  /**
   * Generate performance feedback for user
   */
  private static generatePerformanceFeedback(
    quality: number,
    progress: FlashcardProgress
  ) {
    let level: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;
    let next_session_recommendation: string;
    
    if (quality >= 4.5) {
      level = 'excellent';
      message = 'Outstanding! You have mastered this concept.';
      next_session_recommendation = `Next review in ${progress.interval_days} days. Keep up the excellent work!`;
    } else if (quality >= 3.5) {
      level = 'good';
      message = 'Good recall! You\'re building strong memory traces.';
      next_session_recommendation = `Review again in ${progress.interval_days} days to reinforce learning.`;
    } else if (quality >= 2.5) {
      level = 'fair';
      message = 'Partial recall. Consider reviewing the concept again.';
      next_session_recommendation = `Shortened interval to ${progress.interval_days} days for better retention.`;
    } else {
      level = 'poor';
      message = 'Difficulty recalling. Additional study recommended.';
      next_session_recommendation = `Review tomorrow and consider studying related concepts.`;
    }
    
    return { level, message, next_session_recommendation };
  }
  
  /**
   * Calculate study analytics
   */
  private static calculateStudyAnalytics(progress: FlashcardProgress) {
    const retention_rate = progress.success_rate;
    
    // Calculate mastery level based on recent performance and repetitions
    const recentQuality = progress.quality_responses.slice(-5);
    const avgRecentQuality = recentQuality.length > 0 
      ? recentQuality.reduce((sum, q) => sum + q, 0) / recentQuality.length 
      : 0;
    
    const mastery_level = Math.min(1.0, (avgRecentQuality / 5) * (progress.repetitions / 10));
    
    // Estimate memory strength using Ebbinghaus forgetting curve
    const daysSinceLastReview = progress.last_reviewed_at 
      ? (Date.now() - progress.last_reviewed_at.getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    
    // Memory strength decreases exponentially
    const estimated_memory_strength = Math.max(0.1, 
      retention_rate * Math.exp(-daysSinceLastReview / (progress.interval_days * 0.5))
    );
    
    return {
      retention_rate: Math.round(retention_rate * 100) / 100,
      mastery_level: Math.round(mastery_level * 100) / 100,
      estimated_memory_strength: Math.round(estimated_memory_strength * 100) / 100
    };
  }
  
  /**
   * Get cards due for review
   */
  static getDueCards(progressList: FlashcardProgress[]): FlashcardProgress[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    return progressList
      .filter(progress => new Date(progress.next_review_date) <= now)
      .sort((a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime());
  }
  
  /**
   * Get upcoming reviews for scheduling
   */
  static getUpcomingReviews(
    progressList: FlashcardProgress[], 
    days: number = 7
  ): { date: string; count: number }[] {
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const upcoming = progressList.filter(progress => {
      const reviewDate = new Date(progress.next_review_date);
      return reviewDate <= endDate && reviewDate >= new Date();
    });
    
    // Group by date
    const groupedByDate: { [key: string]: number } = {};
    
    upcoming.forEach(progress => {
      const dateKey = progress.next_review_date.toISOString().split('T')[0];
      groupedByDate[dateKey] = (groupedByDate[dateKey] || 0) + 1;
    });
    
    return Object.entries(groupedByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  /**
   * Calculate optimal study session length
   */
  static calculateOptimalSessionLength(
    userProgress: FlashcardProgress[],
    avgResponseTime: number = 30000 // 30 seconds default
  ): {
    recommended_cards: number;
    estimated_duration_minutes: number;
    break_recommendation: string;
  } {
    
    const dueCards = this.getDueCards(userProgress);
    const avgTimePerCard = avgResponseTime / 1000; // Convert to seconds
    
    // Optimal session: 15-25 cards or 20-30 minutes
    const maxCards = Math.min(25, dueCards.length);
    const recommendedCards = Math.max(5, Math.min(maxCards, 20));
    
    const estimatedDurationMinutes = Math.ceil((recommendedCards * avgTimePerCard) / 60);
    
    let breakRecommendation = '';
    if (estimatedDurationMinutes > 30) {
      breakRecommendation = 'Take a 5-minute break after every 15 cards to maintain focus.';
    } else if (estimatedDurationMinutes > 45) {
      breakRecommendation = 'Consider splitting this session into two shorter sessions.';
    } else {
      breakRecommendation = 'Complete all cards in one focused session for best results.';
    }
    
    return {
      recommended_cards: recommendedCards,
      estimated_duration_minutes: estimatedDurationMinutes,
      break_recommendation: breakRecommendation
    };
  }
}

// Export utility functions
export const SpacedRepetitionUtils = {
  
  /**
   * Format next review date for display
   */
  formatNextReview: (date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday (Overdue)';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  },
  
  /**
   * Get difficulty color for UI
   */
  getDifficultyColor: (successRate: number): string => {
    if (successRate >= 0.8) return 'text-green-600';
    if (successRate >= 0.6) return 'text-yellow-600';
    if (successRate >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  },
  
  /**
   * Calculate streak information
   */
  calculateStreak: (qualityResponse: number[]): {
    current_streak: number;
    longest_streak: number;
    streak_type: 'success' | 'failure';
  } => {
    
    if (qualityResponse.length === 0) {
      return { current_streak: 0, longest_streak: 0, streak_type: 'success' };
    }
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const lastResponse = qualityResponse[qualityResponse.length - 1];
    const streakType: 'success' | 'failure' = lastResponse >= 3 ? 'success' : 'failure';
    
    // Calculate current streak
    for (let i = qualityResponse.length - 1; i >= 0; i--) {
      const isSuccess = qualityResponse[i] >= 3;
      if ((streakType === 'success' && isSuccess) || (streakType === 'failure' && !isSuccess)) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest success streak
    for (let i = 0; i < qualityResponse.length; i++) {
      if (qualityResponse[i] >= 3) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      streak_type: streakType
    };
  }
};
"""

# Save the spaced repetition algorithm
with open("spaced_repetition_algorithm.ts", "w") as f:
    f.write(spaced_repetition_code)

print("✅ Spaced Repetition Algorithm created")
print("📁 File: spaced_repetition_algorithm.ts")
print("🧠 Features: Enhanced SM-2, performance analytics, streak tracking")