// components/features/CourseCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Calendar,
  IndianRupee,
  Play,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  trailer_video_url?: string;

  // Instructor information
  primary_instructor: {
    id: string;
    name: string;
    avatar_url?: string;
    specialization: string;
  };

  // Course details
  exam_type: string;
  difficulty_level: number;
  course_type: 'regular' | 'crash' | 'test_series' | 'revision';

  // Pricing and enrollment
  fee: number;
  discounted_fee?: number;
  currency: string;
  max_students: number;
  current_enrollment: number;

  // Schedule
  start_date: string;
  end_date: string;
  enrollment_end_date: string;

  // Course structure
  total_lessons: number;
  estimated_hours: number;

  // Analytics
  average_rating: number;
  total_ratings: number;

  // Status
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  is_free: boolean;
}

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'featured';
  showEnrollButton?: boolean;
  onEnroll?: (courseId: string) => void;
  className?: string;
}

export default function CourseCard({ 
  course, 
  variant = 'default',
  showEnrollButton = true,
  onEnroll,
  className 
}: CourseCardProps) {

  const isEnrollmentOpen = new Date() <= new Date(course.enrollment_end_date);
  const enrollmentProgress = (course.current_enrollment / course.max_students) * 100;
  const hasDiscount = course.discounted_fee && course.discounted_fee < course.fee;
  const effectivePrice = hasDiscount ? course.discounted_fee : course.fee;

  // Calculate urgency indicators
  const daysUntilStart = Math.ceil(
    (new Date(course.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const daysUntilEnrollmentEnd = Math.ceil(
    (new Date(course.enrollment_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (level: number) => {
    const levels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return levels[level] || 'Unknown';
  };

  const getCourseTypeColor = (type: string) => {
    switch (type) {
      case 'crash': return 'bg-red-100 text-red-800';
      case 'test_series': return 'bg-purple-100 text-purple-800';
      case 'revision': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: course.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (variant === 'compact') {
    return (
      <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={course.thumbnail_url || '/placeholder-course.jpg'}
                alt={course.title}
                fill
                className="object-cover"
              />
              {course.is_featured && (
                <Badge className="absolute -top-1 -right-1 bg-yellow-500 text-xs px-1">
                  ★
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/courses/${course.slug}`}>
                <h3 className="font-semibold text-sm line-clamp-2 hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
              </Link>

              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {course.exam_type}
                </Badge>
                <span className="text-xs text-gray-500">
                  {course.total_lessons} lessons
                </span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">
                    {course.average_rating.toFixed(1)} ({course.total_ratings})
                  </span>
                </div>

                <div className="text-right">
                  {hasDiscount && (
                    <span className="text-xs text-gray-500 line-through">
                      {formatPrice(course.fee)}
                    </span>
                  )}
                  <div className="font-semibold text-sm">
                    {formatPrice(effectivePrice ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-all duration-300 group",
      variant === 'featured' && "border-2 border-yellow-200 shadow-md",
      className
    )}>
      {/* Thumbnail and Video Preview */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={course.thumbnail_url || '/placeholder-course.jpg'}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {course.is_featured && (
            <Badge className="bg-yellow-500 text-yellow-900">
              <Award className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {course.is_free && (
            <Badge className="bg-green-500 text-white">
              Free
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-red-500 text-white">
              {Math.round(((course.fee - course.discounted_fee!) / course.fee) * 100)}% OFF
            </Badge>
          )}
        </div>

        {/* Enrollment urgency */}
        {daysUntilEnrollmentEnd <= 3 && daysUntilEnrollmentEnd > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white animate-pulse">
            {daysUntilEnrollmentEnd} days left
          </Badge>
        )}

        {/* Play button for trailer */}
        {course.trailer_video_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Play className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
        )}

        {/* Course type badge */}
        <Badge 
          className={cn(
            "absolute bottom-2 left-2 text-xs",
            getCourseTypeColor(course.course_type)
          )}
        >
          {course.course_type.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/courses/${course.slug}`}>
              <CardTitle className="text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                {course.title}
              </CardTitle>
            </Link>

            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {course.exam_type}
              </Badge>
              <Badge 
                className={cn("text-xs", getDifficultyColor(course.difficulty_level))}
              >
                {getDifficultyText(course.difficulty_level)}
              </Badge>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            {hasDiscount && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(course.fee)}
              </div>
            )}
            <div className="text-xl font-bold text-green-600">
              {formatPrice(effectivePrice ?? 0)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {course.short_description}
        </p>

        {/* Instructor */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
            {course.primary_instructor.avatar_url ? (
              <Image
                src={course.primary_instructor.avatar_url}
                alt={course.primary_instructor.name}
                width={32}
                height={32}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                {course.primary_instructor.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{course.primary_instructor.name}</p>
            <p className="text-xs text-gray-500">{course.primary_instructor.specialization}</p>
          </div>
        </div>

        {/* Course stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>{course.total_lessons} lessons</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{course.estimated_hours}h total</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{course.current_enrollment} enrolled</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Starts {new Date(course.start_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(course.average_rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {course.average_rating.toFixed(1)} ({course.total_ratings} reviews)
          </span>
        </div>

        {/* Enrollment progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Enrollment</span>
            <span className="font-medium">
              {course.current_enrollment}/{course.max_students}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                enrollmentProgress > 80 ? "bg-red-500" : 
                enrollmentProgress > 60 ? "bg-yellow-500" : "bg-green-500"
              )}
              style={{ width: `${Math.min(enrollmentProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        {showEnrollButton && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => onEnroll?.(course.id)}
              disabled={!isEnrollmentOpen || course.current_enrollment >= course.max_students}
              size="sm"
            >
              {!isEnrollmentOpen 
                ? 'Enrollment Closed' 
                : course.current_enrollment >= course.max_students 
                ? 'Seats Full'
                : 'Enroll Now'
              }
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/courses/${course.slug}`}>
                Details
              </Link>
            </Button>
          </div>
        )}

        {/* Urgency indicators */}
        {daysUntilStart <= 7 && daysUntilStart > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
            <p className="text-sm text-blue-800">
              <Calendar className="h-4 w-4 inline mr-1" />
              Starts in {daysUntilStart} days
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export component and types
export type { Course, CourseCardProps };
