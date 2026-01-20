
"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
    LogOut, 
    Camera, 
    ShieldCheck, 
    Flame, 
    Star, 
    Trophy, 
    ChevronRight, 
    Bell, 
    HelpCircle, 
    Moon, 
    User,
    Settings,
    Loader2,
    ArrowLeft,
    CreditCard,
    LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';

const MENU_ITEMS = [
  { icon: User, label: 'Edit Profile', desc: 'Update your personal information', color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { icon: Bell, label: 'Notifications', desc: 'Manage your alert preferences', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: ShieldCheck, label: 'Privacy & Security', desc: 'Password and security settings', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-zinc-800' },
  { icon: CreditCard, label: 'Billing & Plans', desc: 'Manage subscriptions', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs and contacting support', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
];

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);

            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);
            setLoading(false);
        };
        fetchUser();
    }, [router, supabase]);

    const handleSignOut = async () => {
        if (!confirm('Are you sure you want to sign out?')) return;
        await supabase.auth.signOut();
        router.replace('/auth');
    };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: data.publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Optimistic update
            setProfile({ ...profile, avatar_url: data.publicUrl });
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-12">
             {/* Navbar / Header */}
             <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-20">
                 <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                     <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                         <ArrowLeft className="w-5 h-5" />
                         <span className="font-semibold">Back to Dashboard</span>
                     </Link>
                     <div className="text-lg font-bold text-gray-900 dark:text-white">My Profile</div>
                     <div className="w-24" /> {/* Spacer for balance */}
                 </div>
             </div>

             <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN - Profile Card */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center">
                             <div className="relative mb-4 group">
                                 <div className="w-32 h-32 rounded-full p-1 border-4 border-gray-50 dark:border-zinc-800 shadow-inner overflow-hidden relative">
                                    <Image 
                                        src={profile?.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${user?.email}`} 
                                        alt="Avatar"
                                        fill
                                        className="object-cover rounded-full"
                                    />
                                    {/* Hover Upload Overlay */}
                                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-10">
                                        <Camera className="w-8 h-8 text-white" />
                                        <input type="file" onChange={handleUploadAvatar} className="hidden" accept="image/*" />
                                    </label>
                                 </div>
                                 <div className="absolute bottom-1 right-1 bg-teal-500 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 pointer-events-none z-20">
                                     {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                                 </div>
                             </div>

                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                 {profile?.full_name || 'Brain Sprinter'}
                             </h2>
                             <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{user?.email}</p>

                             <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/10 px-3 py-1.5 rounded-full border border-teal-100 dark:border-teal-900/20 mb-6">
                                 <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                 <span className="text-teal-700 dark:text-teal-400 font-bold text-xs uppercase tracking-wide">
                                     {profile?.is_premium ? 'Premium' : 'Free Plan'}
                                 </span>
                             </div>

                             <button 
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                             >
                                 <LogOut className="w-5 h-5" /> Sign Out
                             </button>
                        </div>

                        {/* Quick Stats Summary for Mobile / Vertical Layout */}
                        <div className="bg-[#FF6B58] rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
                            <Flame className="w-32 h-32 absolute -right-6 -bottom-6 text-white/10 rotate-12" />
                            <div className="relative z-10">
                                <div className="text-white/80 font-medium mb-1">Current Streak</div>
                                <div className="text-4xl font-bold mb-4">{profile?.current_streak || 0} Days</div>
                                <div className="bg-white/20 h-2 rounded-full overflow-hidden">
                                    <div className="bg-white h-full w-2/3" /> 
                                </div>
                                <div className="text-white/60 text-xs mt-2">Keep it up! You're doing great.</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Main Content */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-6">
                        
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard 
                                icon={Star} 
                                value={profile?.xp || 0} 
                                label="Total XP" 
                                color="text-amber-500" 
                                bg="bg-amber-500/10"
                                trend="+12%" // Example trend
                            />
                            <StatCard 
                                icon={Trophy} 
                                value={profile?.level || 1} 
                                label="Current Level" 
                                color="text-purple-600" 
                                bg="bg-purple-500/10"
                                subLabel="Rookie"
                            />
                            <StatCard 
                                icon={LayoutDashboard} 
                                value={profile?.games_played || 0} 
                                label="Games Played" 
                                color="text-blue-500" 
                                bg="bg-blue-500/10"
                            />
                        </div>

                        {/* Settings Section */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-400" /> Account Settings
                             </h3>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MENU_ITEMS.map((item, idx) => (
                                    <button 
                                        key={idx}
                                        className="flex items-start p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 hover:border-teal-500/30 hover:bg-teal-50/30 dark:hover:bg-zinc-800/50 transition-all group text-left"
                                        onClick={() => {}} // Placeholder handlers
                                    >
                                        <div className={`p-3 rounded-full mr-4 shrink-0 transition-colors ${item.bg} group-hover:bg-white dark:group-hover:bg-zinc-800`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                {item.label}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                {item.desc}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                    </button>
                                ))}
                             </div>

                             {/* Dark Mode Row */}
                             <div className="mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-600 dark:text-gray-400">
                                         <Moon className="w-6 h-6" />
                                     </div>
                                     <div>
                                         <div className="font-bold text-gray-900 dark:text-white">Dark Mode</div>
                                         <div className="text-xs text-gray-500">Adjust the appearance of the application</div>
                                     </div>
                                 </div>
                                 <button
                                    onClick={() => setIsDarkMode(!isDarkMode)} 
                                    className={`w-14 h-8 rounded-full p-1 transition-colors relative ${isDarkMode ? 'bg-teal-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
                                 >
                                     <motion.div 
                                        initial={false}
                                        animate={{ x: isDarkMode ? 24 : 0 }}
                                        className="bg-white w-6 h-6 rounded-full shadow-md" 
                                     />
                                 </button>
                             </div>
                        </div>

                        {/* Version Info */}
                        <div className="text-center md:text-right text-gray-400 text-xs py-4">
                            BrainSprint Web v1.0.0
                        </div>
                    </div>
                </div>
             </main>
        </div>
    );
}

function StatCard({ icon: Icon, value, label, color, bg, trend, subLabel }: any) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                {trend && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                {value}
            </div>
            <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</div>
                {subLabel && <span className="text-xs text-gray-300">• {subLabel}</span>}
            </div>
        </div>
    );
}
