'use client';

import { useState } from 'react';
import { Download, Database, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DatabasePage() {
    const [downloading, setDownloading] = useState(false);

    const handleBackup = async () => {
        try {
            setDownloading(true);
            const response = await fetch('/api/admin/backup');

            if (!response.ok) throw new Error('Backup failed');

            // Handle blob download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rusdi-backup-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Backup error:', error);
            alert('Failed to download backup');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Database Management</h1>
                <p className="text-gray-400 mt-2">Manage and backup your system data.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-card border border-white/5 shadow-sm"
                >
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <Database size={24} />
                        </div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            System Healthy
                        </span>
                    </div>

                    <h3 className="text-xl font-bold mb-2">Full System Backup</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Download a complete ZIP archive containing `analytics.db` and `weather.db`.
                        Includes WAL (Write-Ahead Log) files for data integrity.
                    </p>

                    <button
                        onClick={handleBackup}
                        disabled={downloading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloading ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Compressing...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Download Backup (.zip)
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                        Safe to run while bot is online (Read-Only Mode)
                    </p>
                </motion.div>

                {/* Restore Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl bg-card border border-white/5 shadow-sm opacity-50 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm">Coming Soon</span>
                    </div>

                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
                            <AlertCircle size={24} />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2">Restore Database</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Upload a backup file to restore system state. This requires stopping the bot temporarily.
                    </p>

                    <button disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400">
                        Upload Backup
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
