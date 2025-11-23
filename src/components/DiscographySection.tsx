'use client';

import { useState } from 'react';
import Image from 'next/image';

import AlbumGrid from '@/components/AlbumGrid';
import { Album } from '@/types';

interface DiscographySectionProps {
    albums: Album[];
}

type SortType = 'time' | 'rating';
type SortOrder = 'desc' | 'asc';

export default function DiscographySection({ albums }: DiscographySectionProps) {
    const [sortType, setSortType] = useState<SortType>('time');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Sort albums based on current sort type and order
    const sortedAlbums = [...albums].sort((a, b) => {
        if (sortType === 'time') {
            const dateA = new Date(a.release_date || '1900-01-01').getTime();
            const dateB = new Date(b.release_date || '1900-01-01').getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        } else {
            // Sort by rating
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
        }
    });

    const toggleSort = (type: SortType) => {
        if (sortType === type) {
            // Toggle order if clicking the same sort type
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            // Switch to new sort type with default desc order
            setSortType(type);
            setSortOrder('desc');
        }
    };

    return (
        <div className="mb-8">
            {/* Header with Sort Controls */}
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold tracking-tight text-white">Discography</h2>

                {/* Sort Controls */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400 mr-2 font-medium">Sort by:</span>

                    {/* Time Sort Button */}
                    <button
                        onClick={() => toggleSort('time')}
                        className={`group relative px-4 py-2 rounded-full border transition-all duration-300 ${sortType === 'time'
                            ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                            : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                            }`}
                    >
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Time
                            {sortType === 'time' && (
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-300 ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </span>
                    </button>

                    {/* Rating Sort Button */}
                    <button
                        onClick={() => toggleSort('rating')}
                        className={`group relative px-4 py-2 rounded-full border transition-all duration-300 ${sortType === 'rating'
                            ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                            : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                            }`}
                    >
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Rating
                            {sortType === 'rating' && (
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-300 ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            {/* Album Grid */}
            {sortedAlbums.length > 0 ? (
                <AlbumGrid allAlbums={sortedAlbums} disableInfiniteScroll={true} />
            ) : (
                <p className="text-zinc-500 italic">No albums found.</p>
            )}
        </div>
    );
}
