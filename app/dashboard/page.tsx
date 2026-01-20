
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    Calculator, 
    Lightbulb, 
    Puzzle, 
    Play, 
    RefreshCw, 
    Flame, 
    Trophy, 
    Clock, 
    ChevronRight, 
    Zap,
    Activity
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMiniQuizStore } from "@/stores/useMiniQuizStore";

// Game Modes Configuration
const GAME_MODES = [
    {
        id: 'calculation',
        title: 'Quant Maths',
        description: 'Master arithmetic & quantitative aptitude',
        icon: Calculator,
        color: 'text-teal-500',
        bgColor: 'bg-teal-500/10',
        borderColor: 'border-teal-100 dark:border-teal-500/20',
        href: '/game/maths'
    },
    {
        id: 'formula',
        title: 'Formula Sprint',
        description: 'Complete formulas under pressure',
        icon: Zap,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-100 dark:border-orange-500/20',
        href: '/game/formula-completion'
    },
    {
        id: 'reasoning',
        title: 'Reasoning',
        description: 'Boost logic & problem solving',
        icon: Lightbulb,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-100 dark:border-amber-500/20',
        href: '/game/reasoning' 
    },
    {
        id: 'english',
        title: 'English',
        description: 'Enhance visual & verbal skills',
        icon: Puzzle,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-100 dark:border-indigo-500/20',
        href: '/game/english'
    }
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [lastMatchTime, setLastMatchTime] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  
  const { fetchQuizzes, quizzes, loading: quizzesLoading } = useMiniQuizStore();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // Fetch Profile
      const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
      setProfile(profileData);

      // Fetch Last Match for Streak Logic
      const { data: matchData } = await supabase
        .from('matches') // Assuming table exists
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (matchData) setLastMatchTime(matchData.created_at);

      // Fetch total games played count
      const { count: sessionCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      const { count: attemptCount } = await supabase
          .from('mini_quiz_attempts') // Also count mini quizzes if you want exact total
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

      setProfile({ 
          ...profileData, 
          games_played: (sessionCount || 0) + (attemptCount || 0) 
      });

      // Fetch Last Match for Streak Logic
      // Update logic to check both sessions and attempts
      // ... (existing logic or improvement needed, but keeping scope focused on stats first)
      
      fetchQuizzes();
    };

    init();
  }, [router, supabase, fetchQuizzes]);

  // Greeting Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Streak Logic
  const lastActiveDate = lastMatchTime ? new Date(lastMatchTime) : (profile?.last_active_at ? new Date(profile.last_active_at) : null);
  const isToday = lastActiveDate?.toDateString() === new Date().toDateString();
  const isYesterday = lastActiveDate?.toDateString() === new Date(Date.now() - 86400000).toDateString();
  
  const displayStreak = isToday 
        ? Math.max(1, profile?.current_streak || 0) 
        : (isYesterday ? (profile?.current_streak || 0) : 0);
  
  const streakColor = displayStreak > 0 ? "text-orange-500 bg-orange-500/20" : "text-blue-500 bg-blue-500/20";
  const streakIcon = displayStreak > 0 ? "🔥" : "❄️";

  if (!user) return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-24">
      
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-500/5 to-transparent dark:from-orange-500/10" />
      </div>

      <main className="max-w-6xl mx-auto relative z-10 px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <div className="text-center md:text-left">
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-1">
                    {getGreeting()},
                </p>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white capitalize tracking-tight">
                    {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Sprinter'} 👋
                </h1>
            </div>
            
            <div className="flex items-center gap-6 bg-white dark:bg-zinc-900 p-2 pr-6 rounded-full shadow-sm border border-gray-100 dark:border-zinc-800">
                <Link href="/profile">
                    <Avatar className="w-12 h-12 border-2 border-orange-500/20 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                        <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
                        <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Streak</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{displayStreak}</span>
                            <span className="text-lg">{streakIcon}</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-zinc-800 my-auto" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{profile?.level || profile?.current_level || 1}</span>
                            <Trophy className="w-4 h-4 text-teal-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:border-orange-500/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Quick Stats
                    </h3>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl group-hover:bg-gray-100 dark:group-hover:bg-zinc-800 transition-colors">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total XP</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{profile?.total_xp || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl group-hover:bg-gray-100 dark:group-hover:bg-zinc-800 transition-colors">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Quizzes Played</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{profile?.games_played || 0}</span>
                    </div>
                </div>
                
                <Link href="/analysis" className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                    <Activity className="w-4 h-4" /> View AI Radar
                </Link>
            </div>

            {/* Study Together */}
            <Link href="/rooms" className="block relative group">
                <div className="h-full bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.02]">
                    <div className="relative z-10">
                        <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                            Study Together
                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                        </h3>
                        <p className="text-indigo-100 text-sm">Join study rooms and compete with friends in real-time.</p>
                    </div>
                    <div className="relative z-10 mt-6">
                        <span className="inline-block bg-white text-indigo-600 py-2 px-6 rounded-xl font-bold text-sm">
                            Find a Room
                        </span>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12" />
                </div>
            </Link>

            {/* Leaderboard Link */}
            <Link href="/leaderboard" className="block relative group">
                <div className="h-full bg-gradient-to-br from-gray-900 to-black dark:from-zinc-800 dark:to-zinc-900 rounded-3xl p-6 shadow-lg text-white border border-gray-800 relative overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.02]">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-xl">Leaderboard</h3>
                            <Trophy className="w-6 h-6 text-yellow-500 group-hover:rotate-12 transition-transform" />
                        </div>
                        <p className="text-gray-400 text-sm">See where you stand among the top sprinters.</p>
                    </div>
                    <div className="relative z-10 mt-6">
                         <span className="inline-block bg-gray-800 border border-gray-700 group-hover:bg-gray-700 group-hover:border-gray-600 text-white py-2 px-6 rounded-xl font-bold text-sm transition-colors">
                            View Rankings
                        </span>
                    </div>
                </div>
            </Link>
        </div>

        <div className="space-y-12">
            
            {/* Training Modes Section */}
            <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Zap className="w-5 h-5 text-indigo-500" />
                    </div>
                    Training Modes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {GAME_MODES.map((mode) => (
                        <Link key={mode.id} href={mode.href} className="group">
                            <motion.div 
                                whileHover={{ y: -4 }}
                                className={`h-full bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col`}
                            >
                                <div className={`absolute top-0 right-0 p-32 rounded-full blur-3xl opacity-10 -mr-16 -mt-16 ${mode.bgColor.replace('/10', '/30')}`} />
                                
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mode.bgColor}`}>
                                        <mode.icon className={`w-7 h-7 ${mode.color}`} />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-zinc-700 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    </div>
                                </div>
                                
                                <div className="relative z-10 mt-auto">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {mode.title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed text-sm">
                                        {mode.description}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Mini Quizzes Section */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Flame className="w-5 h-5 text-orange-500" />
                        </div>
                        Mini Quizzes
                    </h2>
                    <button 
                        onClick={() => fetchQuizzes()}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Refresh Quizzes"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-400 ${quizzesLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzesLoading && quizzes.length === 0 ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-gray-100 dark:bg-zinc-900 rounded-3xl animate-pulse" />
                        ))
                    ) : quizzes.length === 0 ? (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                            <p className="text-gray-400 font-medium">No active quizzes at the moment.</p>
                            <button onClick={() => fetchQuizzes()} className="mt-2 text-teal-600 font-bold text-sm hover:underline">Check again</button>
                        </div>
                    ) : (
                        quizzes.map((quiz) => (
                            <Link key={quiz.id} href={`/game/miniquiz/${quiz.id}`} className="block group">
                                <div className="h-64 rounded-3xl overflow-hidden relative shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                    <Image
                                        src={quiz.thumbnail_url || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80'}
                                        alt={quiz.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                                    
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                                <span className="text-white text-xs font-bold uppercase tracking-wider">
                                                    {quiz.topic}
                                                </span>
                                            </div>
                                            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-white" />
                                                <span className="text-white text-xs font-bold">
                                                    {quiz.total_time_minutes}m
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-white text-2xl font-bold leading-tight mb-2 drop-shadow-sm group-hover:text-orange-400 transition-colors">
                                                {quiz.title}
                                            </h3>
                                            <p className="text-gray-300 text-sm line-clamp-2">
                                                {quiz.description || 'Tap to start challenge'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>
        </div>
      </main>
    </div>
  );
}
