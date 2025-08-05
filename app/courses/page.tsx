'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { Search, Filter, BookOpen, Clock, Users, Star, IndianRupee } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const EXAM_TYPES = [
  { value: 'all', label: 'All Exams' },
  { value: 'UPSC', label: 'UPSC' },
  { value: 'SSC', label: 'SSC' },
  { value: 'BANKING', label: 'Banking' },
  { value: 'RAILWAY', label: 'Railway' },
  { value: 'DEFENSE', label: 'Defense' },
];

const DIFFICULTY_LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: '1', label: 'Beginner' },
  { value: '2', label: 'Elementary' },
  { value: '3', label: 'Intermediate' },
  { value: '4', label: 'Advanced' },
  { value: '5', label: 'Expert' },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    fetchCourses();
  }, [selectedExam, selectedDifficulty, searchQuery]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('courses')
        .select(`
          *,
          subjects(*),
          users!primary_instructor_id(name, faculty_profiles(*))
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (selectedExam !== 'all') {
        query = query.eq('exam_type', selectedExam);
      }

      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty_level', parseInt(selectedDifficulty));
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (selectedTab === 'free') return course.is_free;
    if (selectedTab === 'paid') return !course.is_free;
    if (selectedTab === 'featured') return course.is_featured;
    return true;
  });

  const CourseCard = ({ course }: { course: any }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-lg relative overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant={course.is_free ? 'secondary' : 'default'}>
            {course.is_free ? 'FREE' : 'PAID'}
          </Badge>
        </div>
        {course.is_featured && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">FEATURED</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {course.exam_type}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span className="text-xs text-gray-600">{course.average_rating || 0}</span>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.short_description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.estimated_hours}h</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.current_enrollment}</span>
            </div>
          </div>

          <div className="text-right">
            {course.is_free ? (
              <span className="text-green-600 font-semibold">Free</span>
            ) : (
              <div>
                {course.discounted_fee && (
                  <span className="text-gray-400 line-through text-sm">
                    {formatCurrency(course.fee)}
                  </span>
                )}
                <div className="font-semibold text-blue-600">
                  {formatCurrency(course.discounted_fee || course.fee)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/courses/${course.slug}`}>
              View Details
            </Link>
          </Button>
          {!course.is_free && (
            <Button variant="outline" size="sm">
              <IndianRupee className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🇮🇳 Courses for Indian Competitive Exams
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Master UPSC, SSC, Banking, and other competitive exams with our expert-designed courses
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {EXAM_TYPES.map(exam => (
                <option key={exam.value} value={exam.value}>{exam.label}</option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Courses</TabsTrigger>
              <TabsTrigger value="free">Free Courses</TabsTrigger>
              <TabsTrigger value="paid">Paid Courses</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded mb-4" />
                  <div className="h-8 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}