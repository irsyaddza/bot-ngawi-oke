'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Volume2, Music, AlertCircle } from 'lucide-react';
import Soundboard from '@/components/Soundboard';

export default function SoundsPage() {
    const { data: session } = useSession();
    const [guildId, setGuildId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get guild ID from settings, fallback to bot config
        const fetchGuildId = async () => {
            try {
                // Try settings first
                const settingsRes = await fetch('/api/admin/settings');
                const settingsData = await settingsRes.json();
                if (settingsData.settings?.guildId) {
                    setGuildId(settingsData.settings.guildId);
                    setLoading(false);
                    return;
                }

                // Fallback to bot config
                const botConfigRes = await fetch('/api/admin/bot-config');
                const botConfigData = await botConfigRes.json();
                if (botConfigData.guildId) {
                    setGuildId(botConfigData.guildId);
                    setLoading(false);
                    return;
                }

                // No guild ID found
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch guild ID:', error);
                setLoading(false);
            }
        };

        fetchGuildId();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!guildId) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">🎧 Soundboard</h1>
                    <p className="text-gray-400 mt-2">Manage your custom sound library</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                    <div className="flex gap-3">
                        <AlertCircle className="flex-shrink-0 text-red-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-200">Guild ID tidak ditemukan</h3>
                            <p className="text-sm text-red-300 mt-2">
                                Solusi:
                            </p>
                            <ul className="text-sm text-red-300 mt-2 space-y-1 ml-4">
                                <li>1. Pastikan environment variable <code className="bg-red-950/50 px-1.5 py-0.5 rounded text-xs">GUILD_ID</code> sudah di-set di <code className="bg-red-950/50 px-1.5 py-0.5 rounded text-xs">.env</code></li>
                                <li>2. Restart bot dan web application</li>
                                <li>3. Atau set manual di halaman Settings → update guildId</li>
                                <li>4. Refresh halaman ini</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Volume2 className="text-purple-500" />
                        Soundboard Library
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Manage sounds yang dapat dimainkan melalui command Discord
                    </p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20"
                >
                    <div className="flex items-start gap-3">
                        <Music className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="font-semibold text-blue-200">Cara Upload Sound</h3>
                            <p className="text-sm text-blue-300 mt-2">
                                Gunakan command Discord: <code className="bg-black/30 px-2 py-1 rounded">/uploadsound</code>
                            </p>
                            <ul className="text-sm text-blue-300 mt-2 space-y-1 ml-4">
                                <li>• File MP3/WAV/OGG (max 20MB)</li>
                                <li>• Berikan nama dan deskripsi</li>
                                <li>• Sound langsung tersimpan di sini</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20"
                >
                    <div className="flex items-start gap-3">
                        <Volume2 className="text-purple-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="font-semibold text-purple-200">Cara Mainkan Sound</h3>
                            <p className="text-sm text-purple-300 mt-2">
                                Di Discord, gunakan: <code className="bg-black/30 px-2 py-1 rounded">/soundboard play</code>
                            </p>
                            <ul className="text-sm text-purple-300 mt-2 space-y-1 ml-4">
                                <li>• Join voice channel dulu</li>
                                <li>• Pilih sound dari dropdown menu</li>
                                <li>• Sound akan diputar untuk semua member</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Soundboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-xl bg-slate-900/50 border border-white/10"
            >
                <Soundboard guildId={guildId} />
            </motion.div>
        </div>
    );
}
