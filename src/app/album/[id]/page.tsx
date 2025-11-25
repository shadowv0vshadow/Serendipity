import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import * as motion from 'framer-motion/client';

import { Album } from '@/types';
import AlbumDetailClient from '@/components/AlbumDetailClient';
import { getApiBaseUrl } from '@/lib/api-config';

async function getAlbum(id: string) {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/albums/${id}`, { cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch album: ${res.status} ${res.statusText}`);
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
        <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
            {/* Fixed Background Layer */}
            <div className="fixed inset-0 z-0">
                {album.image_path && (
                    <>
                        <Image
                            src={encodeURI(album.image_path)}
                            alt=""
                            fill
                            className="object-cover opacity-30 blur-3xl scale-110"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
                    </>
                )}
            </div>

            {/* Content Layer */}
            <div className="relative z-10 container mx-auto px-6 pt-24 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col lg:flex-row gap-12 mb-16"
                >
                    {/* Left: Album Cover */}
                    <div className="w-full lg:w-2/5 xl:w-1/3 flex-shrink-0">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group"
                        >
                            <Image
                                src={encodeURI(album.image_path)}
                                alt={album.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 1024px) 100vw, 40vw"
                                priority
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZyI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMxYTFhMWEiIG9mZnNldD0iMjAlIiAvPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMmEyYTJhIiBvZmZzZXQ9IjUwJSIgLz4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzFhMWExYSIgb2Zmc2V0PSI3MCUiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgZmlsbD0iIzFhMWExYSIgLz4KICA8cmVjdCBpZD0iciIgd2lkdGg9IjcwMCIgaGVpZ2h0PSI3MDAiIGZpbGw9InVybCgjZykiIC8+CiAgPGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii03MDAiIHRvPSI3MDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAgLz4KPC9zdmc+"
                            />
                        </motion.div>
                    </div>

                    {/* Right: Album Info */}
                    <div className="flex-1 flex flex-col justify-center">
                        {/* Rank Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-4"
                        >
                            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 font-bold text-sm tracking-wider">
                                #{album.rank}
                            </span>
                        </motion.div>

                        {/* Album Title */}
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 leading-tight"
                        >
                            {album.title}
                        </motion.h1>

                        {/* Artist Name */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mb-8"
                        >
                            <Link
                                href={`/artist/${album.artist_id}`}
                                className="text-2xl md:text-3xl text-zinc-300 hover:text-white transition-colors font-light inline-flex items-center gap-2 group"
                            >
                                {album.artist_name}
                                <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </motion.div>

                        {/* Metadata Grid */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="grid grid-cols-2 gap-6 mb-8"
                        >
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Released</span>
                                <span className="text-white font-medium text-lg">{album.release_date || 'N/A'}</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Rating</span>
                                <span className="text-white font-medium text-lg">{album.rating} / 5.0</span>
                            </div>
                        </motion.div>

                        {/* Genres */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="mb-8"
                        >
                            <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-3">Genres</span>
                            <div className="flex flex-wrap gap-2">
                                {album.genres.map((genre: string) => (
                                    <Link
                                        key={genre}
                                        href={`/genre/${encodeURIComponent(genre)}`}
                                        className="px-4 py-2 bg-white/5 backdrop-blur-md hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 rounded-full text-sm text-zinc-300 hover:text-white transition-all duration-200"
                                    >
                                        {genre}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>

                        {/* Like Button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <AlbumDetailClient album={album} />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Streaming Section */}
                {(album.spotify_link || album.youtube_link) && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
                    >
                        <h3 className="text-2xl font-bold mb-6 text-white">Listen Now</h3>

                        {album.spotify_link ? (
                            <div className="w-full shadow-lg rounded-xl overflow-hidden">
                                <iframe
                                    style={{ borderRadius: '12px' }}
                                    src={`https://open.spotify.com/embed/album/${album.spotify_link.split('/').pop()}`}
                                    width="100%"
                                    height="352"
                                    className="border-none"
                                    allowFullScreen
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                />
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
                                />
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </div>
        </main>
    );
}
