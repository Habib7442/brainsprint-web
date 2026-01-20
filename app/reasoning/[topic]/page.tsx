
"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReasoningStore, ReasoningQuestion } from '@/stores/useReasoningStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { createClient } from '@/utils/supabase/client';
import { 
    Cpu, 
    List, 
    Clock, 
    TrendingUp, 
    BookOpen, 
    ArrowRight, 
    ChevronLeft, 
    Loader2,
    X,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';

// --- Sub Components ---

const StartScreen = ({ topicName }: { topicName: string }) => {
    const { startGame } = useReasoningStore();
    const router = useRouter();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black min-h-screen">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="bg-orange-100 dark:bg-orange-900/20 p-6 rounded-full mb-4">
                    <Cpu className="w-16 h-16 text-orange-500" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {decodeURIComponent(topicName)}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    AI-Powered Training
                </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 mb-8 w-full max-w-md">
                <div className="flex items-center mb-4">
                    <List className="w-6 h-6 text-teal-600" />
                    <span className="text-lg font-medium ml-3 text-gray-800 dark:text-gray-200">20 Questions</span>
                </div>
                <div className="flex items-center mb-4">
                    <Clock className="w-6 h-6 text-teal-600" />
                    <span className="text-lg font-medium ml-3 text-gray-800 dark:text-gray-200">10 Minutes</span>
                </div>
                <div className="flex items-center mb-4">
                    <TrendingUp className="w-6 h-6 text-teal-600" />
                    <span className="text-lg font-medium ml-3 text-gray-800 dark:text-gray-200">Adaptive Difficulty</span>
                </div>
                <div className="flex items-center">
                   <BookOpen className="w-6 h-6 text-teal-600" />
                   <span className="text-lg font-medium ml-3 text-gray-800 dark:text-gray-200">Topic: {decodeURIComponent(topicName)}</span>
               </div>
            </div>

            <button 
                onClick={() => startGame(decodeURIComponent(topicName))}
                className="w-full max-w-md group"
            >
                <div
                    className="py-4 rounded-2xl flex justify-center items-center bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold text-xl transition-transform active:scale-95 duration-200"
                >
                    <span className="mr-2">Start Session</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
            </button>
            
            <button 
                onClick={() => router.back()}
                className="mt-4 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
            >
                Back to Topics
            </button>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gray-50 dark:bg-black min-h-screen">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <h2 className="text-2xl font-bold mt-8 text-gray-900 dark:text-white text-center">
            AI is crafting your challenge...
        </h2>
        <p className="text-gray-500 mt-4 text-center">
            Generating 20 unique reasoning questions just for you.
        </p>
    </div>
);

const PlayScreen = () => {
    const { 
        questions, 
        currentIndex, 
        answers, 
        timeLeft, 
        nextQuestion, 
        prevQuestion,
        answerQuestion,
        finishGame,
        tick,
    } = useReasoningStore();
    
    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => tick(), 1000);
        return () => clearInterval(timer);
    }, [tick]);

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentIndex]);

    const currentQ = questions[currentIndex];
    
    // Safety check
    if (!currentQ) return <LoadingScreen />;

    const progress = (currentIndex + 1) / questions.length;
    
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleBackPress = () => {
        if (window.confirm("Quit Session? You will lose your progress.")) {
             useReasoningStore.getState().reset();
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black min-h-screen max-w-3xl mx-auto w-full shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <button onClick={handleBackPress}>
                    <X className="w-6 h-6 text-gray-500" />
                </button>
                <div className="flex items-center bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                    <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-500' : 'text-gray-500'}`} />
                    <span className={`font-medium ml-2 ${timeLeft < 60 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
                <span className="font-medium text-orange-500">
                    {currentIndex + 1}/{questions.length}
                </span>
            </div>

             {/* Progress Bar */}
             <div className="h-1 bg-gray-200 w-full">
                <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
            </div>

            <div ref={scrollRef} className="flex-1 px-6 pt-6 overflow-y-auto pb-24">
                {/* Difficulty Badge */}
                <div className="inline-block px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 mb-4">
                    <span className="text-teal-700 dark:text-teal-400 font-medium text-xs uppercase tracking-wider">
                        {currentQ.difficulty} Difficulty
                    </span>
                </div>

                {/* Question */}
                <h2 className="text-xl font-medium text-gray-900 dark:text-white leading-8 mb-8">
                    {currentQ.question}
                </h2>

                {/* Options */}
                <div className="space-y-4">
                    {currentQ.options.map((option: string, idx: number) => {
                        const isSelected = answers[currentQ.id] === option;
                        return (
                            <button
                                key={idx}
                                onClick={() => answerQuestion(currentQ.id, option)}
                                className={`w-full p-4 rounded-xl border-2 flex items-center transition-all ${
                                    isSelected 
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' 
                                    : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex justify-center items-center shrink-0 ${
                                    isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300 dark:border-zinc-500'
                                }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                </div>
                                <span className={`flex-1 text-left text-base ${
                                    isSelected ? 'text-orange-900 dark:text-orange-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button 
                    onClick={prevQuestion}
                    disabled={currentIndex === 0}
                    className={`px-6 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center ${
                        currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>

                {currentIndex === questions.length - 1 ? (
                    <button 
                        onClick={() => finishGame()}
                        className="flex-1 ml-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl flex justify-center items-center font-bold text-lg hover:shadow-lg transition-all active:scale-95"
                    >
                         <span className="mr-2">Submit Test</span>
                         <CheckCircle className="w-6 h-6" />
                    </button>
                ) : (
                    <button 
                        onClick={nextQuestion}
                        className="flex-1 ml-4 bg-gradient-to-r from-orange-400 to-amber-500 text-white py-3 rounded-xl flex justify-center items-center font-bold text-lg hover:shadow-lg transition-all active:scale-95"
                    >
                        <span className="mr-2">Next</span>
                        <ArrowRight className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    );
};

const SavingScreen = () => (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gray-50 dark:bg-black min-h-screen">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <h2 className="text-2xl font-bold mt-8 text-gray-900 dark:text-white text-center">
            Saving Progress...
        </h2>
        <p className="text-gray-500 mt-4 text-center">
            Syncing your victory to the cloud.
        </p>
    </div>
);

const ResultScreen = () => {
    const { questions, answers, score, reset, isSubmitting } = useReasoningStore();
    const router = useRouter();
    const percentage = Math.round((score / questions.length) * 100);

    return (
        <div className="flex-1 bg-gray-50 dark:bg-black min-h-screen max-w-3xl mx-auto w-full">
            <div className="px-6 py-8 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 sticky top-0">
                 <h2 className="text-center font-bold text-xl text-gray-900 dark:text-white mb-4">Session Complete!</h2>
                 <div className="flex justify-center items-center space-x-12">
                     <div className="text-center">
                         <div className="text-4xl font-bold text-orange-500">{score}/{questions.length}</div>
                         <div className="text-sm text-gray-500">Score</div>
                     </div>
                     <div className="w-px h-12 bg-gray-200 dark:bg-zinc-700" />
                     <div className="text-center">
                         <div className={`text-4xl font-bold ${percentage >= 80 ? 'text-teal-500' : 'text-amber-500'}`}>
                             {percentage}%
                         </div>
                         <div className="text-sm text-gray-500">Accuracy</div>
                     </div>
                 </div>
            </div>

            <div className="flex-1 px-6 pt-6 pb-32">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detailed Review</h3>
                
                {questions.map((q, index) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer === q.correctAnswer;
                    const isSkipped = !userAnswer;

                    return (
                        <div key={q.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-gray-500 text-xs uppercase">Question {index + 1}</span>
                                <div className={`px-2 py-0.5 rounded text-xs ${
                                    isCorrect ? 'bg-green-100 dark:bg-green-900/30' : isSkipped ? 'bg-gray-100 dark:bg-gray-800' : 'bg-red-100 dark:bg-red-900/30'
                                }`}>
                                    <span className={`text-xs font-bold ${
                                        isCorrect ? 'text-green-700 dark:text-green-400' : isSkipped ? 'text-gray-600 dark:text-gray-400' : 'text-red-700 dark:text-red-400'
                                    }`}>
                                        {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Wrong'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-900 dark:text-white font-medium mb-4 leading-6">{q.question}</p>

                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg mb-3">
                                <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                                <p className={`font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {userAnswer || 'Not Answered'}
                                </p>
                            </div>

                            {!isCorrect && (
                                <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg mb-3">
                                    <p className="text-xs text-green-700 dark:text-green-400 mb-1">Correct Answer</p>
                                    <p className="font-medium text-green-700 dark:text-green-400">
                                        {q.correctAnswer}
                                    </p>
                                </div>
                            )}

                            <div className="mt-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                                <p className="font-bold text-gray-700 dark:text-gray-300 mb-1 text-sm">Explanation:</p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-5">
                                    {q.explanation}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 fixed bottom-0 left-0 right-0 max-w-3xl mx-auto">
                <button 
                    onClick={() => {
                        reset();
                    }}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-4 rounded-2xl font-bold text-xl hover:shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
                    disabled={isSubmitting}
                >
                     {isSubmitting ? (
                         <Loader2 className="animate-spin text-white" />
                     ) : (
                         "Start New Session"
                     )}
                </button>
                 <button 
                    onClick={() => {
                        reset();
                        router.back();
                    }}
                    className="mt-3 w-full py-2 text-center text-gray-500 hover:text-gray-700 dark:text-gray-400 font-medium"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

interface PageProps {
    params: Promise<{
        topic: string;
    }>;
}

export default function ReasoningGamePage({ params }: PageProps) {
    const { status, reset } = useReasoningStore();
    const resolveParams = React.use(params);
    const topic = resolveParams.topic;
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) router.push('/auth');
        };
        checkUser();
    }, [router, supabase]);

    // Reset when component unmounts - actually mobile app resets on finish or manual quit, 
    // but here we might want to ensure fresh state if they navigated away and back.
    // But since store is global, we should be careful. 
    // The StartScreen handles "startGame" which resets state. So we are good.
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {status === 'idle' && <StartScreen topicName={topic} />}
            {status === 'generating' && <LoadingScreen />}
            {status === 'playing' && <PlayScreen />}
            {status === 'saving' && <SavingScreen />}
            {status === 'completed' && <ResultScreen />}
        </div>
    );
}
