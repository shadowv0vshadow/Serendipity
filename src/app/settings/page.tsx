'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api-config';
import { Settings, Disc, DollarSign, BarChart3, ChevronLeft, Save } from 'lucide-react';

interface UserSettings {
    collection_mode: boolean;
    valuation_mode: boolean;
    price_comparison_mode: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings>({
        collection_mode: true,
        valuation_mode: false,
        price_comparison_mode: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/settings`, {
                credentials: 'include'
            });

            if (res.status === 401) {
                router.push('/');
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: keyof UserSettings) => {
        const newSettings = {
            ...settings,
            [key]: !settings[key]
        };

        // Optimistic update
        setSettings(newSettings);
        setMessage(null);

        try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSettings),
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Failed to save');
            }
        } catch (error) {
            // Revert on error
            setSettings(prev => ({
                ...prev,
                [key]: !prev[key]
            }));
            setMessage({ type: 'error', text: 'Failed to save changes' });
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#111] flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#111] text-white pt-24 px-6 pb-20">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="w-8 h-8 text-purple-400" />
                        Settings
                    </h1>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                    >
                        {message.text}
                    </motion.div>
                )}

                <div className="space-y-6">
                    {/* Collection Mode */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl h-fit">
                                    <Disc className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Collection Mode</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Enable Discogs integration to manage your record collection.
                                        Allows adding albums, viewing your library, and syncing data.
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={settings.collection_mode}
                                onChange={() => handleToggle('collection_mode')}
                            />
                        </div>
                    </motion.div>

                    {/* Valuation Mode */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${!settings.collection_mode ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="p-3 bg-green-500/20 rounded-xl h-fit">
                                    <DollarSign className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Valuation Mode</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Display estimated values for your collection items based on Discogs market data.
                                        See the total worth of your library.
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={settings.valuation_mode}
                                onChange={() => handleToggle('valuation_mode')}
                            />
                        </div>
                    </motion.div>

                    {/* Price Comparison Mode */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${!settings.collection_mode ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-xl h-fit">
                                    <BarChart3 className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Price Comparison Mode</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Compare prices across different marketplaces (e.g., eBay, Amazon) to find the best deals
                                        or value your items more accurately.
                                    </p>
                                </div>
                            </div>
                            <Toggle
                                checked={settings.price_comparison_mode}
                                onChange={() => handleToggle('price_comparison_mode')}
                            />
                        </div>
                    </motion.div>
                </div>


            </div>
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`w-14 h-8 rounded-lg p-1 flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${checked ? 'bg-purple-500' : 'bg-white/20'
                } ${checked ? 'justify-end' : 'justify-start'}`}
        >
            <motion.div
                layout
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                }}
                className="w-6 h-6 bg-white rounded-md shadow-md"
            />
        </button>
    );
}
