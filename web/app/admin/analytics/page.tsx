'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Users, MessageSquare, Mic, TrendingUp, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/analytics/stats');
                const json = await res.json();
                if (!json.error) {
                    setData(json);
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-gray-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="text-gray-500">No data available.</div>;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1b1e] border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="font-medium text-white mb-1">{label}</p>
                    <p className="text-primary text-sm">
                        {payload[0].value} {payload[0].name === 'count' ? 'Message' : 'Value'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="text-primary" />
                        Server Analytics
                    </h1>
                    <p className="text-gray-400 mt-2">Real-time insights from your Discord server.</p>
                </div>
                <div className="flex gap-2 text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Data</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Messages"
                    value={data.totals.messages.toLocaleString()}
                    icon={MessageSquare}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                />
                <StatCard
                    title="Voice Hours"
                    value={data.totals.voiceHours.toFixed(1) + 'h'}
                    icon={Mic}
                    color="text-green-400"
                    bg="bg-green-500/10"
                />
                <StatCard
                    title="Active Users"
                    value={data.topUsers.length} // Rough estimate of active pool
                    icon={Users}
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                />
                <StatCard
                    title="Server Health"
                    value="Good"
                    icon={Activity}
                    color="text-orange-400"
                    bg="bg-orange-500/10"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Daily Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-white/5 rounded-xl p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            Daily Activity (Last 7 Days)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="day" stroke="#6b7280" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Hourly Trends Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-white/5 rounded-xl p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Clock size={18} className="text-gray-400" />
                            Hourly Trend (Communication Heatmap)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.hourly}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="hour"
                                    stroke="#6b7280"
                                    tick={{ fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={3} // Show fewer ticks
                                />
                                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Top Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-white/5 rounded-xl overflow-hidden"
            >
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp size={18} className="text-yellow-400" />
                        Top Active Users
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Rank</th>
                                <th className="px-6 py-4 font-medium">User ID</th>
                                <th className="px-6 py-4 font-medium text-right">Message Count</th>
                                <th className="px-6 py-4 font-medium">Activity Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.topUsers.length > 0 ? (
                                data.topUsers.map((user: any, i: number) => (
                                    <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`
                                                flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs
                                                ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                                ${i === 1 ? 'bg-gray-400/20 text-gray-300' : ''}
                                                ${i === 2 ? 'bg-orange-500/20 text-orange-400' : ''}
                                                ${i > 2 ? 'bg-white/5 text-gray-500' : ''}
                                            `}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-200">{user.user_id}</td>
                                        <td className="px-6 py-4 text-right">{user.count.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-white/10 rounded-full h-1.5 max-w-[100px]">
                                                <div
                                                    className="bg-primary h-1.5 rounded-full"
                                                    style={{ width: `${Math.min((user.count / (data.topUsers[0].count || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No data available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-card border border-white/5 rounded-xl p-5 shadow-sm"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-gray-400 text-sm font-medium">{title}</h4>
                    <p className="text-2xl font-bold mt-2 text-white">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${bg} ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
        </motion.div>
    );
}
