
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Code2, 
    Users, 
    GitMerge, 
    Compass, 
    Infinity, 
    ListOrdered, 
    Clock, 
    FileQuestion, 
    ChevronRight 
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

const REASONING_TOPICS = [
  {
    id: 'coding-decoding',
    title: 'Coding-Decoding',
    icon: Code2,
    description: 'Letter shifting, patterns, and cyphers.',
    questions: '20 Questions',
    time: '10 Mins',
    gradient: 'from-[#FF6B58] to-[#F59E0B]', // Coral to Amber
  },
  {
    id: 'blood-relations',
    title: 'Blood Relations',
    icon: Users,
    description: 'Family tree and relationship puzzles.',
    questions: '15 Questions',
    time: '8 Mins',
    gradient: 'from-[#0D9488] to-[#14B8A6]', // Teal
  },
  {
    id: 'syllogism',
    title: 'Syllogism',
    icon: GitMerge,
    description: 'Logical conclusions from statements.',
    questions: '20 Questions',
    time: '12 Mins',
    gradient: 'from-[#6366F1] to-[#8B5CF6]', // Indigo
  },
  {
    id: 'direction-sense',
    title: 'Direction Sense',
    icon: Compass,
    description: 'North, South, angles and paths.',
    questions: '15 Questions',
    time: '8 Mins',
    gradient: 'from-[#EC4899] to-[#DB2777]', // Pink
  },
  {
    id: 'number-series',
    title: 'Number Series',
    icon: Infinity,
    description: 'Find the missing number in the sequence.',
    questions: '20 Questions',
    time: '10 Mins',
    gradient: 'from-[#10B981] to-[#059669]', // Emerald
  },
    {
    id: 'ordering-ranking',
    title: 'Ordering & Ranking',
    icon: ListOrdered,
    description: 'Position from left/right, total persons.',
    questions: '15 Questions',
    time: '8 Mins',
    gradient: 'from-[#F97316] to-[#EA580C]', // Orange
  },
];

export default function ReasoningTopicsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-12">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 sticky top-0 z-20">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reasoning Library</h1>
            </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 pt-8">
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-2xl">
                Select a topic to start your AI-powered training session. Questions are generated instantly based on competitive exam patterns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REASONING_TOPICS.map((topic) => (
                    <Link key={topic.id} href={`/game/reasoning/${topic.title}`}>
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-md hover:border-gray-200 dark:hover:border-zinc-700 transition-all group">
                            <div className="flex items-center">
                                {/* Icon Container with Gradient */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-5 bg-gradient-to-br ${topic.gradient} shadow-md`}>
                                    <topic.icon className="w-7 h-7 text-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                                        {topic.title}
                                    </h3>
                                    <p className="text-gray-500 text-xs font-medium leading-relaxed mb-3 line-clamp-1">
                                        {topic.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center text-gray-400">
                                            <FileQuestion className="w-3.5 h-3.5 mr-1" />
                                            <span className="text-xs font-medium">{topic.questions}</span>
                                        </div>
                                        <div className="flex items-center text-gray-400">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            <span className="text-xs font-medium">{topic.time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-2">
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    </div>
  );
}
