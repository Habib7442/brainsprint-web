
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
    X, 
    Image as ImageIcon, 
    Sparkles, 
    FileText, 
    PenTool, 
    CloudUpload, 
    PlusCircle, 
    ArrowRight, 
    Loader2,
    CheckCircle,
    Trash2
} from 'lucide-react';
import Image from 'next/image';

interface ManualQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    imageUrl?: string;
}

export default function CreateRoomPage() {
    const router = useRouter();
    const supabase = createClient();
    const { user } = useAuthStore();
    
    // Room Basics
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

    // Quiz Options
    const [generationType, setGenerationType] = useState<'ai' | 'manual' | 'pdf'>('ai');
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState('20');
    
    // PDF State
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const [pdfName, setPdfName] = useState<string | null>(null);

    // Manual Creation State
    const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);
    const [currentQ, setCurrentQ] = useState<Partial<ManualQuestion>>({ options: ['', '', '', ''] });
    const [qImageFile, setQImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // --- Actions ---

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'question') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (type === 'cover') {
            setCoverImageFile(file);
            setCoverImagePreview(URL.createObjectURL(file));
        } else {
            setQImageFile(file);
        }
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            alert('Please upload a valid PDF file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
             const base64 = (reader.result as string).split(',')[1];
             setPdfBase64(base64);
             setPdfName(file.name);
        };
        reader.readAsDataURL(file);
    };

    const addManualQuestion = async () => {
        if (!currentQ.question || !currentQ.correctAnswer) {
            alert('Question and Answer are required');
            return;
        }

        let imageUrl = undefined;
        // In web version, we might handle qImage upload here or just simulate for now since we need bucket logic
        
        const newQ: ManualQuestion = {
            id: Date.now().toString(),
            question: currentQ.question!,
            options: currentQ.options as string[],
            correctAnswer: currentQ.correctAnswer!,
            explanation: currentQ.explanation,
            imageUrl: imageUrl
        };

        setManualQuestions([...manualQuestions, newQ]);
        setCurrentQ({ options: ['', '', '', ''] });
        setQImageFile(null);
    };

    const uploadFile = async (file: File) => {
         const ext = file.name.split('.').pop();
         const fileName = `${Date.now()}.${ext}`;
         const { error: uploadError } = await supabase.storage
            .from('room_assets')
            .upload(fileName, file);
          
         if (uploadError) throw uploadError;
         
         const { data } = supabase.storage.from('room_assets').getPublicUrl(fileName);
         return data.publicUrl;
    };

    const handleCreate = async () => {
        if (!name.trim()) return alert('Room name is required');
        
        setLoading(true);
        try {
            const code = isPublic ? null : Math.random().toString(36).substring(2, 8).toUpperCase();
            let coverUrl = null;
            
            if (coverImageFile) {
                coverUrl = await uploadFile(coverImageFile);
            }

            // 1. Create Room
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .insert({
                    creator_id: user?.id,
                    name,
                    subject,
                    description,
                    is_public: isPublic,
                    code,
                    status: 'waiting',
                    cover_image_url: coverUrl
                })
                .select()
                .single();

            if (roomError) throw roomError;

            // 2. Generate/Save Questions
            let questions: any[] = [];
            
            if (generationType === 'api') { // This logic was 'ai' in mobile
                const response = await fetch('/api/generate-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: topic,
                        subject: topic, // Web API uses 'subject' primarily
                        count: parseInt(questionCount)
                    })
                });
                
                if (!response.ok) throw new Error('AI Generation Failed');
                questions = await response.json();
            } else if (generationType === 'pdf') {
                 const response = await fetch('/api/generate-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: topic || 'Document Analysis',
                        subject: 'PDF Analysis',
                        count: parseInt(questionCount),
                        pdfBase64
                    })
                });
                if (!response.ok) throw new Error('PDF Analysis Failed');
                questions = await response.json();
            } else {
                questions = manualQuestions;
            }

            const { error: quizError } = await supabase
                .from('room_quizzes')
                .insert({
                    room_id: room.id,
                    questions
                });

            if (quizError) throw quizError;

            // 3. Join as Creator
            await supabase.from('room_participants').insert({
                room_id: room.id,
                user_id: user?.id,
                status: 'joined',
                score: 0
            });

            router.replace(`/rooms/${room.id}`);

        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 sticky top-0 z-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                         <X className="w-6 h-6 text-gray-500" />
                     </button>
                     <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Room</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="space-y-8">
                    {/* Cover Image */}
                    <div className="relative w-full h-56 bg-gray-100 dark:bg-zinc-800 rounded-3xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-blue-500 transition-all group">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'cover')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {coverImagePreview ? (
                            <Image src={coverImagePreview} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                <ImageIcon className="w-10 h-10 mb-2" />
                                <span className="font-bold">Upload Cover Image</span>
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Room Name</label>
                             <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:ring-2 ring-blue-500 outline-none font-medium"
                                placeholder="e.g. Friday Trivia"
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Subject (Optional)</label>
                             <input 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:ring-2 ring-blue-500 outline-none font-medium"
                                placeholder="e.g. Science"
                             />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                         <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Description</label>
                         <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:ring-2 ring-blue-500 outline-none font-medium min-h-[100px]"
                            placeholder="Briefly describe what this room is about..."
                         />
                    </div>

                    {/* Privacy Toggle */}
                    <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
                        <div>
                            <div className="font-bold text-lg text-gray-900 dark:text-white">Public Room</div>
                            <div className="text-gray-500 text-sm">Anyone can find and join this room</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#FF6B58]"></div>
                        </label>
                    </div>

                    {/* Quiz Material */}
                    <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quiz Material</h2>
                        
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'ai', label: 'AI Topic', icon: Sparkles },
                                { id: 'pdf', label: 'From PDF', icon: FileText },
                                { id: 'manual', label: 'Manual', icon: PenTool }
                            ].map((type: any) => (
                                <button
                                    key={type.id}
                                    onClick={() => setGenerationType(type.id)}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                        generationType === type.id 
                                        ? 'border-[#FF6B58] bg-[#FF6B58]/10 text-[#FF6B58]' 
                                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    <type.icon className="w-6 h-6" />
                                    <span className="font-bold text-sm">{type.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* AI Input */}
                        {generationType === 'ai' && (
                             <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                                 <div>
                                     <label className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Enter Topic</label>
                                     <input 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full mt-2 p-4 bg-white dark:bg-black rounded-xl border border-blue-200 dark:border-blue-900 focus:ring-2 ring-blue-500 outline-none font-bold"
                                        placeholder="e.g. World History, Python Basics..."
                                     />
                                 </div>
                             </div>
                        )}

                        {/* PDF Input */}
                        {generationType === 'pdf' && (
                            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                                <div className="border-2 border-dashed border-red-300 dark:border-red-800 rounded-xl p-8 text-center bg-white dark:bg-black relative">
                                    <input 
                                        type="file" 
                                        accept="application/pdf"
                                        onChange={handlePdfUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <CloudUpload className="w-10 h-10 text-red-500 mx-auto mb-2" />
                                    <div className="font-bold text-gray-900 dark:text-white">{pdfName || 'Click to Upload PDF'}</div>
                                    <div className="text-xs text-gray-500 mt-1">Max 5MB • Text-based PDFs only</div>
                                </div>
                                <div>
                                     <label className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Focus Topic (Optional)</label>
                                     <input 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full mt-2 p-4 bg-white dark:bg-black rounded-xl border border-red-200 dark:border-red-900 focus:ring-2 ring-red-500 outline-none font-bold"
                                        placeholder="e.g. Chapter 3 Summary"
                                     />
                                 </div>
                            </div>
                        )}

                        {/* Manual Input */}
                        {generationType === 'manual' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add New Question</h3>
                                    <textarea 
                                        value={currentQ.question}
                                        onChange={(e) => setCurrentQ({...currentQ, question: e.target.value})}
                                        className="w-full p-4 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-zinc-700 outline-none font-medium text-lg"
                                        placeholder="Type your question here..."
                                    />
                                    
                                    <div className="space-y-3">
                                        {[0, 1, 2, 3].map((idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <div className="w-8 h-12 flex items-center justify-center font-bold text-gray-400 bg-gray-100 dark:bg-zinc-800 rounded-l-xl">
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <input 
                                                    value={currentQ.options?.[idx]}
                                                    onChange={(e) => {
                                                        const newOpts = [...(currentQ.options || [])];
                                                        newOpts[idx] = e.target.value;
                                                        setCurrentQ({...currentQ, options: newOpts});
                                                    }}
                                                    className="flex-1 p-3 bg-gray-50 dark:bg-black rounded-r-xl border border-gray-200 dark:border-zinc-700 outline-none"
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                                <button 
                                                    onClick={() => setCurrentQ({...currentQ, correctAnswer: currentQ.options?.[idx]})}
                                                    className={`px-4 rounded-xl font-bold transition-all ${
                                                        currentQ.correctAnswer === currentQ.options?.[idx] && currentQ.options?.[idx]
                                                        ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
                                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                                    }`}
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        onClick={addManualQuestion}
                                        className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        Add Question
                                    </button>
                                </div>

                                {/* List */}
                                <div className="space-y-3">
                                    {manualQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-full font-bold text-xs text-gray-500">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white line-clamp-1">{q.question}</span>
                                            </div>
                                            <button 
                                                onClick={() => setManualQuestions(manualQuestions.filter((_, i) => i !== idx))}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 z-30">
                <div className="max-w-3xl mx-auto">
                    <button 
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full py-4 bg-[#FF6B58] text-white font-bold rounded-xl shadow-lg shadow-[#FF6B58]/30 hover:bg-[#E55A49] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>Create Room <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
