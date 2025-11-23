import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import * as motion from 'framer-motion/client';

import AlbumGrid from '@/components/AlbumGrid';
import ArtistBio from '@/components/ArtistBio';
import DiscographySection from '@/components/DiscographySection';
import { getApiBaseUrl } from '@/lib/api-config';
import { Artist } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getArtist(id: string): Promise<Artist> {
    const baseUrl = getApiBaseUrl();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    const res = await fetch(`${baseUrl}/api/artists/${id}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
            ...(sessionToken ? { Cookie: `session_token=${sessionToken.value}` } : {}),
        },
    });

    if (!res.ok) {
        if (res.status === 404) {
            throw new Error('Artist not found');
        }
        throw new Error(`Failed to fetch artist: ${res.statusText}`);
    }

    return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const { id } = await params;
        const artist = await getArtist(id);
        return {
            title: `${artist.name} - Slowdive`,
            description: artist.bio ? artist.bio.substring(0, 160) : `Music by ${artist.name}`,
        };
    } catch {
        return {
            title: 'Artist Not Found - Slowdive',
        };
    }
}

export default async function ArtistPage({ params }: PageProps) {
    const { id } = await params;
    let artist: Artist;

    try {
        artist = await getArtist(id);
    } catch (e) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Artist Not Found</h1>
                    <Link href="/" className="text-purple-400 hover:underline">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
            {/* Fixed Background Layer */}
            <div className="fixed inset-0 z-0">
                {artist.image_path && (
                    <>
                        <Image
                            src={artist.image_path}
                            alt=""
                            fill
                            className="object-cover opacity-30 blur-3xl scale-110"
                            priority
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZyI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMxYTFhMWEiIG9mZnNldD0iMjAlIiAvPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMmEyYTJhIiBvZmZzZXQ9IjUwJSIgLz4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzFhMWExYSIgb2Zmc2V0PSI3MCUiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgZmlsbD0iIzFhMWExYSIgLz4KICA8cmVjdCBpZD0iciIgd2lkdGg9IjcwMCIgaGVpZ2h0PSI3MDAiIGZpbGw9InVybCgjZykiIC8+CiAgPGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii03MDAiIHRvPSI3MDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAgLz4KPC9zdmc+"
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
                    className="flex flex-col md:flex-row gap-12 mb-20 items-end"
                >
                    {/* Artist Image Card */}
                    <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group"
                        >
                            {artist.image_path ? (
                                <Image
                                    src={artist.image_path}
                                    alt={artist.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    priority
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZyI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMxYTFhMWEiIG9mZnNldD0iMjAlIiAvPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMmEyYTJhIiBvZmZzZXQ9IjUwJSIgLz4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzFhMWExYSIgb2Zmc2V0PSI3MCUiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgZmlsbD0iIzFhMWExYSIgLz4KICA8cmVjdCBpZD0iciIgd2lkdGg9IjcwMCIgaGVpZ2h0PSI3MDAiIGZpbGw9InVybCgjZykiIC8+CiAgPGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii03MDAiIHRvPSI3MDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAgLz4KPC9zdmc+"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                                    No Image
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 pb-4">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-6xl md:text-8xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400"
                        >
                            {artist.name}
                        </motion.h1>

                        {artist.location && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-zinc-400 text-lg mb-8 flex items-center gap-2 font-light"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {artist.location}
                            </motion.p>
                        )}

                        {artist.bio && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="prose prose-invert prose-lg max-w-none text-zinc-300/90 leading-relaxed"
                            >
                                <ArtistBio bio={artist.bio} />
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Discography Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                >
                    <DiscographySection albums={artist.albums} />
                </motion.div>
            </div>
        </main>
    );
}
