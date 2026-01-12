'use client';

import { motion } from 'framer-motion';

const TECHNOLOGIES = [
    { name: 'Discord.js', color: '#5865F2' },
    { name: 'Next.js 16', color: '#000000' },
    { name: 'DeepSeek', color: '#412991' },
    { name: 'Gemini AI', color: '#8E75B2' },
    { name: 'Open-Meteo', color: '#FFA500' },
    { name: 'QuickChart', color: '#FF6384' },
    { name: 'Lavalink', color: '#FF0000' },
    { name: 'SQLite', color: '#003B57' },
];

export default function Marquee() {
    return (
        <section className="py-20 border-y border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden">
            <div className="container mx-auto px-4 mb-8 text-center">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                    Powered by Modern Technologies
                </p>
            </div>

            <div className="flex relative items-center">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...TECHNOLOGIES, ...TECHNOLOGIES, ...TECHNOLOGIES].map((tech, i) => (
                        <div key={i} className="mx-8 flex items-center gap-2 group cursor-default">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: tech.color }}
                            />
                            <span className="text-xl font-bold text-gray-400 group-hover:text-white transition-colors">
                                {tech.name}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap">
                    {[...TECHNOLOGIES, ...TECHNOLOGIES, ...TECHNOLOGIES].map((tech, i) => (
                        <div key={i} className="mx-8 flex items-center gap-2 group cursor-default">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: tech.color }}
                            />
                            <span className="text-xl font-bold text-gray-400 group-hover:text-white transition-colors">
                                {tech.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
