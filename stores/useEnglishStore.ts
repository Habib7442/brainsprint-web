
import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from './useAuthStore';

// Reuse Question Interface
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

interface EnglishState {
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

const GAME_DURATION = 10 * 60; // 10 minutes for English
const supabase = createClient();

export const useEnglishStore = create<EnglishState>((set, get) => ({
  topic: 'Grammar',
  questions: [],
  currentIndex: 0,
  answers: {},
  timeLeft: GAME_DURATION,
  status: 'idle',
  isSubmitting: false,
  score: 0,

  startGame: async (topic = 'Grammar') => {
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
            subject: 'English Language (Grammar & Vocab)', 
            count: 20 
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
        
        // 1. Save Session
        const { error: sessionError } = await supabase.from('user_sessions').insert({
          user_id: user.id,
          category: 'english',
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

        if (sessionError) throw sessionError;

        // 2. Update Total XP and Exams Played
         const { error: updateError } = await supabase.rpc('increment_player_stats', { 
            xp_to_add: xpEarned,
            games_to_add: 1 
        });

        if (updateError) {
             const { data: profile } = await supabase.from('users').select('xp, games_played').eq('id', user.id).single();
             if (profile) {
                 await supabase.from('users').update({
                     xp: (profile.xp || 0) + xpEarned,
                     games_played: (profile.games_played || 0) + 1,
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
      topic: 'Grammar',
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
