# Create Next.js App Router structure with core components

import os

# Create directories
directories = [
    'app',
    'app/(auth)',
    'app/(auth)/login',
    'app/(auth)/signup',
    'app/(dashboard)',
    'app/(dashboard)/dashboard',
    'app/(dashboard)/courses',
    'app/(dashboard)/flashcards',
    'app/(dashboard)/quizzes',
    'app/(dashboard)/profile',
    'app/api',
    'app/api/auth',
    'app/api/courses',
    'app/api/flashcards',
    'components', 
    'components/ui',
    'components/auth',
    'components/dashboard',
    'lib',
    'types',
    'utils'
]

for directory in directories:
    os.makedirs(directory, exist_ok=True)

# Database types
database_types = '''
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          date_of_birth: string | null
          exam_category: 'UPSC' | 'SSC' | 'State PCS' | 'Banking' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          date_of_birth?: string | null
          exam_category?: 'UPSC' | 'SSC' | 'State PCS' | 'Banking' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          date_of_birth?: string | null
          exam_category?: 'UPSC' | 'SSC' | 'State PCS' | 'Banking' | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'UPSC' | 'SSC' | 'State PCS' | 'Banking'
          duration_months: number | null
          fee_amount: number | null
          batch_timing: string | null
          features: string[] | null
          instructor_id: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: 'UPSC' | 'SSC' | 'State PCS' | 'Banking'
          duration_months?: number | null
          fee_amount?: number | null
          batch_timing?: string | null
          features?: string[] | null
          instructor_id?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'UPSC' | 'SSC' | 'State PCS' | 'Banking'
          duration_months?: number | null
          fee_amount?: number | null
          batch_timing?: string | null
          features?: string[] | null
          instructor_id?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          course_id: string
          subject: string
          question: string
          answer: string
          difficulty_level: number | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          subject: string
          question: string
          answer: string
          difficulty_level?: number | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          subject?: string
          question?: string
          answer?: string
          difficulty_level?: number | null
          tags?: string[] | null
          created_at?: string
        }
      }
      user_flashcard_progress: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          ease_factor: number | null
          interval_days: number | null
          repetitions: number | null
          next_review_date: string
          last_reviewed: string | null
          quality: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flashcard_id: string
          ease_factor?: number | null
          interval_days?: number | null
          repetitions?: number | null
          next_review_date?: string
          last_reviewed?: string | null
          quality?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flashcard_id?: string
          ease_factor?: number | null
          interval_days?: number | null
          repetitions?: number | null
          next_review_date?: string
          last_reviewed?: string | null
          quality?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Flashcard = Database['public']['Tables']['flashcards']['Row']
export type FlashcardProgress = Database['public']['Tables']['user_flashcard_progress']['Row']
'''

# Main layout component
layout_tsx = '''
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { createServerSupabaseClient } from '@/lib/supabase'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kanchen Academy - Premier UPSC, SSC & Competitive Exam Coaching',
  description: 'Transform your dreams into civil service success with AI-powered learning tools and expert mentorship.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
'''

# Homepage
homepage_tsx = '''
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import CoursesSection from '@/components/CoursesSection'
import TestimonialsSection from '@/components/TestimonialsSection' 
import ContactSection from '@/components/ContactSection'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  
  // Fetch featured courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .limit(4)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <CoursesSection courses={courses || []} />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
'''

# Hero Section Component
hero_section_tsx = '''
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, BookOpen, Users, Trophy } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Transform Your Dreams into{' '}
            <span className="text-primary-600 relative">
              Civil Service Success
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-primary-200"
                viewBox="0 0 200 12"
                fill="currentColor"
              >
                <path d="M0 8c40-4 80-4 120 0s80 4 120 0v4c-40 4-80 4-120 0s-80-4-120 0z" />
              </svg>
            </span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-600 max-w-2xl">
            Join India&apos;s most innovative coaching institute combining traditional teaching 
            excellence with AI-powered learning tools. Specialized preparation for UPSC, SSC, 
            and State PCS examinations.
          </p>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-2">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">1000+</div>
              <div className="text-sm text-gray-600">Successful Students</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">50+</div>
              <div className="text-sm text-gray-600">Expert Faculty</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-2">
                <Trophy className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold"
              asChild
            >
              <Link href="/courses">
                Explore Courses
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg font-semibold"
              asChild
            >
              <Link href="/contact">
                Book Free Trial
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Right Content - Visual */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 p-8 lg:p-12">
            {/* Achievement Cards */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg p-4 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Rahul Mishra</div>
                    <div className="text-sm text-gray-600">IAS 2023, AIR 45</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-lg p-4 shadow-lg ml-8"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">AI-Powered Learning</div>
                    <div className="text-sm text-gray-600">Personalized study paths</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-lg p-4 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Expert Mentorship</div>
                    <div className="text-sm text-gray-600">Former civil servants</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
'''

# Write the files
with open('lib/database.types.ts', 'w') as f:
    f.write(database_types)

with open('app/layout.tsx', 'w') as f:
    f.write(layout_tsx)

with open('app/page.tsx', 'w') as f:
    f.write(homepage_tsx)

with open('components/HeroSection.tsx', 'w') as f:
    f.write(hero_section_tsx)

# CSS globals
globals_css = '''
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 157 45% 56%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 157 45% 56%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
'''

with open('app/globals.css', 'w') as f:
    f.write(globals_css)

print("✅ Core Next.js structure and components created!")
print("\n📁 Files created:")
print("- lib/database.types.ts")
print("- app/layout.tsx") 
print("- app/page.tsx")
print("- app/globals.css")
print("- components/HeroSection.tsx")
print("- Created directory structure for Next.js App Router")