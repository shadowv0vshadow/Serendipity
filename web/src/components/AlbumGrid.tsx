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
    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
    const [albums, setAlbums] = useState(allAlbums.slice(0, ITEMS_PER_PAGE));

    const loadMoreRef = useRef(null);
    const isInView = useInView(loadMoreRef, { margin: "200px" });

    useEffect(() => {
        if (isInView && displayCount < allAlbums.length) {
            const nextCount = displayCount + ITEMS_PER_PAGE;
            setAlbums(allAlbums.slice(0, nextCount));
            setDisplayCount(nextCount);
        }
    }, [isInView, displayCount, allAlbums]);

    return (
        <div className="w-full z-10 relative pb-20">
            {/* Full width grid: no horizontal padding */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 w-full">
                {albums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                ))}
            </div>

            {/* Loading trigger element */}
            {displayCount < allAlbums.length && (
                <div ref={loadMoreRef} className="w-full h-20 flex items-center justify-center mt-8">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
