
"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Users, Puzzle, MoveRight, Map, Grid3X3, Code, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const topics = [
  {
    id: "coding-decoding",
    title: "Coding Decoding",
    description: "Crack the patterns and decode secret messages.",
    icon: <Code className="w-6 h-6 text-primary" />,
    color: "bg-primary/10 border-primary/20 hover:border-primary",
    href: "/reasoning/coding-decoding",
  },
  {
    id: "alphabet-mastery",
    title: "Alpha Blitz",
    description: "Memorize letter positions and opposites with speed training.",
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    color: "bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500",
    href: "/reasoning/alphabet-mastery",
  },
  {
    id: "puzzles",
    title: "Floor Puzzles",
    description: "Solve complex floor and box-based reasoning challenges.",
    icon: <Puzzle className="w-6 h-6 text-secondary" />,
    color: "bg-secondary/10 border-secondary/20 hover:border-secondary",
    href: "/reasoning/puzzles",
    locked: true
  },
  {
    id: "direction",
    title: "Direction Sense",
    description: "Navigate through maps and calculate shortest distances.",
    icon: <Map className="w-6 h-6 text-purple-500" />,
    color: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500",
    href: "/reasoning/direction",
    locked: true
  },
  // Add more topics...
];

export default function ReasoningPage() {
  return (
    <div className="min-h-screen bg-background p-6">
       {/* Header */}
       <div className="max-w-5xl mx-auto mb-12 pt-4">
           <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-white mb-6 transition-colors">
               <ArrowLeft className="w-4 h-4 mr-2" />
               Back to Dashboard
           </Link>
           <h1 className="text-4xl font-extrabold tracking-tight mb-2">Reasoning Sprins</h1>
           <p className="text-muted-foreground">Select a topic to start your mental workout.</p>
       </div>

       {/* Topics Grid */}
       <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
           {topics.map((topic, index) => (
               <Link key={topic.id} href={topic.locked ? "#" : topic.href} className={`block h-full ${topic.locked ? "cursor-not-allowed opacity-60" : ""}`}>
                   <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.1 }}
                       whileHover={!topic.locked ? { scale: 1.02 } : {}}
                       className={`p-6 rounded-2xl border transition-all duration-300 ${topic.color} bg-card h-full flex flex-col justify-center`}
                   >
                       <div className="flex items-start justify-between h-full">
                           <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl bg-background border border-border/50`}>
                                    {topic.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">{topic.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{topic.description}</p>
                                </div>
                           </div>
                           {!topic.locked ? (
                               <MoveRight className="w-5 h-5 text-muted-foreground shrink-0" />
                           ) : (
                               <span className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground shrink-0">LOCKED</span>
                           )}
                       </div>
                   </motion.div>
               </Link>
           ))}
       </div>
    </div>
  );
}
