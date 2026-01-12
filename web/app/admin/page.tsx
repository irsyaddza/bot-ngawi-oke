'use client';

import { useSession } from "next-auth/react";
import { MessageSquare, Mic, Terminal, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({
        voiceHours: 0,
        messageCount: 0,
        activeUsers: 0,
        uptime: '0h 0m',
        system: { cpu: 0, memory: 0 },
        recentLogs: []
    });

    useEffect(() => {
        const fetchStats = () => {
            fetch('/api/admin/stats')
                .then(res => {
                    if (!res.ok) throw new Error('API Error');
                    return res.json();
                })
                .then(data => {
                    if (!data) return;
                    // Format uptime from seconds to readable string
                    const totalSeconds = data.uptimeSeconds || 0;
                    const d = Math.floor(totalSeconds / (3600 * 24));
                    const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
                    const m = Math.floor((totalSeconds % 3600) / 60);

                    const uptimeStr = `${d}d ${h}h ${m}m`;

                    setStats(prev => ({
                        ...prev,
                        voiceHours: data.voiceHours || 0,
                        messageCount: data.messageCount || 0,
                        activeUsers: data.activeUsers || 0,
                        uptime: uptimeStr,
                        system: data.system || { cpu: 0, memory: 0 },
                        recentLogs: data.recentLogs || []
                    }));
                })
                .catch(err => {
                    console.error('Failed to fetch stats:', err);
                });
        };

        // Fetch immediately
        fetchStats();

        // 3 seconds polling for "Real-time" feel
        const interval = setInterval(fetchStats, 3000);

        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                    <p className="text-gray-400 mt-2">
                        Welcome back, <span className="text-primary font-semibold">{session?.user?.name || 'Administrator'}</span>.
                    </p>
                </div>
                <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-400">System Live</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: "Voice Time", value: `${stats.voiceHours} Hrs`, trend: "Calculated" },
                    { label: "Active Users", value: stats.activeUsers.toLocaleString(), trend: "Last 30 days" },
                    { label: "Total Messages", value: (stats.messageCount / 1000).toFixed(1) + 'k', trend: "All time" },
                    { label: "App Uptime", value: stats.uptime, trend: "Status: Online" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-5 rounded-xl bg-card border border-white/5 shadow-sm hover:border-white/10 transition-colors"
                    >
                        <div className="text-sm text-gray-400">{stat.label}</div>
                        <div className="text-2xl font-bold mt-2">{stat.value}</div>
                        <div className={`text-xs mt-2 ${stat.trend.includes('Online') ? 'text-green-400' : 'text-primary'}`}>
                            {stat.trend}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Real-time Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Live System Monitor */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl bg-[#0f1117] border border-white/5 shadow-lg"
                >
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                        Live System Monitor
                    </h3>

                    <div className="space-y-6">
                        {/* CPU Usage */}
                        <div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-gray-400">CPU Load (Container)</span>
                                <span className="text-blue-400 font-mono">{stats.system.cpu}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.system.cpu}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* RAM Usage */}
                        <div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-gray-400">Memory Usage (RSS)</span>
                                <span className="text-purple-400 font-mono">{formatBytes(stats.system.memory)}</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-600 to-pink-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((stats.system.memory / (1024 * 1024 * 512)) * 100, 100)}%` }} // Scale relative to ~512MB for visual
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <p className="text-xs text-gray-600 mt-1 text-right">Scaled to 512MB Alloc</p>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Recent Activity Log */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl bg-[#0f1117] border border-white/5 shadow-lg flex flex-col h-[300px]"
                >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                        Recent Activity
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {stats.recentLogs && stats.recentLogs.length > 0 ? (
                            stats.recentLogs.map((log: any, i: number) => {
                                let Icon = Activity;
                                let colorClass = "text-gray-400 bg-gray-400/10";

                                switch (log.type) {
                                    case 'message':
                                        Icon = MessageSquare;
                                        colorClass = "text-blue-400 bg-blue-400/10";
                                        break;
                                    case 'voice':
                                        Icon = Mic;
                                        colorClass = "text-green-400 bg-green-400/10";
                                        break;
                                    case 'command':
                                        Icon = Terminal;
                                        colorClass = "text-purple-400 bg-purple-400/10";
                                        break;
                                }

                                return (
                                    <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-start gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-xs text-gray-500 mb-0.5">{new Date(log.time).toLocaleTimeString()}</p>
                                                <span className="text-[10px] uppercase font-bold text-gray-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{log.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-200 break-words line-clamp-2">{log.description}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                                <div className="animate-pulse">Waiting for signals...</div>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
