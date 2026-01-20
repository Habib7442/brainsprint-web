
"use client";

import { Code, Compass, GitMerge, Infinity, ListOrdered, Users, ChevronRight, Clock, List } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const REASONING_TOPICS = [
  {
    id: 'coding-decoding',
    title: 'Coding-Decoding',
    icon: Code,
    description: 'Letter shifting, patterns, and cyphers.',
    questions: '20 Questions',
    time: '10 Mins',
    color: 'from-orange-400 to-amber-500', 
  },
  {
    id: 'blood-relations',
    title: 'Blood Relations',
    icon: Users,
    description: 'Family tree and relationship puzzles.',
    questions: '15 Questions',
    time: '8 Mins',
    color: 'from-teal-500 to-teal-400',
  },
  {
    id: 'syllogism',
    title: 'Syllogism',
    icon: GitMerge,
    description: 'Logical conclusions from statements.',
    questions: '20 Questions',
    time: '12 Mins',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'direction-sense',
    title: 'Direction Sense',
    icon: Compass,
    description: 'North, South, angles and paths.',
    questions: '15 Questions',
    time: '8 Mins',
    color: 'from-pink-500 to-pink-600',
  },
  {
    id: 'number-series',
    title: 'Number Series',
    icon: Infinity,
    description: 'Find the missing number in the sequence.',
    questions: '20 Questions',
    time: '10 Mins',
    color: 'from-emerald-500 to-emerald-600',
  },
    {
    id: 'ordering-ranking',
    title: 'Ordering & Ranking',
    icon: ListOrdered,
    description: 'Position from left/right, total persons.',
    questions: '15 Questions',
    time: '8 Mins',
    color: 'from-orange-500 to-orange-600',
  },
];

export default function ReasoningTopicsPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth');
        }
    };
    checkUser();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 inline-flex items-center gap-1 transition-colors">
                 <ChevronRight className="rotate-180 w-4 h-4" /> Back to Dashboard
            </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reasoning Library</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Select a topic to start your AI-powered training session. Questions are generated instantly based on competitive exam patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REASONING_TOPICS.map((topic, index) => (
            <Link
              key={topic.id}
              href={`/reasoning/${topic.title}`} 
              className="group block"
            >
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 h-full">
                    <div className="flex items-center">
                        <div className={`w-14 h-14 rounded-xl items-center justify-center mr-4 flex bg-gradient-to-br ${topic.color} shrink-0`}>
                            <topic.icon className="w-7 h-7 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
                                {topic.title}
                            </h3>
                            <p className="text-gray-500 text-xs font-medium leading-4 mb-2 truncate">
                                {topic.description}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center">
                                    <List className="w-3 h-3 text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-500">{topic.questions}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-3 h-3 text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-500">{topic.time}</span>
                                </div>
                            </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 shrink-0" />
                    </div>
                </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
