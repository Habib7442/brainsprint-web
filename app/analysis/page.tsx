"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
    Activity, 
    Zap, 
    Target, 
    AlertTriangle, 
    Calendar, 
    CheckCircle2, 
    ArrowRight,
    Loader2,
    TrendingUp,
    Brain,
    Timer,
    AlertCircle,
    X, 
    ExternalLink, 
    History,
    Youtube,
    Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import MathRenderer from '@/components/MathRenderer';
import { formatDistanceToNow } from 'date-fns';


interface TopicStat {
    name: string;
    total_questions: number;
    correct_answers: number;
    total_time: number; // in minutes
    accuracy: number;
    avg_time_per_q: number; // in seconds
}

interface AIPlan {
    analysis: {
        weak_topics: string[];
        slow_topics: string[];
        careless_topics: string[];
    };
    plan: {
        day: string;
        focus: string;
        tasks: string[];
    }[];
    coach_note: string;
}

interface Session {
    id: string;
    completed_at: string;
    sub_type: string;
    category: string;
    total_questions: number;
    correct_answers: number;
    duration_minutes: number;
    metadata: {
        questions: any[];
        user_answers: Record<string, string>;
    };
}

export default function AnalysisPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<string, TopicStat>>({});
    const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [historyFilter, setHistoryFilter] = useState<'All' | 'Mathematics' | 'Reasoning'>('All');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // derived analysis from stats (Client-side fallback/immediate)
    // MUST be before early returns to satisfy Rules of Hooks
    // derived analysis from stats (SMART Analytic Engine)
    const derivedAnalysis = useMemo(() => {
        const values = Object.values(stats);
        if (values.length === 0) return { weak: [], slow: [], careless: [] };

        // 1. Weak Points: Accuracy < 60% OR Lowest 25% of stats
        const weak = values
            .filter(s => s.accuracy < 60)
            .map(s => s.name);

        // 2. Speed Drift: Slower than your OWN overall average by 20%
        const avgGlobalSpeed = values.reduce((acc, curr) => acc + curr.avg_time_per_q, 0) / values.length;
        const slow = values
            .filter(s => s.avg_time_per_q > (avgGlobalSpeed * 1.2) || s.avg_time_per_q > 90)
            .map(s => s.name);

        // 3. Careless Errors: High accuracy (80%+) but inconsistent
        // In this context, we flag topics where you are clearly competent (80%+) 
        // but not perfect (100%), suggesting small slips rather than conceptual gaps.
        const careless = values
            .filter(s => s.accuracy >= 75 && s.accuracy < 95)
            .map(s => s.name);

        return { weak, slow, careless };
    }, [stats]);

    const filteredSessions = useMemo(() => {
        return sessions.filter(s => {
            if (historyFilter === 'All') return true;
            return s.category?.toLowerCase() === historyFilter.toLowerCase();
        });
    }, [sessions, historyFilter]);

    useEffect(() => {
        fetchData();
    }, []);

    const generateAIPlan = async (currentStats: Record<string, TopicStat>) => {
        if (Object.keys(currentStats).length === 0) {
            setGeneratingPlan(false);
            return;
        }

        setGeneratingPlan(true);
        try {
            // Simplify stats for AI to save tokens
            const simplifiedStats = Object.values(currentStats).map((s: TopicStat) => ({
                topic: s.name,
                matches: s.total_questions / 10, // approximate "games"
                accuracy: Math.round(s.accuracy) + '%',
                speed_per_q: Math.round(s.avg_time_per_q) + 's'
            }));

            const response = await fetch('/api/analyze-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stats: simplifiedStats })
            });

            const data = await response.json();
            setAiPlan(data);
        } catch (error) {
            console.error("AI Generation Error:", error);
        } finally {
            setGeneratingPlan(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.error("Auth Error:", authError);
                setLoading(false);
                return;
            }



            // Fetch all sessions (ordered by latest)
            const { data: sessionsData, error: dbError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false })
                .limit(50);

            if (dbError) {
                console.error("Supabase DB Error Full:", JSON.stringify(dbError, null, 2));
                setErrorMsg(`DB Error: ${dbError.message || JSON.stringify(dbError)}`);
                setLoading(false);
                return;
            }



            // Ensure sessions is always an array
            const safeSessions = sessionsData || [];

            setSessions(safeSessions); // Store raw sessions

            // Aggregate Stats by Sub-Topic
            const aggregated: Record<string, TopicStat> = {};

            safeSessions.forEach((session: Session) => {
                const topic = session.sub_type || session.category;
                if (!aggregated[topic]) {
                    aggregated[topic] = {
                        name: topic,
                        total_questions: 0,
                        correct_answers: 0,
                        total_time: 0,
                        accuracy: 0,
                        avg_time_per_q: 0
                    };
                }

                aggregated[topic].total_questions += session.total_questions;
                aggregated[topic].correct_answers += session.correct_answers;
                aggregated[topic].total_time += session.duration_minutes || 0;
            });

            // Calculate derived metrics
            Object.values(aggregated).forEach(stat => {
                stat.accuracy = (stat.correct_answers / stat.total_questions) * 100;
                stat.avg_time_per_q = (stat.total_time * 60) / stat.total_questions;
            });

            setStats(aggregated);
            
            // Trigger AI Analysis automatically
            generateAIPlan(aggregated);
            setLoading(false); // Set loading to false after all data is fetched and processed

        } catch (error: any) {
            console.error("Error fetching stats:", error);
            setErrorMsg(error?.message || "Unknown error");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Analyzing your brainprints...</p>
                </div>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black p-6 flex items-center justify-center">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-6 rounded-2xl max-w-md w-full text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Error Loading Data</h3>
                    <p className="text-red-600 dark:text-red-300 mb-6">{errorMsg}</p>
                    <button 
                        onClick={fetchData} 
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                    >
                        Try Again
                    </button>
                    
                     <Link href="/dashboard" className="block mt-4 text-sm text-gray-500 hover:underline">
                         Back to Dashboard
                     </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6 font-sans">
             {/* ... Header and AI Radar Grid ... */}
            <div className="max-w-5xl mx-auto">
                {/* ... existing header ... */} 
                <header className="mb-10">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 inline-flex items-center gap-1 transition-colors">
                         <Target className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        AI Performance Radar
                    </h1>
                </header>

                 {/* Radar Grid (Weak/Slow/Mistakes) */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-6 rounded-2xl"
                    >
                         <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            <h3 className="text-lg font-bold text-red-900 dark:text-red-100">You are weak in</h3>
                        </div>
                        {derivedAnalysis.weak.length > 0 ? (
                            <ul className="space-y-2">
                                {derivedAnalysis.weak.slice(0, 5).map((topic: string) => (
                                    <li key={topic} className="flex items-start gap-2 text-red-700 dark:text-red-200 font-medium">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                        {topic}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-red-400 text-sm italic">No major weaknesses detected yet!</p>
                        )}
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Timer className="w-6 h-6 text-amber-500" />
                            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">You are slow in</h3>
                        </div>
                        {derivedAnalysis.slow.length > 0 ? (
                            <ul className="space-y-2">
                                {derivedAnalysis.slow.slice(0, 5).map((topic: string) => (
                                    <li key={topic} className="flex items-start gap-2 text-amber-700 dark:text-amber-200 font-medium">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                        {topic}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-amber-400 text-sm italic">Your speed is great across the board!</p>
                        )}
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-6 rounded-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-6 h-6 text-blue-500" />
                            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Careless Mistakes in</h3>
                        </div>
                        {derivedAnalysis.careless.length > 0 ? (
                            <ul className="space-y-2">
                                {derivedAnalysis.careless.slice(0, 5).map((topic: string) => (
                                    <li key={topic} className="flex items-start gap-2 text-blue-700 dark:text-blue-200 font-medium">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                        {topic}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-blue-400 text-sm italic">You've been very consistent!</p>
                        )}
                    </motion.div>
                 </div>

                 {/* NEW: Recommended Learning */}
                 {derivedAnalysis.weak.length > 0 && (
                    <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Youtube className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended Lectures</h2>
                                <p className="text-sm text-gray-500">Top-rated videos to help you master your weak topics</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {derivedAnalysis.weak.map((topic: string) => (
                                <div key={topic} className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 hover:shadow-xl hover:shadow-red-500/5 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                            Priority Study
                                        </span>
                                        <Play className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                        {topic} Mastery
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">Learn {topic} concepts covers for SSC, RRB, and UPSC exams.</p>
                                    
                                    <a 
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " for competitive exams best teachers")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-zinc-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all rounded-xl font-bold text-sm"
                                    >
                                        Watch Best Lectures <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

                 {/* NEW SECTON: Test History */}
                 <div className="border-t border-gray-200 dark:border-zinc-800 pt-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <History className="w-6 h-6 text-purple-500" />
                            Recent Test History
                        </h2>
                        
                        {/* Subject Filter */}
                        <div className="flex gap-2 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
                            {['All', 'Maths', 'Reasoning'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setHistoryFilter(f as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        historyFilter === f 
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white' 
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredSessions.length === 0 ? (
                            <div className="text-center p-8 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                                <p className="text-gray-500">No sessions found for {historyFilter}.</p>
                            </div>
                        ) : (
                            filteredSessions.map((session) => (
                                <div key={session.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0
                                            ${session.category === 'Reasoning' || session.category === 'reasoning'
                                              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                            }
                                        `}>
                                            {(session.correct_answers / session.total_questions * 100).toFixed(0)}%
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                {session.sub_type || session.category}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
                                                <span className="capitalize">{session.category}</span>
                                                <span>•</span>
                                                <span suppressHydrationWarning>{formatDistanceToNow(new Date(session.completed_at), { addSuffix: true })}</span>
                                                <span>•</span>
                                                <span>{session.correct_answers}/{session.total_questions} Correct</span>
                                                {session.duration_minutes > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{Math.floor(session.duration_minutes)}m {Math.round((session.duration_minutes % 1) * 60)}s</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setSelectedSession(session)}
                                        className="px-6 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                                    >
                                        Review Test <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
            </div>

            {/* Test Review Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-950 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Test Review: {selectedSession.sub_type}</h3>
                                <p className="text-sm text-gray-500">
                                    {(selectedSession.correct_answers / selectedSession.total_questions * 100).toFixed(0)}% Score • {new Date(selectedSession.completed_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedSession(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedSession.metadata?.questions ? (
                                selectedSession.metadata.questions.map((q: any, idx: number) => {
                                    const userAnswer = selectedSession.metadata.user_answers?.[q.id];
                                    const isCorrect = userAnswer === q.correctAnswer;
                                    const isSkipped = !userAnswer;

                                    return (
                                        <div key={idx} className={`p-6 rounded-2xl border ${
                                            isCorrect 
                                            ? 'border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10' 
                                            : isSkipped
                                            ? 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900'
                                            : 'border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10'
                                        }`}>
                                            <div className="flex gap-4 mb-4">
                                                <span className={`w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full font-bold text-sm
                                                    ${isCorrect ? 'bg-green-100 text-green-700' : isSkipped ? 'bg-gray-200 text-gray-500' : 'bg-red-100 text-red-700'}
                                                `}>
                                                    {idx + 1}
                                                </span>
                                                <div className="font-medium text-lg text-gray-900 dark:text-white">
                                                    <MathRenderer text={q.question} />
                                                </div>
                                            </div>

                                            <div className="pl-12 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                     <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                                                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Correct Answer</span>
                                                        <div className="text-green-600 dark:text-green-400 font-medium">
                                                            <MathRenderer text={q.correctAnswer} />
                                                        </div>
                                                     </div>
                                                     
                                                     {!isCorrect && (
                                                         <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                                                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Your Answer</span>
                                                            <div className={`font-medium ${isSkipped ? 'text-gray-400 italic' : 'text-red-500'}`}>
                                                                {isSkipped ? 'Skipped' : <MathRenderer text={userAnswer} />}
                                                            </div>
                                                         </div>
                                                     )}
                                                </div>

                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-zinc-900/50 p-4 rounded-xl">
                                                    <span className="font-bold text-gray-900 dark:text-gray-200">Explanation: </span>
                                                    <MathRenderer text={q.explanation} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    No detailed properties found for this session. Use a newer session to see details.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
