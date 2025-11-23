'use client';

import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import AlbumCard from './AlbumCard';
import { Album } from '@/types';
import { getApiBaseUrl } from '@/lib/api-config';

interface AlbumGridProps {
    allAlbums: Album[];
    genre?: string;
    disableInfiniteScroll?: boolean;
}

export default function AlbumGrid({ allAlbums, genre, disableInfiniteScroll = false }: AlbumGridProps) {
    const [albums, setAlbums] = useState<Album[]>(allAlbums);
    const [offset, setOffset] = useState(allAlbums.length);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(!disableInfiniteScroll);

    // Dynamic batch size based on screen width
    const getBatchSize = () => {
        if (typeof window === 'undefined') return 40;
        const width = window.innerWidth;
        if (width >= 1536) return 60; // 2xl: 10 columns
        if (width >= 1280) return 50; // xl: 10 columns
        if (width >= 1024) return 40; // lg: 8 columns
        if (width >= 768) return 30;  // md: 6 columns
        if (width >= 640) return 20;  // sm: 4 columns
        return 15; // mobile: 3 columns
    };

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px', // Load earlier (was 200px)
    });

    const loadMoreAlbums = async () => {
        if (isLoading || !hasMore || disableInfiniteScroll) return;

        setIsLoading(true);
        try {
            const baseUrl = getApiBaseUrl();
            const batchSize = getBatchSize();
            let url = `${baseUrl}/api/albums?limit=${batchSize}&offset=${offset}`;
            if (genre) {
                url += `&genre=${encodeURIComponent(genre)}`;
            }

            const res = await fetch(url, {
                cache: 'no-store',
            });

            if (res.ok) {
                const data = await res.json();
                const newAlbums = data.albums;

                if (newAlbums.length === 0) {
                    setHasMore(false);
                } else {
                    setAlbums(prev => [...prev, ...newAlbums]);
                    setOffset(prev => prev + newAlbums.length);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more albums:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (inView && hasMore && !isLoading && !disableInfiniteScroll) {
            loadMoreAlbums();
        }
    }, [inView, hasMore, isLoading, disableInfiniteScroll]);

    // Reset when genre changes
    useEffect(() => {
        setAlbums(allAlbums);
        setOffset(allAlbums.length);
        setHasMore(!disableInfiniteScroll);
    }, [genre, allAlbums, disableInfiniteScroll]);

    return (
        <div className="w-full z-10 relative pb-20">
            {/* Full width grid: no horizontal padding */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 w-full">
                {albums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                ))}
            </div>

            {/* Loading indicator */}
            {hasMore && !disableInfiniteScroll && (
                <div ref={ref} className="w-full py-12 flex justify-center">
                    {isLoading && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-zinc-400">Loading more albums...</span>
                        </div>
                    )}
                </div>
            )}

            {/* End of content */}
            {!hasMore && albums.length > 0 && !disableInfiniteScroll && (
                <div className="w-full py-12 text-center text-zinc-500 text-sm">
                    You've reached the end
                </div>
            )}
        </div>
    );
}
