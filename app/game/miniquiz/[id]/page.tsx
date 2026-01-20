
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMiniQuizStore } from '@/stores/useMiniQuizStore';
import { createClient } from '@/utils/supabase/client';
import { 
    Loader2, 
    Timer, 
    X, 
    CheckCircle, 
    ChevronLeft, 
    AlertCircle, 
    ArrowLeft,
    Info,
    Clock,
    Trophy
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient();

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function MiniQuizGamePage({ params }: PageProps) {
    const resolveParams = React.use(params);
    const { id } = resolveParams;
    const router = useRouter();
    const { user } = useAuthStore();
    
    // Store Hooks
    const { 
        fetchQuestions, 
        currentQuestions, 
        loading, 
        submitScore, 
        checkParticipation, 
        userAttempt, 
        fetchLeaderboard, 
        leaderboard,
        quizzes,
        fetchQuizzes 
    } = useMiniQuizStore();

    const currentQuiz = quizzes.find(q => q.id === id);
    const maxTimeSeconds = (currentQuiz?.total_time_minutes || 5) * 60;

    // Local State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'review' | 'leaderboard'>('loading');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [answers, setAnswers] = useState<{questionId: string, isCorrect: boolean, selected: string}[]>([]);

    // Initialization
    useEffect(() => {
        const init = async () => {
            if (!id) return;
            
            // Ensure auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }

            // Parallel fetch of necessary data
            await Promise.all([
                fetchQuestions(id),
                checkParticipation(id),
                fetchLeaderboard(id),
                quizzes.length === 0 ? fetchQuizzes() : Promise.resolve()
            ]);
        };
        init();
    }, [id, router, fetchQuestions, checkParticipation, fetchLeaderboard, fetchQuizzes, quizzes.length, supabase.auth]);

    // Update Game State based on loaded data
    useEffect(() => {
        if (!loading && currentQuestions.length > 0) {
            // Wait for userAttempt to be determined
            // If userAttempt is not null, they already played -> Leaderboard
            // Else -> Start
            // But we need to ensure checkParticipation finished. loading covers it.
            if (userAttempt) {
                setGameState('leaderboard');
            } else {
                 setGameState('start');
            }
        } else if (!loading && currentQuestions.length === 0 && quizzes.length > 0) {
            // No questions found or error?
            // Maybe just stay in 'loading' or show error, but 'loading' prevents flash
        }
    }, [loading, userAttempt, currentQuestions.length, quizzes.length]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                setTimeElapsed(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Auto-finish on Timeout
    useEffect(() => {
        if (gameState === 'playing' && timeElapsed >= maxTimeSeconds) {
            finishGame();
        }
    }, [timeElapsed, gameState, maxTimeSeconds]);

    // Prevent leaving window (basic browser check)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (gameState === 'playing') {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [gameState]);


    const handleStart = () => {
        setGameState('playing');
    };

    const handleAnswer = (option: string) => {
        if (selectedOption) return; // Prevent double click

        setSelectedOption(option);
        const currentQ = currentQuestions[currentIndex];
        const correct = option === currentQ.correct_answer;
        
        setIsCorrect(correct);
        if (correct) setScore(s => s + 10); // 10 points per question

        // Save answer locally
        setAnswers([...answers, { questionId: currentQ.id, isCorrect: correct, selected: option }]);

        // Delay next question
        setTimeout(() => {
            if (currentIndex < currentQuestions.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setSelectedOption(null);
                setIsCorrect(null);
            } else {
                finishGame();
            }
        }, 1500);
    };

    const finishGame = async () => {
        let calcScore = score;
        if (selectedOption && isCorrect) {
            calcScore += 10;
        }
        
        await submitScore(id, calcScore, timeElapsed);
        await fetchLeaderboard(id);
        await checkParticipation(id);
        setGameState('leaderboard');
    };

    // --- RENDERERS ---

    if (loading || gameState === 'loading') {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-white mt-4 font-medium">Loading Quiz...</p>
            </div>
        );
    }

    // START SCREEN
    if (gameState === 'start' && !userAttempt) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center px-6 text-center">
                <div className="mb-8">
                    <h1 className="text-4xl text-white font-bold mb-4">Ready for Challenge?</h1>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">
                        You have <span className="text-white font-bold">{currentQuestions.length} questions</span>.<br/>
                        Complete them as fast as possible for maximum XP!
                    </p>
                </div>
                <button 
                    onClick={handleStart}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg shadow-orange-500/20 transform transition-transform active:scale-95"
                >
                    Start Quiz
                </button>
            </div>
        );
    }

    // LEADERBOARD / RESULTS
    if (gameState === 'leaderboard') {
        const myRank = leaderboard.findIndex(l => l.user_id === user?.id) + 1;

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-12">
                {/* Header */}
                <div className="bg-gray-900 px-6 py-6 flex items-center justify-between sticky top-0 z-10">
                    <button onClick={() => router.back()} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-white font-bold text-xl">Results</h2>
                    <button onClick={() => setGameState('review')} className="text-orange-500 font-bold hover:text-orange-400 px-2">
                        Review
                    </button>
                </div>

                {/* My Stats */}
                {userAttempt && (
                    <div className="bg-gray-900 pb-12 px-6 rounded-b-[40px] shadow-xl mb-8">
                        <div className="flex justify-center items-end mb-6">
                             <div className="text-7xl font-extrabold text-white tracking-tight">{userAttempt.score}</div>
                             <div className="text-gray-400 text-2xl font-medium mb-3 ml-2">pts</div>
                        </div>
                        <div className="flex justify-center gap-4">
                            <div className="bg-white/10 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Time</span>
                                <span className="text-white text-lg font-bold">
                                    {Math.floor(userAttempt.time_taken_seconds / 60)}m {userAttempt.time_taken_seconds % 60}s
                                </span>
                            </div>
                            <div className="bg-white/10 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Rank</span>
                                <span className="text-white text-lg font-bold">#{myRank > 0 ? myRank : '-'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard List */}
                <div className="max-w-md mx-auto px-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Leaderboard</h3>
                    <div className="space-y-3">
                        {leaderboard.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Be the first to complete this quiz!</p>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <div 
                                    key={entry.user_id}
                                    className={`flex items-center p-4 rounded-2xl border ${
                                        entry.user_id === user?.id 
                                        ? 'bg-orange-500/10 border-orange-500/30' 
                                        : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
                                    }`}
                                >
                                    <div className={`w-8 font-bold text-lg ${index < 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                                        #{index + 1}
                                    </div>
                                    <Avatar className="w-10 h-10 border border-gray-200 dark:border-zinc-700 mr-3">
                                        <AvatarImage src={entry.avatar_url} />
                                        <AvatarFallback>{entry.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 dark:text-white truncate pr-2">
                                            {entry.name || 'Anonymous User'}
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            {Math.floor(entry.time_taken_seconds / 60)}m {entry.time_taken_seconds % 60}s
                                        </div>
                                    </div>
                                    <div className="bg-teal-500/10 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full font-bold text-sm">
                                        {entry.score}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // REVIEW MODE
    if (gameState === 'review') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black font-sans">
                {/* Header */}
                <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center sticky top-0 z-10">
                    <button 
                        onClick={() => setGameState('leaderboard')}
                        className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white ml-2">Review Answers</h1>
                </div>

                <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                    {currentQuestions.map((q, idx) => (
                        <div key={q.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="font-bold text-gray-400 text-sm uppercase tracking-wider">Question {idx + 1}</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
                                {q.question_text}
                            </h3>

                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-4 rounded-xl mb-4">
                                <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1 block">Correct Answer</span>
                                <p className="text-green-800 dark:text-green-300 font-medium">{q.correct_answer}</p>
                            </div>

                            {q.explanation && (
                                <div className="flex gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl">
                                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                        {q.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // PLAYING STATE (Default)
    const currentQ = currentQuestions[currentIndex];
    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col max-w-2xl mx-auto w-full shadow-2xl">
            {/* Game Header */}
            <div className="px-6 py-6 pb-2">
                <div className="flex justify-between items-end mb-6">
                    <div className="text-gray-400 font-medium">
                        Question <span className="text-white text-xl font-bold ml-1">{currentIndex + 1}</span>
                        <span className="text-gray-600 text-sm mx-1">/</span>
                        <span className="text-gray-500">{currentQuestions.length}</span>
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                        maxTimeSeconds - timeElapsed < 60 
                        ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                        : 'bg-white/10 border-white/10 text-white'
                    }`}>
                        <Timer className="w-4 h-4" />
                        <span className="font-mono font-bold text-lg">
                            {Math.floor((maxTimeSeconds - timeElapsed) / 60)}:
                            {((maxTimeSeconds - timeElapsed) % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden w-full">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 px-6 py-8 flex flex-col">
                <div className="flex-1">
                    {currentQ?.image_url && (
                        <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 mb-6">
                            <Image 
                                src={currentQ.image_url} 
                                alt="Question Image" 
                                fill 
                                className="object-contain" 
                            />
                        </div>
                    )}
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-8">
                        {currentQ?.question_text || "Loading..."}
                    </h2>

                    <div className="space-y-3">
                        {currentQ?.options.map((option, idx) => {
                            const isSelected = selectedOption === option;
                            const showResult = isSelected && isCorrect !== null;
                            
                            let containerClass = "border-white/10 bg-white/5 hover:bg-white/10";
                            let icon = null;

                            if (showResult) {
                                if (isCorrect) {
                                    containerClass = "border-green-500/50 bg-green-500/20";
                                    icon = <CheckCircle className="w-6 h-6 text-green-500" />;
                                } else {
                                    containerClass = "border-red-500/50 bg-red-500/20";
                                    icon = <X className="w-6 h-6 text-red-500" />;
                                }
                            } else if (isSelected) {
                                containerClass = "border-white/30 bg-white/20";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    disabled={selectedOption !== null}
                                    className={`w-full p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-200 active:scale-[0.99] ${containerClass}`}
                                >
                                    <span className={`text-lg font-medium ${showResult && isCorrect ? 'text-green-400' : showResult && !isCorrect ? 'text-red-400' : 'text-gray-100'}`}>
                                        {option}
                                    </span>
                                    {icon}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple Avatar Component for internal use if import fails, but standard imports should work
function Avatar({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={`rounded-full overflow-hidden flex items-center justify-center bg-gray-200 ${className}`}>{children}</div>
}
function AvatarImage({ src }: { src?: string | null }) {
    if (!src) return null;
    return <img src={src} className="w-full h-full object-cover" alt="" />
}
function AvatarFallback({ children }: { children: React.ReactNode }) {
    return <span className="font-bold text-gray-500">{children}</span>
}
