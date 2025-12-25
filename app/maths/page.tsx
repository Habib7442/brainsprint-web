
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calculator, Zap, Lock, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

export default function MathsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-8 flex items-center gap-4 max-w-7xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="w-8 h-8 text-secondary" />
            Quant Maths
          </h1>
          <p className="text-muted-foreground">Train your speed, accuracy, and mental arithmetic.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        
        {/* Main Content - Game Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Speed Calculation (Unlocked) */}
          <Link href="/maths/speed-calculation">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="p-6 h-full bg-card border-secondary/20 hover:border-secondary transition-colors cursor-pointer relative overflow-hidden group">
                <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4 text-secondary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Speed Calculation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Numbers fall like Tetris. Tap them to match the target sum before they crash!
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono text-secondary">
                    <span className="px-2 py-0.5 rounded bg-secondary/20 border border-secondary/30">FAST PACED</span>
                    <span>ARITHMETIC</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Link>

          {/* Locked Items */}
          {['Algebra Duel', 'Geometry Dash', 'Percentage Power'].map((topic) => (
            <Card key={topic} className="p-6 h-full opacity-60 grayscale cursor-not-allowed">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{topic}</h3>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </Card>
          ))}
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="lg:col-span-1">
           <Leaderboard />
        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchLeaders = async () => {
            setLoading(true);
            try {
                // Fetch top 50 raw scores from quant_scores
                const { data: scores } = await supabase
                    .from('quant_scores')
                    .select('*')
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
                });
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
    }, []);

    return (
        <Card className="p-6 border-secondary/20 bg-secondary/5 h-fit max-h-[600px] flex flex-col sticky top-6">
            <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-secondary" />
                <h3 className="font-bold text-lg text-foreground">Top Quant Masters</h3>
            </div>
            
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-8">Loading...</div>
            ) : leaders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 py-8">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">?</div>
                    No scores yet.
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                    {leaders.map((entry, i) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-secondary/30 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0
                                    ${i === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 
                                      i === 1 ? 'bg-slate-300 text-slate-900' :
                                      i === 2 ? 'bg-amber-600 text-white' : 
                                      'bg-slate-800 text-slate-400'}
                                `}>
                                    {i + 1}
                                </div>
                                <div className="flex items-center gap-2 overflow-hidden">
                                     {entry.player_avatar ? (
                                        <img src={entry.player_avatar} alt="Avatar" className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white shrink-0">
                                            {entry.player_name?.substring(0, 1)}
                                        </div>
                                    )}
                                    <span className="text-xs font-semibold text-foreground truncate" title={entry.player_name}>
                                        {entry.player_name}
                                    </span>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-sm text-secondary shrink-0 ml-2">
                                {entry.score}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
