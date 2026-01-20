
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Zap, 
    Trophy, 
    Clock, 
    CheckCircle2, 
    XCircle,
    Brain,
    Rocket,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { FORMULA_DATA, FormulaQuestion } from '@/lib/data/formulas';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MathRenderer from '@/components/MathRenderer';

export default function FormulaCompletionGame() {
    const router = useRouter();
    const supabase = createClient();
    
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [questions, setQuestions] = useState<FormulaQuestion[]>([]);
    const [timeLeft, setTimeLeft] = useState(15);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [xpEarned, setXpEarned] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    const [selectedChapter, setSelectedChapter] = useState<string>('All');
    const chapters = ['All', 'Mensuration', 'Trigonometry', 'Algebra', 'Geometry', 'Arithmetic'];

    // Initialize Game via AI
    const startGame = async (chapter: string = selectedChapter) => {
        setLoadingQuestions(true);
        try {
            const response = await fetch('/api/generate-formulas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapter, count: 25 })
            });
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            setQuestions(data);
            setGameState('playing');
            setCurrentIndex(0);
            setScore(0);
            setTimeLeft(15);
            setGameStartTime(new Date());
        } catch (err) {
            console.error("AI Generation Failed, falling back to local data:", err);
            // Fallback to local data
            let pool = [...FORMULA_DATA];
            if (chapter !== 'All') {
                pool = pool.filter(f => f.chapter === chapter);
            }
            if (pool.length === 0) pool = FORMULA_DATA;
            const shuffled = pool.sort(() => 0.5 - Math.random());
            setQuestions(shuffled.slice(0, 25));
            setGameState('playing');
            setCurrentIndex(0);
            setScore(0);
            setTimeLeft(15);
            setGameStartTime(new Date());
        } finally {
            setLoadingQuestions(false);
        }
    };

    // Handle Finish
    const finishGame = useCallback(async (finalScore: number) => {
        setGameState('result');
        const xp = finalScore * 10;
        setXpEarned(xp);
        
        const durationSec = gameStartTime ? Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000) : 0;
        setDurationSeconds(durationSec);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const duration = gameStartTime ? (new Date().getTime() - gameStartTime.getTime()) / 60000 : 0;
                
                // Save Session
                await supabase.from('user_sessions').insert({
                    user_id: user.id,
                    category: 'Mathematics',
                    sub_type: 'Formula Sprint',
                    total_questions: questions.length,
                    correct_answers: finalScore,
                    duration_minutes: duration,
                    xp_earned: xp,
                    metadata: {
                        questions: questions,
                        user_answers: userAnswers
                    }
                });

                // Update Stats
                await supabase.rpc('increment_player_stats', {
                    xp_to_add: xp
                });
            }
        } catch (err) {
            console.error("Error saving game results:", err);
        }
    }, [questions, userAnswers, supabase, gameStartTime]);

    // Timer Logic
    useEffect(() => {
        if (gameState !== 'playing') return;

        if (timeLeft <= 0) {
            handleAnswer(""); // Treat as wrong
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, gameState]);

    const handleAnswer = (answer: string) => {
        const currentQ = questions[currentIndex];
        const isCorrect = answer === currentQ.correctPart;
        
        if (isCorrect) setScore(prev => prev + 1);
        
        const newUserAnswers = { ...userAnswers, [currentQ.id]: answer };
        setUserAnswers(newUserAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimeLeft(15); // Reset timer for next Q
        } else {
            finishGame(isCorrect ? score + 1 : score);
        }
    };

    if (gameState === 'intro') {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full text-center space-y-8"
                >
                    <div className="w-24 h-24 bg-teal-500/20 rounded-3xl flex items-center justify-center mx-auto border border-teal-500/30">
                        <Zap className="w-12 h-12 text-teal-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black mb-3">Formula Sprint</h1>
                        <p className="text-gray-400">Complete the formulas under pressure. High accuracy = High XP.</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4">
                        <div className="flex gap-4">
                            <Clock className="w-5 h-5 text-teal-400 shrink-0" />
                            <p className="text-sm text-gray-300">15 Seconds per formula</p>
                        </div>
                        <div className="flex gap-4">
                            <Brain className="w-5 h-5 text-purple-400 shrink-0" />
                            <p className="text-sm text-gray-300">25 High-stakes questions</p>
                        </div>
                        <div className="flex gap-4">
                            <Rocket className="w-5 h-5 text-orange-400 shrink-0" />
                            <p className="text-sm text-gray-300">Earn up to 250 XP per session</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-left">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-3 block">Select Focus Chapter</label>
                            <div className="grid grid-cols-2 gap-2">
                                {chapters.map(chapter => (
                                    <button
                                        key={chapter}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                                            selectedChapter === chapter
                                            ? 'bg-teal-500 border-teal-500 text-black shadow-[0_0_20px_rgba(45,212,191,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                        }`}
                                    >
                                        {chapter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={() => startGame()}
                        disabled={loadingQuestions}
                        className="w-full h-16 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loadingQuestions ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                GENERATING FORMULAS...
                            </div>
                        ) : 'START SPRINT'}
                    </Button>
                    
                    <Link href="/dashboard" className="block text-gray-500 font-bold hover:text-white transition-colors">
                        Back to Dashboard
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'playing') {
        const currentQ = questions[currentIndex];
        const progress = ((currentIndex) / questions.length) * 100;

        return (
            <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
                <div className="max-w-4xl mx-auto flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-xl font-bold">
                                {currentIndex + 1}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-400 uppercase text-xs tracking-widest">{currentQ.chapter}</h2>
                                <p className="font-black text-white">Question {currentIndex + 1} of 25</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                            <Clock className={`w-5 h-5 ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-teal-400'}`} />
                            <span className={`text-xl font-black ${timeLeft < 5 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/5 rounded-full mb-16 overflow-hidden">
                        <motion.div 
                            className="h-full bg-teal-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Question Card */}
                    <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 flex flex-col justify-center items-center text-center space-y-12"
                    >
                        <div className="space-y-6">
                            <div className="text-2xl font-bold text-gray-400 tracking-tight">
                                <MathRenderer text={currentQ.formulaHead.startsWith('$') ? currentQ.formulaHead : `$${currentQ.formulaHead}$`} />
                            </div>
                            <div className="text-5xl md:text-7xl font-black tracking-tight">
                                <MathRenderer 
                                    text={(() => {
                                        const t = currentQ.template.replace('[?]', '\\color{#2DD4BF}{\\boxed{\\text{ ? }}}');
                                        return t.startsWith('$') ? t : `$${t}$`;
                                    })()} 
                                    className="leading-none" 
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                            {currentQ.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt)}
                                    className="p-6 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center hover:bg-white/10 hover:border-teal-500/50 transition-all active:scale-95 group"
                                >
                                    <div className="text-xl font-bold group-hover:text-teal-400 transition-colors">
                                        <MathRenderer text={opt} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[40px] p-10 text-center shadow-2xl overflow-hidden relative"
            >
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(45,212,191,0.4)]">
                        <Trophy className="w-10 h-10 text-black" />
                    </div>
                    
                    <h2 className="text-4xl font-black mb-2">Sprint Result</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-10">Maths Formula Vault</p>

                    <div className="grid grid-cols-3 gap-3 mb-10">
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                            <div className="text-2xl font-black text-teal-400">{score}/25</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Accuracy</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                            <div className="text-2xl font-black text-orange-400">+{xpEarned}</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">XP Earned</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                            <div className="text-2xl font-black text-blue-400">
                                {Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Time</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button 
                            onClick={() => startGame()}
                            className="w-full h-14 rounded-2xl bg-white text-black font-black hover:bg-gray-200 transition-all active:scale-95"
                        >
                            TRY AGAIN
                        </Button>
                        <Button 
                            variant="outline"
                            className="w-full h-14 rounded-2xl border-white/10 bg-transparent text-white font-bold hover:bg-white/5 transition-all"
                            asChild
                        >
                            <Link href="/dashboard">BACK TO DASHBOARD</Link>
                        </Button>
                    </div>
                </div>

                {/* Decorative background for result */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full -mr-32 -mt-32" />
            </motion.div>
        </div>
    );
}
