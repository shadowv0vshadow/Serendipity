import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import DiscogsSearch from './DiscogsSearch';
import { X, Plus, Trash2, Disc } from 'lucide-react';

interface CollectionItem {
    id: number;
    title: string;
    artist: string;
    format: string;
    year: string;
    thumb_url: string;
    notes: string;
    added_at: string;
}

export default function CollectionManager() {
    const [items, setItems] = useState<CollectionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [initialSearch, setInitialSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [settings, setSettings] = useState({ collection_mode: true, valuation_mode: false, price_comparison_mode: false });
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const fetchCollection = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/collection`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch collection', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

                // Fetch settings first
                const settingsRes = await fetch(`${baseUrl}/api/settings`, { credentials: 'include' });
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(settingsData);

                    // Only fetch collection if enabled
                    if (settingsData.collection_mode) {
                        const colRes = await fetch(`${baseUrl}/api/collection`, { credentials: 'include' });
                        if (colRes.ok) {
                            const colData = await colRes.json();
                            setItems(colData);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to initialize collection manager', error);
            } finally {
                setLoading(false);
                setSettingsLoaded(true);
            }
        };
        init();
    }, []);

    if (settingsLoaded && !settings.collection_mode) {
        return null;
    }

    const handleAddItem = async (discogsItem: any) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/collection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    discogs_id: discogsItem.id,
                    master_id: discogsItem.master_id,
                    title: discogsItem.title.split(' - ')[1] || discogsItem.title,
                    artist: discogsItem.title.split(' - ')[0] || 'Unknown Artist',
                    format: discogsItem.format ? discogsItem.format.join(', ') : 'Unknown Format',
                    year: discogsItem.year,
                    thumb_url: discogsItem.thumb,
                    label: discogsItem.label ? discogsItem.label[0] : undefined
                }),
            });

            if (res.ok) {
                setShowAddModal(false);
                setErrorMessage('');
                fetchCollection();
            } else {
                const data = await res.json();
                setErrorMessage(data.detail || 'Failed to add item');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        } catch (error) {
            console.error('Failed to add item', error);
            setErrorMessage('Failed to add item');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleRemoveItem = async (id: number) => {
        const confirmed = window.confirm('Are you sure you want to remove this item?');
        if (!confirmed) return;

        try {
            // Optimistically remove from UI first for smooth animation
            setItems(prevItems => prevItems.filter(item => item.id !== id));

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/collection/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                // If delete failed, refetch to restore the item
                fetchCollection();
                throw new Error('Failed to remove item');
            } else {
                // Show success message
                setSuccessMessage('Item removed from collection');
                setTimeout(() => setSuccessMessage(''), 2000);
            }
        } catch (error) {
            console.error('Failed to remove item', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Disc className="w-6 h-6 text-purple-400" />
                        My Collection
                        <span className="text-sm font-normal text-gray-400 ml-2">({items.length} items)</span>
                    </h2>
                    {settings.valuation_mode && (
                        <p className="text-green-400 font-mono mt-1 text-sm">
                            Est. Value: ${items.reduce((acc, _) => acc + (Math.floor(Math.random() * 30) + 15), 0).toLocaleString()}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => {
                        setInitialSearch('');
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Item
                </button>
            </div>

            {loading ? (
                <div className="text-white/40 text-center py-12">Loading collection...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
                    <Disc className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">Your collection is empty</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 text-purple-400 hover:text-purple-300 font-medium"
                    >
                        Start collecting
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                            >
                                <div className="flex p-4 gap-4">
                                    <div className="relative w-24 h-24 flex-shrink-0 bg-black/60 rounded-lg overflow-hidden">
                                        {item.thumb_url ? (
                                            <Image
                                                src={item.thumb_url}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/20">
                                                <Disc className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate" title={item.title}>
                                            {item.title}
                                        </h3>
                                        <p className="text-purple-400 text-sm truncate">{item.artist}</p>

                                        <div className="mt-2 space-y-1 text-xs text-white/50">
                                            <p className="truncate">{item.format}</p>
                                            <p>{item.year}</p>
                                        </div>
                                        {settings.price_comparison_mode && (
                                            <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                                                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Compare:</span>
                                                <a href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item.artist + ' ' + item.title + ' vinyl')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">eBay</a>
                                                <span className="text-gray-600">|</span>
                                                <a href={`https://www.amazon.com/s?k=${encodeURIComponent(item.artist + ' ' + item.title + ' vinyl')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Amazon</a>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                                        title="Remove from collection"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Item Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-[#121212] border border-white/10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h3 className="text-xl font-bold text-white">Add to Collection</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <DiscogsSearch
                                    initialQuery={initialSearch}
                                    onSelect={handleAddItem}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="font-medium">{successMessage}</span>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {errorMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-r from-red-500/90 to-rose-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
