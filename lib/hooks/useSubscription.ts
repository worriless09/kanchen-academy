import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useAuth';

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  expires_at: string;
  billing_cycle: string;
  subscription_plans: {
    name: string;
    display_name: string;
    hrm_features_enabled: boolean;
    max_courses: number;
    max_flashcard_decks: number;
    max_quiz_attempts_per_day: number;
  };
}

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;

    switch (feature) {
      case 'hrm_features':
        return subscription.subscription_plans.hrm_features_enabled;
      case 'unlimited_courses':
        return subscription.subscription_plans.max_courses === null;
      case 'unlimited_flashcards':
        return subscription.subscription_plans.max_flashcard_decks === null;
      default:
        return false;
    }
  };

  const isPremium = subscription?.subscription_plans.name !== 'free';
  const isExpired = subscription ? new Date(subscription.expires_at) < new Date() : false;

  return {
    subscription,
    loading,
    isPremium,
    isExpired,
    hasFeature,
    refreshSubscription: fetchSubscription,
  };
}