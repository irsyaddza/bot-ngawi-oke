'use client';

import { Github, Heart, Twitter } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-background/50 backdrop-blur-xl mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Brand / Copyright */}
                    <div className="text-center md:text-left">
                        <div className="font-bold text-lg mb-1">Bot Ngawi Oke</div>
                        <p className="text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} All rights reserved.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="https://github.com/irsyaddza/bot-ngawi-oke"
                            target="_blank"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <Github size={20} />
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <Twitter size={20} />
                        </Link>
                    </div>

                    {/* Made with love */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Made with</span>
                        <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                        <span>by Irsyad & Team</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
