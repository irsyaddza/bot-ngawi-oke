'use client';

import { motion } from 'framer-motion';
import { Music, Sparkles, LineChart, CloudSun, ArrowRight } from 'lucide-react';

const FEATURES = [
    {
        title: 'Music Player',
        description: 'High-fidelity audio with queue management, Lavalink support, and seamless playback controls.',
        icon: Music,
        color: 'from-blue-500 to-cyan-400',
        delay: 0.1
    },
    {
        title: 'AI Chat',
        description: 'Powered by Gemini and DeepSeek for smart, context-aware conversations and automated assistance.',
        icon: Sparkles,
        color: 'from-purple-500 to-pink-400',
        delay: 0.2
    },
    {
        title: 'Server Analytics',
        description: 'Beautifully rendered charts and real-time statistics to monitor server growth and user activity.',
        icon: LineChart,
        color: 'from-green-500 to-emerald-400',
        delay: 0.3
    },
    {
        title: 'Weather Forecast',
        description: 'Accurate, real-time weather data from Open-Meteo delivered via elegant custom embeds.',
        icon: CloudSun,
        color: 'from-orange-500 to-yellow-400',
        delay: 0.4
    }
];

export default function PowerFeatures() {
    return (
        <section className="py-24 bg-black/40 relative overflow-hidden" id="features">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        Power <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Features</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 max-w-2xl mx-auto text-lg"
                    >
                        Rusdi Bot brings a suite of advanced tools to your Discord community,
                        designed for performance and built for fun.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
                    {FEATURES.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: feature.delay }}
                            whileHover={{ y: -5 }}
                            className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:bg-white/[0.08]"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-6 shadow-lg shadow-white/5 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-full h-full text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-white group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
