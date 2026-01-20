
import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from './useAuthStore';

// Reuse the question interface
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

interface MathsState {
  topic: string;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  timeLeft: number;
  status: 'idle' | 'generating' | 'playing' | 'saving' | 'completed';
  isSubmitting: boolean;
  score: number;
  
  startGame: (topic?: string) => Promise<void>;
  generate: () => Promise<void>;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  tick: () => void;
  finishGame: () => Promise<void>;
  reset: () => void;
  setIndex: (index: number) => void;
}

const GAME_DURATION = 15 * 60; // 15 minutes for Maths (calculated time)
const supabase = createClient();

export const useMathsStore = create<MathsState>((set, get) => ({
  topic: 'Percentage',
  questions: [],
  currentIndex: 0,
  answers: {},
  timeLeft: GAME_DURATION,
  status: 'idle',
  isSubmitting: false,
  score: 0,

  startGame: async (topic = 'Percentage') => {
    set({ topic, status: 'generating', questions: [], answers: {}, currentIndex: 0, timeLeft: GAME_DURATION });
    await get().generate();
  },

  generate: async () => {
    try {
      const { topic } = get();
      
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            topic, 
            subject: 'Quantitative Aptitude (Maths)', 
            count: 15 // Maths takes longer, so maybe fewer questions or stick to 20? User said "like reasoning" which is 20. Let's keep 15 to ensure quality and strict time. Or 20. Let's do 15 for Maths 15mins.
        })
      });

      if (!response.ok) {
          throw new Error('Failed to generate questions');
      }

      const questions = await response.json();
      set({ questions, status: 'playing' });
    } catch (error) {
      console.error('Failed to generate questions:', error);
      set({ status: 'idle' });
    }
  },

  answerQuestion: (questionId, answer) => {
    const { status } = get();
    if (status !== 'playing') return;
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer }
    }));
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },
  
  setIndex: (index: number) => {
      set({ currentIndex: index });
  },

  tick: () => {
    const { timeLeft, status, finishGame } = get();
    if (status !== 'playing') return;
    
    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else {
      finishGame();
    }
  },

  finishGame: async () => {
    const { questions, answers, topic, timeLeft } = get();
    const { user } = useAuthStore.getState();
    
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    set({ status: 'saving', score: correctCount, isSubmitting: true });

    if (user) {
      try {
        const xpEarned = correctCount * 10;
        
        // Run critical tasks in parallel for speed
        const sessionPromise = supabase.from('user_sessions').insert({
          user_id: user.id,
          category: 'maths',
          sub_type: topic,
          session_type: 'ai_generated',
          total_questions: questions.length,
          correct_answers: correctCount,
          xp_earned: xpEarned,
          duration_minutes: +((GAME_DURATION - timeLeft) / 60).toFixed(2),
           metadata: { 
             questions: questions, 
             user_answers: answers
           }
        });

        const statsPromise = supabase.rpc('increment_player_stats', { 
            xp_to_add: xpEarned
        });

        // Wait for both
        const [sessionResult, statsResult] = await Promise.all([sessionPromise, statsPromise]);

        // 1. Session check (Critical)
        if (sessionResult.error) throw sessionResult.error;

        // 2. Stats check (Non-critical but important for leaderboard)
        if (statsResult.error) {
             console.warn('RPC status update failed, trying manual update:', statsResult.error.message);
             
             // Fallback: Manual Update (sequential but rare)
             const { data: profile } = await supabase
                .from('users')
                .select('total_xp')
                .eq('id', user.id)
                .single();
             
             if (profile) {
                 await supabase.from('users').update({
                     total_xp: (profile.total_xp || 0) + xpEarned,
                     last_active_at: new Date().toISOString()
                 }).eq('id', user.id);
             }
        }

      } catch (err: any) {
        console.error('CRITICAL SAVE ERROR:', err);
        // Important: You might want to show this to the user via toast/alert
      } finally {
        set({ status: 'completed', isSubmitting: false });
      }
    } else {
        set({ status: 'completed', isSubmitting: false });
    }
  },

  reset: () => {
    set({
      topic: 'Percentage',
      questions: [],
      currentIndex: 0,
      answers: {},
      timeLeft: GAME_DURATION,
      status: 'idle',
      isSubmitting: false,
      score: 0
    });
  }
}));
