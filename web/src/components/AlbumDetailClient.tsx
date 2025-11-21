'use client';

import { useState, useEffect } from 'react';
import { Album } from '@/types';

interface AlbumDetailClientProps {
    album: Album;
}

export default function AlbumDetailClient({ album }: AlbumDetailClientProps) {
    const [isLiked, setIsLiked] = useState(album.is_liked || false);
    const [userId, setUserId] = useState<number | null>(null);
    const [showLoginToast, setShowLoginToast] = useState(false);

    useEffect(() => {
        // Get user from localStorage and fetch current like status
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.id);

            // Fetch the actual like status from API
            const fetchLikeStatus = async () => {
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
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
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
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

    return (
        <>
            <button
                onClick={toggleLike}
                className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                aria-label={isLiked ? 'Unlike album' : 'Like album'}
            >
                <svg
                    className={`w-6 h-6 transition-all duration-200 ${isLiked
                        ? 'fill-red-500 stroke-red-500'
                        : 'fill-none stroke-gray-400 group-hover:stroke-red-400'
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
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                    {isLiked ? 'Liked' : 'Like'}
                </span>
            </button>

            {/* Login Toast Notification */}
            {showLoginToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span className="font-medium">Please login to like albums</span>
                    </div>
                </div>
            )}
        </>
    );
}
