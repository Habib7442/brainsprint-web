"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReasoningStore } from "@/stores/useReasoningStore";
import { 
  ArrowLeft, Timer, HelpCircle, CheckCircle2, 
  XCircle, RotateCcw, Loader2, 
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import MathRenderer from "@/components/MathRenderer";

export default function ReasoningGamePage() {
  const { topic } = useParams();
  const router = useRouter();
  
  // Use Reasoning Store
  const {
      questions,
      currentIndex,
      answers,
      status,
      timeLeft,
      score,
      startGame,
      answerQuestion,
      nextQuestion,
      prevQuestion,
      finishGame,
      reset
  } = useReasoningStore();

  const [hasStarted, setHasStarted] = useState(false);

  // Initialize Game
  useEffect(() => {
    if (topic && !hasStarted && status === 'idle') {
      const decodedTopic = decodeURIComponent(topic as string);
      startGame(decodedTopic);
      setHasStarted(true);
    }
  }, [topic, startGame, hasStarted, status]);

  // Timer Effect
  useEffect(() => {
    if (status === 'playing' && timeLeft > 0) {
        // Timer handled by store via explicit tick or just using store for display
        // If store doesn't auto-tick, we can do it here or assume store handles it?
        // Logic in store (lines 106-115) has `tick` function.
        // But in component shown earlier, it was using `setState` directly!
        // Best to use store's tick if available or just consistent logic.
        // I will use local interval updating store state for smoother UI or same as Maths.
        // Maths store updated state directly.
        const timer = setInterval(() => {
             useReasoningStore.getState().tick();
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [status, timeLeft]);

  // Saving Screen
  if (status === 'saving') {
      return (
          <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center z-50">
              <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mb-8 p-6 bg-purple-50 dark:bg-zinc-800 rounded-full"
              >
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Saving Your Progress...</h2>
              <p className="text-gray-500 max-w-md">
                  Please wait while we record your results and update the leaderboard.
              </p>
          </div>
      );
  }

  // Result Screen
  if (status === 'completed') {
    const percentage = Math.round((score / questions.length) * 100);

    // Trigger confetti on high score
    if (percentage > 70) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Score Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center shadow-lg border border-purple-100 dark:border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />

                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Session Complete!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Here is how you performed in {decodeURIComponent(topic as string)}</p>

                <div className="flex justify-center items-center gap-12 mb-8">
                    <div className="text-center">
                        <div className="text-5xl font-black text-purple-600 dark:text-purple-400 mb-1">{score}/{questions.length}</div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Score</div>
                    </div>
                    <div className="w-px h-16 bg-gray-200 dark:bg-zinc-800" />
                    <div className="text-center">
                        <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-1">{percentage}%</div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Accuracy</div>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" /> Dashboard
                    </button>
                    <button
                         onClick={() => {
                             reset();
                             const decodedTopic = decodeURIComponent(topic as string);
                             startGame(decodedTopic);
                         }}
                        className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none"
                    >
                        <RotateCcw className="w-5 h-5" /> Retry
                    </button>
                </div>
            </div>

            {/* Detailed Review */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white px-2">Detailed Review</h3>
                {questions.map((q, idx) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer === q.correctAnswer;
                    const isSkipped = !userAnswer;

                    return (
                        <div key={q.id} className={`bg-white dark:bg-zinc-900 p-6 rounded-2xl border ${isCorrect ? 'border-green-200 dark:border-green-900/30' : isSkipped ? 'border-gray-200 dark:border-zinc-800' : 'border-red-200 dark:border-red-900/30'}`}>
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-full font-bold text-sm text-gray-500">
                                        {idx + 1}
                                    </span>
                                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                                        <MathRenderer text={q.question} />
                                    </div>
                                </div>
                                {isCorrect ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                ) : isSkipped ? (
                                    <HelpCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                )}
                            </div>

                            <div className="pl-12 space-y-2">
                                <div className="flex flex-col gap-2">
                                    <div className="text-sm font-semibold text-gray-500">Correct Answer:</div>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg font-medium">
                                        <MathRenderer text={q.correctAnswer} />
                                    </div>
                                </div>
                                {!isCorrect && !isSkipped && (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sm font-semibold text-gray-500">Your Answer:</div>
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg font-medium">
                                            <MathRenderer text={userAnswer} />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-bold text-gray-900 dark:text-gray-200">Explanation: </span>
                                        <MathRenderer text={q.explanation} />
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    );
  }

  // Loading / Playing Screen
  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generating Reasoning Challenge...</h2>
        <p className="text-gray-500 mt-2">Preparing logic puzzles for {decodeURIComponent(topic as string)}</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans flex flex-col">
      {/* Game Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                    <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-500' : 'text-purple-700 dark:text-purple-300'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                </div>

                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Q {currentIndex + 1} <span className="text-gray-300">/</span> {questions.length}
                </div>
            </div>
        </div>
      </header>

      {/* Main Question Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
            >
                {/* Question Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 mb-8 min-h-[200px] flex items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                        <MathRenderer text={currentQ.question} />
                    </h2>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((option, idx) => {
                        const isSelected = answers[currentQ.id] === option;
                        return (
                            <button
                                key={idx}
                                onClick={() => answerQuestion(currentQ.id, option)}
                                className={`group relative p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4
                                    ${isSelected
                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 shadow-lg shadow-purple-500/10'
                                        : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-md'
                                    }
                                `}
                            >
                                <span className={`w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full font-bold text-sm transition-colors
                                    ${isSelected
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 group-hover:text-purple-600'
                                    }
                                `}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className={`text-lg font-medium transition-colors
                                    ${isSelected
                                        ? 'text-purple-900 dark:text-purple-100'
                                        : 'text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'
                                    }
                                `}>
                                    <MathRenderer text={option} />
                                </span>

                                {isSelected && (
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 px-6 py-4 sticky bottom-0 z-10 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex justify-between items-center">

            {/* Previous Button */}
            <button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
                    ${currentIndex === 0
                        ? 'text-gray-300 dark:text-zinc-700 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }
                `}
            >
                <ChevronRight className="w-5 h-5 rotate-180" />
                Previous
            </button>

            {/* Next / Finish Button */}
            {currentIndex === questions.length - 1 ? (
                <button
                    onClick={finishGame}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                >
                    Finish Session
                    <CheckCircle2 className="w-5 h-5" />
                </button>
            ) : (
                <button
                    onClick={nextQuestion}
                    className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                >
                    Next Question
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>
      </footer>
    </div>
  );
}
