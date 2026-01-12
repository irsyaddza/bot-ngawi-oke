'use client';

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({
        voiceHours: 0,
        messageCount: 0,
        activeUsers: 0,
        uptime: '0h 0m'
    });

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => {
                if (!res.ok) throw new Error('API Error');
                return res.json();
            })
            .then(data => {
                if (!data) return;
                // Format uptime from seconds to readable string
                const h = Math.floor((data.uptimeSeconds || 0) / 3600);
                const m = Math.floor(((data.uptimeSeconds || 0) % 3600) / 60);

                setStats({
                    voiceHours: data.voiceHours || 0,
                    messageCount: data.messageCount || 0,
                    activeUsers: data.activeUsers || 0,
                    uptime: `${h}h ${m}m`
                });
            })
            .catch(err => {
                console.error('Failed to fetch stats:', err);
                // Keep default 0 values on error
            });
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                <p className="text-gray-400 mt-2">
                    Welcome back, <span className="text-primary font-semibold">{session?.user?.name || 'Administrator'}</span>.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Voice Time", value: `${stats.voiceHours} Hrs`, trend: "Calculated" },
                    { label: "Active Users", value: stats.activeUsers.toLocaleString(), trend: "Last 30 days" },
                    { label: "Total Messages", value: (stats.messageCount / 1000).toFixed(1) + 'k', trend: "All time" },
                    { label: "System Uptime", value: stats.uptime, trend: "Status: Online" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-xl bg-card border border-white/5 shadow-sm"
                    >
                        <div className="text-sm text-gray-400">{stat.label}</div>
                        <div className="text-2xl font-bold mt-2">{stat.value}</div>
                        <div className={`text-xs mt-2 ${stat.trend.includes('Online') ? 'text-green-400' : 'text-primary'}`}>
                            {stat.trend}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity Mockup */}
            <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6">
                <h3 className="text-lg font-semibold mb-4">Real-time Analytics</h3>
                <div className="h-48 flex items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-lg">
                    <p>Graphs & Charts Coming Soon in Phase 2</p>
                </div>
            </div>
        </div>
    );
}
