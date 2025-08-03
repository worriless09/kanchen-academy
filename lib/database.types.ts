
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
