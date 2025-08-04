// components/features/FlashcardDeck.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  RotateCcw,
  Zap,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  HRMSpacedRepetitionEngine, 
  HRMFlashcardProgress, 
  HRMReviewResponse 
} from '@/lib/algorithms/hrm-spaced-repetition';
import { SpacedRepetitionUtils } from '@/lib/algorithms/spaced-repetition';
import { toast } from 'react-hot-toast';

// Types and Interfaces
interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
  difficulty: number;
  reasoning_type: 'logical' | 'analytical' | 'memory' | 'application';
  cognitive_load: number;
  tags: string[];
  hints: string[];
  explanation?: string;
  related_concepts?: string[];
}

interface FlashcardDeckProps {
  deckId: string;
  deckTitle: string;
  cards: Flashcard[];
  userProgress: HRMFlashcardProgress[];
  userId: string;
  subject: string;
  onProgressUpdate: (cardId: string, progress: HRMFlashcardProgress) => Promise<void>;
  onSessionComplete: (sessionSummary: SessionSummary) => void;
  settings?: {
    showHints: boolean;
    enableTimer: boolean;
    autoAdvance: boolean;
    studyMode: 'review' | 'learn' | 'cram';
  };
}

interface SessionSummary {
  total_cards: number;
  cards_completed: number;
  average_quality: number;
  session_duration: number;
  reasoning_improvement: number;
  areas_to_focus: string[];
  next_session_recommendation: string;
}

interface StudySession {
  session_id: string;
  start_time: Date;
  cards_reviewed: Flashcard[];
  responses: HRMReviewResponse[];
  current_fatigue_level: number;
}

// Main Component
export default function FlashcardDeck({
  deckId,
  deckTitle,
  cards,
  userProgress,
  userId,
  subject,
  onProgressUpdate,
  onSessionComplete,
  settings = {
    showHints: true,
    enableTimer: true,
    autoAdvance: false,
    studyMode: 'review'
  }
}: FlashcardDeckProps) {

  // State Management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [sessionStartTime] = useState<Date>(new Date());
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.5);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [sessionData, setSessionData] = useState<StudySession>({
    session_id: `${userId}-${deckId}-${Date.now()}`,
    start_time: new Date(),
    cards_reviewed: [],
    responses: [],
    current_fatigue_level: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  // Refs
  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived State
  const currentCard = cards[currentIndex];
  const currentProgress = userProgress.find(p => p.flashcard_id === currentCard?.id);
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const timeSpent = Date.now() - cardStartTime.getTime();
  const sessionDuration = Date.now() - sessionStartTime.getTime();

  // Effects
  useEffect(() => {
    if (currentCard) {
      setCardStartTime(new Date());
      setIsFlipped(false);
      setShowHints(false);
      setHintsUsed(0);
      setReasoningSteps([]);
      setCurrentResponse('');
      setConfidenceLevel(0.5);

      // Update fatigue level based on session duration
      const fatigueLevel = Math.min(1, sessionDuration / (45 * 60 * 1000)); // 45 minutes max
      setSessionData(prev => ({ ...prev, current_fatigue_level: fatigueLevel }));
    }
  }, [currentIndex, currentCard, sessionDuration]);

  // Auto-advance functionality
  useEffect(() => {
    if (settings.autoAdvance && isFlipped && settings.studyMode === 'cram') {
      timerRef.current = setTimeout(() => {
        handleQualityResponse(3); // Default to "Good" for auto-advance
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isFlipped, settings.autoAdvance, settings.studyMode]);

  // Handlers
  const handleCardFlip = useCallback(() => {
    if (!isFlipped) {
      // Track time to flip as part of reasoning analysis
      const timeToFlip = Date.now() - cardStartTime.getTime();
      if (timeToFlip < 2000) {
        // Quick flip might indicate guessing
        setConfidenceLevel(prev => Math.max(0.2, prev - 0.2));
      }
    }
    setIsFlipped(!isFlipped);
  }, [isFlipped, cardStartTime]);

  const handleHintRequest = useCallback(() => {
    if (currentCard.hints && hintsUsed < currentCard.hints.length) {
      setShowHints(true);
      setHintsUsed(prev => prev + 1);
      setConfidenceLevel(prev => Math.max(0.1, prev - 0.15)); // Reduce confidence for hint usage
      toast.info(`Hint ${hintsUsed + 1}: ${currentCard.hints[hintsUsed]}`);
    }
  }, [currentCard.hints, hintsUsed]);

  const handleReasoningStepAdd = useCallback((step: string) => {
    if (step.trim()) {
      setReasoningSteps(prev => [...prev, step.trim()]);
    }
  }, []);

  const handleQualityResponse = useCallback(async (quality: number) => {
    if (!currentCard || isProcessing) return;

    setIsProcessing(true);

    try {
      const responseTime = Date.now() - cardStartTime.getTime();

      // Create detailed review response
      const reviewResponse: HRMReviewResponse = {
        quality,
        response_time: responseTime,
        confidence_level: confidenceLevel,
        hints_used: hintsUsed,
        partial_correct: quality >= 2 && quality < 4,
        reasoning_steps: reasoningSteps,
        conceptual_understanding: Math.max(0, Math.min(1, (quality + confidenceLevel * 5) / 10)),
        problem_solving_approach: reasoningSteps.length > 2 ? 'analytical' : 
                                 confidenceLevel > 0.8 ? 'intuitive' : 'mixed',
        metacognitive_awareness: hintsUsed === 0 && confidenceLevel > 0.7 ? 0.8 : 0.5
      };

      // Calculate next review using HRM-enhanced algorithm
      const reviewResult = await HRMSpacedRepetitionEngine.calculateHRMEnhancedReview(
        userId,
        currentCard.id,
        currentProgress,
        reviewResponse,
        {
          subject,
          topic: currentCard.tags[0] || 'general',
          difficulty_level: currentCard.difficulty / 5,
          session_context: {
            session_id: sessionData.session_id,
            cards_reviewed: sessionData.cards_reviewed.length,
            session_start_time: sessionData.start_time.toISOString(),
            fatigue_level: sessionData.current_fatigue_level
          }
        }
      );

      // Update progress in database
      await onProgressUpdate(currentCard.id, reviewResult.updated_progress);

      // Update session data
      setSessionData(prev => ({
        ...prev,
        cards_reviewed: [...prev.cards_reviewed, currentCard],
        responses: [...prev.responses, reviewResponse]
      }));

      // Show feedback toast
      const feedback = reviewResult.performance_feedback;
      toast.success(feedback.message, {
        duration: 3000,
        icon: quality >= 4 ? '🎉' : quality >= 3 ? '👍' : '💪'
      });

      // Move to next card or complete session
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        await completeSession();
      }

    } catch (error) {
      console.error('Failed to process review:', error);
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    currentCard, 
    isProcessing, 
    cardStartTime, 
    confidenceLevel, 
    hintsUsed, 
    reasoningSteps, 
    userId, 
    currentProgress, 
    subject, 
    sessionData, 
    onProgressUpdate, 
    currentIndex, 
    cards.length
  ]);

  const completeSession = useCallback(async () => {
    const totalTime = Date.now() - sessionStartTime.getTime();
    const avgQuality = sessionData.responses.reduce((sum, r) => sum + r.quality, 0) / sessionData.responses.length;

    const summary: SessionSummary = {
      total_cards: cards.length,
      cards_completed: sessionData.responses.length,
      average_quality: avgQuality,
      session_duration: totalTime,
      reasoning_improvement: calculateReasoningImprovement(),
      areas_to_focus: extractAreasToFocus(),
      next_session_recommendation: generateNextSessionRecommendation(avgQuality, totalTime)
    };

    setSessionSummary(summary);
    onSessionComplete(summary);
  }, [sessionStartTime, sessionData, cards.length, onSessionComplete]);

  const calculateReasoningImprovement = useCallback((): number => {
    const responses = sessionData.responses;
    if (responses.length < 3) return 0;

    const firstHalf = responses.slice(0, Math.floor(responses.length / 2));
    const secondHalf = responses.slice(Math.floor(responses.length / 2));

    const firstAvg = firstHalf.reduce((sum, r) => sum + r.conceptual_understanding, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.conceptual_understanding, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }, [sessionData.responses]);

  const extractAreasToFocus = useCallback((): string[] => {
    const strugglingCards = sessionData.responses
      .filter(r => r.quality < 3)
      .map((_, index) => sessionData.cards_reviewed[index]?.tags[0])
      .filter((tag): tag is string => tag !== undefined);

    return [...new Set(strugglingCards)].slice(0, 3);
  }, [sessionData]);

  const generateNextSessionRecommendation = useCallback((avgQuality: number, duration: number): string => {
    if (avgQuality >= 4) {
      return "Excellent session! Consider increasing difficulty or tackling new topics.";
    } else if (avgQuality >= 3) {
      return "Good progress! Continue with regular review sessions.";
    } else if (duration > 30 * 60 * 1000) {
      return "Consider shorter, more focused sessions to improve retention.";
    } else {
      return "Focus on fundamentals and consider additional study materials.";
    }
  }, []);

  const handleSkipCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, cards.length]);

  const handleResetCard = useCallback(() => {
    setIsFlipped(false);
    setShowHints(false);
    setHintsUsed(0);
    setReasoningSteps([]);
    setCurrentResponse('');
    setConfidenceLevel(0.5);
    setCardStartTime(new Date());
  }, []);

  // Render Methods
  const renderProgressBar = () => (
    <div className="space-y-2 mb-6">
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <div className="flex items-center gap-4">
          {settings.enableTimer && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(timeSpent / 1000)}s</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <span>{currentCard?.reasoning_type}</span>
          </div>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex gap-2">
        <Badge variant="outline" className="text-xs">
          Difficulty: {currentCard?.difficulty}/5
        </Badge>
        <Badge variant="outline" className="text-xs">
          Load: {Math.round((currentCard?.cognitive_load || 0) * 100)}%
        </Badge>
        {currentProgress && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              SpacedRepetitionUtils.getDifficultyColor(currentProgress.success_rate)
            )}
          >
            Success: {Math.round(currentProgress.success_rate * 100)}%
          </Badge>
        )}
      </div>
    </div>
  );

  const renderCard = () => (
    <Card 
      className={cn(
        "h-80 cursor-pointer transition-all duration-300 hover:shadow-lg",
        isFlipped && "shadow-md border-blue-200"
      )}
      onClick={handleCardFlip}
    >
      <CardContent className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4 w-full">
          {!isFlipped ? (
            <>
              <div className="text-sm text-gray-500 uppercase tracking-wide flex items-center justify-center gap-2">
                <BookOpen className="h-4 w-4" />
                {currentCard?.reasoning_type} • Click to reveal
              </div>
              <p className="text-lg font-medium leading-relaxed">
                {currentCard?.front_text}
              </p>
              {currentCard?.tags && currentCard.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-4">
                  {currentCard.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-sm text-green-600 uppercase tracking-wide flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Answer
              </div>
              <div className="space-y-3">
                <p className="text-lg leading-relaxed">
                  {currentCard?.back_text}
                </p>
                {currentCard?.explanation && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <strong>Explanation:</strong> {currentCard.explanation}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderHintSection = () => {
    if (!settings.showHints || !currentCard?.hints || currentCard.hints.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleHintRequest}
          disabled={hintsUsed >= currentCard.hints.length || isFlipped}
          className="mb-2"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Get Hint ({hintsUsed}/{currentCard.hints.length})
        </Button>
      </div>
    );
  };

  const renderReasoningInput = () => {
    if (isFlipped || settings.studyMode === 'cram') return null;

    return (
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Your reasoning (optional):
          </label>
          <textarea
            ref={responseInputRef}
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Describe your thought process..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Confidence Level: {Math.round(confidenceLevel * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    );
  };

  const renderResponseButtons = () => {
    if (!isFlipped) return null;

    return (
      <div className="mt-6 space-y-4">
        <p className="text-center text-sm text-gray-600">
          How well did you know this?
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleQualityResponse(0)}
            disabled={isProcessing}
            className="text-red-600 border-red-200 hover:bg-red-50 flex-col py-4"
          >
            <span className="font-medium">Forgot</span>
            <span className="text-xs text-gray-500">Complete blackout</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleQualityResponse(2)}
            disabled={isProcessing}
            className="text-orange-600 border-orange-200 hover:bg-orange-50 flex-col py-4"
          >
            <span className="font-medium">Hard</span>
            <span className="text-xs text-gray-500">Difficult recall</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleQualityResponse(4)}
            disabled={isProcessing}
            className="text-green-600 border-green-200 hover:bg-green-50 flex-col py-4"
          >
            <span className="font-medium">Good</span>
            <span className="text-xs text-gray-500">Correct response</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleQualityResponse(5)}
            disabled={isProcessing}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-col py-4"
          >
            <span className="font-medium">Perfect</span>
            <span className="text-xs text-gray-500">Immediate recall</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderControlButtons = () => (
    <div className="mt-6 flex justify-between items-center">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetCard}
          className="text-gray-600"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        {settings.studyMode !== 'cram' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipCard}
            className="text-gray-600"
            disabled={currentIndex >= cards.length - 1}
          >
            Skip
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <TrendingUp className="h-4 w-4" />
        <span>Session: {Math.floor(sessionDuration / 60000)}min</span>
      </div>
    </div>
  );

  // Main Render
  if (!currentCard) {
    return (
      <div className="text-center p-8">
        <div className="mb-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Cards Available</h3>
          <p className="text-gray-600">Add cards to this deck to start studying.</p>
        </div>
      </div>
    );
  }

  if (sessionSummary) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              Session Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sessionSummary.cards_completed}
                </div>
                <div className="text-sm text-gray-600">Cards Reviewed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(sessionSummary.average_quality * 100) / 100}
                </div>
                <div className="text-sm text-gray-600">Avg Quality</div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Next Session Recommendation:
              </p>
              <p className="text-sm text-blue-700">
                {sessionSummary.next_session_recommendation}
              </p>
            </div>

            {sessionSummary.areas_to_focus.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Areas to Focus:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sessionSummary.areas_to_focus.map(area => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{deckTitle}</h2>
        <p className="text-gray-600">
          {settings.studyMode === 'review' ? 'Review Mode' : 
           settings.studyMode === 'learn' ? 'Learning Mode' : 'Cram Mode'}
        </p>
      </div>

      {renderProgressBar()}
      {renderCard()}
      {renderHintSection()}
      {renderReasoningInput()}
      {renderResponseButtons()}
      {renderControlButtons()}
    </div>
  );
}

// Export component and related types
export type { Flashcard, FlashcardDeckProps, SessionSummary };
