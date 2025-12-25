
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Brain, Trophy, Zap, Gamepad2, Timer } from "lucide-react";

export default function LandingPage() {
  const [isHovering, setIsHovering] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       setUser(user);
    };
    checkUser();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] relative overflow-hidden selection:bg-primary selection:text-white font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
         <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-secondary/10 opacity-20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/images/icon.png"
            alt="BrainSprint Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-mono tracking-widest uppercase">
              AxomPrep Presents
            </span>
            <span className="text-xl font-bold tracking-tight text-white">
              BrainSprint
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-white hidden sm:flex"
            asChild
          >
            <Link href="#features">Features</Link>
          </Button>
          
          {user ? (
              <Button
                className="bg-white text-black hover:bg-slate-200 font-bold transition-all"
                asChild
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
          ) : (
              <Button
                className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_20px_rgba(255,107,94,0.3)] transition-all hover:scale-105"
                onClick={handleGoogleLogin}
              >
                Sign In
              </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-20 pb-32 px-4 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-8 shadow-[0_0_15px_rgba(45,212,191,0.1)]"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">The Ultimate Mental Performance Engine</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-2xl"
        >
          Think <span className="text-primary transparent-text-stroke">Faster.</span> <br />
          Solve <span className="text-secondary">Smarter.</span> <br />
          Win <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Exams.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
        >
          Stop boring rote learning. BrainSprint turns reasoning, maths, and English into 
          high-speed interactive games designed to rewire your brain for competitive exams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          {user ? (
             <Button
                size="lg"
                className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(255,107,94,0.4)] transition-all hover:scale-105 hover:animate-pulse"
                asChild
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <Link href="/dashboard">
                    <Zap className={`w-5 h-5 mr-2 ${isHovering ? "fill-current" : ""}`} />
                    Go to Dashboard
                </Link>
              </Button>
          ) : (
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(255,107,94,0.4)] transition-all hover:scale-105 hover:animate-pulse"
                onClick={handleGoogleLogin}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <Zap className={`w-5 h-5 mr-2 ${isHovering ? "fill-current" : ""}`} />
                Start Sprinting
              </Button>
          )}
         {/* Removed How it Works button */}
        </motion.div>
      </main>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-24 bg-card/50 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Gamepad2 className="w-8 h-8 text-primary" />}
              title="Gamified Learning"
              description="Master seating arrangements and puzzles through interactive drag-and-drop games, not boring PDFs."
            />
            <FeatureCard
              icon={<Timer className="w-8 h-8 text-secondary" />}
              title="Sprint Mode"
              description="10 questions. 10 minutes. Simulating real exam pressure to build your speed and accuracy reflexes."
            />
            <FeatureCard
              icon={<Trophy className="w-8 h-8 text-accent" />}
              title="Compete & Win"
              description="Climb the global leaderboards, earn XP, and unlock badges as you outpace your competition."
            />
          </div>
        </div>
      </section>
      
       {/* Footer */}
       <footer className="relative z-10 py-12 border-t border-border/50 text-center">
          <p className="text-muted-foreground text-sm">
             © {new Date().getFullYear()} BrainSprint. A product of <span className="text-white font-semibold">AxomPrep</span>.
          </p>
       </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group"
    >
      <div className="mb-6 p-4 rounded-xl bg-background border border-border inline-block group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
