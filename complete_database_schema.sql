-- Complete Kanchen-Academy Database Schema
-- Comprehensive schema for all platform components

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Enhanced users table with all roles and profiles
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin', 'moderator')),
  
  -- Student-specific fields
  exam_target VARCHAR(100), -- 'UPSC', 'SSC', 'BANKING', etc.
  current_preparation_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  preferred_language VARCHAR(10) DEFAULT 'english',
  study_goals TEXT,
  target_exam_date DATE,
  
  -- HRM-specific fields
  reasoning_level DECIMAL(3,2) DEFAULT 0.5,
  learning_preferences JSONB DEFAULT '{}',
  cognitive_profile JSONB DEFAULT '{}',
  
  -- Profile fields
  avatar_url VARCHAR(500),
  bio TEXT,
  location VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  
  -- Account status
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'deactivated')),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  
  -- Timestamps
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for tracking active sessions
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB DEFAULT '{}', -- Browser, OS, IP, etc.
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Study preferences
  preferred_study_time TIME,
  daily_study_goal INTEGER DEFAULT 60, -- minutes
  reminder_settings JSONB DEFAULT '{}',
  difficulty_preference VARCHAR(20) DEFAULT 'adaptive',
  
  -- UI preferences
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'english',
  notification_settings JSONB DEFAULT '{}',
  
  -- Privacy settings
  profile_visibility VARCHAR(20) DEFAULT 'public',
  progress_sharing BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COURSE MANAGEMENT
-- =============================================

-- Course categories and subjects
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL, -- 'UPSC_GS', 'SSC_MATH', etc.
  description TEXT,
  exam_type VARCHAR(50) NOT NULL, -- 'UPSC', 'SSC', 'BANKING'
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  icon_url VARCHAR(500),
  color_code VARCHAR(7), -- Hex color
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Course categorization
  subject_id UUID REFERENCES subjects(id),
  exam_type VARCHAR(50) NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  course_type VARCHAR(50) DEFAULT 'regular' CHECK (course_type IN ('regular', 'crash', 'test_series', 'revision')),
  
  -- Instructor and content
  primary_instructor_id UUID REFERENCES users(id),
  co_instructors UUID[] DEFAULT '{}',
  
  -- Course structure
  total_lessons INTEGER DEFAULT 0,
  estimated_hours INTEGER DEFAULT 0,
  prerequisites TEXT[],
  learning_outcomes TEXT[],
  
  -- Pricing and enrollment
  fee DECIMAL(10,2) DEFAULT 0,
  discounted_fee DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'INR',
  max_students INTEGER DEFAULT 100,
  current_enrollment INTEGER DEFAULT 0,
  
  -- Schedule
  start_date DATE,
  end_date DATE,
  enrollment_start_date DATE,
  enrollment_end_date DATE,
  
  -- Course materials
  thumbnail_url VARCHAR(500),
  trailer_video_url VARCHAR(500),
  syllabus_pdf_url VARCHAR(500),
  
  -- HRM integration
  reasoning_complexity DECIMAL(3,2) DEFAULT 0.5,
  adaptive_difficulty BOOLEAN DEFAULT true,
  
  -- Status and visibility
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  
  -- SEO and marketing
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  tags TEXT[],
  
  -- Analytics
  total_views INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course modules/chapters
CREATE TABLE course_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  
  -- Module content
  estimated_duration INTEGER, -- minutes
  is_free_preview BOOLEAN DEFAULT false,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual lessons within modules
CREATE TABLE course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  
  -- Lesson content
  lesson_type VARCHAR(50) DEFAULT 'video' CHECK (lesson_type IN ('video', 'text', 'quiz', 'assignment', 'live')),
  content_url VARCHAR(500), -- Video URL, document URL, etc.
  content_text TEXT, -- For text-based lessons
  duration INTEGER, -- minutes
  
  -- Resources
  attachments JSONB DEFAULT '{}', -- PDF, slides, etc.
  transcript TEXT,
  notes TEXT,
  
  -- Access control
  is_free_preview BOOLEAN DEFAULT false,
  requires_completion_of UUID[], -- Prerequisite lesson IDs
  
  -- HRM integration
  cognitive_load DECIMAL(3,2) DEFAULT 0.5,
  reasoning_type VARCHAR(50),
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ENROLLMENT SYSTEM
-- =============================================

-- Course enrollments
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Enrollment details
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrollment_type VARCHAR(20) DEFAULT 'paid' CHECK (enrollment_type IN ('free', 'paid', 'scholarship', 'trial')),
  
  -- Payment information
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Access control
  access_granted_at TIMESTAMP WITH TIME ZONE,
  access_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Progress tracking
  progress_percentage DECIMAL(5,2) DEFAULT 0.0,
  lessons_completed INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- minutes
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- HRM personalization
  personalized_curriculum JSONB DEFAULT '{}',
  learning_velocity DECIMAL(3,2) DEFAULT 1.0,
  current_difficulty_level DECIMAL(3,2) DEFAULT 0.5,
  adaptive_path JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'suspended')),
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN DEFAULT false,
  
  -- Constraints
  UNIQUE(user_id, course_id)
);

-- Track individual lesson progress
CREATE TABLE lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  
  -- Progress details
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0, -- seconds
  progress_percentage DECIMAL(5,2) DEFAULT 0.0,
  
  -- Engagement metrics
  video_watch_time INTEGER DEFAULT 0, -- seconds
  notes_taken TEXT,
  bookmarked BOOLEAN DEFAULT false,
  
  -- HRM analysis
  comprehension_score DECIMAL(3,2),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  
  -- Status
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  
  UNIQUE(user_id, lesson_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FACULTY MANAGEMENT
-- =============================================

-- Faculty profiles (extends users table)
CREATE TABLE faculty_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Professional information
  designation VARCHAR(255),
  specialization VARCHAR(255),
  experience_years INTEGER,
  qualifications TEXT[],
  certifications TEXT[],
  achievements TEXT[],
  
  -- Teaching information
  subjects_taught UUID[], -- References subjects.id
  teaching_style_profile JSONB DEFAULT '{}',
  preferred_batch_size INTEGER,
  
  -- Media and presentation
  profile_photo_url VARCHAR(500),
  cover_photo_url VARCHAR(500),
  intro_video_url VARCHAR(500),
  
  -- Performance metrics
  total_students_taught INTEGER DEFAULT 0,
  average_student_rating DECIMAL(3,2) DEFAULT 0.0,
  total_courses INTEGER DEFAULT 0,
  student_success_rate DECIMAL(5,2) DEFAULT 0.0,
  
  -- HRM teaching analytics
  reasoning_coaching_score DECIMAL(3,2) DEFAULT 0.0,
  adaptive_teaching_ability DECIMAL(3,2) DEFAULT 0.0,
  student_engagement_score DECIMAL(3,2) DEFAULT 0.0,
  
  -- Availability and scheduling
  availability_schedule JSONB DEFAULT '{}', -- Weekly schedule
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  max_weekly_hours INTEGER DEFAULT 40,
  
  -- Contact and social
  office_hours VARCHAR(255),
  contact_email VARCHAR(255),
  social_links JSONB DEFAULT '{}',
  
  -- Administrative
  joining_date DATE,
  employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'guest')),
  salary_range VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Faculty reviews and ratings
CREATE TABLE faculty_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Review details
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  
  -- Specific ratings
  teaching_quality INTEGER CHECK (teaching_quality BETWEEN 1 AND 5),
  communication_skills INTEGER CHECK (communication_skills BETWEEN 1 AND 5),
  subject_knowledge INTEGER CHECK (subject_knowledge BETWEEN 1 AND 5),
  responsiveness INTEGER CHECK (responsiveness BETWEEN 1 AND 5),
  
  -- Review metadata
  is_anonymous BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faculty_id, student_id, course_id)
);

-- =============================================
-- QUIZ & ASSESSMENT SYSTEM
-- =============================================

-- Quiz categories and types
CREATE TABLE quiz_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  category_type VARCHAR(50) DEFAULT 'practice' CHECK (category_type IN ('practice', 'mock_test', 'chapter_test', 'full_test')),
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Quiz categorization
  category_id UUID REFERENCES quiz_categories(id),
  subject_id UUID REFERENCES subjects(id),
  course_id UUID REFERENCES courses(id), -- Optional: quiz linked to specific course
  created_by UUID REFERENCES users(id),
  
  -- Quiz configuration
  total_questions INTEGER DEFAULT 0,
  total_marks DECIMAL(8,2) DEFAULT 0,
  time_limit INTEGER, -- minutes
  passing_marks DECIMAL(8,2),
  negative_marking DECIMAL(3,2) DEFAULT 0, -- -0.25 for 1/4 negative marking
  
  -- Quiz behavior
  question_randomization BOOLEAN DEFAULT true,
  option_randomization BOOLEAN DEFAULT true,
  allow_review BOOLEAN DEFAULT true,
  show_results_immediately BOOLEAN DEFAULT false,
  allow_retake BOOLEAN DEFAULT true,
  max_attempts INTEGER DEFAULT 3,
  
  -- HRM integration
  adaptive_difficulty BOOLEAN DEFAULT false,
  reasoning_analysis_enabled BOOLEAN DEFAULT true,
  cognitive_load_balancing BOOLEAN DEFAULT false,
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  requires_enrollment BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Pricing (for premium quizzes)
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(8,2) DEFAULT 0,
  
  -- Status and visibility
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Analytics
  total_attempts INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  
  -- Question content
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'multiple_select', 'true_false', 'fill_blank', 'essay', 'numerical')),
  explanation TEXT,
  
  -- Question metadata
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  marks DECIMAL(5,2) DEFAULT 1.0,
  negative_marks DECIMAL(5,2) DEFAULT 0.0,
  estimated_time INTEGER DEFAULT 60, -- seconds
  
  -- HRM fields
  cognitive_load DECIMAL(3,2) DEFAULT 0.5,
  reasoning_type VARCHAR(50),
  requires_multi_step_reasoning BOOLEAN DEFAULT false,
  
  -- Content organization
  topic VARCHAR(255),
  subtopic VARCHAR(255),
  tags TEXT[],
  
  -- Question resources
  image_url VARCHAR(500),
  audio_url VARCHAR(500),
  reference_links TEXT[],
  
  -- Question ordering
  sort_order INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz question options (for MCQ, multiple select, etc.)
CREATE TABLE quiz_question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  
  -- Option content
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  
  -- Option metadata
  explanation TEXT, -- Why this option is correct/incorrect
  
  -- Media
  image_url VARCHAR(500),
  
  -- Ordering
  sort_order INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- QUIZ ATTEMPTS & RESULTS
-- =============================================

-- Quiz attempts by users
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  
  -- Attempt details
  attempt_number INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken INTEGER, -- seconds
  
  -- Scoring
  total_questions INTEGER,
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  unanswered INTEGER DEFAULT 0,
  
  -- Marks calculation
  total_marks DECIMAL(8,2) DEFAULT 0,
  marks_obtained DECIMAL(8,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Performance analysis
  rank_overall INTEGER,
  rank_category INTEGER,
  percentile DECIMAL(5,2),
  
  -- HRM analysis
  reasoning_performance JSONB DEFAULT '{}',
  cognitive_load_analysis JSONB DEFAULT '{}',
  learning_insights JSONB DEFAULT '{}',
  recommended_study_areas TEXT[],
  
  -- Attempt status
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned', 'expired')),
  
  -- Device and environment
  device_info JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual question responses
CREATE TABLE quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  
  -- Response details
  selected_options UUID[], -- For MCQ/multiple select
  text_response TEXT, -- For essay/fill-in-blank
  numerical_response DECIMAL(10,4), -- For numerical questions
  
  -- Response metadata
  is_correct BOOLEAN,
  marks_awarded DECIMAL(5,2) DEFAULT 0,
  time_taken INTEGER, -- seconds
  
  -- Response analysis
  confidence_level DECIMAL(3,2), -- Self-reported or calculated
  reasoning_quality DECIMAL(3,2), -- HRM analysis
  
  -- Timestamps
  answered_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FLASHCARD SYSTEM (Enhanced from previous)
-- =============================================

-- Flashcard decks (enhanced version)
CREATE TABLE flashcard_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id), -- Optional: link to course
  subject_id UUID REFERENCES subjects(id),
  
  -- Deck information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Deck categorization
  category VARCHAR(100),
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  exam_type VARCHAR(50),
  
  -- Deck settings
  is_public BOOLEAN DEFAULT false,
  allow_collaboration BOOLEAN DEFAULT false,
  tags TEXT[],
  
  -- HRM integration
  hrm_optimized BOOLEAN DEFAULT false,
  adaptive_difficulty BOOLEAN DEFAULT true,
  reasoning_focus VARCHAR(50),
  
  -- Analytics
  total_cards INTEGER DEFAULT 0,
  total_studies INTEGER DEFAULT 0,
  average_retention_rate DECIMAL(5,2) DEFAULT 0.0,
  
  -- Sharing and collaboration
  shared_with UUID[], -- User IDs who have access
  original_deck_id UUID, -- If this is a copy of another deck
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual flashcards (enhanced version)
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  
  -- Card content
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  
  -- Card metadata
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  card_type VARCHAR(50) DEFAULT 'basic' CHECK (card_type IN ('basic', 'cloze', 'image', 'audio', 'reverse')),
  
  -- HRM fields
  reasoning_type VARCHAR(50) DEFAULT 'memory' CHECK (reasoning_type IN ('logical', 'analytical', 'memory', 'application')),
  cognitive_load DECIMAL(3,2) DEFAULT 0.5,
  multi_step_reasoning BOOLEAN DEFAULT false,
  
  -- Card enhancements
  hints TEXT[],
  explanation TEXT,
  mnemonics TEXT,
  related_concepts TEXT[],
  
  -- Media attachments
  front_image_url VARCHAR(500),
  back_image_url VARCHAR(500),
  audio_url VARCHAR(500),
  
  -- Card organization
  tags TEXT[],
  sort_order INTEGER,
  
  -- Analytics
  total_reviews INTEGER DEFAULT 0,
  average_quality DECIMAL(3,2) DEFAULT 0.0,
  success_rate DECIMAL(5,2) DEFAULT 0.0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced user flashcard progress (from previous implementation)
CREATE TABLE user_flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  
  -- Traditional spaced repetition fields
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Enhanced progress tracking
  quality_responses INTEGER[] DEFAULT '{}',
  total_reviews INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.0,
  average_response_time INTEGER DEFAULT 0, -- milliseconds
  difficulty_trend VARCHAR(20) DEFAULT 'stable' CHECK (difficulty_trend IN ('improving', 'stable', 'declining')),
  
  -- HRM enhancement fields
  reasoning_score DECIMAL(3,2) DEFAULT 0.0,
  adaptive_difficulty DECIMAL(3,2) DEFAULT 0.5,
  learning_trajectory JSONB DEFAULT '{}',
  cognitive_load_history DECIMAL(3,2)[] DEFAULT '{}',
  reasoning_depth_history DECIMAL(3,2)[] DEFAULT '{}',
  pattern_recognition_history DECIMAL(3,2)[] DEFAULT '{}',
  
  -- Personalization
  hrm_confidence_score DECIMAL(3,2) DEFAULT 0.5,
  personalized_interval_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  UNIQUE(user_id, flashcard_id)
);

-- HRM reasoning analysis sessions (from previous implementation)
CREATE TABLE reasoning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('flashcard', 'quiz', 'assessment', 'study')),
  content_id UUID, -- Reference to flashcard, quiz, etc.
  
  -- HRM analysis results
  reasoning_depth DECIMAL(3,2) DEFAULT 0.0,
  pattern_recognition DECIMAL(3,2) DEFAULT 0.0,
  cognitive_load DECIMAL(3,2) DEFAULT 0.0,
  problem_solving_approach VARCHAR(50),
  
  -- Learning insights
  cognitive_strengths TEXT[],
  improvement_areas TEXT[],
  study_recommendations TEXT[],
  recommended_difficulty DECIMAL(3,2),
  
  -- Session metadata
  duration_seconds INTEGER,
  confidence_level DECIMAL(3,2),
  questions_attempted INTEGER DEFAULT 0,
  
  -- Device and context
  device_info JSONB DEFAULT '{}',
  session_context JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENT & SUBSCRIPTION SYSTEM
-- =============================================

-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Plan features
  max_courses INTEGER, -- NULL for unlimited
  max_flashcard_decks INTEGER,
  max_quiz_attempts_per_day INTEGER,
  hrm_features_enabled BOOLEAN DEFAULT false,
  ai_quiz_generation BOOLEAN DEFAULT false,
  personal_mentor_access BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  
  -- Plan configuration
  trial_period_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '{}', -- Detailed feature list
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Subscription details
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  
  -- Payment information
  amount_paid DECIMAL(10,2),
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50), -- 'razorpay', 'stripe', etc.
  payment_reference VARCHAR(255),
  
  -- Subscription status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trial')),
  auto_renewal BOOLEAN DEFAULT true,
  
  -- Trial information
  is_trial BOOLEAN DEFAULT false,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('subscription', 'course_purchase', 'quiz_access', 'one_time')),
  reference_id UUID, -- References subscription, course, etc.
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50),
  
  -- Gateway information
  gateway_transaction_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  gateway_response JSONB DEFAULT '{}',
  
  -- Transaction status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Failure information
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS & PROGRESS TRACKING
-- =============================================

-- User study analytics
CREATE TABLE user_study_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Time tracking
  total_study_time INTEGER DEFAULT 0, -- minutes
  video_watch_time INTEGER DEFAULT 0,
  flashcard_study_time INTEGER DEFAULT 0,
  quiz_time INTEGER DEFAULT 0,
  
  -- Activity counts
  lessons_completed INTEGER DEFAULT 0,
  flashcards_reviewed INTEGER DEFAULT 0,
  quizzes_attempted INTEGER DEFAULT 0,
  notes_created INTEGER DEFAULT 0,
  
  -- Performance metrics
  average_quiz_score DECIMAL(5,2) DEFAULT 0.0,
  flashcard_retention_rate DECIMAL(5,2) DEFAULT 0.0,
  
  -- HRM analytics
  average_reasoning_depth DECIMAL(3,2) DEFAULT 0.0,
  average_cognitive_load DECIMAL(3,2) DEFAULT 0.0,
  learning_velocity DECIMAL(3,2) DEFAULT 1.0,
  
  -- Goals and streaks
  daily_goal_met BOOLEAN DEFAULT false,
  study_streak INTEGER DEFAULT 0,
  
  UNIQUE(user_id, date),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course analytics
CREATE TABLE course_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Enrollment metrics
  new_enrollments INTEGER DEFAULT 0,
  total_active_students INTEGER DEFAULT 0,
  dropout_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  
  -- Engagement metrics
  total_watch_time INTEGER DEFAULT 0, -- minutes
  average_session_duration INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  
  -- Performance metrics
  average_progress_percentage DECIMAL(5,2) DEFAULT 0.0,
  average_student_rating DECIMAL(3,2) DEFAULT 0.0,
  
  -- Revenue metrics
  revenue_generated DECIMAL(10,2) DEFAULT 0.0,
  
  UNIQUE(course_id, date),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS & COMMUNICATION
-- =============================================

-- Notification types and templates
CREATE TABLE notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Notification settings
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('system', 'course', 'quiz', 'payment', 'reminder', 'achievement')),
  delivery_methods VARCHAR(50)[] DEFAULT '{"in_app"}', -- in_app, email, sms, push
  
  -- Personalization
  is_personalized BOOLEAN DEFAULT false,
  variables JSONB DEFAULT '{}', -- Template variables
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications
CREATE TABLE user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES notification_templates(id),
  
  -- Notification content
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  
  -- Metadata
  reference_id UUID, -- Reference to course, quiz, etc.
  reference_type VARCHAR(50), -- 'course', 'quiz', 'payment', etc.
  
  -- Delivery status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery methods
  sent_in_app BOOLEAN DEFAULT true,
  sent_email BOOLEAN DEFAULT false,
  sent_sms BOOLEAN DEFAULT false,
  sent_push BOOLEAN DEFAULT false,
  
  -- Priority and urgency
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_exam_target ON users(exam_target);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- Course indexes
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_exam_type ON courses(exam_type);
CREATE INDEX idx_courses_subject_id ON courses(subject_id);
CREATE INDEX idx_courses_start_date ON courses(start_date);
CREATE INDEX idx_courses_is_featured ON courses(is_featured);

-- Enrollment indexes
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_enrolled_at ON enrollments(enrolled_at);

-- Quiz indexes
CREATE INDEX idx_quizzes_subject_id ON quizzes(subject_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- Flashcard indexes
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_user_flashcard_progress_user_id ON user_flashcard_progress(user_id);
CREATE INDEX idx_user_flashcard_progress_next_review ON user_flashcard_progress(next_review_date);

-- Analytics indexes
CREATE INDEX idx_user_study_analytics_user_date ON user_study_analytics(user_id, date);
CREATE INDEX idx_course_analytics_course_date ON course_analytics(course_id, date);
CREATE INDEX idx_reasoning_sessions_user_id ON reasoning_sessions(user_id);
CREATE INDEX idx_reasoning_sessions_created_at ON reasoning_sessions(created_at);

-- Notification indexes
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own flashcard progress" ON user_flashcard_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analytics" ON user_study_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON user_notifications FOR ALL USING (auth.uid() = user_id);

-- Admin policies (admins can access all data)
CREATE POLICY "Admins can manage all data" ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Instructor policies (instructors can access their course data)
CREATE POLICY "Instructors can view their course enrollments" ON enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE id = course_id AND primary_instructor_id = auth.uid()
  )
);
