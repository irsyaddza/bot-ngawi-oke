'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Database, Check, AlertCircle, RefreshCw, Table as TableIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DatabasePage() {
    const [activeTab, setActiveTab] = useState('backup'); // backup, chat_history, weather, analytics
    const [downloading, setDownloading] = useState(false);

    // Data Viewer State
    const [dbData, setDbData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Analytics Dropdown State
    const [analyticsTable, setAnalyticsTable] = useState('analytics_messages');
    const [analyticsDropdownOpen, setAnalyticsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setAnalyticsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeTab !== 'backup') {
            fetchData();
        }
    }, [activeTab, analyticsTable]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            let url = `/api/admin/database/view?db=${activeTab}`;
            if (activeTab === 'analytics') {
                url += `&table=${analyticsTable}`;
            }

            const res = await fetch(url);
            const json = await res.json();

            if (json.error) {
                console.error('DB View Error:', json.error);
                setDbData([]);
                setColumns([]);
            } else {
                setDbData(json.data || []);
                setColumns(json.columns || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleBackup = async () => {
        try {
            setDownloading(true);
            const response = await fetch('/api/admin/backup');

            if (!response.ok) throw new Error('Backup failed');

            // Handle blob download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rusdi-backup-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Backup error:', error);
            alert('Failed to download backup');
        } finally {
            setDownloading(false);
        }
    };

    const tabs = [
        { id: 'backup', label: 'Backup & Restore', icon: Database },
        { id: 'chat_history', label: 'Chat History', icon: TableIcon },
        { id: 'weather', label: 'Weather Config', icon: TableIcon },
        { id: 'analytics', label: 'Analytics', icon: TableIcon },
    ];

    const analyticsOptions = [
        { value: 'analytics_messages', label: 'Messages' },
        { value: 'analytics_voice', label: 'Voice History' },
        { value: 'analytics_voice_active', label: 'Active Voice' },
        { value: 'analytics_config', label: 'Config' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Database Management</h1>
                <p className="text-gray-400 mt-2">Manage backups and view database contents.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-white/10 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap
                            ${activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-white'}
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === 'backup' ? (
                    <motion.div
                        key="backup"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {/* Backup Card (Existing) */}
                        <div className="p-6 rounded-xl bg-card border border-white/5 shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                    <Database size={24} />
                                </div>
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                    System Healthy
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Full System Backup</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Download a complete ZIP archive containing active databases.
                            </p>
                            <button
                                onClick={handleBackup}
                                disabled={downloading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all"
                            >
                                {downloading ? 'Compressing...' : <><Download size={18} /> Download Backup (.zip)</>}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="viewer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/5 relative z-10">
                            <h2 className="text-lg font-semibold flex items-center gap-2 py-1">
                                <TableIcon className="text-primary" size={20} />
                                Viewing: {tabs.find(t => t.id === activeTab)?.label}

                                {activeTab === 'analytics' && (
                                    <div className="relative ml-2" ref={dropdownRef}>
                                        <button
                                            onClick={() => setAnalyticsDropdownOpen(!analyticsDropdownOpen)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all hover:border-primary/50"
                                        >
                                            <span className="text-gray-200">
                                                {analyticsOptions.find(o => o.value === analyticsTable)?.label || 'Select Table'}
                                            </span>
                                            <motion.div
                                                animate={{ rotate: analyticsDropdownOpen ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronDown size={14} className="text-gray-400" />
                                            </motion.div>
                                        </button>

                                        <AnimatePresence>
                                            {analyticsDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute top-full left-0 mt-2 w-48 bg-[#1a1b1e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 backdrop-blur-xl"
                                                >
                                                    {analyticsOptions.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => {
                                                                setAnalyticsTable(option.value);
                                                                setAnalyticsDropdownOpen(false);
                                                            }}
                                                            className={`
                                                                w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                                                                ${analyticsTable === option.value
                                                                    ? 'bg-primary/10 text-primary font-medium'
                                                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                                                            `}
                                                        >
                                                            {option.label}
                                                            {analyticsTable === option.value && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </h2>
                            <button
                                onClick={fetchData}
                                disabled={loadingData}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white active:scale-95 transform"
                                title="Refresh Data"
                            >
                                <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto global-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#111] text-gray-400 sticky top-0 backdrop-blur-sm z-0">
                                        <tr>
                                            {columns.map(col => (
                                                <th key={col} className="px-6 py-4 font-medium whitespace-nowrap border-b border-white/5">
                                                    {col.replace('_', ' ').toUpperCase()}
                                                </th>
                                            ))}
                                            {columns.length === 0 && !loadingData && <th className="px-6 py-4">Status</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loadingData ? (
                                            <tr>
                                                <td colSpan={columns.length || 1} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                        <p>Loading data...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : dbData.length > 0 ? (
                                            dbData.map((row, i) => (
                                                <motion.tr
                                                    key={i}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                                    className="hover:bg-white/5 transition-colors group"
                                                >
                                                    {columns.map(col => (
                                                        <td key={`${i}-${col}`} className="px-6 py-3 text-gray-300 whitespace-nowrap max-w-xs truncate group-hover:text-white">
                                                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                                        </td>
                                                    ))}
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={columns.length || 1} className="px-6 py-12 text-center text-gray-500">
                                                    No records found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .global-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .global-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .global-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .global-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
