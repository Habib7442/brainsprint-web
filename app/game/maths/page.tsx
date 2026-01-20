
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Percent, 
    Calculator, 
    Shapes, 
    TrendingUp, 
    Clock, 
    BarChart3,
    FileQuestion, 
    ChevronRight 
} from 'lucide-react';

const MATHS_TOPICS = [
  {
    id: 'percentage',
    title: 'Percentage',
    icon: Percent,
    description: 'Calculations, Profit & Loss basics.',
    questions: '15 Questions',
    time: '15 Mins',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'algebra',
    title: 'Algebra',
    icon: Calculator,
    description: 'Equations, Polynomials and Simplification.',
    questions: '15 Questions',
    time: '15 Mins',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'geometry',
    title: 'Geometry',
    icon: Shapes,
    description: 'Triangles, Circles, Angles and Areas.',
    questions: '15 Questions',
    time: '15 Mins',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'time-work',
    title: 'Time & Work',
    icon: Clock,
    description: 'Efficiency, pipes and cisterns.',
    questions: '15 Questions',
    time: '15 Mins',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'number-system',
    title: 'Number System',
    icon: BarChart3,
    description: 'Divisibility, Remainder theorem & LCM/HCF.',
    questions: '15 Questions',
    time: '15 Mins',
    gradient: 'from-rose-500 to-pink-500',
  },
    {
    id: 'si-ci',
    title: 'SI & CI',
    icon: TrendingUp,
    description: 'Simple and Compound Interest problems.',
    questions: '15 Questions',
    time: '15 Mins',
    gradient: 'from-lime-500 to-green-600',
  },
];

export default function MathsTopicsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-12">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 sticky top-0 z-20">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Maths Library</h1>
            </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 pt-8">
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-2xl">
                Master Quantitative Aptitude with AI-generated questions tailored for SSC CGL, RRB, and Banking exams.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MATHS_TOPICS.map((topic) => (
                    <Link key={topic.id} href={`/game/maths/${topic.title}`}>
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
