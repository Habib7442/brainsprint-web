"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Check, X, RefreshCw, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import confetti from "canvas-confetti";

interface Question {
  word: string;
  question: string;
  options: string[];
  answer: string;
  hint?: string;
}

export default function VocabBuilderPage() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  const supabase = createClient();

  // Start new round (fetch questions)
  const startRound = async () => {
    setLoading(true);
    setGameOver(false);
    setScore(0);
    setCurrentIndex(0);
    setStreak(0);
    setQuestions([]);

    try {
      const res = await fetch("/api/generate-vocab", { method: "POST" });
      const data = await res.json();
      
      if (data.questions) {
        setQuestions(data.questions);
      } else {
        console.error("No questions returned", data);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent double click

    setSelectedOption(option);
    const correct = option === questions[currentIndex].answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 10 + (streak * 2));
      setStreak((prev) => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#ffffff'] // Purple theme
      });
    } else {
      setStreak(0);
    }

    // Auto advance
    setTimeout(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            endGame();
        }
    }, 1500);
  };

  const endGame = async () => {
    setGameOver(true);
    
    // XP Logic
    const finalScore = score + (streak * 5); // Bonus
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Save Score
             const { error } = await supabase.from('english_scores').insert({
                user_id: user.id,
                topic: 'Vocab Builder (AI)',
                score: finalScore,
                total_questions: questions.length,
                exam_type: 'SSC/Banking' 
            });
            if (error) console.error(error);

            // Update XP
            const { data: profile } = await supabase
                .from('users')
                .select('xp')
                .eq('id', user.id)
                .single();

             if (profile) {
                await supabase.from('users').update({
                    xp: (profile.xp || 0) + finalScore
                }).eq('id', user.id);
            }
        }
    } catch(e) {
        console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <Link href="/english">
          <Button variant="ghost">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
        </Link>
        <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-purple-500/10 rounded-full text-purple-500 font-bold border border-purple-500/20">
                Score: {score}
            </div>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
            {!loading && questions.length === 0 && !gameOver && (
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="text-center py-20">
                    <div className="w-20 h-20 bg-purple-500/20 rounded-3xl mx-auto flex items-center justify-center mb-6 text-purple-500 border border-purple-500/30">
                        <BookOpen className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Vocab Builder</h1>
                    <p className="text-muted-foreground mb-8">Generate personalized vocabulary questions using AI.</p>
                    <Button onClick={startRound} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 h-12">
                         Start AI Session
                    </Button>
                </motion.div>
            )}

            {loading && (
                 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center py-20 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold">Generating Questions...</h2>
                    <p className="text-muted-foreground text-sm mt-2">Consulting the AI linguist</p>
                 </motion.div>
            )}

            {!loading && questions.length > 0 && !gameOver && (
                <motion.div key={currentIndex} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}} className="w-full">
                    <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground uppercase tracking-widest font-bold">
                        <span>Question {currentIndex + 1} / {questions.length}</span>
                        <span>Streak: <span className="text-orange-500">{streak}</span></span>
                    </div>
                    
                    <Card className="p-8 mb-6 border-purple-500/20 bg-card/50 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-center mb-8">{questions[currentIndex].question}</h2>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {questions[currentIndex].options.map((option) => (
                                <Button
                                    key={option}
                                    variant="outline"
                                    className={`h-16 text-lg justify-start px-6 border-2 transition-all ${
                                        selectedOption === option 
                                            ? option === questions[currentIndex].answer 
                                                ? "bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/20 hover:text-green-500" 
                                                : "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/20 hover:text-red-500"
                                            : selectedOption && option === questions[currentIndex].answer
                                                ? "bg-green-500/20 border-green-500 text-green-500"
                                                : "hover:border-purple-500 hover:bg-purple-500/5"
                                    }`}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={selectedOption !== null}
                                >
                                    <div className="flex items-center w-full">
                                        <span className="flex-1 text-left">{option}</span>
                                        {selectedOption === option && (
                                            option === questions[currentIndex].answer ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />
                                        )}
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </Card>
                    
                    {questions[currentIndex].hint && (
                         <div className="text-center text-sm text-muted-foreground italic">
                            Hint: {questions[currentIndex].hint}
                         </div>
                    )}
                </motion.div>
            )}

            {gameOver && (
                <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="text-center py-10 w-full max-w-md mx-auto">
                    <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 border border-yellow-500/30">
                        <Trophy className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
                    <div className="text-5xl font-black text-purple-500 mb-2">{score} XP</div>
                    <p className="text-muted-foreground mb-8">Vocabulary Expanded</p>
                    
                    <div className="flex gap-4 justify-center">
                        <Link href="/english">
                            <Button variant="outline" size="lg">Exit</Button>
                        </Link>
                        <Button onClick={startRound} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                            <RefreshCw className="w-4 h-4 mr-2" /> New Set
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
