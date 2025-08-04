
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import HeroSection from '@/components/features/HeroSection'
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
