
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Calculator, Trophy, Flame, User, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      } else {
        // Fetch detailed profile from 'users' table
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        // Merge auth user with profile data
        setUser({ ...user, profile }); 
      }
    };
    getUser();
  }, [supabase, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
             <Image
                src="/assets/images/icon.png"
                alt="BrainSprint Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                <Flame className="w-4 h-4 fill-current" />
                <span className="font-mono font-bold">{user.profile?.xp || 0} XP</span>
            </div>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 overflow-hidden hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-ring">
                        {user.profile?.avatar_url || user.user_metadata.avatar_url ? (
                            <Image 
                                src={user.profile?.avatar_url || user.user_metadata.avatar_url} 
                                alt="User" 
                                width={40} 
                                height={40} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserIcon className="w-5 h-5 text-secondary" />
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.profile?.full_name || user.user_metadata.full_name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem className="cursor-pointer focus:bg-accent/10 focus:text-accent">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push("/");
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome back, {(user.profile?.full_name || user.user_metadata.full_name)?.split(' ')[0] || "Sprinter"} 👋</h2>
            <p className="text-muted-foreground">Ready to train your brain today?</p>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Reasoning Card */}
            <Link href="/reasoning">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40 mix-blend-multiply transition-opacity group-hover:opacity-90" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-700" />
                    
                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-white mb-2">Reasoning</h3>
                            <p className="text-white/80 font-medium">Master logic, puzzles, and patterns.</p>
                        </div>
                    </div>
                </motion.div>
            </Link>

            {/* Maths Card */}
            <Link href="/maths">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer"
                >
                     <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 to-secondary/40 mix-blend-multiply transition-opacity group-hover:opacity-90" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-700" />
                    
                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Calculator className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-white mb-2">Quant Maths</h3>
                            <p className="text-white/80 font-medium">Speed maths, algebra, and arithmetic.</p>
                        </div>
                    </div>
                </motion.div>
            </Link>

            {/* English Card */}
            <Link href="/english">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/80 to-purple-500/40 mix-blend-multiply transition-opacity group-hover:opacity-90" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-700" />
                    
                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-white mb-2">English</h3>
                            <p className="text-white/80 font-medium">Vocabulary, Grammar, and Verbal Ability.</p>
                        </div>
                    </div>
                </motion.div>
            </Link>
        </div>


      </main>
    </div>
  );
}
