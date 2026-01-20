
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
import { Button } from '@/components/ui/button';

const MENU_ITEMS = [
  { icon: User, label: 'Edit Profile', desc: 'Update your personal information', color: 'text-teal-400', bg: 'bg-teal-900/20' },
  { icon: Bell, label: 'Notifications', desc: 'Manage your alert preferences', color: 'text-amber-400', bg: 'bg-amber-900/20' },
  { icon: ShieldCheck, label: 'Privacy & Security', desc: 'Password and security settings', color: 'text-zinc-400', bg: 'bg-zinc-800' },
  { icon: CreditCard, label: 'Billing & Plans', desc: 'Manage subscriptions', color: 'text-purple-400', bg: 'bg-purple-900/20' },
  { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs and contacting support', color: 'text-indigo-400', bg: 'bg-indigo-900/20' },
];

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [gamesPlayed, setGamesPlayed] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');

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
            setNewName(profileData?.name || '');

            // Fetch games played count
            const { count } = await supabase
                .from('user_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            setGamesPlayed(count || 0);

            setLoading(false);
        };
        fetchUser();
    }, [router, supabase]);

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('users')
                .update({ name: newName })
                .eq('id', user.id);

            if (error) throw error;
            setProfile({ ...profile, name: newName });
            setIsEditing(false);
        } catch (error: any) {
            alert(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

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
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
    );

    // Streak Logic for display
    const lastActiveDate = profile?.last_active_at ? new Date(profile.last_active_at) : null;
    const isToday = lastActiveDate?.toDateString() === new Date().toDateString();
    const isYesterday = lastActiveDate?.toDateString() === new Date(Date.now() - 86400000).toDateString();
    
    const displayStreak = isToday 
          ? Math.max(1, profile?.current_streak || 0) 
          : (isYesterday ? (profile?.current_streak || 0) : 0);

    return (
        <div className="min-h-screen bg-black text-white font-sans pb-12 dark">
             {/* Navbar / Header */}
             <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
                 <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                     <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                         <ArrowLeft className="w-5 h-5" />
                         <span className="font-semibold">Back to Dashboard</span>
                     </Link>
                     <div className="text-lg font-bold text-white">My Profile</div>
                     <div className="w-24" /> {/* Spacer for balance */}
                 </div>
             </div>

             <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN - Profile Card */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                        <div className="bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-800 flex flex-col items-center text-center">
                             <div className="relative mb-4 group">
                                 <div className="w-32 h-32 rounded-full p-1 border-4 border-zinc-800 shadow-inner overflow-hidden relative">
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
                                 <div className="absolute bottom-1 right-1 bg-teal-500 w-8 h-8 rounded-full flex items-center justify-center border-2 border-zinc-900 pointer-events-none z-20">
                                     {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                                 </div>
                             </div>

                             <h2 className="text-2xl font-bold text-white mb-1">
                                 {profile?.name || 'Brain Sprinter'}
                             </h2>
                             <p className="text-gray-400 text-sm mb-4">{user?.email}</p>

                             <div className="flex items-center gap-2 bg-teal-900/10 px-3 py-1.5 rounded-full border border-teal-900/20 mb-6">
                                 <ShieldCheck className="w-4 h-4 text-teal-400" />
                                 <span className="text-teal-400 font-bold text-xs uppercase tracking-wide">
                                     {profile?.is_premium ? 'Premium' : 'Free Plan'}
                                 </span>
                             </div>

                             <button 
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/10 text-red-400 rounded-xl font-bold hover:bg-red-900/20 transition-colors"
                             >
                                 <LogOut className="w-5 h-5" /> Sign Out
                             </button>
                        </div>

                        {/* Quick Stats Summary for Mobile / Vertical Layout */}
                        <div className="bg-[#FF6B58] rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
                            <Flame className="w-32 h-32 absolute -right-6 -bottom-6 text-white/10 rotate-12" />
                            <div className="relative z-10">
                                <div className="text-white/80 font-medium mb-1">Current Streak</div>
                                <div className="text-4xl font-bold mb-4">{displayStreak} Days</div>
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
                                value={profile?.total_xp || 0} 
                                label="Total XP" 
                                color="text-amber-500" 
                                bg="bg-amber-500/10"
                                trend="+12%" // Example trend
                            />
                            <StatCard 
                                icon={Trophy} 
                                value={profile?.current_level || 1} 
                                label="Current Level" 
                                color="text-purple-600" 
                                bg="bg-purple-500/10"
                                subLabel="Rookie"
                            />
                            <StatCard 
                                icon={LayoutDashboard} 
                                value={gamesPlayed} 
                                label="Games Played" 
                                color="text-blue-500" 
                                bg="bg-blue-500/10"
                            />
                        </div>

                        {/* Settings Section */}
                        <div className="bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-800">
                             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-400" /> Account Settings
                             </h3>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MENU_ITEMS.map((item, idx) => (
                                    <button 
                                        key={idx}
                                        className="flex items-start p-4 rounded-2xl border border-zinc-800 hover:border-teal-500/30 hover:bg-zinc-800/50 transition-all group text-left"
                                        onClick={() => {
                                            if (item.label === 'Edit Profile') setIsEditing(true);
                                        }}
                                    >
                                        <div className={`p-3 rounded-full mr-4 shrink-0 transition-colors ${item.bg} group-hover:bg-zinc-800`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">
                                                {item.label}
                                            </div>
                                            <div className="text-xs text-gray-400 line-clamp-1">
                                                {item.desc}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Version Info */}
                        <div className="text-center md:text-right text-gray-400 text-xs py-4">
                            BrainSprint Web v1.0.0
                        </div>
                    </div>
                </div>
             </main>

             {/* Edit Profile Modal */}
             {isEditing && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 max-w-md w-full shadow-2xl"
                     >
                         <h3 className="text-2xl font-black mb-6">Edit Profile</h3>
                         <div className="space-y-4">
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Display Name</label>
                                 <input 
                                    type="text" 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-teal-500 transition-all"
                                    placeholder="Enter your name"
                                 />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mt-8">
                             <Button 
                                variant="outline" 
                                onClick={() => setIsEditing(false)}
                                className="h-14 rounded-2xl border-white/10 bg-transparent text-white font-bold hover:bg-white/5"
                             >
                                 Cancel
                             </Button>
                             <Button 
                                onClick={handleUpdateProfile}
                                className="h-14 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-black"
                             >
                                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                             </Button>
                         </div>
                     </motion.div>
                 </div>
             )}
        </div>
    );
}

function StatCard({ icon: Icon, value, label, color, bg, trend, subLabel }: any) {
    return (
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                {trend && (
                    <span className="bg-green-900/30 text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-extrabold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                {value}
            </div>
            <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</div>
                {subLabel && <span className="text-xs text-gray-300">• {subLabel}</span>}
            </div>
        </div>
    );
}
