
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEnglishStore } from '@/stores/useEnglishStore';
import { 
    Loader2, 
    ArrowLeft, 
    CheckCircle, 
    Clock, 
    ChevronLeft, 
    ChevronRight,
    Languages
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PageProps {
    params: Promise<{
        topic: string;
    }>;
}

export default function EnglishGamePage({ params }: PageProps) {
    const resolveParams = React.use(params);
    const { topic } = resolveParams;
    const router = useRouter();
    const decodedTopic = decodeURIComponent(topic);

    const { 
        status, 
        questions, 
        currentIndex, 
        answers, 
        timeLeft, 
        score,
        isSubmitting,
        startGame, 
        answerQuestion, 
        nextQuestion, 
        prevQuestion, 
        finishGame,
        tick,
        reset
    } = useEnglishStore();

    // Start Game
    useEffect(() => {
        startGame(decodedTopic);
        return () => reset(); // Cleanup on unmount
    }, [decodedTopic, startGame, reset]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'playing') {
            interval = setInterval(tick, 1000);
        }
        return () => clearInterval(interval);
    }, [status, tick]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (status === 'generating' || status === 'idle') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="mb-8"
                >
                    <Languages className="w-16 h-16 text-purple-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Curating English Set...</h2>
                <p className="text-gray-500 max-w-md">
                    Selecting {decodedTopic} questions tailored for competitive exams.
                </p>
            </div>
        );
    }

    if (status === 'completed' || status === 'saving') {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
                 <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 p-6 sticky top-0 z-20">
                     <h1 className="text-center font-bold text-xl text-gray-900 dark:text-white mb-4">Session Complete!</h1>
                     <div className="flex justify-center items-center gap-12">
                         <div className="text-center">
                             <div className="text-3xl font-bold text-purple-500 mb-1">{score}/{questions.length}</div>
                             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score</div>
                         </div>
                         <div className="w-px h-12 bg-gray-200 dark:bg-zinc-800" />
                         <div className="text-center">
                             <div className={`text-3xl font-bold mb-1 ${percentage >= 80 ? 'text-teal-500' : 'text-amber-500'}`}>
                                 {percentage}%
                             </div>
                             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accuracy</div>
                         </div>
                     </div>
                 </div>

                 <div className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-6 pb-32">
                     <h2 className="text-lg font-bold text-gray-900 dark:text-white">Detailed Review</h2>
                     {questions.map((q, idx) => {
                         const userAnswer = answers[q.id];
                         const isCorrect = userAnswer === q.correctAnswer;
                         return (
                             <div key={q.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                     <span className="font-bold text-gray-400 text-xs uppercase">Question {idx + 1}</span>
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                         {isCorrect ? 'Correct' : 'Wrong'}
                                     </span>
                                 </div>
                                 <h3 className="font-medium text-gray-900 dark:text-white mb-4 leading-relaxed">{q.question}</h3>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                     <div className={`p-3 rounded-xl text-sm ${isCorrect ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                                         <span className="block text-xs opacity-70 mb-1">Your Answer</span>
                                         <span className="font-bold">{userAnswer || 'Skipped'}</span>
                                     </div>
                                     {!isCorrect && (
                                         <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-sm text-purple-700 dark:text-purple-400">
                                             <span className="block text-xs opacity-70 mb-1">Correct Answer</span>
                                             <span className="font-bold">{q.correctAnswer}</span>
                                         </div>
                                     )}
                                 </div>
                                 
                                 <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                         <span className="font-bold text-gray-900 dark:text-white mr-2">Explanation:</span>
                                         {q.explanation}
                                     </p>
                                 </div>
                             </div>
                         );
                     })}
                 </div>

                 <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex justify-center gap-4 z-20">
                     <button 
                         onClick={() => router.back()}
                         className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                     >
                         Dashboard
                     </button>
                     <button 
                         onClick={() => startGame(decodedTopic)}
                         disabled={isSubmitting}
                         className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 flex items-center gap-2"
                     >
                         {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'New Session'}
                     </button>
                 </div>
            </div>
        );
    }

    // PLAYING STATE
    const currentQ = questions[currentIndex];
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans flex flex-col">
            {/* Game Header */}
            <div className="bg-white dark:bg-zinc-900 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                 <div className="flex items-center gap-4">
                     <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                         <ArrowLeft className="w-6 h-6" />
                     </button>
                     <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                         <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-500' : 'text-gray-500'}`} />
                         <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                             {formatTime(timeLeft)}
                         </span>
                     </div>
                 </div>
                 <div className="font-bold text-gray-400">
                     {currentIndex + 1} / {questions.length}
                 </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 dark:bg-zinc-800 w-full">
                <motion.div 
                    className="h-full bg-purple-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            <div className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col justify-center">
                 <div className="mb-8">
                     <span className="inline-block px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
                         {currentQ?.topic} • {currentQ?.difficulty}
                     </span>
                     <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                         {currentQ?.question}
                     </h2>
                 </div>

                 <div className="space-y-3">
                     {currentQ?.options.map((option, idx) => {
                         const isSelected = answers[currentQ.id] === option;
                         return (
                             <motion.button
                                 key={idx}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => answerQuestion(currentQ.id, option)}
                                 className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                                     isSelected 
                                     ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                                     : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-300 dark:hover:border-purple-900'
                                 }`}
                             >
                                 <div className="flex items-center gap-4 relative z-10">
                                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                         isSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-300 text-gray-400'
                                     }`}>
                                         {isSelected ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold text-sm">{String.fromCharCode(65 + idx)}</span>}
                                     </div>
                                     <span className={`text-lg font-medium ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                         {option}
                                     </span>
                                 </div>
                             </motion.button>
                         );
                     })}
                 </div>
            </div>

            {/* Footer */}
            <div className="bg-white dark:bg-zinc-900 p-6 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center max-w-2xl mx-auto w-full">
                 <button 
                     onClick={prevQuestion} 
                     disabled={currentIndex === 0}
                     className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                 >
                     <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-white" />
                 </button>

                 {currentIndex === questions.length - 1 ? (
                     <button 
                         onClick={finishGame}
                         className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center gap-2 transition-all"
                     >
                         Submit Test <CheckCircle className="w-5 h-5" />
                     </button>
                 ) : (
                     <button 
                         onClick={nextQuestion}
                         className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all"
                     >
                         Next Question <ChevronRight className="w-5 h-5" />
                     </button>
                 )}
            </div>
        </div>
    );
}
