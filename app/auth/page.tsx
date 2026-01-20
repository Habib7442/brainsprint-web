
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Depending on config, might need email verification. 
        // For now, assuming auto-confirm or showing "Check email"
        alert("Account created! Please check your email to verify your account before logging in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute inset-0 w-full h-full pointer-events-none">
         <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-teal-500/20 opacity-20 blur-[100px]" />
         <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-orange-500/10 opacity-20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
        </Link>
        
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-400">
                {isSignUp ? "Start your sprinting journey today." : "Ready to train your brain?"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                        placeholder="hello@example.com"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-300"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-black font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-teal-400 hover:text-teal-300 font-bold ml-1 hover:underline"
                >
                    {isSignUp ? "Log In" : "Sign Up"}
                </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
