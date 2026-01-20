
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
    Users, 
    Lock, 
    Plus, 
    ArrowRight, 
    Clock, 
    Search,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient();

interface Room {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  status: string;
  creator_id: string;
  created_at: string;
  participants_count?: number; 
  subject?: string;
  cover_image_url?: string;
  code?: string;
}

export default function RoomsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');

    const getRelativeTime = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return past.toLocaleDateString();
    };

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .in('status', ['waiting', 'active', 'finished'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRooms(data || []);
        } catch (err) {
            console.error('Fetch rooms error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            fetchRooms();
        };
        checkUser();
    }, [router]);

    const handleJoinPrivate = async () => {
        if (!joinCode || joinCode.length < 6) return;
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('code', joinCode.toUpperCase())
                .single();
            
            if (error || !data) {
                alert('Invalid Room Code');
                return;
            }
            
            router.push(`/rooms/${data.id}`);
        } catch (err) {
            alert('Error joining room');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2 inline-flex items-center gap-1 transition-colors">
                            <ArrowRight className="rotate-180 w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Rooms</h1>
                        <p className="text-gray-500 dark:text-gray-400">Join & Compete with friends</p>
                    </div>
                    
                    <button 
                        onClick={() => router.push('/rooms/create')}
                        className="bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-6 rounded-full flex items-center justify-center font-bold shadow-sm transition-all active:scale-95 w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Create Room
                    </button>
                </div>

                {/* Join Code Section */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 mb-8">
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Have a Room Code?</h2>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <input 
                                type="text"
                                className="w-full bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-3 pl-10 font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all uppercase placeholder:normal-case"
                                placeholder="Ex: AB12CD"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                maxLength={6}
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                        <button 
                            onClick={handleJoinPrivate}
                            disabled={joinCode.length < 6}
                            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Active Rooms</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                         <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                ) : rooms.length === 0 ? (
                     <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No active public rooms found.</p>
                        <button onClick={() => router.push('/rooms/create')} className="text-teal-600 font-bold mt-2 hover:underline">Create your own!</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {rooms.map((room) => (
                            <Link 
                                key={room.id}
                                href={`/rooms/${room.id}`}
                                className="group block bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-zinc-800 transition-all duration-300 hover:-translate-y-1 h-64 flex flex-col"
                            >
                                {room.cover_image_url ? (
                                    <div className="relative h-full">
                                        <Image
                                            src={room.cover_image_url}
                                            alt={room.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                        
                                        <div className="absolute inset-x-0 bottom-0 p-5">
                                             <div className="flex justify-between items-start mb-3">
                                                 <div className="flex gap-2">
                                                    {!room.is_public && (
                                                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center">
                                                            <Lock className="w-3 h-3 text-white mr-1" />
                                                            <span className="text-white text-[10px] font-bold tracking-wider">PRIVATE</span>
                                                        </div>
                                                    )}
                                                    {room.subject && (
                                                        <div className="bg-orange-500 px-2 py-1 rounded-md">
                                                            <span className="text-white text-[10px] font-bold tracking-wider uppercase">{room.subject}</span>
                                                        </div>
                                                    )}
                                                 </div>
                                                 <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center">
                                                     <Clock className="w-3 h-3 text-white mr-1" />
                                                     <span className="text-white text-[10px] font-bold">{getRelativeTime(room.created_at)}</span>
                                                 </div>
                                             </div>
                                            
                                            <h3 className="text-2xl font-bold text-white mb-1 shadow-sm leading-tight">{room.name}</h3>
                                            <p className="text-gray-300 text-sm line-clamp-1">{room.description || 'No description'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                          <div className="flex justify-between items-start">
                                              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                                                  {room.is_public ? (
                                                      <Users className="w-6 h-6 text-orange-500" />
                                                  ) : (
                                                      <Lock className="w-6 h-6 text-orange-500" />
                                                  )}
                                              </div>
                                              <div className="flex flex-col items-end gap-2">
                                                 <div className="flex gap-2">
                                                    {!room.is_public && (
                                                        <div className="bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md flex items-center">
                                                            <Lock className="w-3 h-3 text-gray-500 mr-1" />
                                                            <span className="text-gray-500 text-[10px] font-bold tracking-wider">PRIVATE</span>
                                                        </div>
                                                    )}
                                                    {room.subject && (
                                                        <div className="bg-teal-100 dark:bg-teal-900/20 px-2 py-1 rounded-md">
                                                            <span className="text-teal-700 dark:text-teal-400 text-[10px] font-bold tracking-wider uppercase">{room.subject}</span>
                                                        </div>
                                                    )}
                                                 </div>
                                                 <span className="text-gray-400 text-xs font-medium">{getRelativeTime(room.created_at)}</span>
                                              </div>
                                          </div>
                                          
                                          <div>
                                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{room.name}</h3>
                                              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">{room.description || 'No description available for this room.'}</p>
                                          </div>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
