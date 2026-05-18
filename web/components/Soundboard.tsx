'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    Edit2,
    Volume2,
    BarChart3,
    Clock,
    User
} from 'lucide-react';

interface Sound {
    id: string;
    filename: string;
    name: string;
    uploadedBy: string;
    uploadedAt: string;
    description: string;
    playCount: number;
    lastPlayed: string | null;
}

interface SoundboardProps {
    guildId: string;
}

export default function Soundboard({ guildId }: SoundboardProps) {
    const [sounds, setSounds] = useState<Sound[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        loadSounds();
    }, [guildId]);

    const loadSounds = async () => {
        try {
            const res = await fetch(`/api/admin/sounds?guildId=${guildId}`);
            if (!res.ok) throw new Error('Failed to load sounds');
            const data = await res.json();
            setSounds(data.sounds || []);
        } catch (error) {
            console.error('Error loading sounds:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteSound = async (soundId: string) => {
        if (!confirm('Hapus sound ini?')) return;

        try {
            const res = await fetch(
                `/api/admin/sounds?guildId=${guildId}&soundId=${soundId}`,
                { method: 'DELETE' }
            );
            if (!res.ok) throw new Error('Failed to delete sound');
            setSounds(sounds.filter(s => s.id !== soundId));
        } catch (error) {
            console.error('Error deleting sound:', error);
        }
    };

    const updateSoundName = async (soundId: string, newName: string) => {
        try {
            const res = await fetch('/api/admin/sounds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guildId,
                    soundId,
                    action: 'rename',
                    name: newName
                })
            });
            if (!res.ok) throw new Error('Failed to rename sound');
            const data = await res.json();
            setSounds(sounds.map(s => s.id === soundId ? data.sound : s));
            setEditingId(null);
        } catch (error) {
            console.error('Error renaming sound:', error);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Belum diputar';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-gray-400">Loading soundboard...</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Volume2 className="text-purple-500" />
                    🎧 Soundboard
                </h2>
                <p className="text-gray-400 text-sm">
                    {sounds.length} sound{sounds.length !== 1 ? 's' : ''} uploaded
                </p>
            </div>

            {sounds.length === 0 ? (
                <div className="text-center py-12 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm">
                    <Volume2 className="mx-auto mb-4 text-gray-500" size={48} />
                    <p className="text-gray-400">Belum ada sound yang diupload</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Gunakan command `/uploadsound` untuk menambah sound
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {sounds.map((sound) => (
                            <motion.div
                                key={sound.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="group relative bg-gradient-to-br from-purple-950/40 to-blue-950/40 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 hover:from-purple-900/50 hover:to-blue-900/50 transition-all duration-300 overflow-hidden"
                            >
                                {/* Background gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-transparent to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity" />

                                <div className="relative z-10">
                                    {/* Header with name */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex-1 min-w-0">
                                            {editingId === sound.id ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            updateSoundName(sound.id, editName);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setEditingId(null);
                                                        }
                                                    }}
                                                    onBlur={() => updateSoundName(sound.id, editName)}
                                                    className="w-full bg-white/10 border border-purple-400/50 rounded px-2 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                                                />
                                            ) : (
                                                <h3 className="font-bold text-white truncate">
                                                    {sound.name}
                                                </h3>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {sound.description && (
                                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                                            {sound.description}
                                        </p>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                        <div className="bg-white/5 rounded p-2">
                                            <div className="flex items-center gap-1 text-gray-400 mb-1">
                                                <BarChart3 size={12} />
                                                Plays
                                            </div>
                                            <div className="font-semibold text-white">
                                                {sound.playCount || 0}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded p-2">
                                            <div className="flex items-center gap-1 text-gray-400 mb-1">
                                                <Clock size={12} />
                                                Last
                                            </div>
                                            <div className="font-semibold text-white text-xs">
                                                {formatDate(sound.lastPlayed).split(' ')[0]}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer with uploader and actions */}
                                    <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <User size={12} />
                                            <span className="truncate">ID: {sound.uploadedBy.slice(0, 8)}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingId(sound.id);
                                                    setEditName(sound.name);
                                                }}
                                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-yellow-400"
                                                title="Edit name"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => deleteSound(sound.id)}
                                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-red-400"
                                                title="Delete sound"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* File info */}
                                    <div className="mt-2 text-xs text-gray-500 truncate">
                                        📄 {sound.filename}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
