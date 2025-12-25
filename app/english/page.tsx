"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Quote, Languages, BookType, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EnglishPage() {
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
            <BookOpen className="w-8 h-8 text-purple-500" />
            English
          </h1>
          <p className="text-muted-foreground">Master vocabulary, grammar, and verbal ability.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Vocab Builder (Unlocked) */}
        <Link href="/english/vocab">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full block">
            <Card className="p-6 h-full bg-card border-purple-500/20 hover:border-purple-500 transition-colors cursor-pointer relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-purple-500">
                  <Languages className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Vocab Builder</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-powered vocabulary challenges to expand your word bank.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-500">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">AI GEN</span>
                  <span>WORD POWER</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </Link>

        {/* Locked Items */}
        {[{ title: 'Grammar Guru', icon: Quote }, { title: 'Reading Comprehension', icon: BookType }].map((topic) => (
          <Card key={topic.title} className="p-6 h-full opacity-60 grayscale cursor-not-allowed flex flex-col justify-center">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">{topic.title}</h3>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
