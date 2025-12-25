"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import questionsData from "@/lib/reasoning/coding_decoding.json";
import confetti from "canvas-confetti";
import { Progress } from "@/components/ui/progress";

export default function CodingDecodingQuiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  const handleOptionSelect = (option: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionsData[currentQuestionIndex].id]: option,
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questionsData.forEach((q) => {
      if (answers[q.id] === q.answer) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Save to Supabase
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from("reasoning_scores")
          .insert({
            user_id: user.id,
            topic: "Coding Decoding",
            score: finalScore,
            total_questions: questionsData.length,
            time_taken: 900 - timeLeft,
          });

        if (error) throw error;
        setSaveMessage("Score saved successfully!");

        // Update XP
        const { data: profile } = await supabase
            .from('users')
            .select('xp')
            .eq('id', user.id)
            .single();
        
        if (profile) {
            const currentXp = profile.xp || 0;
            const xpGain = finalScore * 10; // 10 XP per correct answer
            await supabase
                .from('users')
                .update({ xp: currentXp + xpGain })
                .eq('id', user.id);
        }
      } else {
        setSaveMessage("Log in to save your score.");
      }
    } catch (error) {
      console.error("Error saving score:", error);
      setSaveMessage("Could not save score.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((currentQuestionIndex + 1) / questionsData.length) * 100;

  return (
    <div 
      className="min-h-screen bg-background p-6 flex flex-col items-center select-none" 
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <Link href="/reasoning">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full text-secondary font-mono font-bold">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Quiz Area */}
        <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
            {!isSubmitted ? (
                <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                >
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Question {currentQuestionIndex + 1} of {questionsData.length}</span>
                        <span>{Math.round(progress)}% Completed</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <Card className="p-8 mb-6 border-primary/10 shadow-lg min-h-[400px] flex flex-col justify-center">
                    <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">
                    {questionsData[currentQuestionIndex].question}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questionsData[currentQuestionIndex].options.map((option) => (
                        <Button
                        key={option}
                        variant={answers[questionsData[currentQuestionIndex].id] === option ? "default" : "outline"}
                        className={`h-auto py-4 px-6 justify-start text-left text-lg ${
                            answers[questionsData[currentQuestionIndex].id] === option 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "hover:bg-primary/5"
                        }`}
                        onClick={() => handleOptionSelect(option)}
                        >
                        <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center mr-4 text-sm opacity-50 font-mono">
                            {option === questionsData[currentQuestionIndex].options[0] ? "A" : 
                            option === questionsData[currentQuestionIndex].options[1] ? "B" :
                            option === questionsData[currentQuestionIndex].options[2] ? "C" : "D"}
                        </span>
                        {option}
                        </Button>
                    ))}
                    </div>
                </Card>

                <div className="flex justify-between items-center">
                    <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    >
                    Previous
                    </Button>
                    
                    {currentQuestionIndex < questionsData.length - 1 ? (
                    <Button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    >
                        Next Question
                    </Button>
                    ) : (
                    <Button onClick={handleSubmit} size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                        Submit Test
                    </Button>
                    )}
                </div>
                </motion.div>
            ) : (
                <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-12"
                >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <TrophyIcon className="w-12 h-12 text-green-600" />
                </div>
                
                <h2 className="text-3xl font-bold mb-2 text-white">Quiz Completed!</h2>
                <p className="text-gray-400 mb-8">Here is how you performed</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mb-8">
                    <Card className="p-6 flex flex-col items-center bg-blue-950/40 border-blue-500/30">
                        <span className="text-4xl font-black text-blue-400 mb-2">{score} / {questionsData.length}</span>
                        <span className="text-sm font-bold uppercase tracking-wider text-blue-200/60">Score</span>
                    </Card>
                    <Card className="p-6 flex flex-col items-center bg-purple-950/40 border-purple-500/30">
                        <span className="text-4xl font-black text-purple-400 mb-2">{Math.round((score / questionsData.length) * 100)}%</span>
                        <span className="text-sm font-bold uppercase tracking-wider text-purple-200/60">Accuracy</span>
                    </Card>
                    <Card className="p-6 flex flex-col items-center bg-orange-950/40 border-orange-500/30">
                        <span className="text-4xl font-black text-orange-400 mb-2">{formatTime(900 - timeLeft)}</span>
                        <span className="text-sm font-bold uppercase tracking-wider text-orange-200/60">Time Taken</span>
                    </Card>
                </div>

                {saveMessage && (
                    <div className="mb-8 p-4 bg-muted/50 border border-muted rounded-lg flex items-center gap-2">
                    {isSaving ? <span className="animate-pulse">Saving...</span> : <CheckCircle className="w-5 h-5 text-green-500" />}
                    {saveMessage}
                    </div>
                )}

                <div className="flex gap-4">
                    <Link href="/reasoning">
                    <Button variant="outline" size="lg">Back to Topics</Button>
                    </Link>
                    <Button onClick={() => window.location.reload()} size="lg">Retake Quiz</Button>
                </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* Sidebar Leaderboard */}
        <div className="lg:col-span-1">
            <Leaderboard refreshTrigger={isSubmitted} />
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
                // 1. Fetch Top Scores (Top 50 raw to find unique bests)
                const { data: scores } = await supabase
                    .from('reasoning_scores')
                    .select('*')
                    .eq('topic', 'Coding Decoding')
                    .order('score', { ascending: false })
                    .order('time_taken', { ascending: true })
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
                    // Since ordered by score desc + time asc, first is best
                });
                const uniqueScores = Array.from(uniqueScoresMap.values()).slice(0, 10);

                // 2. Fetch User Profiles
                const userIds = uniqueScores.map(s => s.user_id);
                // We use the public 'users' table which mirrors auth users
                const { data: users } = await supabase
                    .from('users')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);

                // 3. Merge Data
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
                console.error("Leaderboard fetch error:", e);
            }
            setLoading(false);
        };
        fetchLeaders();
    }, [refreshTrigger]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <Card className="p-6 border-purple-500/20 bg-purple-950/10 h-full max-h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-lg text-white">Leaderboard</h3>
            </div>
            
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
            ) : leaders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">?</div>
                    No scores yet. Be the first!
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {leaders.map((entry, i) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-white/5 hover:border-purple-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* Rank */}
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                    ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
                                      i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/50' :
                                      i === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/50' : 
                                      'bg-muted/50 text-muted-foreground'}
                                `}>
                                    {i + 1}
                                </div>
                                
                                {/* Avatar & Name */}
                                <div className="flex items-center gap-3">
                                    {entry.player_avatar ? (
                                        <img src={entry.player_avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                                            {entry.player_name?.substring(0, 1)}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white truncate max-w-[100px]" title={entry.player_name}>
                                            {entry.player_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{formatDuration(entry.time_taken)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Score */}
                            <div className="font-mono font-bold text-lg text-purple-400">
                                {entry.score}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}


function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
