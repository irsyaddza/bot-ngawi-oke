'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, UserPlus, Trash2, Shield, AlertTriangle, Zap, Server, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({});
    const [admins, setAdmins] = useState<any[]>([]);

    const [newAdminId, setNewAdminId] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.settings) setSettings(data.settings);
            if (data.admins) setAdmins(data.admins);
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: string, value: any) => {
        setSaving(key);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_setting', key, value })
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Failed to update setting', error);
        } finally {
            setSaving(null);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminId) return;

        setAddingAdmin(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_admin',
                    userId: newAdminId,
                    name: newAdminName || 'Unknown User'
                })
            });
            const data = await res.json();
            if (data.success) {
                setAdmins(data.admins);
                setNewAdminId('');
                setNewAdminName('');
            } else {
                alert('Failed to add admin');
            }
        } catch (error) {
            console.error('Add admin error', error);
        } finally {
            setAddingAdmin(false);
        }
    };

    const removeAdmin = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this admin?')) return;

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove_admin', userId })
            });
            const data = await res.json();
            if (data.success) {
                setAdmins(data.admins);
            }
        } catch (error) {
            console.error('Remove admin error', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Global Settings</h1>
                <p className="text-gray-400 mt-2">Manage bot configuration and access control.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* General Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-card border border-white/5 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Zap size={24} />
                            </div>
                            <h2 className="text-xl font-semibold">AI Configuration</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">Active Logic Engine</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['gemini', 'deepseek'].map((logic) => (
                                        <button
                                            key={logic}
                                            onClick={() => updateSetting('ai_logic', logic)}
                                            disabled={saving === 'ai_logic'}
                                            className={`
                                                relative px-4 py-3 rounded-lg border text-left transition-all
                                                ${settings.ai_logic === logic
                                                    ? 'bg-primary/10 border-primary text-white'
                                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}
                                            `}
                                        >
                                            <span className="font-semibold capitalize block">{logic}</span>
                                            <span className="text-xs opacity-60">
                                                {logic === 'gemini' ? 'Balanced & Fast' : 'Reasoning & Creative'}
                                            </span>
                                            {settings.ai_logic === logic && (
                                                <motion.div layoutId="activeLogic" className="absolute inset-0 border-2 border-primary rounded-lg" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>


                </motion.div>

                {/* Admin Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-white/5 rounded-xl p-6 h-fit"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <Shield size={24} />
                        </div>
                        <h2 className="text-xl font-semibold">Admin Access</h2>
                    </div>

                    <form onSubmit={handleAddAdmin} className="mb-6 space-y-3">
                        <div>
                            <input
                                type="text"
                                placeholder="Discord User ID"
                                value={newAdminId}
                                onChange={(e) => setNewAdminId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary outline-none"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Name (Optional)"
                                value={newAdminName}
                                onChange={(e) => setNewAdminName(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary outline-none"
                            />
                            <button
                                type="submit"
                                disabled={addingAdmin}
                                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {addingAdmin ? 'Adding...' : <><UserPlus size={16} /> Add</>}
                            </button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Authorized Users</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Always show Master Admin (from Env) */}
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg opacity-75">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Server size={14} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">System Owner</div>
                                        <div className="text-xs text-gray-500">Master Admin</div>
                                    </div>
                                </div>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">Immutable</span>
                            </div>

                            {/* DB Admins */}
                            {admins.map((admin) => (
                                <div key={admin.user_id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg group hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <Shield size={14} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{admin.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{admin.user_id}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeAdmin(admin.user_id)}
                                        className="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Access"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}

                            {admins.length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No additional admins configured.
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
}
