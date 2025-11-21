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
  return (
    <main className="min-h-screen bg-[#111] text-[#eee]">
      {/* Slowdive Hero Section */}
      <div className="w-full h-[50vh] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-[#111] z-0 pointer-events-none" />

        <h1 className="text-[12rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent opacity-80 blur-sm animate-pulse z-10 select-none">
          slowdive
        </h1>
        <p className="text-gray-400 tracking-[1em] uppercase text-sm z-10 mt-4 opacity-60">
          Music Discovery
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 w-full z-10 relative">
        {albums.map((album: Album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </main>
  );
}
