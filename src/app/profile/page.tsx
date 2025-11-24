'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlbumCard from '@/components/AlbumCard';
import CollectionManager from '@/components/CollectionManager';
import { Album } from '@/types';
import { getApiBaseUrl } from '@/lib/api-config';

export default function ProfilePage() {
    const [user, setUser] = useState<{ id: number; username: string } | null>(null);
    const [likedAlbums, setLikedAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/');
            return;
        }

        const userData = JSON.parse(userStr);
        setUser(userData);

        // Fetch liked albums
        const fetchLikedAlbums = async () => {
            try {
                const baseUrl = getApiBaseUrl();
                const res = await fetch(`${baseUrl}/api/users/${userData.id}/likes`);

                if (!res.ok) {
                    throw new Error('Failed to fetch liked albums');
                }

                const data = await res.json();
                // Add is_liked property since these are all liked albums
                const albumsWithLikedStatus = data.map((album: Album) => ({
                    ...album,
                    is_liked: true
                }));
                setLikedAlbums(albumsWithLikedStatus);
            } catch (error) {
                console.error('Error fetching liked albums:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLikedAlbums();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111] text-white pt-12">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-gray-400">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111] text-white pt-12">
            <div className="container mx-auto px-6 py-12 max-w-7xl">
                {/* Profile Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">
                        {user?.username}'s Profile
                    </h1>
                    <p className="text-gray-400">
                        {likedAlbums.length} {likedAlbums.length === 1 ? 'album' : 'albums'} liked
                    </p>
                </div>

                {/* Collection Section */}
                <div className="mb-16">
                    <CollectionManager />
                </div>

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    Liked Albums
                </h2>

                {/* Liked Albums Grid */}
                {likedAlbums.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {likedAlbums.map((album) => (
                            <AlbumCard key={album.id} album={album} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                        <svg
                            className="w-24 h-24 mx-auto mb-6 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-400 mb-2">
                            No liked albums yet
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Start exploring and like some albums to see them here
                        </p>
                        <a
                            href="/"
                            className="inline-block px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Discover Music
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
