"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Medal, ChevronRight, User, Calculator, Lightbulb, BookOpen, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient();

interface LeaderboardEntry {
  id: string; // user_id
  name: string;
  avatar_url: string | null;
  score: number;
  rank?: number;
  level?: number;
}

const TABS = [
    { id: 'all_time', label: 'All Time', icon: Trophy, color: 'text-yellow-500' },
    { id: 'maths', label: 'Maths', icon: Calculator, color: 'text-blue-500' },
    { id: 'reasoning', label: 'Reasoning', icon: Lightbulb, color: 'text-amber-500' },
    { id: 'english', label: 'English', icon: BookOpen, color: 'text-purple-500' },
    { id: 'gk', label: 'GK', icon: Globe, color: 'text-green-500' }
];

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState('all_time');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchLeaderboard();
    }, [activeTab]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setEntries([]);
        try {
            if (activeTab === 'all_time') {
                // Fetch Global leaderboard based on Total XP
                const { data, error } = await supabase
                    .from('users')
                    .select('id, name, avatar_url, total_xp, current_level')
                    .order('total_xp', { ascending: false })
                    .limit(50);

                if (error) throw error;

                const mapped = data.map(u => ({
                    id: u.id,
                    name: u.name || 'Anonymous',
                    avatar_url: u.avatar_url,
                    score: u.total_xp || 0,
                    level: u.current_level
                }));
                setEntries(mapped);

            } else {
                // Fetch Subject Leaderboard from user_sessions
                // Strategy: Fetch top sessions for the category, then client-side dedupe for "Best Score"
                
                // Note: 'english' category might allow 'vocab' or 'grammar' subtypes, so just filter by category
                const { data, error } = await supabase
                    .from('user_sessions')
                    .select(`
                        user_id, 
                        correct_answers, 
                        xp_earned,
                        users (name, avatar_url, current_level)
                    `)
                    .eq('category', activeTab) // match tab id to category
                    .order('correct_answers', { ascending: false })
                    .order('xp_earned', { ascending: false })
                    .limit(200);

                if (error) throw error;

                // Client-side deduplication (Max Score per User)
                const uniqueUsers = new Map();
                data.forEach((session: any) => {
                    if (!uniqueUsers.has(session.user_id) && session.users) {
                        uniqueUsers.set(session.user_id, {
                            id: session.user_id,
                            name: session.users.name || 'Anonymous',
                            avatar_url: session.users.avatar_url,
                            score: session.correct_answers, // Showing Correct Answers count as "Score" for subject specific? Or XP? Let's use Correct Answers as it's more tangible for a single test "result". Or maybe XP. Let's use XP for consistency with leaderboard unit.
                            // Actually, user said "show best result". Usually that means score (e.g. 15/15).
                            // But leaderboard looks better with big numbers (XP).
                            // Let's stick to XP earned in that session as the stored metric.
                            // Wait, if I use XP, it's specific to that session. 
                            level: session.users.current_level
                        });
                    }
                });

                // Convert map to array and sort again to be sure (though fetch order helps)
                // Note: We want keys (XP) to be the score.
                // Let's modify the map logic slightly to ensure we pick the BEST run if multiple fetched?
                // The fetch `order` guarantees the first time we see a user, it's their best run.
                
                // Re-map to use session XP
                const mapped = Array.from(uniqueUsers.values()).map((u: any) => ({
                    ...u,
                    // If we want to show the session XP:
                     score: data.find((s: any) => s.user_id === u.id)?.xp_earned || 0
                }));
                
                setEntries(mapped.slice(0, 50));
            }

        } catch (err: any) {
            console.error('Error fetching leaderboard:', err.message || err);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
        return <span className="font-bold text-gray-500 w-6 text-center">{index + 1}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                     <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 inline-flex items-center gap-1 transition-colors">
                         <ChevronRight className="rotate-180 w-4 h-4" /> Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
                            <p className="text-gray-500 dark:text-gray-400">Top performers & highest scorers.</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all whitespace-nowrap ${
                                    isActive 
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-lg' 
                                    : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? (activeTab === 'all_time' ? 'text-yellow-400' : '') : tab.color}`} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden min-h-[400px]">
                    {/* Header */}
                    <div className="grid grid-cols-12 px-6 py-4 bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <div className="col-span-2 text-center">Rank</div>
                        <div className="col-span-7">Sprinter</div>
                        <div className="col-span-3 text-right">{activeTab === 'all_time' ? 'Total XP' : 'Best XP'}</div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4" />
                            <p className="text-gray-400 font-medium">Loading rankings...</p>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-80 text-center p-8">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Trophy className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Records Yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Be the first to compete in {TABS.find(t => t.id === activeTab)?.label} and climb the ranks!
                            </p>
                            <Link href="/dashboard" className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-full font-bold text-sm hover:bg-orange-600 transition-colors">
                                Play Now
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {entries.map((entry, index) => (
                                <div 
                                    key={entry.id} 
                                    className={`grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-default group ${
                                        index < 3 ? 'bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/10' : ''
                                    }`}
                                >
                                    <div className="col-span-2 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>
                                    
                                    <div className="col-span-7 flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden ring-2 ring-transparent group-hover:ring-orange-500/50 transition-all">
                                            {entry.avatar_url ? (
                                                <Image src={entry.avatar_url} alt={entry.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
                                                    <User className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                                                {entry.name}
                                            </div>
                                            {entry.level && (
                                                <div className="text-xs text-gray-500 font-medium">
                                                    Level {entry.level}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                                        {entry.score.toLocaleString()} XP
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
