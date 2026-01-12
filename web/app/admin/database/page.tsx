'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Database, Check, AlertCircle, RefreshCw, Table as TableIcon, ChevronDown, Edit, Trash2, Plus, X, Save, Loader2 } from 'lucide-react';
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

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingRow, setEditingRow] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);

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

    // --- CRUD OPERATIONS ---

    const getTableContext = () => {
        if (activeTab === 'analytics') return analyticsTable;
        return activeTab === 'weather' ? 'weather_config' : 'chat_history'; // chat_history db has table 'chat_history'
    };

    const getPrimaryKey = () => {
        const table = getTableContext();
        if (table === 'weather_config' || table === 'analytics_config') return 'guild_id';
        if (table === 'chat_history') return 'history_key';
        return 'id';
    };

    const handleEdit = (row: any) => {
        setModalMode('edit');
        setEditingRow({ ...row }); // Clone to avoid mutation
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setModalMode('create');
        // Initialize empty row based on columns
        const newRow: any = {};
        columns.forEach(col => newRow[col] = '');
        setEditingRow(newRow);
        setIsModalOpen(true);
    };

    const handleDelete = async (row: any) => {
        const pk = getPrimaryKey();
        const key = row[pk];

        if (!confirm(`Are you sure you want to delete this record? (${key})`)) return;

        setDeletingKey(String(key));
        try {
            const res = await fetch('/api/admin/database/edit', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    db: activeTab,
                    table: getTableContext(),
                    key: key
                })
            });
            const json = await res.json();
            if (json.success) {
                fetchData(); // Refresh
            } else {
                alert('Delete failed: ' + json.error);
            }
        } catch (e: any) {
            alert('Delete Error: ' + e.message);
        } finally {
            setDeletingKey(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const pk = getPrimaryKey();
            const method = modalMode === 'create' ? 'POST' : 'PUT';

            // Format data if needed (e.g. JSON strings)
            const submissionData = { ...editingRow };

            const res = await fetch('/api/admin/database/edit', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    db: activeTab,
                    table: getTableContext(),
                    data: submissionData,
                    key: modalMode === 'edit' ? editingRow[pk] : undefined
                })
            });

            const json = await res.json();
            if (json.success) {
                setIsModalOpen(false);
                fetchData();
            } else {
                alert('Save failed: ' + json.error);
            }
        } catch (e: any) {
            alert('Save Error: ' + e.message);
        } finally {
            setSaving(false);
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
                <p className="text-gray-400 mt-2">Manage backups, view, and edit database contents.</p>
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
                        {/* Header & Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-white/5 relative z-10">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 py-1">
                                    <TableIcon className="text-primary" size={20} />
                                    <span className="hidden sm:inline">Viewing:</span> {tabs.find(t => t.id === activeTab)?.label}
                                </h2>

                                {activeTab !== 'analytics' && (
                                    <div className="flex gap-2 sm:hidden">
                                        <button
                                            onClick={handleCreate}
                                            className="p-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors"
                                            title="Add New"
                                        >
                                            <Plus size={18} />
                                        </button>
                                        <button
                                            onClick={fetchData}
                                            disabled={loadingData}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                        >
                                            <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                {activeTab === 'analytics' && (
                                    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                                        <button
                                            onClick={() => setAnalyticsDropdownOpen(!analyticsDropdownOpen)}
                                            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all hover:border-primary/50"
                                        >
                                            <span className="text-gray-200 truncate">
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
                                                    className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 mt-2 bg-[#1a1b1e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 backdrop-blur-xl"
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

                                <div className="hidden sm:flex gap-2">
                                    <button
                                        onClick={handleCreate}
                                        className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Plus size={16} /> New Record
                                    </button>
                                    <button
                                        onClick={fetchData}
                                        disabled={loadingData}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white active:scale-95 transform"
                                        title="Refresh Data"
                                    >
                                        <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto global-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#111] text-gray-400 sticky top-0 backdrop-blur-sm z-10">
                                        <tr>
                                            <th className="px-6 py-4 font-medium whitespace-nowrap border-b border-white/5 w-16">
                                                Actions
                                            </th>
                                            {columns.map(col => (
                                                <th key={col} className="px-6 py-4 font-medium whitespace-nowrap border-b border-white/5">
                                                    {col.replace('_', ' ').toUpperCase()}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loadingData ? (
                                            <tr>
                                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
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
                                                    {/* Actions Column */}
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(row)}
                                                                className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row)}
                                                                disabled={deletingKey === String(row[getPrimaryKey()])}
                                                                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                                                                title="Delete"
                                                            >
                                                                {deletingKey === String(row[getPrimaryKey()]) ?
                                                                    <Loader2 size={14} className="animate-spin" /> :
                                                                    <Trash2 size={14} />
                                                                }
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {columns.map(col => {
                                                        const val = row[col];
                                                        let displayVal: React.ReactNode = String(val);

                                                        if (typeof val === 'object' && val !== null) {
                                                            displayVal = JSON.stringify(val);
                                                        } else if (col === 'updated_at' || col === 'created_at' || col === 'timestamp' || col === 'join_time' || col === 'leave_time') {
                                                            try {
                                                                const timestamp = Number(val);
                                                                const d = !isNaN(timestamp) && timestamp > 0 ? new Date(timestamp) : new Date(String(val));

                                                                if (!isNaN(d.getTime())) {
                                                                    displayVal = d.toLocaleString('id-ID', {
                                                                        day: 'numeric',
                                                                        month: 'long',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        second: '2-digit'
                                                                    });
                                                                }
                                                            } catch (e) { console.error('Date formatting error:', e); }
                                                        }

                                                        return (
                                                            <td key={`${i}-${col}`} className="px-6 py-3 text-gray-300 whitespace-nowrap max-w-xs truncate group-hover:text-white">
                                                                <span title={String(val)}>{displayVal}</span>
                                                            </td>
                                                        );
                                                    })}
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
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

            {/* EDIT/CREATE MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1a1b1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h3 className="text-xl font-bold">
                                    {modalMode === 'create' ? 'Create New Record' : 'Edit Record'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 global-scrollbar">
                                {columns.map(col => (
                                    <div key={col} className="space-y-1">
                                        <label className="text-sm font-medium text-gray-300 capitalize">
                                            {col.replace('_', ' ')}
                                        </label>
                                        <input
                                            type="text"
                                            value={typeof editingRow[col] === 'object' ? JSON.stringify(editingRow[col]) : (editingRow[col] || '')}
                                            onChange={(e) => setEditingRow({ ...editingRow, [col]: e.target.value })}
                                            disabled={modalMode === 'edit' && col === getPrimaryKey()}
                                            className={`
                                                w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none transition-colors
                                                ${modalMode === 'edit' && col === getPrimaryKey() ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        />
                                        {modalMode === 'edit' && col === getPrimaryKey() && (
                                            <p className="text-xs text-yellow-500/80">Primary keys cannot be edited.</p>
                                        )}
                                    </div>
                                ))}
                            </form>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#1a1b1e] rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
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
