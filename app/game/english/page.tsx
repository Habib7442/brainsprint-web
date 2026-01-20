
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    BookType, 
    MessageSquareQuote, 
    AlertCircle, 
    Puzzle, 
    Clock, 
    Languages,
    FileQuestion, 
    ChevronRight 
} from 'lucide-react';

const ENGLISH_TOPICS = [
  {
    id: 'grammar',
    title: 'Grammar',
    icon: BookType,
    description: 'Tenses, Articles, Prepositions rules.',
    questions: '20 Questions',
    time: '10 Mins',
    gradient: 'from-fuchsia-500 to-pink-500',
  },
  {
    id: 'vocab',
    title: 'Vocabulary',
    icon: Languages,
    description: 'Synonyms, Antonyms, One Word.',
    questions: '20 Questions',
    time: '10 Mins',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'error-spotting',
    title: 'Error Spotting',
    icon: AlertCircle,
    description: 'Find grammatical errors in sentences.',
    questions: '20 Questions',
    time: '10 Mins',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    id: 'idioms',
    title: 'Idioms & Phrases',
    icon: MessageSquareQuote,
    description: 'Common idioms and their meanings.',
    questions: '20 Questions',
    time: '10 Mins',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'cloze-test',
    title: 'Cloze Test',
    icon: Puzzle,
    description: 'Fill in the blanks in a passage.',
    questions: '20 Questions',
    time: '12 Mins',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

export default function EnglishTopicsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-12">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 sticky top-0 z-20">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">English Library</h1>
            </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 pt-8">
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-2xl">
                Improve your language skills for SSC CGL, CHSL and Banking exams with AI-curated sets.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ENGLISH_TOPICS.map((topic) => (
                    <Link key={topic.id} href={`/game/english/${topic.title}`}>
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
