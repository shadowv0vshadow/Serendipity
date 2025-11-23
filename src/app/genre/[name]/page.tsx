import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AlbumGrid from '@/components/AlbumGrid';

interface Props {
    params: Promise<{ name: string }>;
}

import { getApiBaseUrl } from '@/lib/api-config';

async function getGenreAlbums(genre: string) {
    // In Vercel, use absolute URL for SSR
    const baseUrl = getApiBaseUrl();

    const res = await fetch(`${baseUrl}/api/albums?genre=${encodeURIComponent(genre)}&limit=40`, {
        cache: 'no-store'
    });

    if (!res.ok) {
        throw new Error('Failed to fetch albums');
    }

    return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    return {
        title: `${decodedName} Albums - Slowdive`,
        description: `Explore the best ${decodedName} albums on Slowdive.`,
    };
}

export default async function GenrePage({ params }: Props) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const data = await getGenreAlbums(decodedName);

    if (!data.albums || data.albums.length === 0) {
        return (
            <div className="min-h-screen bg-[#111] text-[#eee] pt-24 px-6">
                <div className="container mx-auto max-w-7xl">
                    <Link
                        href="/"
                        className="inline-block mb-8 text-gray-400 hover:text-white transition-colors text-lg"
                    >
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold mb-8">Genre: <span className="text-purple-400">{decodedName}</span></h1>
                    <div className="text-xl text-gray-400">No albums found for this genre.</div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#111] text-[#eee] relative pt-24">
            <div className="container mx-auto px-6 max-w-7xl">
                <Link
                    href="/"
                    className="inline-block mb-8 text-gray-400 hover:text-white transition-colors text-lg"
                >
                    ← Back to Home
                </Link>

                <div className="mb-12">
                    <h1 className="text-5xl font-bold mb-4">
                        Genre: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">{decodedName}</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Found {data.total} albums
                    </p>
                </div>

                <AlbumGrid allAlbums={data.albums} genre={decodedName} />
            </div>
        </main>
    );
}
