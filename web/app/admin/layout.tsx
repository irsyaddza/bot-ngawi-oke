'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BarChart2,
    Settings,
    Database,
    LogOut,
    Menu,
    X,
    Bot
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const MENU_ITEMS = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Database', href: '/admin/database', icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="fixed lg:static inset-y-0 left-0 z-50 bg-slate-950 border-r border-white/5 flex flex-col"
                    >
                        <div className="p-6 flex items-center gap-3 border-b border-white/5">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <Bot size={20} />
                            </div>
                            <span className="font-bold text-lg">Admin Panel</span>

                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden ml-auto text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-1">
                            {MENU_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <item.icon size={18} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                <header className="h-16 px-6 border-b border-white/5 flex items-center bg-background/50 backdrop-blur-sm sticky top-0 z-40">
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="mr-4 text-gray-400 hover:text-white"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    <div className="ml-auto flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-400">System Healthy</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 lg:p-10 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
