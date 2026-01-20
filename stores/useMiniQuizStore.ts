
import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export interface MiniQuiz {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  total_time_minutes: number;
  is_active: boolean;
  thumbnail_url: string | null;
  created_at: string;
}

export interface MiniQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  image_url: string | null;
  explanation: string | null;
  order_index: number;
}

export interface MiniQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  time_taken_seconds: number;
  status: 'in_progress' | 'completed';
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string;
  score: number;
  time_taken_seconds: number;
}

interface MiniQuizState {
  quizzes: MiniQuiz[];
  currentQuestions: MiniQuizQuestion[];
  leaderboard: LeaderboardEntry[];
  userAttempt: MiniQuizAttempt | null;
  loading: boolean;
  error: string | null;
  
  fetchQuizzes: () => Promise<void>;
  fetchQuestions: (quizId: string) => Promise<void>;
  submitScore: (quizId: string, score: number, timeTaken: number) => Promise<boolean>;
  fetchLeaderboard: (quizId: string) => Promise<void>;
  checkParticipation: (quizId: string) => Promise<void>;
}

export const useMiniQuizStore = create<MiniQuizState>((set, get) => ({
  quizzes: [],
  currentQuestions: [],
  leaderboard: [],
  userAttempt: null,
  loading: false,
  error: null,

  fetchQuizzes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('mini_quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ quizzes: data || [] });
    } catch (err: any) {
      console.error('Error fetching mini quizzes:', err);
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchQuestions: async (quizId: string) => {
    set({ loading: true, error: null, currentQuestions: [] });
    try {
        const { data, error } = await supabase
            .from('mini_quiz_questions')
            .select('id, quiz_id, question_text, options, correct_answer, image_url, explanation, order_index')
            .eq('quiz_id', quizId)
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        set({ currentQuestions: data || [] });
    } catch (err: any) {
        console.error('Error fetching questions', err);
        set({ error: err.message });
    } finally {
        set({ loading: false });
    }
  },

  checkParticipation: async (quizId: string) => {
     set({ loading: true });
     try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         const { data, error } = await supabase
            .from('mini_quiz_attempts')
            .select('*')
            .eq('quiz_id', quizId)
            .eq('user_id', user.id)
            .single();
         
         if (error && error.code !== 'PGRST116') throw error; // Ignore not found
         
         set({ userAttempt: data || null });
     } catch (err) {
         console.error('Check participation error', err);
     } finally {
         set({ loading: false });
     }
  },

  submitScore: async (quizId: string, score: number, timeTaken: number) => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const { error } = await supabase
            .from('mini_quiz_attempts')
            .upsert({
                quiz_id: quizId,
                user_id: user.id,
                score,
                time_taken_seconds: timeTaken,
                status: 'completed',
                completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,quiz_id' });

          if (error) throw error;
          return true;
      } catch (err: any) {
          console.error('Submit score error', err);
          set({ error: err.message });
          return false;
      }
  },

  fetchLeaderboard: async (quizId: string) => {
    try {
        const { data, error } = await supabase.rpc('get_mini_quiz_leaderboard', { p_quiz_id: quizId });
        if (error) throw error;
        set({ leaderboard: data || [] });
    } catch (err: any) {
        console.error('Fetch leaderboard error', err);
        set({ leaderboard: [] });
    }
  }

}));
