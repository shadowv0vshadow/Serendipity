'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api-config';
import { Album } from '@/types';
import AlbumCard from '@/components/AlbumCard';
import { Search, Music, Disc, MapPin } from 'lucide-react';

interface Artist {
    id: number;
    name: string;
    image_path: string;
    location: string;
}

interface SearchResults {
    artists: Artist[];
    albums: Album[];
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q');
    const [results, setResults] = useState<SearchResults>({ artists: [], albums: [] });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (q) {
            fetchResults(q);
        } else {
            setLoading(false);
        }
    }, [q]);

    const fetchResults = async (query: string) => {
        setLoading(true);
        try {
            const baseUrl = getApiBaseUrl();
            const res = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111] pt-24 px-6 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Searching for "{q}"...</p>
                </div>
            </div>
        );
    }

    const hasResults = results.artists.length > 0 || results.albums.length > 0;

    return (
        <div className="min-h-screen bg-[#111] text-white pt-24 px-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                    <div className="p-3 bg-white/5 rounded-2xl">
                        <Search className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Search Results</h1>
                        <p className="text-gray-400 mt-1">
                            Found {results.artists.length} artists and {results.albums.length} albums for "{q}"
                        </p>
                    </div>
                </div>

                {!hasResults ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No results found</h3>
                        <p className="text-gray-400">Try adjusting your search terms or check for typos.</p>
                    </div>
                ) : (
                    <>
                        {/* Artists Section */}
                        {results.artists.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Music className="w-5 h-5 text-blue-400" />
                                    Artists
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {results.artists.map((artist) => (
                                        <Link
                                            key={artist.id}
                                            href={`/artist/${artist.id}`}
                                            className="group block"
                                        >
                                            <div className="aspect-square relative rounded-full overflow-hidden mb-4 bg-white/5 border border-white/10 group-hover:border-purple-500/50 transition-colors">
                                                {artist.image_path ? (
                                                    <Image
                                                        src={artist.image_path}
                                                        alt={artist.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                                                        <Music className="w-10 h-10 text-white/20" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-bold truncate group-hover:text-purple-400 transition-colors">
                                                    {artist.name}
                                                </h3>
                                                {artist.location && (
                                                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {artist.location}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Albums Section */}
                        {results.albums.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Disc className="w-5 h-5 text-purple-400" />
                                    Albums
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {results.albums.map((album) => (
                                        <AlbumCard
                                            key={album.id}
                                            album={{
                                                ...album,
                                                ratings_count: "0", // Default or fetch if available
                                                genres: [], // Add missing genres property
                                                rank: 0 // Add missing rank property
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
