
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
    ArrowLeft, 
    Pencil, 
    Trash2, 
    Copy, 
    Grid, 
    Key, 
    Play, 
    BookOpen, 
    X, 
    Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Room {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  code: string;
  status: string;
  creator_id: string;
  cover_image_url?: string;
  subject?: string;
}

interface Participant {
  user_id: string;
  name?: string;
  avatar_url?: string;
  status: string;
  score: number;
  rank?: number;
}

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function RoomLobbyPage({ params }: PageProps) {
    const resolveParams = React.use(params);
    const { id } = resolveParams;
    const router = useRouter();
    const supabase = createClient();
    const { user, initialized } = useAuthStore();
    
    // Missing States Restored
    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreator, setIsCreator] = useState(false);
    const [inputCode, setInputCode] = useState('');

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editSubject, setEditSubject] = useState('');
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

    // Derived state
    const myParticipant = participants.find(p => p.user_id === user?.id);

    // Auth Check
    useEffect(() => {
        if (!initialized) return;

        if (!user) {
            router.push('/auth');
            return;
        }

        if (id) {
            initRoom();
            const channel = subscribeToRoom();
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [id, user, initialized]);

    const initRoom = async () => {
        try {
            await fetchRoomDetails();
        } catch (error) {
            console.error(error);
            setLoading(false); // Ensure loading is stopped directly on error
        }
        // Finally block is already handling this, but let's be explicit and careful about flow
    };

    const fetchRoomDetails = async () => {
        try {
            // 1. Fetch Room
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', id)
                .single();
            
            if (roomError) throw roomError;
            setRoom(roomData);
            setIsCreator(roomData.creator_id === user?.id);

            // 2. Fetch Participants
            await fetchParticipants();

            // 3. Auto-join if public
            const { data: participation } = await supabase
                .from('room_participants')
                .select('*')
                .eq('room_id', id)
                .eq('user_id', user?.id)
                .single();

            if (!participation && roomData.is_public) {
                await joinRoom();
            }

            setLoading(false); // Success path

        } catch (err) {
            console.error('Error loading room:', err);
            setLoading(false); // Error path
        }
    };

    const fetchParticipants = async () => {
        try {
            const { data: participations, error: pError } = await supabase
                .from('room_participants')
                .select('*')
                .eq('room_id', id);

            if (pError || !participations) return;

            if (participations.length === 0) {
                setParticipants([]);
                return;
            }

            const userIds = participations.map(p => p.user_id);
            const { data: usersData } = await supabase
                .from('users')
                .select('id, full_name, avatar_url') // Web uses full_name vs mobile 'name'
                .in('id', userIds);
            
            const merged = participations.map(p => {
                const userDetail = usersData?.find((u: any) => u.id === p.user_id);
                return {
                    user_id: p.user_id,
                    status: p.status,
                    score: p.score,
                    name: userDetail?.full_name || 'User',
                    avatar_url: userDetail?.avatar_url
                };
            }).sort((a, b) => b.score - a.score)
              .map((p, idx) => ({ ...p, rank: idx + 1 }));
            
            setParticipants(merged);

        } catch (err) {
             console.error('Fetch Participants Error:', err);
        }
    };

    const joinRoom = async () => {
        try {
            await supabase.from('room_participants').upsert({
                room_id: id,
                user_id: user?.id,
                status: 'joined',
                score: 0
            }, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
            
            await fetchParticipants();
        } catch (err) {
            console.error('Join error', err);
        }
    };

    const subscribeToRoom = () => {
        return supabase
            .channel(`room_${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${id}` }, () => {
                fetchParticipants();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${id}` }, (payload) => {
                if (payload.new.status === 'active') {
                    router.push(`/rooms/play/${id}`);
                }
            })
            .subscribe();
    };

    const handleUnlockRoom = async () => {
        if (!inputCode) return;
        if (inputCode.trim().toUpperCase() !== room?.code) {
            alert('Invalid Code');
            return;
        }
        await joinRoom();
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this room?')) {
            await supabase.from('rooms').delete().eq('id', id);
            router.push('/dashboard');
        }
    };

    const copyCode = () => {
        if (room?.code) {
             navigator.clipboard.writeText(room.code);
             alert('Code copied to clipboard: ' + room.code);
        }
    };

    // Update Room Logic
    const openEditModal = () => {
        setEditName(room?.name || '');
        setEditDescription(room?.description || '');
        setEditSubject(room?.subject || '');
        setEditImagePreview(room?.cover_image_url || null);
        setEditModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImageFile(file);
            setEditImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateRoom = async () => {
        try {
            let coverUrl = room?.cover_image_url;
            
            if (editImageFile) {
                const ext = editImageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('room_assets')
                    .upload(fileName, editImageFile);
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('room_assets').getPublicUrl(fileName);
                coverUrl = data.publicUrl;
            }

            const { error } = await supabase
                .from('rooms')
                .update({
                    name: editName,
                    description: editDescription,
                    subject: editSubject,
                    cover_image_url: coverUrl
                })
                .eq('id', id);

            if (error) throw error;
            
            // Optimistic update
            setRoom(prev => prev ? ({ ...prev, name: editName, description: editDescription, subject: editSubject, cover_image_url: coverUrl }) : null);
            setEditModalOpen(false);

        } catch (err) {
            alert('Failed to update room');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center dark:bg-black text-white">Loading Room...</div>;
    }

    if (!room) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-24">
            {/* Header / Cover */}
            <div className={`relative h-[40vh] w-full ${!room.cover_image_url ? 'bg-slate-900' : ''}`}>
                {room.cover_image_url ? (
                    <Image 
                        src={room.cover_image_url} 
                        alt={room.name} 
                        fill 
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                         <Grid className="w-32 h-32 text-white" />
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />

                {/* Navbar */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    
                    {isCreator && (
                        <div className="flex gap-3">
                            <button onClick={openEditModal} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30">
                                <Pencil className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={handleDelete} className="w-10 h-10 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors border border-red-500/30">
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Room Info Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                    {room.subject && (
                        <span className="inline-block px-3 py-1 bg-[#FF6B58] rounded-full text-white text-xs font-bold uppercase mb-3">
                            {room.subject}
                        </span>
                    )}
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 shadow-sm">{room.name}</h1>
                    <p className="text-gray-200 text-lg md:max-w-xl">{room.description || 'Get ready to compete!'}</p>

                    {!room.is_public && room.code && isCreator && (
                        <button onClick={copyCode} className="mt-4 flex items-center bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                            <span className="text-white font-mono font-bold text-lg mr-3 tracking-widest">{room.code}</span>
                            <Copy className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Participants Section */}
            <div className="max-w-4xl mx-auto -mt-8 relative z-20 px-4">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden min-h-[50vh]">
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Participants</h2>
                        <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-green-700 dark:text-green-400 font-bold text-xs">
                            {participants.length} Active
                        </div>
                    </div>

                    <div className="p-2">
                        {participants.map((p) => {
                            const isMe = p.user_id === user?.id;
                            return (
                                <div key={p.user_id} className={`flex items-center p-4 rounded-xl mb-1 ${isMe ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}>
                                    <div className={`w-8 text-center font-bold text-lg mr-4 ${p.rank! <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                                        #{p.rank}
                                    </div>
                                    <div className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden mr-4">
                                        {p.avatar_url ? (
                                            <Image src={p.avatar_url} alt={p.name || ''} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                {p.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                            {p.name} {isMe && '(You)'}
                                        </div>
                                    </div>
                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                        {p.score} XP
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 z-30">
                <div className="max-w-4xl mx-auto flex justify-center">
                    {!room.is_public && !isCreator && !myParticipant ? (
                         <div className="flex w-full max-w-md gap-3">
                             <div className="relative flex-1">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                    placeholder="ENTER CODE"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-coral-500"
                                    maxLength={6}
                                />
                             </div>
                             <button 
                                 onClick={handleUnlockRoom}
                                 className="bg-[#FF6B58] text-white px-6 rounded-xl font-bold shadow-lg shadow-[#FF6B58]/30 hover:bg-[#E55A49] transition-colors"
                             >
                                 Join
                             </button>
                         </div>
                    ) : (
                        myParticipant?.status === 'completed' ? (
                            <button 
                                onClick={() => router.push(`/rooms/play/${id}?review=true`)}
                                className="w-full max-w-md bg-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors"
                            >
                                <BookOpen className="w-6 h-6" /> View Solutions
                            </button>
                        ) : (
                            <button 
                                onClick={() => router.push(`/rooms/play/${id}`)}
                                className="w-full max-w-md bg-[#FF6B58] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-coral/30 flex items-center justify-center gap-2 hover:bg-[#E55A49] transition-colors"
                            >
                                Start Test Now <Play className="w-6 h-6 fill-current" />
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setEditModalOpen(false)}
                    >
                        <motion.div 
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Room</h3>
                                <button onClick={() => setEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Image Upload */}
                                <div className="relative h-40 w-full bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-blue-500 transition-colors group">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {editImagePreview ? (
                                        <Image src={editImagePreview} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                            <ImageIcon className="w-8 h-8 mb-2" />
                                            <span className="text-sm font-medium">Click to upload cover</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Room Name</label>
                                    <input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 ring-blue-500 outline-none"
                                        placeholder="Ex: Weekly Quiz"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Subject</label>
                                    <input 
                                        value={editSubject}
                                        onChange={(e) => setEditSubject(e.target.value)}
                                        className="w-full p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 ring-blue-500 outline-none"
                                        placeholder="Ex: Biology"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                                    <textarea 
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus:ring-2 ring-blue-500 outline-none min-h-[80px]"
                                        placeholder="What is this room about?"
                                    />
                                </div>

                                <button 
                                    onClick={handleUpdateRoom}
                                    className="w-full py-4 bg-[#FF6B58] text-white font-bold rounded-xl shadow-lg hover:bg-[#d8503e] transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
