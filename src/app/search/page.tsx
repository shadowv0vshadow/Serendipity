import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import AlbumGrid from '@/components/AlbumGrid';
import { getApiBaseUrl } from '@/lib/api-config';
import { Artist, Album } from '@/types';

interface SearchProps {
    searchParams: Promise<{ q: string }>;
}

async function getSearchResults(query: string) {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`, {
        cache: 'no-store'
    });

    if (!res.ok) {
        throw new Error('Failed to fetch search results');
    }

    return res.json();
}

export async function generateMetadata({ searchParams }: SearchProps): Promise<Metadata> {
    const { q } = await searchParams;
    return {
        title: `Search: ${q} - Slowdive`,
        description: `Search results for ${q}`,
    };
}

export default async function SearchPage({ searchParams }: SearchProps) {
    const { q } = await searchParams;

    if (!q) {
        return (
            <div className="min-h-screen bg-[#111] text-[#eee] pt-24 px-6">
                <div className="container mx-auto max-w-7xl">
                    <h1 className="text-4xl font-bold mb-8">Search</h1>
                    <p className="text-gray-400">Please enter a search term.</p>
                </div>
            </div>
        );
    }

    const results = await getSearchResults(q);
    const artists: Artist[] = results.artists;
    const albums: Album[] = results.albums;

    return (
        <main className="min-h-screen bg-[#111] text-[#eee] pt-24 pb-12">
            <div className="container mx-auto px-6 max-w-7xl">
                <h1 className="text-4xl font-bold mb-2">Search Results</h1>
                <p className="text-gray-400 mb-12 text-lg">
                    Showing results for <span className="text-white font-semibold">"{q}"</span>
                </p>

                {/* Artists Section */}
                {artists.length > 0 && (
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">Artists</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {artists.map((artist) => (
                                <Link
                                    key={artist.id}
                                    href={`/artist/${artist.id}`}
                                    className="group block bg-gray-900/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-colors"
                                >
                                    <div className="aspect-square relative bg-gray-800">
                                        {artist.image_path ? (
                                            <Image
                                                src={artist.image_path}
                                                alt={artist.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold truncate group-hover:text-purple-400 transition-colors">
                                            {artist.name}
                                        </h3>
                                        {artist.location && (
                                            <p className="text-sm text-gray-500 truncate mt-1">
                                                {artist.location}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Albums Section */}
                {albums.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">Albums</h2>
                        <AlbumGrid allAlbums={albums} disableInfiniteScroll={true} />
                    </div>
                )}

                {artists.length === 0 && albums.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-xl">No results found for "{q}"</p>
                    </div>
                )}
            </div>
        </main>
    );
}
