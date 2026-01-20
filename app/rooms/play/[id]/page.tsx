
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
    Clock, 
    ArrowRight, 
    Check, 
    X, 
    Trophy, 
    List, 
    ArrowLeft, 
    Sparkles, 
    AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  imageUrl?: string;
  explanation?: string;
}

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function RoomPlayPage({ params }: PageProps) {
    const resolveParams = React.use(params);
    const { id } = resolveParams;
    const router = useRouter();
    const searchParams = useSearchParams();
    const reviewMode = searchParams.get('review') === 'true';
    
    const supabase = createClient();
    const { user } = useAuthStore();
    
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(600); // 10 mins
    const [isGameOver, setIsGameOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    // Fetch Quiz
    useEffect(() => {
        const fetchContent = async () => {
            if (!id) return;
            try {
                 const { data, error } = await supabase
                    .from('room_quizzes')
                    .select('questions')
                    .eq('room_id', id)
                    .single();
                 
                 if (error) throw error;
                 
                 let parsedQuestions: Question[] = [];
                 if (typeof data.questions === 'string') {
                      parsedQuestions = JSON.parse(data.questions);
                 } else {
                      parsedQuestions = data.questions;
                 }
                 setQuestions(parsedQuestions);
            } catch (err) {
                console.error(err);
                alert('Failed to load quiz');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        
        fetchContent();
    }, [id]);

    // Timer Logic
    useEffect(() => {
        if (!reviewMode && !loading && !isGameOver && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !reviewMode && !isGameOver) {
            handleFinish();
        }
    }, [loading, isGameOver, timeLeft, reviewMode]);

    const handleOptionSelect = (option: string) => {
        if (reviewMode) return;
        setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    };

    const handleNext = () => {
        const currentAnswer = answers[currentIndex];
        if (!currentAnswer) return;

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Calculate final score
            let finalScore = 0;
            questions.forEach((q, idx) => {
                if (answers[idx] === q.correctAnswer) {
                    finalScore++;
                }
            });
            handleFinish(finalScore); 
        }
    };

    const handleFinish = async (finalScoreValue?: number) => {
        setIsGameOver(true);
        const calcScore = finalScoreValue !== undefined ? finalScoreValue : score;
        setScore(calcScore);

        if (!user) return;

        try {
            await supabase
                .from('room_participants')
                .update({ 
                    score: calcScore * 10,
                    status: 'completed' 
                })
                .eq('room_id', id)
                .eq('user_id', user.id);
        } catch (err) {
            console.error('Error saving score:', err);
        }
    };

    // --- RENDER ---

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Quiz...</div>;
    
    // GAME OVER SCREEN
    if (isGameOver) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
                 <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-yellow-500/20 p-8 rounded-full mb-6"
                 >
                    <Trophy className="w-20 h-20 text-yellow-500" />
                 </motion.div>
                 <h1 className="text-4xl font-bold text-white mb-2">Quiz Completed!</h1>
                 <p className="text-gray-400 text-lg">You scored</p>
                 <div className="text-6xl font-bold text-[#FF6B58] my-6">{score * 10} XP</div>
                 
                 <div className="w-full max-w-md space-y-4">
                     <button 
                        onClick={() => router.push(`/rooms/${id}`)}
                        className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors"
                     >
                        View Leaderboard
                     </button>
                     <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-4 bg-gray-800 text-gray-400 rounded-xl font-bold text-lg hover:bg-gray-700 transition-colors"
                     >
                        Exit Room
                     </button>
                 </div>
            </div>
        );
    }

    // REVIEW MODE
    if (reviewMode) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => router.back()} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
                             <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Test Solutions</h1>
                    </div>
                    
                    <div className="space-y-12 pb-20">
                        {questions.map((q, index) => (
                            <div key={index} className="border-b border-gray-800 pb-8 last:border-0">
                                <div className="text-[#FF6B58] font-bold mb-2 uppercase tracking-wide text-sm">Question {index + 1}</div>
                                {q.imageUrl && (
                                    <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden bg-gray-800">
                                        <Image src={q.imageUrl} alt="Question Image" fill className="object-contain" />
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-6 leading-relaxed">{q.question}</h3>
                                
                                <div className="space-y-3 mb-6">
                                    {q.options.map((opt, idx) => {
                                        const isCorrect = opt === q.correctAnswer;
                                        return (
                                            <div key={idx} className={`p-4 rounded-xl border flex items-center gap-4 ${
                                                isCorrect 
                                                ? 'bg-green-900/20 border-green-500/50' 
                                                : 'bg-gray-800 border-gray-700 opacity-70'
                                            }`}>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                                                    isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-500'
                                                }`}>
                                                    {isCorrect && <Check className="w-4 h-4" />}
                                                </div>
                                                <span className={`text-base ${isCorrect ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                                    {opt}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-blue-900/10 border border-blue-500/30 p-5 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-sm uppercase">
                                        <Sparkles className="w-4 h-4" /> AI Explanation
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-sm">
                                        {q.explanation || "No explanation provided."}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) return <div className="text-white text-center mt-20">No questions found.</div>;

    const currentQ = questions[currentIndex];

    // PLAY MODE
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-800">
                 <div className="text-gray-400 font-bold">Q. {currentIndex + 1} <span className="text-gray-600">/ {questions.length}</span></div>
                 <div className="bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-gray-400" />
                     <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-white'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                     </span>
                 </div>
            </div>

            <div className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col">
                 <div className="my-4 flex-1">
                     {currentQ.imageUrl && (
                         <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
                             <Image src={currentQ.imageUrl} alt="Question" fill className="object-contain" />
                         </div>
                     )}
                     <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-8">
                         {currentQ.question}
                     </h2>

                    <div className="space-y-4">
                        {currentQ.options.map((option, idx) => {
                            const isSelected = answers[currentIndex] === option;
                            return (
                                <button
                                   key={idx}
                                   onClick={() => handleOptionSelect(option)}
                                   className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group ${
                                       isSelected 
                                       ? 'border-[#FF6B58] bg-[#FF6B58]/10' 
                                       : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                                   }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isSelected ? 'border-[#FF6B58]' : 'border-gray-500 group-hover:border-gray-400'
                                    }`}>
                                        {isSelected && <div className="w-3 h-3 rounded-full bg-[#FF6B58]" />}
                                    </div>
                                    <span className={`text-lg font-medium ${isSelected ? 'text-[#FF6B58]' : 'text-gray-300'}`}>
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                 </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 bg-gray-900 sticky bottom-0">
                <div className="max-w-2xl mx-auto flex gap-4">
                    {currentIndex > 0 && (
                        <button
                            onClick={() => setCurrentIndex(prev => prev - 1)}
                            className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 border border-gray-700 hover:bg-gray-750 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Prev
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={!answers[currentIndex]}
                        className={`flex-[2] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                            !answers[currentIndex] 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                            : 'bg-[#FF6B58] text-white hover:bg-[#E55A49] shadow-lg shadow-[#FF6B58]/20'
                        }`}
                    >
                        {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
