import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * HRM Client for communicating with Hierarchical Reasoning Model service
 * Handles all interactions with the Python FastAPI HRM service
 */

export interface ReasoningRequest {
  user_id: string;
  problem_type: 'flashcard' | 'quiz' | 'assessment' | 'adaptive_path';
  input_data: {
    flashcard_id?: string;
    question_complexity?: number;
    response_time?: number;
    quality_score?: number;
    confidence_level?: number;
    reasoning_steps?: string[];
    conceptual_understanding?: number;
    problem_solving_approach?: 'analytical' | 'intuitive' | 'mixed';
    hints_used?: number;
    partial_correct?: boolean;
    metacognitive_awareness?: number;
    question_text?: string;
    answer_text?: string;
    user_response?: string;
    [key: string]: any;
  };
  context: {
    subject?: string;
    topic?: string;
    difficulty_level?: number;
    user_history?: {
      previous_performance?: number[];
      reasoning_depth_history?: number[];
      pattern_recognition_history?: number[];
      success_rate?: number;
      average_response_time?: number;
      difficulty_trend?: 'improving' | 'stable' | 'declining';
    };
    session_context?: {
      session_id?: string;
      cards_reviewed?: number;
      session_start_time?: string;
      fatigue_level?: number;
    };
    [key: string]: any;
  };
  session_id?: string;
}

export interface ReasoningResponse {
  reasoning_depth: number;
  pattern_recognition: number;
  cognitive_load: number;
  recommended_difficulty: number;
  learning_insights: {
    reasoning_strengths: string[];
    improvement_areas: string[];
    study_recommendations: string[];
    optimal_study_time: number;
  };
  adaptive_factors: {
    difficulty_multiplier: number;
    interval_adjustment: number;
    confidence_factor: number;
    retention_prediction: number;
  };
  processing_time_ms: number;
}

export interface AdaptiveScheduleRequest {
  user_id: string;
  flashcard_history: Array<{
    flashcard_id: string;
    quality_responses: number[];
    reasoning_depth_history: number[];
    pattern_recognition_history: number[];
    cognitive_load_history: number[];
    last_reviewed: string;
    success_rate: number;
  }>;
  current_performance: {
    session_quality: number;
    reasoning_trend: string;
    cognitive_state: string;
  };
  learning_goals: {
    target_mastery_level: number;
    time_constraints: number; // minutes per day
    priority_subjects: string[];
  };
}

export interface AdaptiveScheduleResponse {
  next_review_intervals: Array<{
    flashcard_id: string;
    recommended_interval_days: number;
    priority_score: number;
    reasoning_based_adjustment: number;
  }>;
  difficulty_adjustments: Array<{
    flashcard_id: string;
    current_difficulty: number;
    recommended_difficulty: number;
    adjustment_reason: string;
  }>;
  learning_trajectory: {
    predicted_mastery_timeline: string;
    focus_areas: string[];
    estimated_study_time: number;
    success_probability: number;
  };
}

export interface QuizGenerationRequest {
  user_id: string;
  topic: string;
  difficulty_level: number;
  question_count: number;
  question_types: ('mcq' | 'written' | 'analytical' | 'application')[];
  content_source: {
    text_content?: string;
    reference_materials?: string[];
    learning_objectives?: string[];
  };
  user_profile: {
    reasoning_level: number;
    strengths: string[];
    weaknesses: string[];
    preferred_question_style: string;
  };
}

export interface QuizGenerationResponse {
  questions: Array<{
    id: string;
    type: 'mcq' | 'written' | 'analytical' | 'application';
    question_text: string;
    options?: string[];
    correct_answer: string;
    explanation: string;
    difficulty_level: number;
    cognitive_load: number;
    reasoning_steps_required: string[];
    time_estimate: number;
    learning_objective: string;
  }>;
  quiz_metadata: {
    total_estimated_time: number;
    difficulty_distribution: { [key: string]: number };
    cognitive_load_profile: string;
    adaptive_recommendations: string[];
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  gpu_available: boolean;
  redis_connected: boolean;
  model_loaded: boolean;
  version: string;
  uptime_seconds: number;
  queue_size: number;
  avg_response_time_ms: number;
}

export class HRMClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private circuitBreakerOpen: boolean;
  private lastHealthCheck: Date | null;
  private healthCheckInterval: number;

  constructor() {
    this.baseUrl = process.env.HRM_SERVICE_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.HRM_TIMEOUT || '30000'); // 30 seconds
    this.retryAttempts = parseInt(process.env.HRM_RETRY_ATTEMPTS || '3');
    this.circuitBreakerOpen = false;
    this.lastHealthCheck = null;
    this.healthCheckInterval = 300000; // 5 minutes

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Kanchen-Academy-Frontend/1.0',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[HRM Client] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[HRM Client] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[HRM Client] Response: ${response.status} (${response.data?.processing_time_ms || 0}ms)`);
        return response;
      },
      (error) => {
        console.error('[HRM Client] Response error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Analyze reasoning pattern using HRM
   */
  async analyzeReasoning(request: ReasoningRequest): Promise<ReasoningResponse> {
    await this.ensureServiceHealth();

    if (this.circuitBreakerOpen) {
      throw new Error('HRM service circuit breaker is open - service unavailable');
    }

    try {
      const response: AxiosResponse<ReasoningResponse> = await this.retryRequest(
        () => this.client.post<ReasoningResponse>('/analyze-reasoning', request)
      );

      // Validate response structure
      this.validateReasoningResponse(response.data);
      
      return response.data;
    } catch (error) {
      console.error('HRM reasoning analysis failed:', error);
      this.handleServiceError(error);
      throw new Error(`Failed to analyze reasoning pattern: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Generate optimized review schedule
   */
  async optimizeSchedule(request: AdaptiveScheduleRequest): Promise<AdaptiveScheduleResponse> {
    await this.ensureServiceHealth();

    if (this.circuitBreakerOpen) {
      throw new Error('HRM service circuit breaker is open - service unavailable');
    }

    try {
      const response: AxiosResponse<AdaptiveScheduleResponse> = await this.retryRequest(
        () => this.client.post<AdaptiveScheduleResponse>('/optimize-schedule', request)
      );

      return response.data;
    } catch (error) {
      console.error('HRM schedule optimization failed:', error);
      this.handleServiceError(error);
      throw new Error(`Failed to optimize schedule: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Generate adaptive quiz questions
   */
  async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    await this.ensureServiceHealth();

    if (this.circuitBreakerOpen) {
      throw new Error('HRM service circuit breaker is open - service unavailable');
    }

    try {
      const response: AxiosResponse<QuizGenerationResponse> = await this.retryRequest(
        () => this.client.post<QuizGenerationResponse>('/generate-quiz', request)
      );

      return response.data;
    } catch (error) {
      console.error('HRM quiz generation failed:', error);
      this.handleServiceError(error);
      throw new Error(`Failed to generate quiz: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Batch analyze multiple reasoning patterns
   */
  async batchAnalyzeReasoning(requests: ReasoningRequest[]): Promise<ReasoningResponse[]> {
    await this.ensureServiceHealth();

    if (this.circuitBreakerOpen) {
      throw new Error('HRM service circuit breaker is open - service unavailable');
    }

    try {
      const response: AxiosResponse<{ results: ReasoningResponse[] }> = await this.retryRequest(
        () => this.client.post<{ results: ReasoningResponse[] }>('/batch-analyze-reasoning', {
          requests: requests
        })
      );

      return response.data.results;
    } catch (error) {
      console.error('HRM batch analysis failed:', error);
      this.handleServiceError(error);
      throw new Error(`Failed to batch analyze reasoning: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Health check for HRM service
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response: AxiosResponse<HealthCheckResponse> = await this.client.get('/health', {
        timeout: 5000 // Shorter timeout for health checks
      });
      
      this.lastHealthCheck = new Date();
      this.circuitBreakerOpen = response.data.status === 'unhealthy';
      
      return response.data;
    } catch (error) {
      console.error('HRM health check failed:', error);
      this.circuitBreakerOpen = true;
      throw new Error(`Health check failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStats(): Promise<{
    model_info: any;
    performance_metrics: any;
    queue_status: any;
  }> {
    try {
      const response = await this.client.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get HRM service stats:', error);
      throw new Error(`Failed to get service stats: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Warm up the HRM model (useful after deployment)
   */
  async warmupModel(): Promise<{ success: boolean; warmup_time_ms: number }> {
    try {
      const response = await this.client.post('/warmup', {}, {
        timeout: 60000 // 1 minute timeout for warmup
      });
      return response.data;
    } catch (error) {
      console.error('HRM model warmup failed:', error);
      throw new Error(`Model warmup failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Ensure service is healthy before making requests
   */
  private async ensureServiceHealth(): Promise<void> {
    const now = new Date();
    const timeSinceLastCheck = this.lastHealthCheck 
      ? now.getTime() - this.lastHealthCheck.getTime()
      : Infinity;

    // Check health if it's been more than 5 minutes or if circuit breaker is open
    if (timeSinceLastCheck > this.healthCheckInterval || this.circuitBreakerOpen) {
      try {
        await this.healthCheck();
      } catch (error) {
        console.warn('Health check failed, proceeding with degraded service');
      }
    }
  }

  /**
   * Retry mechanism for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }

        if (attempt < this.retryAttempts) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`[HRM Client] Retry attempt ${attempt} after ${backoffDelay}ms`);
          await this.delay(backoffDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle service errors and circuit breaker logic
   */
  private handleServiceError(error: any): void {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.circuitBreakerOpen = true;
        console.error('[HRM Client] Opening circuit breaker due to connection issues');
      } else if (error.response?.status && error.response.status >= 500) {
        console.error('[HRM Client] Server error detected:', error.response.status);
      }
    }
  }

  /**
   * Validate reasoning response structure
   */
  private validateReasoningResponse(response: ReasoningResponse): void {
    const requiredFields = [
      'reasoning_depth',
      'pattern_recognition',
      'cognitive_load',
      'recommended_difficulty',
      'learning_insights',
      'adaptive_factors'
    ];

    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new Error(`Invalid HRM response: missing field '${field}'`);
      }
    }

    // Validate numeric ranges
    if (response.reasoning_depth < 0 || response.reasoning_depth > 1) {
      throw new Error('Invalid reasoning_depth value: must be between 0 and 1');
    }
    if (response.pattern_recognition < 0 || response.pattern_recognition > 1) {
      throw new Error('Invalid pattern_recognition value: must be between 0 and 1');
    }
    if (response.cognitive_load < 0 || response.cognitive_load > 1) {
      throw new Error('Invalid cognitive_load value: must be between 0 and 1');
    }
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.detail) {
        return error.response.data.detail;
      }
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      if (error.message) {
        return error.message;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close circuit breaker manually (for testing or manual recovery)
   */
  closeCircuitBreaker(): void {
    this.circuitBreakerOpen = false;
    console.log('[HRM Client] Circuit breaker manually closed');
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(): boolean {
    return !this.circuitBreakerOpen;
  }

  /**
   * Get current service status
   */
  getServiceStatus(): {
    available: boolean;
    last_health_check: Date | null;
    circuit_breaker_open: boolean;
  } {
    return {
      available: !this.circuitBreakerOpen,
      last_health_check: this.lastHealthCheck,
      circuit_breaker_open: this.circuitBreakerOpen
    };
  }
}

// Create singleton instance
export const hrmClient = new HRMClient();

// Export fallback utilities for when HRM service is unavailable
export const HRMFallbacks = {
  
  /**
   * Generate fallback reasoning response when HRM is unavailable
   */
  generateFallbackReasoning: (
    quality: number,
    responseTime: number,
    confidence: number
  ): ReasoningResponse => {
    return {
      reasoning_depth: Math.max(0, Math.min(1, quality / 5)),
      pattern_recognition: Math.max(0, Math.min(1, confidence)),
      cognitive_load: Math.max(0, Math.min(1, responseTime / 60000)), // Normalize to 1 minute
      recommended_difficulty: Math.max(0.1, Math.min(1, quality / 5)),
      learning_insights: {
        reasoning_strengths: quality >= 4 ? ['Good recall ability'] : [],
        improvement_areas: quality < 3 ? ['Needs more practice'] : [],
        study_recommendations: quality < 3 ? ['Review fundamentals'] : ['Continue regular practice'],
        optimal_study_time: 30
      },
      adaptive_factors: {
        difficulty_multiplier: 1.0,
        interval_adjustment: quality >= 3 ? 1.0 : 0.8,
        confidence_factor: confidence,
        retention_prediction: Math.max(0, Math.min(1, quality / 5))
      },
      processing_time_ms: 0
    };
  },

  /**
   * Check if fallback should be used
   */
  shouldUseFallback: (): boolean => {
    return !hrmClient.isServiceAvailable();
  }
};

// Export configuration for easy setup
export const HRMClientConfig = {
  
  /**
   * Configure HRM client for different environments
   */
  configure: (config: {
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
  }) => {
    if (config.baseUrl) {
      process.env.HRM_SERVICE_URL = config.baseUrl;
    }
    if (config.timeout) {
      process.env.HRM_TIMEOUT = config.timeout.toString();
    }
    if (config.retryAttempts) {
      process.env.HRM_RETRY_ATTEMPTS = config.retryAttempts.toString();
    }
  },

  /**
   * Get recommended configuration for different environments
   */
  getEnvironmentConfig: (env: 'development' | 'staging' | 'production') => {
    switch (env) {
      case 'development':
        return {
          baseUrl: 'http://localhost:8000',
          timeout: 30000,
          retryAttempts: 2
        };
      case 'staging':
        return {
          baseUrl: process.env.HRM_SERVICE_URL || 'https://hrm-staging.kanchen-academy.com',
          timeout: 45000,
          retryAttempts: 3
        };
      case 'production':
        return {
          baseUrl: process.env.HRM_SERVICE_URL || 'https://hrm.kanchen-academy.com',
          timeout: 60000,
          retryAttempts: 3
        };
      default:
        return {
          baseUrl: 'http://localhost:8000',
          timeout: 30000,
          retryAttempts: 3
        };
    }
  }
};
