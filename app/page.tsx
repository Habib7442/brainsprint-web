
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { 
    Sparkles, Brain, Trophy, Zap, Gamepad2, Timer, Bot, Users, 
    ArrowRight, Star, ChevronRight, Activity, Target, Shield, Rocket,
    BookOpen, MousePointer2, CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  const { scrollY } = useScroll();
  
  // Parallax values
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.9]);

  useEffect(() => {
    const checkUser = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       setUser(user);
    };
    checkUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150 pointer-events-none" />
      </div>

      {/* Floating Grid */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-5xl px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500 rounded-lg blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <Image
                src="/assets/images/icon.png"
                alt="BrainSprint Logo"
                width={36}
                height={36}
                className="relative w-9 h-9 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 -mb-0.5">AxomPrep Presents</span>
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              BrainSprint
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
            {['Features', 'Modules', 'PvP Rooms', 'Pricing'].map((item) => (
                <Link key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    {item}
                </Link>
            ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
              <Button
                className="h-10 px-5 rounded-full bg-white text-black hover:bg-gray-200 font-bold transition-all shadow-lg active:scale-95"
                asChild
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
          ) : (
              <div className="flex items-center gap-2">
                 <Link href="/auth" className="text-sm font-bold text-gray-400 hover:text-white px-4 transition-colors">Sign In</Link>
                 <Button
                    className="h-10 px-5 rounded-full bg-teal-500 hover:bg-teal-400 text-black font-bold transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] active:scale-95"
                    asChild
                 >
                    <Link href="/auth">Start Training</Link>
                 </Button>
              </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 flex flex-col items-center text-center z-10 max-w-7xl mx-auto">
         <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="flex flex-col items-center"
         >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-1 rounded-full bg-gradient-to-r from-teal-500/20 to-orange-500/20 border border-white/10 backdrop-blur-md px-4 py-1.5 flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgb(45,212,191)] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-200/80">Powered by AxomPrep</span>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] text-white"
            >
                SOLVE <span className="text-teal-400 italic">FASTER.</span><br />
                THINK <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">SMARTER.</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl text-lg md:text-xl text-gray-400 mb-12 leading-relaxed font-medium"
            >
                Master competitive exams with AI-powered questions, live speed tracking, and real-time study rooms.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-5"
            >
                <Button 
                    size="lg" 
                    className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-gray-200 font-black text-lg transition-transform hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-3 group"
                    asChild
                >
                    <Link href={user ? "/dashboard" : "/auth"}>
                        {user ? "Enter App" : "Get Started"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>

            </motion.div>
         </motion.div>
         
         {/* Live Performance Mockup Section */}
         <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-24 w-full max-w-5xl rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-2xl p-4 md:p-8 relative overflow-hidden group shadow-[0_0_100px_rgba(45,212,191,0.1)]"
         >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-white/20 to-orange-500" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="w-5 h-5 text-teal-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Real-time Radar</span>
                    </div>
                    <div className="space-y-4">
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-teal-500"
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ delay: 1, duration: 2 }}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-500">Processing Speed</span>
                            <span className="text-white">92ms</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Bot className="w-5 h-5 text-orange-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-400">AI Logic Core</span>
                    </div>
                    <p className="text-sm text-gray-400 font-medium leading-normal">
                        "Generating fresh Coding-Decoding sequence with pattern difficulty factor 8.5/10..."
                    </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-purple-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Active Sprint</span>
                    </div>
                    <div className="flex -space-x-3 mb-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800" />
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 font-bold">4 Players racing in "Quant Geometry"</p>
                </div>
            </div>
         </motion.div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Master the Disciplines</h2>
            <p className="text-gray-500 font-medium">Every module is designed to target specific cognitive neural pathways.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ModuleCard 
                title="Quantitative"
                subtitle="Calculated Precision"
                icon={<Timer className="w-8 h-8 text-teal-400" />}
                features={['Square Roots & Cubes', 'Percentage Sprints', 'Mental Arithmetic', 'Geometric Intuition']}
                theme="teal"
            />
            <ModuleCard 
                title="Reasoning"
                subtitle="Logic Under Pressure"
                icon={<Brain className="w-8 h-8 text-orange-400" />}
                features={['Coding-Decoding', 'Seating Arrangements', 'Alphabet Mastery', 'Directional Logic']}
                theme="orange"
            />
            <ModuleCard 
                title="English"
                subtitle="Verbal Velocity"
                icon={<Zap className="w-8 h-8 text-purple-400" />}
                features={['High-Freq Vocabulary', 'Grammar Sprints', 'Error Detection', 'Oxford/Cambridge Corpus']}
                theme="purple"
            />
        </div>
      </section>

      {/* AI Radar Section */}
      <section id="features" className="relative z-10 py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase tracking-widest mb-6">
                    Performance Analysis
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                    See What the <br /><span className="text-teal-400 italic">Human Eye</span> Misses.
                </h2>
                <div className="space-y-6">
                    <RadarFeature 
                        icon={<Target className="w-5 h-5 text-teal-400" />}
                        title="Weak Point Detection"
                        desc="Our AI scans your session history to find the exact sub-topics where accuracy drops below 60%."
                    />
                    <RadarFeature 
                        icon={<Timer className="w-5 h-5 text-orange-400" />}
                        title="Speed Drift Tracking"
                        desc="Monitor your 'Time per Question' and detect fatigue-induced slowdowns in real-time."
                    />
                    <RadarFeature 
                        icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                        title="Careless Error Audit"
                        desc="Separate 'Conceptual Gaps' from 'Careless Mistakes' based on question difficulty weighting."
                    />
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative px-4"
            >
                <div className="absolute inset-0 bg-teal-500/20 blur-[120px] rounded-full" />
                <div className="relative bg-zinc-900 border border-white/10 p-8 rounded-[40px] shadow-2xl">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Performance Radar</h4>
                                <p className="text-[10px] uppercase font-bold text-teal-500 tracking-widest">Active Scan</p>
                            </div>
                        </div>
                    </div>
                    {/* Simulated Radar Chart */}
                    <div className="aspect-square relative flex items-center justify-center mb-10">
                        <div className="absolute w-[90%] h-[90%] border border-teal-500/20 rounded-full" />
                        <div className="absolute w-[70%] h-[70%] border border-teal-500/20 rounded-full" />
                        <div className="absolute w-[50%] h-[50%] border border-teal-500/20 rounded-full" />
                        <div className="absolute w-px h-full bg-teal-500/10" />
                        <div className="absolute w-full h-px bg-teal-500/10" />
                        
                        <div 
                            className="absolute inset-0 bg-teal-500/5"
                            style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%)', maskImage: 'linear-gradient(to right, transparent, black)' }}
                        />

                        <svg className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" viewBox="0 0 100 100">
                            <motion.polygon 
                                points="50,20 80,40 70,80 30,75 20,45"
                                className="fill-teal-500/40 stroke-teal-500 stroke-[0.5]"
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1, type: 'spring' }}
                            />
                        </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <div className="text-xl font-black text-white">88/100</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Speed Score</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <div className="text-xl font-black text-white">94%</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Accuracy</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Social/PvP Section */}
      <section id="pvp-rooms" className="relative z-10 py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-6">Built for Social Grinders</h2>
            <p className="text-gray-500 font-medium text-center mb-16 max-w-2xl">Don't train alone. Create Study Rooms and race against others in real-time sessions.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
                <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-zinc-900 shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-8xl text-white select-none">01</div>
                    <div className="p-10">
                        <h3 className="text-3xl font-bold mb-4">Study Rooms</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">Hosts public or private rooms. Generate questions via AI or manual bank and let friends join via unique room codes.</p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-bold text-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-teal-500" /> Real-time Leaderboard Status
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-teal-500" /> AI-Generated Combat Sets
                            </li>
                        </ul>

                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-zinc-900 shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-8xl text-white select-none">02</div>
                    <div className="p-10">
                        <h3 className="text-3xl font-bold mb-4">Global Tournament</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">Climb the global all-time leaderboard. Earn XP for every correct answer and unlock "Sprinting" levels.</p>
                         <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-bold text-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-teal-500" /> XP Multipliers & Streaks
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-teal-500" /> Avatar & Title Customization
                            </li>
                        </ul>

                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Choose Your <span className="text-teal-400 italic">Velocity</span></h2>
            <p className="text-gray-500 font-medium">Simple, transparent pricing for all types of sprinters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="group p-10 rounded-[40px] bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all shadow-2xl relative overflow-hidden flex flex-col">
                <div className="mb-8 p-1">
                    <h3 className="text-2xl font-bold mb-2">Free Sprint</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black">₹0</span>
                        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">/ Forever</span>
                    </div>
                </div>
                <ul className="space-y-4 mb-12 flex-grow">
                    {['Access basic Reasoning', 'Limited Formula Sprint', 'Basic performance stats', 'Join public rooms'].map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-400">
                            <CheckCircle2 className="w-4 h-4 text-teal-500" /> {f}
                        </li>
                    ))}
                </ul>
                <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-black" asChild>
                    <Link href="/auth">Get Started</Link>
                </Button>
            </div>

            {/* Pro Plan */}
            <div className="group p-10 rounded-[40px] bg-white text-black border border-white/10 transition-all shadow-[0_0_50px_rgba(45,212,191,0.2)] relative overflow-hidden flex flex-col scale-105 z-10">
                <div className="absolute top-6 right-8 bg-teal-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Recommended</div>
                <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2 text-black/60">Pro Sprint</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-black/30 line-through">₹499</span>
                        <span className="text-5xl font-black">₹0</span>
                        <span className="text-black/40 font-bold uppercase tracking-widest text-xs">/ Free For Now</span>
                    </div>
                </div>
                <ul className="space-y-4 mb-12 flex-grow">
                    {[
                        'Unlimited AI Topic Generation',
                        'Deep Performance Radar Scan',
                        'Create Private PvP Rooms',
                        'Advanced Formula Analysis',
                        'Priority AI extraction',
                        'Ad-free Experience'
                    ].map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-black text-black/80">
                            <CheckCircle2 className="w-4 h-4 text-teal-600" /> {f}
                        </li>
                    ))}
                </ul>
                <Button className="w-full h-14 rounded-2xl bg-black text-white hover:bg-black/90 font-black shadow-xl" disabled>
                    Coming Soon
                </Button>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-44 px-6">
        <div className="max-w-4xl mx-auto p-12 md:p-20 rounded-[60px] bg-gradient-to-br from-teal-500 to-teal-400 text-black text-center relative overflow-hidden shadow-[0_0_100px_rgba(45,212,191,0.3)]">
            <div className="relative z-10">
                <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">READY TO <br />BREAK YOUR LIMITS?</h2>
                <p className="text-black/70 font-bold mb-12 max-w-lg mx-auto leading-relaxed">
                    Join thousands of sprinters rewiring their cognitive performance for competitive exams. Free to start.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="h-16 px-12 rounded-2xl bg-black text-white hover:bg-black/90 font-black text-xl shadow-2xl active:scale-95" asChild>
                        <Link href="/auth">Start Training Free</Link>
                    </Button>
                </div>
            </div>
            
            {/* Background elements for CTA */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/20 blur-[60px] rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-black/5 blur-[60px] rounded-full" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div>
                <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                    <Image src="/assets/images/icon.png" alt="Logo" width={24} height={24} className="opacity-50" />
                    <span className="text-xl font-bold tracking-tight text-white/50">BrainSprint</span>
                </div>
                <p className="text-gray-500 max-w-sm text-sm font-medium">
                    The ultra-fast cognitive engine for competitive exam preparation. A product of the AxomPrep.
                </p>
            </div>
            <div className="flex gap-12">
                <div>
                    <h5 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Product</h5>
                    <ul className="space-y-4 text-gray-500 text-sm font-medium">
                        <li><Link href="#features" className="hover:text-teal-400 transition-colors">Features</Link></li>
                        <li><Link href="#modules" className="hover:text-teal-400 transition-colors">Modules</Link></li>
                        <li><Link href="/leaderboard" className="hover:text-teal-400 transition-colors">Leaderboard</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Company</h5>
                    <ul className="space-y-4 text-gray-500 text-sm font-medium">
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">About Us</Link></li>
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">© 2026 BrainSprint. All rights reserved.</p>
            <div className="flex gap-6">
                {/* Social icons could go here */}
            </div>
        </div>
      </footer>

    </div>
  );
}

function ModuleCard({ title, subtitle, icon, features, theme }: { title: string; subtitle: string; icon: React.ReactNode; features: string[], theme: 'teal' | 'orange' | 'purple' }) {
    const themeColors = {
        teal: 'group-hover:text-teal-400',
        orange: 'group-hover:text-orange-400',
        purple: 'group-hover:text-purple-400'
    };

    return (
        <motion.div 
            whileHover={{ y: -10 }}
            className="group p-8 rounded-[40px] bg-zinc-900 border border-white/5 hover:border-white/10 transition-all shadow-2xl relative overflow-hidden"
        >
            <div className="relative z-10">
                <div className="mb-8 p-5 bg-white/5 border border-white/5 rounded-3xl inline-block group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">{subtitle}</div>
                <h3 className={`text-4xl font-black mb-8 transition-colors ${themeColors[theme]}`}>{title}</h3>
                <ul className="space-y-4">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-400">
                            <CheckCircle2 className={`w-4 h-4 ${theme === 'teal' ? 'text-teal-500' : theme === 'orange' ? 'text-orange-500' : 'text-purple-500'}`} />
                            {f}
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className={`absolute bottom-[-20%] right-[-20%] w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${theme === 'teal' ? 'bg-teal-500' : theme === 'orange' ? 'bg-orange-500' : 'bg-purple-500'}`} />
        </motion.div>
    );
}

function RadarFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-white/5 border border-white/5 rounded-xl shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function AlertCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}
