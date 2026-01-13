'use client';

import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, BarChart3, PieChart } from 'lucide-react';

export default function DashboardTeaser() {
    return (
        <section className="py-24 bg-background relative overflow-hidden" id="admin-preview">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Visual Teaser */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* Mock Dashboard Window */}
                        <div className="relative rounded-2xl bg-[#0f1117] border border-white/10 shadow-2xl overflow-hidden aspect-video lg:aspect-square xl:aspect-video flex flex-col">
                            {/* Window Header */}
                            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase italic">Administrator Session</div>
                                <div className="w-10" />
                            </div>

                            {/* Dashboard Content Teaser */}
                            <div className="flex-1 p-6 space-y-6 overflow-hidden select-none grayscale-[0.5] contrast-[1.1] opacity-60 group-hover:opacity-100 transition-opacity">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Active Latency</div>
                                        <div className="text-xl font-bold text-primary">24ms</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Global Shards</div>
                                        <div className="text-xl font-bold text-secondary">Active</div>
                                    </div>
                                </div>

                                {/* Mock Chart */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end gap-1 h-32">
                                        {[40, 70, 45, 90, 65, 80, 50, 95, 75, 85, 60].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${h}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                                                className="flex-1 bg-linear-to-t from-primary/20 to-primary/80 rounded-t-sm"
                                            />
                                        ))}
                                    </div>
                                    <div className="h-px bg-white/10 w-full" />
                                </div>

                                {/* System Monitor Rows */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-400">Memory Allocation</span>
                                        <span className="text-gray-500 font-mono">124.5 MB / 512.0 MB</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '35%' }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 1, duration: 1 }}
                                            className="h-full bg-secondary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Overlay Blur/Fade */}
                            <div className="absolute inset-0 bg-linear-to-t from-[#0f1117] via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -right-8 -bottom-8 p-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-20 backdrop-blur-xl hidden md:block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold">Secure Access</div>
                                    <div className="text-[10px] text-gray-500">Whitelist protection enabled</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                                Management <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-secondary to-primary">Simplified.</span>
                            </h2>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                Experience total control with our private administrative dashboard.
                                Monitor real-time performance, analyze user engagement, and manage
                                configurations with an interface designed for speed and clarity.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-primary/10 rounded-lg h-fit">
                                    <Activity className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Real-time Metrics</h4>
                                    <p className="text-sm text-gray-500">Live monitoring of system resources and throughput.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-secondary/10 rounded-lg h-fit">
                                    <BarChart3 className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Advanced Analytics</h4>
                                    <p className="text-sm text-gray-500">Detailed insights into server growth and active sessions.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-primary/10 rounded-lg h-fit">
                                    <PieChart className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Database Tools</h4>
                                    <p className="text-sm text-gray-500">Raw SQLite access and automated backup systems.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-secondary/10 rounded-lg h-fit">
                                    <Zap className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Quick Config</h4>
                                    <p className="text-sm text-gray-500">Instant updates to bot settings and provider tokens.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                Reserved exclusively for Bot Administrators
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
