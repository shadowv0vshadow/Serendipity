import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Album } from '@/types';


async function getAlbum(id: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:8000');
    const res = await fetch(`${baseUrl}/api/albums/${id}`, { cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch album');
    }
    return res.json();
}

export default async function AlbumDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const album = await getAlbum(id);

    if (!album) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#111] text-[#eee] font-sans">
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                <Link
                    href="/"
                    className="inline-block mb-8 text-gray-400 hover:text-white transition-colors text-lg"
                >
                    ← Back
                </Link>

                <div className="flex flex-col md:flex-row gap-12">
                    {/* Left: Album Cover */}
                    <div className="w-full md:w-1/2">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                            <Image
                                src={album.image_path}
                                alt={album.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                        <div className="mb-2 text-yellow-500 font-bold text-2xl">#{album.rank}</div>
                        <h1 className="text-5xl font-bold mb-4 leading-tight">{album.title}</h1>
                        <h2 className="text-3xl text-gray-300 mb-8 font-light">{album.artist_name}</h2>

                        <div className="grid grid-cols-2 gap-6 mb-10 text-base">
                            <div>
                                <span className="text-gray-500 block text-sm uppercase tracking-wider mb-1">Released</span>
                                <span className="font-medium">{album.release_date || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-sm uppercase tracking-wider mb-1">Rating</span>
                                <span className="font-medium">{album.rating} / 5.0</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500 block text-sm uppercase tracking-wider mb-2">Genres</span>
                                <div className="flex flex-wrap gap-2">
                                    {album.genres.map((genre: string) => (
                                        <span
                                            key={genre}
                                            className="bg-gray-800 hover:bg-gray-700 transition-colors px-3 py-1 rounded-full text-sm text-gray-200"
                                        >
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold mb-4">Listen Now</h3>

                            {album.spotify_link ? (
                                <div className="w-full shadow-lg">
                                    <iframe
                                        style={{ borderRadius: '12px' }}
                                        src={`https://open.spotify.com/embed/album/${album.spotify_link.split('/').pop()}`}
                                        width="100%"
                                        height="152"
                                        className="border-none"
                                        allowFullScreen
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                    ></iframe>
                                </div>
                            ) : album.youtube_link ? (
                                <div className="w-full aspect-video shadow-lg rounded-xl overflow-hidden">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${album.youtube_link.split('v=')[1]}`}
                                        title="YouTube video player"
                                        className="border-none"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No streaming links available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
