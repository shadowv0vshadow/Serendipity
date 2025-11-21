'use client';

import { useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import AlbumCard from './AlbumCard';
import { Album } from '@/types';

interface AlbumGridProps {
    allAlbums: Album[];
}

const ITEMS_PER_PAGE = 40;

export default function AlbumGrid({ allAlbums }: AlbumGridProps) {
    const [albums, setAlbums] = useState<Album[]>(allAlbums);
    const [offset, setOffset] = useState(ITEMS_PER_PAGE);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    const loadMoreRef = useRef(null);
    const isInView = useInView(loadMoreRef, { margin: "200px" });

    // Get user ID from localStorage (for loading more pages)
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const user = JSON.parse(stored);
            setUserId(user.id);
        }
    }, []);

    // Load more when scrolling
    useEffect(() => {
        if (isInView && hasMore && !isLoading) {
            loadMore();
        }
    }, [isInView, hasMore, isLoading]);

    const loadMore = async () => {
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

        try {
            const url = userId
                ? `${baseUrl}/api/albums?user_id=${userId}&limit=${ITEMS_PER_PAGE}&offset=${offset}`
                : `${baseUrl}/api/albums?limit=${ITEMS_PER_PAGE}&offset=${offset}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setAlbums(prev => {
                    // Filter out any duplicates that might have been fetched
                    const newAlbums = data.albums.filter((newAlbum: Album) =>
                        !prev.some(existingAlbum => existingAlbum.id === newAlbum.id)
                    );
                    return [...prev, ...newAlbums];
                });
                setOffset(prev => prev + ITEMS_PER_PAGE);
                setHasMore(data.has_more);
            }
        } catch (e) {
            console.error("Failed to load more albums", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full z-10 relative pb-20">
            {/* Full width grid: no horizontal padding */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 w-full">
                {albums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                ))}
            </div>

            {/* Loading trigger element */}
            {hasMore && (
                <div ref={loadMoreRef} className="w-full h-20 flex items-center justify-center mt-8">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {!hasMore && albums.length > 0 && (
                <div className="w-full text-center mt-8 text-gray-500">
                    No more albums to load
                </div>
            )}
        </div>
    );
}
