// app/(dashboard)/student/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Brain, 
  Clock, 
  Award, 
  TrendingUp, 
  Target,
  Calendar,
  User,
  Settings,
  BarChart3,
  PlayCircle,
  FileText,
  Zap,
  Star,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import CourseCard from '@/components/features/CourseCard';
import FlashcardDeck from '@/components/features/FlashcardDeck';

// Types and Interfaces
interface DashboardStats {
  total_courses: number;
  completed_courses: number;
  active_courses: number;
  total_study_hours: number;
  flashcards_due: number;
  quiz_attempts_today: number;
  current_streak: number;
  average_score: number;
  reasoning_improvement: number;
  weekly_goal_progress: number;
}

interface RecentActivity {
  id: string;
  type: 'course_progress' | 'quiz_completed' | 'flashcard_session' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface StudyGoal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'overdue';
}

interface UpcomingEvent {
  id: string;
  title: string;
  type: 'course_start' | 'quiz_deadline' | 'exam_date' | 'live_session';
  date: string;
  course_title?: string;
  is_urgent: boolean;
}

interface LearningInsight {
  id: string;
  type: 'strength' | 'weakness' | 'recommendation';
  title: string;
  description: string;
  action_text?: string;
  action_url?: string;
}

export default function StudentDashboard() {
  const { user, loading } = useUser();
  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats;
    recent_activity: RecentActivity[];
    study_goals: StudyGoal[];
    upcoming_events: UpcomingEvent[];
    learning_insights: LearningInsight[];
    enrolled_courses: any[];
    due_flashcards: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return;

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Fetch all dashboard data in parallel
      const [
        statsResponse,
        coursesResponse,
        flashcardsResponse,
        analyticsResponse
      ] = await Promise.all([
        fetch('/api/student/dashboard/stats'),
        fetch('/api/student/courses'),
        fetch('/api/flashcards/due'),
        fetch('/api/student/analytics')
      ]);

      const stats = await statsResponse.json();
      const courses = await coursesResponse.json();
      const flashcards = await flashcardsResponse.json();
      const analytics = await analyticsResponse.json();

      setDashboardData({
        stats: stats.stats,
        recent_activity: stats.recent_activity || [],
        study_goals: stats.study_goals || [],
        upcoming_events: stats.upcoming_events || [],
        learning_insights: analytics.insights || [],
        enrolled_courses: courses.enrolled_courses || [],
        due_flashcards: flashcards.cards || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
            <p className="text-gray-600 mb-4">You need to be signed in to access your dashboard.</p>
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const completionRate = stats ? (stats.completed_courses / Math.max(stats.total_courses, 1)) * 100 : 0;

  // Render stats cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold">{stats?.active_courses || 0}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(completionRate)}% completion rate
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Study Hours</p>
              <p className="text-2xl font-bold">{stats?.total_study_hours || 0}h</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2">
            <Progress value={stats?.weekly_goal_progress || 0} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Weekly goal: {Math.round(stats?.weekly_goal_progress || 0)}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cards Due</p>
              <p className="text-2xl font-bold">{stats?.flashcards_due || 0}</p>
            </div>
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2">
            {stats?.flashcards_due && stats.flashcards_due > 0 ? (
              <Button size="sm" className="w-full" asChild>
                <Link href="/flashcards/study">Study Now</Link>
              </Button>
            ) : (
              <p className="text-xs text-green-600 text-center">All caught up! 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                {stats?.current_streak || 0}
                <Flame className="h-5 w-5 text-orange-500" />
              </p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Keep it up! Study daily to maintain your streak.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats cards */}
      {renderStatsCards()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent_activity?.length ? (
                dashboardData.recent_activity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      {activity.type === 'course_progress' && <BookOpen className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'quiz_completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {activity.type === 'flashcard_session' && <Brain className="h-4 w-4 text-purple-600" />}
                      {activity.type === 'achievement' && <Award className="h-4 w-4 text-yellow-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-gray-600">Start studying to see your progress here!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Upcoming Events */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" asChild>
                <Link href="/flashcards/study">
                  <Brain className="h-4 w-4 mr-2" />
                  Study Flashcards ({stats?.flashcards_due || 0})
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/quizzes">
                  <FileText className="h-4 w-4 mr-2" />
                  Take Practice Quiz
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/courses">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue Learning
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.upcoming_events?.length ? (
                  dashboardData.upcoming_events.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                      {event.is_urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No upcoming events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Learning Insights */}
      {dashboardData?.learning_insights?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.learning_insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className={cn(
                  "p-4 rounded-lg border",
                  insight.type === 'strength' && "bg-green-50 border-green-200",
                  insight.type === 'weakness' && "bg-red-50 border-red-200",
                  insight.type === 'recommendation' && "bg-blue-50 border-blue-200"
                )}>
                  <div className="flex items-start gap-2">
                    {insight.type === 'strength' && <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />}
                    {insight.type === 'weakness' && <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                    {insight.type === 'recommendation' && <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />}
                    <div>
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      {insight.action_text && insight.action_url && (
                        <Button size="sm" variant="outline" className="mt-2" asChild>
                          <Link href={insight.action_url}>{insight.action_text}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render courses tab
  const renderCoursesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <Button asChild>
          <Link href="/courses">
            <Plus className="h-4 w-4 mr-2" />
            Browse Courses
          </Link>
        </Button>
      </div>

      {dashboardData?.enrolled_courses?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.enrolled_courses.map((enrollment) => (
            <CourseCard
              key={enrollment.course.id}
              course={enrollment.course}
              variant="compact"
              showEnrollButton={false}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-4">
            Start your learning journey by enrolling in courses
          </p>
          <Button asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </Card>
      )}
    </div>
  );

  // Render flashcards tab
  const renderFlashcardsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Flashcard Study</h2>
        <Button asChild>
          <Link href="/flashcards/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Deck
          </Link>
        </Button>
      </div>

      {dashboardData?.due_flashcards?.length ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Cards Due for Review ({dashboardData.due_flashcards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.due_flashcards.slice(0, 5).map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{card.flashcards.deck_title}</p>
                      <p className="text-sm text-gray-600">
                        {card.priority_reason} • {card.flashcards.front_text.substring(0, 50)}...
                      </p>
                    </div>
                    <Badge variant={card.priority_score > 50 ? "destructive" : "default"}>
                      Priority: {card.priority_score}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/flashcards/study">Start Study Session</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No cards due</h3>
          <p className="text-gray-600 mb-4">
            Great job! You're all caught up with your flashcard reviews.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/flashcards">Manage Decks</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/flashcards/create">Create New Deck</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  // Render analytics tab
  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Learning Analytics</h2>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round(stats?.average_score || 0)}%
            </div>
            <p className="text-sm text-gray-600">Average Quiz Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats?.reasoning_improvement > 0 ? '+' : ''}{Math.round((stats?.reasoning_improvement || 0) * 100)}%
            </div>
            <p className="text-sm text-gray-600">Reasoning Improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats?.quiz_attempts_today || 0}
            </div>
            <p className="text-sm text-gray-600">Quizzes Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Study Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Study Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.study_goals?.length ? (
              dashboardData.study_goals.map((goal) => (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{goal.title}</h4>
                    <Badge variant={
                      goal.status === 'completed' ? 'default' :
                      goal.status === 'overdue' ? 'destructive' : 'secondary'
                    }>
                      {goal.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                      <span>{Math.round((goal.current_value / goal.target_value) * 100)}%</span>
                    </div>
                    <Progress value={(goal.current_value / goal.target_value) * 100} />
                    <p className="text-xs text-gray-500">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No study goals set</h3>
                <p className="text-gray-600 mb-4">Set goals to track your progress</p>
                <Button>Set Your First Goal</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600">
                Ready to continue your learning journey?
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              {renderOverviewTab()}
            </TabsContent>

            <TabsContent value="courses">
              {renderCoursesTab()}
            </TabsContent>

            <TabsContent value="flashcards">  
              {renderFlashcardsTab()}
            </TabsContent>

            <TabsContent value="analytics">
              {renderAnalyticsTab()}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
