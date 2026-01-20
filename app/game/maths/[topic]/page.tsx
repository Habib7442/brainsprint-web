"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMathsStore } from '@/stores/useMathsStore';
import { 
    Loader2, 
    ArrowLeft, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    ChevronLeft, 
    ChevronRight,
    Calculator,
    Download,
    XCircle,
    FileText,
    Trophy,
    Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathRenderer } from '@/components/MathRenderer';

interface PageProps {
    params: Promise<{
        topic: string;
    }>;
}

export default function MathsGamePage({ params }: PageProps) {
    const resolveParams = React.use(params);
    const { topic } = resolveParams;
    const router = useRouter();
    const decodedTopic = decodeURIComponent(topic);
    const resultRef = useRef<HTMLDivElement>(null);

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
    } = useMathsStore();

    const [subTopic, setSubTopic] = useState('');
    
    // Cleanup on unmount
    useEffect(() => {
        return () => reset();
    }, [reset]);

    const handleStart = () => {
        const query = subTopic.trim() 
            ? `${decodedTopic} (Focus: ${subTopic.trim()})` 
            : decodedTopic;
        startGame(query);
    };

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

    const handlePrint = () => {
        window.print();
    };

    if (status === 'idle') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <button onClick={() => router.back()} className="mb-8 p-3 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-white" />
                    </button>
                    
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-xl">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                            <Calculator className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{decodedTopic}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            customize your practice session.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                    Specific Focus (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={subTopic}
                                    onChange={(e) => setSubTopic(e.target.value)}
                                    placeholder="Ex: Train problems, Circular tracks..."
                                    className="w-full p-4 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Leave empty for a general mix of questions.
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Questions will be of <strong>Mixed Difficulty</strong> to simulate real exam conditions.
                                </p>
                            </div>

                            <button 
                                onClick={handleStart}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                Start Quiz <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'generating') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="mb-8"
                >
                    <Calculator className="w-16 h-16 text-blue-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Generating Questions...</h2>
                <p className="text-gray-500 max-w-md">
                    Creating custom {subTopic ? subTopic : decodedTopic} questions...
                </p>
            </div>
        );
    }

    if (status === 'saving') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center z-50">
                <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="mb-8 p-6 bg-blue-50 dark:bg-zinc-800 rounded-full"
                >
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Saving Your Progress...</h2>
                <p className="text-gray-500 max-w-md">
                    Please wait while we record your results and update the leaderboard.
                </p>
            </div>
        );
    }

    if (status === 'completed') {
        const percentage = Math.round((score / questions.length) * 100);
        const accuracyColor = percentage >= 80 ? 'text-teal-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500';
        const accuracyBg = percentage >= 80 ? 'bg-teal-500/10' : percentage >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10';

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col print:bg-white inset-0">
                 {/* Header - Hidden in Print */}
                 <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 p-4 sticky top-0 z-20 print:hidden">
                     <div className="max-w-4xl mx-auto flex justify-between items-center">
                         <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                             <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-white" />
                         </button>
                         <h1 className="font-bold text-lg text-gray-900 dark:text-white">Result & Review</h1>
                         <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm hover:bg-blue-100 transition-colors">
                             <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download PDF</span>
                         </button>
                     </div>
                 </div>

                 <div ref={resultRef} className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8 pb-32 print:p-0 print:pb-0">
                     
                     {/* Score Card */}
                     <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 text-center print:border-none print:shadow-none">
                         <div className="inline-flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-full mb-4">
                             <Trophy className="w-10 h-10 text-yellow-500" />
                         </div>
                         <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                         <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                             You completed the <strong>{decodedTopic}</strong> set. Here is your performance summary.
                         </p>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                             <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                 <div className="text-3xl font-bold text-blue-500 mb-1">{score}</div>
                                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score</div>
                             </div>
                             <div className={`p-4 rounded-2xl ${accuracyBg}`}>
                                 <div className={`text-3xl font-bold ${accuracyColor}`}>{percentage}%</div>
                                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accuracy</div>
                             </div>
                             <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                 <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{questions.length}</div>
                                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Questions</div>
                             </div>
                             <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                 <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{questions.length - score}</div>
                                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Incorrect</div>
                             </div>
                         </div>
                     </div>

                     {/* Breakdown List */}
                     <div className="space-y-6">
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white px-2">Detailed Analysis</h3>
                         {questions.map((q, idx) => {
                             const userAnswer = answers[q.id];
                             const isCorrect = userAnswer === q.correctAnswer;
                             return (
                                 <div key={q.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm print:break-inside-avoid print:border-gray-200">
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                 {idx + 1}
                                             </div>
                                             <span className={`text-sm font-bold uppercase ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                 {isCorrect ? 'Correct' : 'Incorrect'}
                                             </span>
                                         </div>
                                     </div>

                                     <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
                                         <MathRenderer text={q.question} />
                                     </h3>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                         <div className={`p-4 rounded-2xl border-l-4 ${
                                             isCorrect 
                                             ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-900/10 dark:text-green-100' 
                                             : 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/10 dark:text-red-100'
                                         }`}>
                                             <div className="text-xs opacity-70 mb-1 uppercase tracking-wide font-bold">Your Answer</div>
                                             <div className="font-bold text-lg"><MathRenderer text={userAnswer || 'Skipped'} /></div>
                                         </div>
                                         {!isCorrect && (
                                             <div className="p-4 rounded-2xl border-l-4 border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/10 dark:text-blue-100">
                                                 <div className="text-xs opacity-70 mb-1 uppercase tracking-wide font-bold">Correct Answer</div>
                                                 <div className="font-bold text-lg"><MathRenderer text={q.correctAnswer} /></div>
                                             </div>
                                         )}
                                     </div>
                                     
                                     <div className="bg-gray-50 dark:bg-zinc-800/50 p-5 rounded-2xl print:bg-gray-50">
                                         <div className="flex items-center gap-2 mb-2">
                                             <FileText className="w-4 h-4 text-blue-500" />
                                             <span className="font-bold text-gray-900 dark:text-white text-sm uppercase">Explanation</span>
                                         </div>
                                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                                             <MathRenderer text={q.explanation} block />
                                         </p>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>

                 {/* Sticky Footer */}
                 <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex justify-center gap-4 z-20 print:hidden">
                     <button 
                         onClick={() => router.push('/dashboard')}
                         className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                     >
                         Dashboard
                     </button>
                     <button 
                         onClick={() => startGame(decodedTopic)}
                         disabled={isSubmitting}
                         className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2"
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
                    className="h-full bg-blue-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            <div className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col justify-center">
                 <div className="mb-8">
                     <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                         {currentQ?.topic} • {currentQ?.difficulty}
                     </span>
                     <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                         <MathRenderer text={currentQ?.question} />
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
                                     ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                     : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-900'
                                 }`}
                             >
                                 <div className="flex items-center gap-4 relative z-10">
                                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                         isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-400'
                                     }`}>
                                         {isSelected ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold text-sm">{String.fromCharCode(65 + idx)}</span>}
                                     </div>
                                     <span className={`text-lg font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                         <MathRenderer text={option} />
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
                         className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
                     >
                         Next Question <ChevronRight className="w-5 h-5" />
                     </button>
                 )}
            </div>
        </div>
    );
}
