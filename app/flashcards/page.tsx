'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Brain, Clock, TrendingUp, Play, Settings, BookOpen, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';
import { find } from 'lodash';

export default function FlashcardsPage() {
  const { user } = useUser();
  const [decks, setDecks] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    cardsDue: 0,
    studyStreak: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchFlashcardData();
    }
  }, [user]);

  const fetchFlashcardData = async () => {
    try {
      setLoading(true);

      // Fetch user's decks
      const { data: decksData } = await supabase
        .from('flashcard_decks')
        .select(`
          *,
          subjects(name, exam_type)
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      // Fetch due cards
      const { data: dueCardsData } = await supabase
        .from('user_flashcard_progress')
        .select(`
          *,
          flashcards(
            *,
            flashcard_decks(title, subject_id)
          )
        `)
        .eq('user_id', user?.id)
        .lte('next_review_date', new Date().toISOString().split('T')[0])
        .order('next_review_date', { ascending: true });

      setDecks(decksData || []);
      setDueCards(dueCardsData || []);

      // Calculate stats
      const totalCards = decksData?.reduce((sum: any, deck: { total_cards: any; }) => sum + deck.total_cards, 0) || 0;
      setStats({
        totalDecks: decksData?.length || 0,
        totalCards,
        cardsDue: dueCardsData?.length || 0,
        studyStreak: 5, // This would come from analytics
      });

    } catch (error) {
      console.error('Error fetching flashcard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const DeckCard = ({ deck }: { deck: any }) => {
    const progress = deck.total_cards > 0 ? (deck.total_studies / deck.total_cards) * 100 : 0;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{deck.title}</CardTitle>
            <Badge variant="outline">
              {deck.subjects?.exam_type || 'General'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm line-clamp-2">
            {deck.description || 'No description available'}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>{deck.total_cards} cards</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>{Math.round(deck.average_retention_rate || 0)}% retention</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/flashcards/study?deck=${deck.id}`}>
                <Play className="h-4 w-4 mr-1" />
                Study
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/flashcards/${deck.id}`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Last studied: {formatRelativeTime(new Date(deck.updated_at))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
            <p className="text-gray-600 mb-4">Sign in to access your flashcards</p>
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🧠 My Flashcards
              </h1>
              <p className="text-gray-600">
                Spaced repetition with Hermann Ebbinghaus algorithm + HRM AI
              </p>
            </div>
            <Button asChild>
              <Link href="/flashcards/create">
                <Plus className="h-4 w-4 mr-2" />
                New Deck
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDecks}</div>
              <div className="text-sm text-gray-600">Total Decks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCards}</div>
              <div className="text-sm text-gray-600">Total Cards</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.cardsDue}</div>
              <div className="text-sm text-gray-600">Cards Due</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.studyStreak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Due Cards Section */}
        {stats.cardsDue > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Clock className="h-5 w-5" />
                Cards Due for Review ({stats.cardsDue})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-4">
                You have {stats.cardsDue} cards ready for review. Regular practice improves retention!
              </p>
              <Button asChild>
                <Link href="/flashcards/study">
                  <Target className="h-4 w-4 mr-2" />
                  Start Review Session
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Decks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No flashcard decks yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first deck to start studying with spaced repetition
            </p>
            <Button asChild>
              <Link href="/flashcards/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Deck
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}