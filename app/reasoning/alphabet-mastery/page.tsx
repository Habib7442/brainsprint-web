"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, RotateCcw, Zap, Trophy, Timer, Keyboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { createClient } from "@/utils/supabase/client";

type GameMode = "forward" | "backward" | "opposite";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function AlphaBlitzPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<GameMode>("forward");
  const [currentLetter, setCurrentLetter] = useState("");
  const [inputInfo, setInputInfo] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // --- Game Loop ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((p) => p - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // Focus input constantly while playing
  useEffect(() => {
    if (isPlaying && !gameOver) {
      inputRef.current?.focus();
    }
  }, [isPlaying, gameOver, currentLetter]);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setInputInfo("");
    generateNextLetter();
  };

  // Supabase Client
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);

  const endGame = async () => {
    setIsPlaying(false);
    setGameOver(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });
    
    // Save Score
    if (score > 0) {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('reasoning_scores').insert({
                    user_id: user.id,
                    topic: `Alpha Blitz (${mode})`, 
                    score: score,
                    total_questions: 0, 
                    time_taken: 60 
                });

                // Update XP
                const { data: profile } = await supabase
                    .from('users')
                    .select('xp')
                    .eq('id', user.id)
                    .single();
          
                if (profile) {
                    const currentXp = profile.xp || 0;
                    const xpGain = score; // 1:1 Score to XP for Alpha Blitz
                    await supabase
                        .from('users')
                        .update({ xp: currentXp + xpGain })
                        .eq('id', user.id);
                }
            }
        } catch (e) {
            console.error(e);
        }
        setIsSaving(false);
    }
  };

  const goToMenu = () => {
      setGameOver(false);
      setIsPlaying(false);
      setScore(0);
  };

  const generateNextLetter = () => {
    const randomIdx = Math.floor(Math.random() * 26);
    setCurrentLetter(ALPHABET[randomIdx]);
  };

  const checkAnswer = (value: string) => {
    let correct = false;
    const idx = ALPHABET.indexOf(currentLetter) + 1; // 1-based index (A=1)

    if (mode === "forward") {
      // Input should be string of number "1"
      if (parseInt(value) === idx) correct = true;
    } else if (mode === "backward") {
      // Z=1, A=26 (Formula: 27 - idx)
      if (parseInt(value) === 27 - idx) correct = true;
    } else if (mode === "opposite") {
      // A <-> Z (Formula: 27 - idx, convert back to char)
      // Or simply: ALPHABET[26 - (idx - 1) - 1] -> ALPHABET[26 - idx]
      const oppositeChar = ALPHABET[26 - idx];
      if (value.toUpperCase() === oppositeChar) correct = true;
    }

    if (correct) {
      setScore((s) => s + 10 + combo);
      setCombo((c) => c + 1);
      setFeedback("correct");
      setInputInfo("");
      generateNextLetter();
      
      // Clear feedback after short delay
      setTimeout(() => setFeedback(null), 300);
    } else {
      setCombo(0);
      setFeedback("wrong");
      setInputInfo(""); // Clear input on wrong? Or let them retry?
      // Let's clear for speed flow
      setTimeout(() => setFeedback(null), 300);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputInfo(val);

    // Smart Auto-Submit Logic
    if (mode === "opposite") {
      if (val.length === 1) {
        checkAnswer(val);
      }
    } else {
      // Numeric Modes
      // If we have a math match! 
      // Problem: "1" might be "1" (A) or start of "10" (J).
      // We can't auto-submit "1" blindly if the answer could be "1x".
      // Logic: 
      // If val matches answer exactly, submit.
      // If val length >= 2, submit (since nothing > 26).
      // If val is "1" or "2", wait? 
      // Actually, standard typing games wait for full match or Enter.
      // BUT for speed, if I type '1' and answer is '1', can it auto submit?
      // Only if '10'+ is not possible? No, 'A' is 1. If I type 1, it matches.
      // If I want to type 10, I type 1... game submits? That's bad.
      
      // Improved Logic:
      // Always auto-submit if value length == 2.
      // If value length == 1, check if possible answer (1-9).
      // If answer is single digit, auto-submit? 
      // If answer is 1 (A), and I type 1. Does user wait? 
      // Let's require ENTER for consistent flow OR strictly check match.
      
      // Let's TRY strict visual match auto-submit.
      // If I need to type 2, and I type 2. If I meant 20? 
      // If current Target is T (20), and I type 2, it's WRONG state? No.
      // It's incomplete.
      // So purely check against expected answer.
      
      const idx = ALPHABET.indexOf(currentLetter) + 1;
      const targetNum = mode === 'forward' ? idx : 27 - idx;
      
      if (parseInt(val) === targetNum) {
          checkAnswer(val);
      } else if (val.length >= 2) {
          // Wrong answer length
          checkAnswer(val);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 flex flex-col items-center">
      {/* HUD */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-12">
        <Link href="/reasoning">
          <Button variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Exit
          </Button>
        </Link>
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
               <span className="text-xs font-bold text-slate-500 uppercase">Score</span>
               <span className="text-2xl font-mono font-bold text-yellow-400">{score}</span>
           </div>
           <div className="flex flex-col items-end">
               <span className="text-xs font-bold text-slate-500 uppercase">Combo</span>
               <span className={`text-2xl font-mono font-bold ${combo > 5 ? 'text-purple-400 animate-pulse' : 'text-slate-300'}`}>x{combo}</span>
           </div>
           <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
               <Timer className="w-5 h-5 text-slate-400" />
               <span className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
           </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Game Area */}
        <div className="lg:col-span-3 flex flex-col items-center">
            <AnimatePresence mode="wait">
                {!isPlaying && !gameOver ? (
                /* MENU SCREEN */
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-2xl text-center"
                >
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl mx-auto flex items-center justify-center mb-6 text-yellow-400 border border-yellow-500/30">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h1 className="text-5xl font-black mb-4 tracking-tight">ALPHA BLITZ</h1>
                    <p className="text-xl text-slate-400 mb-10">Master the alphabet positions. Speed is key.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card 
                            className="p-6 bg-slate-900 border-slate-800 hover:border-blue-500 cursor-pointer group transition-all"
                            onClick={() => startGame('forward')}
                        >
                            <div className="text-4xl font-black text-slate-700 group-hover:text-blue-500 mb-2 transition-colors">A → 1</div>
                            <div className="font-bold text-white mb-1">Forward Rank</div>
                            <div className="text-xs text-slate-500">A=1, B=2, C=3...</div>
                        </Card>
                        
                        <Card 
                            className="p-6 bg-slate-900 border-slate-800 hover:border-purple-500 cursor-pointer group transition-all"
                            onClick={() => startGame('backward')}
                        >
                            <div className="text-4xl font-black text-slate-700 group-hover:text-purple-500 mb-2 transition-colors">Z → 1</div>
                            <div className="font-bold text-white mb-1">Backward Rank</div>
                            <div className="text-xs text-slate-500">Z=1, Y=2, X=3...</div>
                        </Card>
                        
                        <Card 
                            className="p-6 bg-slate-900 border-slate-800 hover:border-green-500 cursor-pointer group transition-all"
                            onClick={() => startGame('opposite')}
                        >
                            <div className="text-4xl font-black text-slate-700 group-hover:text-green-500 mb-2 transition-colors">A ↔ Z</div>
                            <div className="font-bold text-white mb-1">Opposite Pairs</div>
                            <div className="text-xs text-slate-500">A-Z, B-Y, C-X...</div>
                        </Card>
                    </div>
                </motion.div>
                ) : gameOver ? (
                /* GAME OVER SCREEN */
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center bg-slate-900/50 p-10 rounded-3xl border border-slate-800 backdrop-blur-sm mx-auto"
                >
                    <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
                    <div className="text-6xl font-black text-yellow-400 mb-2">{score}</div>
                    <p className="text-slate-400 mb-8">Final Score</p>
                    
                    <div className="flex gap-4 justify-center">
                        <Button onClick={goToMenu} variant="outline" size="lg">Menu</Button>
                        <Button onClick={() => startGame(mode)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold" size="lg">
                            <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                        </Button>
                    </div>
                </motion.div>
                ) : (
                /* GAMEPLAY SCREEN */
                <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto">
                    <div className="mb-4">
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            {mode === 'forward' ? 'Rank (A=1)' : mode === 'backward' ? 'Reverse (Z=1)' : 'Opposite Pair'}
                        </span>
                    </div>
                    
                    {/* The Target Letter */}
                    <motion.div 
                        key={currentLetter}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <div className="text-[12rem] font-black leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            {currentLetter}
                        </div>
                        
                        {/* Feedback Flash */}
                        {feedback && (
                            <motion.div 
                                initial={{ scale: 1.2, opacity: 1 }}
                                animate={{ scale: 2, opacity: 0 }}
                                className={`absolute inset-0 flex items-center justify-center pointer-events-none rounded-full ${feedback === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                            />
                        )}
                    </motion.div>

                    {/* Input Area */}
                    <div className="mt-12 w-full max-w-[200px] relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputInfo}
                            onChange={handleInput}
                            className={`w-full bg-transparent border-b-4 text-center text-4xl font-mono font-bold py-2 outline-none uppercase transition-colors ${
                                feedback === 'correct' ? 'border-green-500 text-green-500' :
                                feedback === 'wrong' ? 'border-red-500 text-red-500' :
                                'border-slate-700 text-white focus:border-yellow-500'
                            }`}
                            placeholder="?"
                            maxLength={mode === 'opposite' ? 1 : 2}
                        />
                        <div className="text-center mt-4 text-slate-500 text-sm flex items-center justify-center gap-2">
                            <Keyboard className="w-4 h-4" /> 
                            {mode === 'opposite' ? 'Type Letter' : 'Type Number'}
                        </div>
                    </div>
                </div>
                )}
            </AnimatePresence>
        </div>

        {/* Sidebar Leaderboard */}
        <div className="lg:col-span-1">
             <Leaderboard refreshTrigger={gameOver} />
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ refreshTrigger }: { refreshTrigger: boolean }) {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchLeaders = async () => {
            setLoading(true);
            try {
                // Fetch scores that contain "Alpha Blitz"
                // Fetch top 50 raw scores to allow for filtering duplicates
                const { data: scores } = await supabase
                    .from('reasoning_scores')
                    .select('*')
                    .ilike('topic', 'Alpha Blitz%') 
                    .order('score', { ascending: false })
                    .limit(50);
                
                if (!scores || scores.length === 0) {
                    setLeaders([]);
                    setLoading(false);
                    return;
                }

                // Filter Unique Users (Client-side distinct)
                const uniqueScoresMap = new Map();
                scores.forEach(score => {
                    if (!uniqueScoresMap.has(score.user_id)) {
                        uniqueScoresMap.set(score.user_id, score);
                    }
                    // Since we ordered by score desc, the first occurrence is already the best
                });
                
                // Get top 10 unique
                const uniqueScores = Array.from(uniqueScoresMap.values()).slice(0, 10);

                // Fetch Users
                const userIds = uniqueScores.map(s => s.user_id);
                const { data: users } = await supabase
                    .from('users')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);

                // Merge
                const combined = uniqueScores.map(score => {
                    const user = users?.find(u => u.id === score.user_id);
                    return {
                        ...score,
                        player_name: user?.full_name || 'Anonymous',
                        player_avatar: user?.avatar_url
                    };
                });
                
                setLeaders(combined);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchLeaders();
    }, [refreshTrigger]);

    return (
        <Card className="p-6 border-yellow-500/20 bg-yellow-950/10 h-full max-h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-lg text-white">Top Blitzers</h3>
            </div>
            
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
            ) : leaders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">?</div>
                    No scores yet.
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {leaders.map((entry, i) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-yellow-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                    ${i === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 
                                      i === 1 ? 'bg-slate-300 text-slate-900' :
                                      i === 2 ? 'bg-amber-600 text-white' : 
                                      'bg-slate-800 text-slate-400'}
                                `}>
                                    {i + 1}
                                </div>
                                <div className="flex items-center gap-3">
                                     {entry.player_avatar ? (
                                        <img src={entry.player_avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                                            {entry.player_name?.substring(0, 1)}
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold text-white truncate max-w-[100px]" title={entry.player_name}>
                                        {entry.player_name}
                                    </span>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-lg text-yellow-400">
                                {entry.score}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

