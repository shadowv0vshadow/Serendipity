'use client';

import { useState, useEffect } from 'react';
import { Album } from '@/types';
import { getApiBaseUrl } from '@/lib/api-config';
import { motion, AnimatePresence } from 'framer-motion';
import DiscogsSearch from './DiscogsSearch';
import { Disc, X } from 'lucide-react';

interface AlbumDetailClientProps {
    album: Album;
}

export default function AlbumDetailClient({ album }: AlbumDetailClientProps) {
    const [isLiked, setIsLiked] = useState(album.is_liked || false);
    const [userId, setUserId] = useState<number | null>(null);
    const [showLoginToast, setShowLoginToast] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Get user from localStorage and fetch current like status
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.id);

            // Fetch the actual like status from API
            const fetchLikeStatus = async () => {
                try {
                    const baseUrl = getApiBaseUrl();
                    const res = await fetch(`${baseUrl}/api/albums/${album.id}?user_id=${user.id}`, {
                        cache: 'no-store'
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setIsLiked(data.is_liked || false);
                    }
                } catch (error) {
                    console.error('Error fetching like status:', error);
                }
            };
            fetchLikeStatus();
        }
    }, [album.id]);

    const toggleLike = async () => {
        if (!userId) {
            setShowLoginToast(true);
            setTimeout(() => setShowLoginToast(false), 3000);
            return;
        }

        // Optimistic update
        const previousState = isLiked;
        setIsLiked(!previousState);

        try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/likes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId, album_id: album.id }),
            });

            if (!res.ok) {
                throw new Error('Failed to toggle like');
            }

            // Verify state from response
            const data = await res.json();
            // Always sync with server truth
            if (data.status === 'liked') {
                setIsLiked(true);
            } else if (data.status === 'unliked') {
                setIsLiked(false);
            }

        } catch (error) {
            console.error('Error toggling like:', error);
            setIsLiked(previousState); // Revert on error
        }
    };

    const handleAddToCollection = async (discogsItem: any) => {
        if (!userId) {
            setShowCollectionModal(false);
            setShowLoginToast(true);
            setTimeout(() => setShowLoginToast(false), 3000);
            return;
        }

        try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/collection`, {
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
                setShowCollectionModal(false);
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);
            } else {
                const data = await res.json();
                setShowCollectionModal(false);
                throw new Error(data.detail || 'Failed to add to collection');
            }
        } catch (error) {
            console.error('Failed to add item', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to add to collection');
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };

    return (
        <>
            <div className="flex gap-4">
                <button
                    onClick={toggleLike}
                    className={`group flex items-center gap-3 px-8 py-4 rounded-xl transition-all duration-200 font-medium ${isLiked
                        ? 'bg-red-500/20 border-2 border-red-500/50 hover:bg-red-500/30'
                        : 'bg-white/5 backdrop-blur-md border-2 border-white/10 hover:bg-white/10 hover:border-red-500/30'
                        }`}
                    aria-label={isLiked ? 'Unlike album' : 'Like album'}
                >
                    <svg
                        className={`w-6 h-6 transition-all duration-200 ${isLiked
                            ? 'fill-red-500 stroke-red-500'
                            : 'fill-none stroke-zinc-400 group-hover:stroke-red-400'
                            }`}
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                        />
                    </svg>
                    <span className={`text-base ${isLiked ? 'text-red-400' : 'text-zinc-300 group-hover:text-white'}`}>
                        {isLiked ? 'Liked' : 'Add to Favorites'}
                    </span>
                </button>

                <button
                    onClick={() => {
                        if (!userId) {
                            setShowLoginToast(true);
                            setTimeout(() => setShowLoginToast(false), 3000);
                            return;
                        }
                        setShowCollectionModal(true);
                    }}
                    className="group flex items-center gap-3 px-8 py-4 rounded-xl transition-all duration-200 font-medium bg-white/5 backdrop-blur-md border-2 border-white/10 hover:bg-white/10 hover:border-purple-500/30"
                >
                    <Disc className="w-6 h-6 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                    <span className="text-base text-zinc-300 group-hover:text-white">
                        Add to Collection
                    </span>
                </button>
            </div>

            {/* Login Toast Notification */}
            {showLoginToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span className="font-medium">Please login to perform this action</span>
                    </div>
                </div>
            )}

            {/* Add to Collection Modal */}
            <AnimatePresence>
                {showCollectionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-[#121212] border border-white/10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h3 className="text-xl font-bold text-white">Add to Collection</h3>
                                <button
                                    onClick={() => setShowCollectionModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-white/60 mb-4">Select the specific version you own:</p>
                                <DiscogsSearch
                                    initialQuery={`${album.artist_name} - ${album.title}`}
                                    onSelect={handleAddToCollection}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="font-medium">Successfully added to collection!</span>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {showErrorToast && (
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
        </>
    );
}
