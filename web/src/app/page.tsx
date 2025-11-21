import { Metadata } from 'next';

import AlbumCard from '@/components/AlbumCard';
import { Album } from '@/types';

export const metadata: Metadata = {
  title: 'Serendipity | Music Discovery',
  description: 'Discover your next favorite album from curated top charts.',
};

async function getAlbums() {
  // Prioritize environment variable, then Vercel system var, then localhost
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:8000');

  const res = await fetch(`${baseUrl}/api/albums`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch albums');
  }
  return res.json();
}

export default async function Home() {
  const albums = await getAlbums();

  return (
    <main className="min-h-screen bg-[#111] text-[#eee] relative">
      {/* Slowdive Header Effect */}
      <div className="fixed top-0 left-0 w-full h-40 z-50 pointer-events-none flex items-center justify-center mix-blend-difference">
        <h1 className="text-9xl font-bold tracking-tighter text-white opacity-80 blur-sm animate-pulse">
          slowdive
        </h1>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 w-full">
        {albums.map((album: Album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </main>
  );
}
