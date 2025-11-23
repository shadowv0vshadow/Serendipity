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

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '200px',
    });

    const loadMoreAlbums = async () => {
        if (isLoading || !hasMore || disableInfiniteScroll) return;

        setIsLoading(true);
        try {
            const baseUrl = getApiBaseUrl();
            let url = `${baseUrl}/api/albums?limit=20&offset=${offset}`;
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
    }, [inView]);

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
