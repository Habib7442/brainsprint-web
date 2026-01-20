
import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from './useAuthStore';

// Define the shape of a Question
export interface ReasoningQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

interface ReasoningState {
  topic: string;
  questions: ReasoningQuestion[];
  currentIndex: number;
  answers: Record<string, string>; // questionId -> selectedOption
  timeLeft: number; // in seconds
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

const GAME_DURATION = 10 * 60; // 10 minutes
const supabase = createClient();

export const useReasoningStore = create<ReasoningState>((set, get) => ({
  topic: 'Coding-Decoding',
  questions: [],
  currentIndex: 0,
  answers: {},
  timeLeft: GAME_DURATION,
  status: 'idle',
  isSubmitting: false,
  score: 0,

  startGame: async (topic = 'Coding-Decoding') => {
    set({ topic, status: 'generating', questions: [], answers: {}, currentIndex: 0, timeLeft: GAME_DURATION });
    await get().generate();
  },

  generate: async () => {
    try {
      const { topic } = get();
      
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: 20 })
      });

      if (!response.ok) {
          throw new Error('Failed to generate questions');
      }

      const questions = await response.json();
      set({ questions, status: 'playing' });
    } catch (error) {
      console.error('Failed to generate questions:', error);
      set({ status: 'idle' });
      // You might want to set an error state here to show in UI
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
    
    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    // Set saving status first
    set({ status: 'saving', score: correctCount, isSubmitting: true });

    if (user) {
      try {
        // Saving session to DB...

        const { data, error } = await supabase.from('user_sessions').insert({
          user_id: user.id,
          category: 'reasoning',
          sub_type: topic,
          session_type: 'ai_generated',
          total_questions: questions.length,
          correct_answers: correctCount,
          xp_earned: correctCount * 10,
          duration_minutes: +((GAME_DURATION - timeLeft) / 60).toFixed(2),
           metadata: { 
             questions: questions, 
             user_answers: answers
           }
        }).select();

        if (error) {
            console.error('Supabase Insert Error:', error);
            throw error;
        }

        // 2. Update Total XP
        const { error: updateError } = await supabase.rpc('increment_player_stats', { 
            xp_to_add: correctCount * 10
        });

        if (updateError) {
             console.warn('Reasoning RPC failed:', updateError.message);
             const { data: profile } = await supabase.from('users').select('total_xp').eq('id', user.id).single();
             if (profile) {
                 await supabase.from('users').update({
                     total_xp: (profile.total_xp || 0) + (correctCount * 10),
                     last_active_at: new Date().toISOString()
                 }).eq('id', user.id);
             }
        }

      } catch (err: any) {
        console.error('Save Session Error:', err);
      } finally {
        set({ status: 'completed', isSubmitting: false });
      }
    } else {
        set({ status: 'completed', isSubmitting: false });
    }
  },

  reset: () => {
    set({
      topic: 'Coding-Decoding',
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
