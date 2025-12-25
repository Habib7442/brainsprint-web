"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal, Brain, Calculator, BookOpen, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [stats, setStats] = useState({
    maths: 0,
    reasoning: 0,
    english: 0,
    totalGames: 0
  });
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        // Fetch Profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Calculate Rank (Count users with more XP)
        if (profileData?.xp) {
            const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gt('xp', profileData.xp);
            
            setRank((count || 0) + 1);
        } else {
            setRank(null);
        }

        // Fetch Subject Stats
        // 1. Maths
        const { data: mathScores } = await supabase.from('quant_scores').select('score').eq('user_id', user.id);
        const mathTotal = mathScores?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;

        // 2. Reasoning
        const { data: reasonScores } = await supabase.from('reasoning_scores').select('score').eq('user_id', user.id);
        const reasonTotal = reasonScores?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;

        // 3. English
        const { data: englishScores } = await supabase.from('english_scores').select('score').eq('user_id', user.id);
        const englishTotal = englishScores?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;
        
        setStats({
            maths: mathTotal,
            reasoning: reasonTotal,
            english: englishTotal,
            totalGames: (mathScores?.length || 0) + (reasonScores?.length || 0) + (englishScores?.length || 0)
        });

        // Fetch Leaderboard
        const { data: topUsers } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, xp')
            .order('xp', { ascending: false })
            .limit(10);
        setLeaderboard(topUsers || []);

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading Profile...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </header>

        {/* Profile Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
            <Card className="md:col-span-3 bg-gradient-to-br from-card to-secondary/5 border-secondary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative">
                        <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-4xl bg-secondary/10 text-secondary">
                                {(profile?.full_name || "U")[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-sm shadow-lg flex items-center gap-1">
                            <Trophy className="w-3 h-3 fill-current" />
                            Rank #{rank || '-'}
                        </div>
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold mb-2">{profile?.full_name || "Anonymous Sprinter"}</h1>
                        <p className="text-muted-foreground mb-6 flex items-center justify-center md:justify-start gap-2">
                             <Medal className="w-4 h-4 text-secondary" /> 
                             {profile?.xp || 0} Total XP
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-3 bg-background/50 rounded-xl border border-border/50 backdrop-blur-sm">
                                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Games Played</div>
                                <div className="text-xl font-bold">{stats.totalGames}</div>
                            </div>
                             <div className="p-3 bg-background/50 rounded-xl border border-border/50 backdrop-blur-sm">
                                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Win Rate</div>
                                <div className="text-xl font-bold">--%</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Subject Breakdown */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Subject Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="overflow-hidden border-orange-500/20">
                    <div className="h-2 bg-orange-500 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Reasoning</CardTitle>
                        <Brain className="w-5 h-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1">{stats.reasoning}</div>
                        <p className="text-xs text-muted-foreground">Total Score Points</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="overflow-hidden border-cyan-500/20">
                    <div className="h-2 bg-cyan-500 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Quant Maths</CardTitle>
                        <Calculator className="w-5 h-5 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1">{stats.maths}</div>
                        <p className="text-xs text-muted-foreground">Total Score Points</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="overflow-hidden border-purple-500/20">
                    <div className="h-2 bg-purple-500 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">English</CardTitle>
                        <BookOpen className="w-5 h-5 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1">{stats.english}</div>
                        <p className="text-xs text-muted-foreground">Total Score Points</p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        {/* Global Leaderboard */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Global Leaderboard
        </h2>
        <Card className="border-secondary/20 bg-secondary/5 mb-12">
            <div className="divide-y divide-border/50">
                {leaderboard.map((player, i) => (
                    <div 
                        key={player.id} 
                        className={`flex items-center justify-between p-4 ${player.id === user.id ? 'bg-primary/10' : 'hover:bg-white/5'} transition-colors`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                ${i === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 
                                  i === 1 ? 'bg-slate-300 text-slate-900' :
                                  i === 2 ? 'bg-amber-600 text-white' : 
                                  'bg-slate-800 text-slate-400'}
                            `}>
                                {i + 1}
                            </div>
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border border-white/10">
                                    <AvatarImage src={player.avatar_url} />
                                    <AvatarFallback>{player.full_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{player.full_name || 'Anonymous'}</div>
                                    <div className="text-xs text-muted-foreground hidden sm:block">BrainSprint Champion</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Medal className="w-4 h-4 text-secondary opacity-50" />
                            <span className="font-mono font-bold text-lg">{player.xp} <span className="text-xs text-muted-foreground font-sans">XP</span></span>
                        </div>
                    </div>
                ))}
                {leaderboard.length === 0 && (
                     <div className="p-8 text-center text-muted-foreground">No ranked players yet.</div>
                )}
            </div>
        </Card>

      </div>
    </div>
  );
}
