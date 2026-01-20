
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGameStore } from '@/stores/useGameStore';
import { createClient } from '@/utils/supabase/client';
import { 
    Pause, 
    Timer, 
    Heart, 
    Zap,
    Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Option Colors corresponding to Mobile App
const OPTION_COLORS = ['bg-teal-500', 'bg-amber-500', 'bg-indigo-500', 'bg-pink-500'];

// Simple SVG Avatar/Ghost if no image
const GhostAvatar = () => (
    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white text-[10px]">
        👻
    </div>
);

const UserAvatar = () => (
    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm" />
);

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function GameScreen({ params }: PageProps) {
    const resolveParams = React.use(params);
    const { id } = resolveParams;
    const router = useRouter();
    const supabase = createClient();
    const { user } = useAuthStore();
    
    const { 
        score, 
        lives, 
        timeLeft, 
        currentQuestion, 
        isPlaying,
        difficulty,
        combo, 
        ghostScore,
        ghostName,
        ghostAvatar,
        startGame, 
        submitAnswer, 
        tick,
        endGame 
    } = useGameStore();

    // Init
    useEffect(() => {
        const init = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) {
                 router.push('/auth');
                 return;
             }
             startGame(id);
        };
        init();
    }, [id, router, startGame, supabase.auth]);

    // Game Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
             interval = setInterval(() => {
                 tick();
             }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, tick]);

    // Game Over Check
    useEffect(() => {
        // We need to check if game ended physically (lives 0 or stop)
        if (!isPlaying && (lives <= 0 || timeLeft <= 0) && score > 0) { // check score > 0 to ensure we actually played
             // Navigate to results
             // We don't have a generic results page yet, assuming reusing dashboard or standard result page
             // Mobile uses: /game/results with params score, mode.
             // I'll implement a simple in-place game over or redirect.
             // For now, redirect to dashboard with alert? Or better, a Result Modal/View.
             // Let's implement a quick Result View state here or redirect.
             // Redirecting to existing logic or simple alert.
             // Given instructions "fetch everything", I should probably implement result screen too.
             // I will render Game Over state in this component for simplicity.
        }
    }, [isPlaying, lives, timeLeft, score, router]);


    const handleAnswer = (option: string | number) => {
        submitAnswer(option);
    };

    if (!isPlaying && (lives <= 0 || timeLeft <= 0) && currentQuestion) {
        // Game Over Screen Overlay
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
                 <h1 className="text-4xl font-bold text-white mb-4">Game Over!</h1>
                 <p className="text-gray-400 mb-8 text-xl">
                    Score: <span className="text-white font-bold">{score}</span>
                 </p>
                 <button 
                    onClick={() => startGame(id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-lg mb-4"
                >
                    Play Again
                 </button>
                 <button 
                    onClick={() => router.push('/dashboard')}
                    className="text-gray-400 hover:text-white"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    if (!currentQuestion) return (
         <div className="min-h-screen bg-gray-900 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
         </div>
    );

    // Ghost Bar Calculations
    const maxBar = 500; // arbitrary scale for bar
    const userPercent = Math.min((score / maxBar) * 100, 100);
    const ghostPercent = Math.min((ghostScore / maxBar) * 100, 100);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans overflow-hidden flex flex-col max-w-2xl mx-auto w-full shadow-2xl relative">
            
            {/* Background Ambience */}
             <div className="absolute inset-0 bg-gradient-to-b from-gray-800/20 to-gray-900 z-0 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-6 pt-6 flex justify-between items-center mb-6">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    <Pause className="w-5 h-5 text-white" />
                </button>

                <div className="bg-white/10 px-4 py-2 rounded-full flex items-center border border-white/10">
                    <Timer className={`w-5 h-5 mr-2 ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`} />
                    <span className={`font-mono font-bold text-lg ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
                        {timeLeft}s
                    </span>
                </div>

                <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                        <Heart 
                            key={i} 
                            className={`w-6 h-6 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} 
                        />
                    ))}
                </div>
            </div>

            {/* Ghost Tracks */}
            <div className="relative z-10 px-6 mb-8 mt-2 space-y-4">
                {/* You */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-green-400 w-12 text-right">You</span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-full relative">
                        {/* Progress */}
                        <motion.div 
                            className="absolute top-0 left-0 bottom-0 bg-green-500 rounded-full"
                            animate={{ width: `${userPercent}%` }}
                            transition={{ duration: 0.5 }}
                        />
                        {/* Avatar */}
                         <motion.div 
                            className="absolute top-1/2 -mt-2.5 z-10"
                            animate={{ left: `${userPercent}%`, x: '-50%' }}
                            transition={{ duration: 0.5 }}
                        >
                            <UserAvatar />
                        </motion.div>
                    </div>
                </div>
                
                 {/* Ghost */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 w-12 text-right truncate">
                        {ghostName || 'Ghost'}
                    </span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-full relative">
                         {/* Progress */}
                         <motion.div 
                            className="absolute top-0 left-0 bottom-0 bg-red-500 rounded-full opacity-80"
                            animate={{ width: `${ghostPercent}%` }}
                            transition={{ duration: 0.5 }}
                        />
                         {/* Avatar */}
                         <motion.div 
                            className="absolute top-1/2 -mt-2.5 z-10"
                            animate={{ left: `${ghostPercent}%`, x: '-50%' }}
                            transition={{ duration: 0.5 }}
                        >
                            {ghostAvatar ? (
                                <img src={ghostAvatar} className="w-5 h-5 rounded-full border border-red-500 object-cover" alt="" />
                            ) : (
                                <GhostAvatar />
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 mb-12">
                
                {/* Badges */}
                <div className="flex items-center gap-3 mb-8">
                     <div className="bg-gray-800 px-4 py-1.5 rounded-xl border border-gray-700">
                         <span className={`text-xs font-bold uppercase tracking-widest ${
                             difficulty === 1 ? 'text-green-500' : difficulty === 2 ? 'text-amber-500' : 'text-red-500'
                         }`}>
                             Level {difficulty}
                         </span>
                     </div>
                     {combo > 1 && (
                         <div className="bg-amber-900/40 px-4 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1 animate-pulse">
                             <Zap className="w-3 h-3 text-amber-400" />
                             <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                                 {combo}x Combo
                             </span>
                         </div>
                     )}
                </div>

                {/* Question */}
                <div className="mb-12">
                    <h1 className="text-6xl font-extrabold text-white text-center drop-shadow-2xl tracking-tight">
                        {currentQuestion.question.replace('=', '').trim()}
                    </h1>
                </div>

                <div className="text-gray-400 text-xl font-medium">
                    Score: <span className="text-white font-bold ml-1">{score}</span>
                </div>
            </div>

            {/* Options */}
            <div className="relative z-10 px-6 pb-12">
                <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, idx) => (
                        <motion.button
                            key={`${currentQuestion.question}-${idx}`}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAnswer(option)}
                            className={`${OPTION_COLORS[idx % 4]} h-24 rounded-2xl shadow-lg flex items-center justify-center text-3xl font-bold text-white hover:brightness-110 active:brightness-90 transition-all`}
                        >
                            {option}
                        </motion.button>
                    ))}
                </div>
            </div>

        </div>
    );
}
