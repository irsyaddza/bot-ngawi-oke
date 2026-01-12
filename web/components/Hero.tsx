'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Terminal, ArrowRight, Star, GitFork, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
    const [stats, setStats] = useState({ stars: 124, forks: 45, commits: 890 }); // Mock start

    useEffect(() => {
        // Fetch real GitHub stats
        fetch('https://api.github.com/repos/irsyaddza/bot-ngawi-oke')
            .then(res => res.json())
            .then(data => {
                if (data.stargazers_count) {
                    setStats(prev => ({
                        ...prev,
                        stars: data.stargazers_count,
                        forks: data.forks_count
                    }));
                }
            })
            .catch(console.error);
    }, []);

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] pointer-events-none" />

            <div className="container px-4 mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        v1.0.0 Stable Release
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                        Advanced. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                            Fun.
                        </span> <br />
                        Open Source.
                    </h1>

                    <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                        The all-in-one Discord bot featuring high-quality Music Player, AI Chat,
                        Server Analytics, and Weather. Built for fun, designed for easy use.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="https://github.com/irsyaddza/bot-ngawi-oke"
                            target="_blank"
                            className="group flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 rounded-full font-medium transition-all hover:scale-105"
                        >
                            <Terminal className="w-5 h-5" />
                            Deploy Now
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="https://github.com/irsyaddza/bot-ngawi-oke"
                            target="_blank"
                            className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-medium transition-all backdrop-blur-sm"
                        >
                            <Github className="w-5 h-5" />
                            View Source
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Star className="w-4 h-4" />
                                Stars
                            </div>
                            <div className="text-2xl font-bold">{stats.stars}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <GitFork className="w-4 h-4" />
                                Forks
                            </div>
                            <div className="text-2xl font-bold">{stats.forks}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Activity className="w-4 h-4" />
                                Commits
                            </div>
                            <div className="text-2xl font-bold">{stats.commits}+</div>
                        </div>
                    </div>
                </motion.div>

                {/* Code Visual */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden lg:block"
                >
                    <div className="relative rounded-xl bg-[#0f1117] border border-white/10 shadow-2xl overflow-hidden p-6 font-mono text-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-500">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="ml-2">bot-config.ts</span>
                        </div>

                        <div className="space-y-1 text-gray-300">
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">1</span>
                                <span className="text-purple-400">const</span> <span className="text-blue-400">rusdiBot</span> = <span className="text-purple-400">new</span> <span className="text-yellow-400">Client</span>({'{'}
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">2</span>
                                <span className="ml-4">features: [</span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">3</span>
                                <span className="ml-8 text-green-400">'Music_Lavalink',</span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">4</span>
                                <span className="ml-8 text-green-400">'AI_Gemini_DeepSeek',</span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">5</span>
                                <span className="ml-8 text-green-400">'Analytics_Charts',</span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">6</span>
                                <span className="ml-8 text-green-400">'Weather_Auto'</span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">7</span>
                                <span className="ml-4">],</span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">8</span>
                                <span className="ml-4">database: <span className="text-green-400">'SQLite_WAL'</span>,</span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">9</span>
                                <span className="ml-4">privacy: <span className="text-purple-400">true</span></span>
                            </div>
                            <div className="flex">
                                <span className="w-6 text-gray-600 select-none">10</span>
                                {'}'});
                            </div>
                        </div>

                    </div>

                    {/* Floating elements - Moved outside to prevent clipping */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -right-8 -bottom-8 p-4 bg-gray-900/90 backdrop-blur border border-white/10 rounded-lg shadow-xl z-20"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400">System Optimal</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
