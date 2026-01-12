'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ChevronRight } from 'lucide-react';
import commandsData from '@/data/commands.json';

type CommandItem = {
    name: string;
    description: string;
    usage: string;
};

type Category = {
    category: string;
    commands: CommandItem[];
};

export default function CommandList() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const categories = ['All', ...commandsData.map(c => c.category)];

    const filteredCommands = commandsData.flatMap(cat =>
        cat.commands.map(cmd => ({ ...cmd, category: cat.category }))
    ).filter(cmd => {
        const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) ||
            cmd.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <section className="py-20 bg-black/20" id="commands">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Command Reference</h2>
                    <p className="text-gray-400">Explore full capabilities of Rusdi Bot</p>
                </div>

                {/* Search & Filter */}
                <div className="max-w-4xl mx-auto mb-12 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search commands..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-full py-4 pl-12 pr-6 text-gray-200 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                                        ? 'bg-primary text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                    <AnimatePresence mode="popLayout">
                        {filteredCommands.map((cmd, i) => (
                            <motion.div
                                layout
                                key={cmd.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group p-6 rounded-xl bg-card border border-white/5 hover:border-primary/30 transition-all hover:bg-white/5"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-mono font-bold text-primary text-lg group-hover:translate-x-1 transition-transform">
                                        {cmd.name}
                                    </div>
                                    <div className="px-2 py-1 rounded text-xs bg-white/5 text-gray-500 font-medium">
                                        {cmd.category}
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm mb-4 min-h-[40px]">
                                    {cmd.description}
                                </p>

                                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500 bg-black/20 p-2 rounded">
                                    <Command size={12} />
                                    <code>{cmd.usage}</code>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredCommands.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No commands found matching "{search}"
                    </div>
                )}
            </div>
        </section>
    );
}
