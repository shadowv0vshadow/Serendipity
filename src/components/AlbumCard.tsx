'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Album } from '@/types';
import { getApiBaseUrl } from '@/lib/api-config';

export default function AlbumCard({ album }: { album: Album }) {
    const [isLiked, setIsLiked] = useState(album.is_liked);
    const [isHovered, setIsHovered] = useState(false);
    const [showLoginToast, setShowLoginToast] = useState(false);

    const toggleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const stored = localStorage.getItem('user');
        if (!stored) {
            setShowLoginToast(true);
            setTimeout(() => setShowLoginToast(false), 3000);
            return;
        }
        const user = JSON.parse(stored);

        // Optimistic update
        const newState = !isLiked;
        setIsLiked(newState);



        try {
            const baseUrl = getApiBaseUrl();
            await fetch(`${baseUrl}/api/likes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: user.id, album_id: album.id }),
            });
        } catch (err) {
            // Revert on error
            setIsLiked(!newState);
            console.error('Failed to like', err);
        }
    };

    return (
        <div
            className="relative aspect-square group bg-[#1a1a1a] overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {album.image_path ? (
                <img
                    src={encodeURI(album.image_path)}
                    alt={album.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">
                    No Cover
                </div>
            )}

            {/* Hover Overlay */}
            <Link href={`/album/${album.id}`} className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-black/60 backdrop-blur-[2px]">
                <h3 className="text-white font-bold text-sm line-clamp-2 my-1">{album.title}</h3>
                <p className="text-gray-300 text-xs line-clamp-1">{album.artist_name}</p>
            </Link>

            {/* Like Button - Visible on hover or if liked */}
            <button
                onClick={toggleLike}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 z-20 ${isLiked ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-white hover:text-red-400'
                    }`}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={isLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
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
        </div>
    );
}
