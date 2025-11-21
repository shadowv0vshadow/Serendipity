import { Metadata } from 'next';

import AlbumCard from '@/components/AlbumCard';
import { Album } from '@/types';

export const metadata: Metadata = {
  title: 'Serendipity | Music Discovery',
  description: 'Discover your next favorite album from curated top charts.',
};

async function getAlbums() {
  // In Vercel/Next.js, relative paths work if on same domain
  // But for server components, we need absolute URL or handle it via rewrites
  // If we use relative path in fetch on server, it fails (needs base URL)
  // So we use an env var or default to localhost
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  // Actually, for Vercel deployment with rewrites, the client fetches from /api
  // But server components fetch from where?
  // If we deploy monorepo, api is at same domain.
  // Let's try using the relative path if client, but server needs full URL.
  // Simplest: Use a helper.

  const res = await fetch(`${baseUrl}/api/albums`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch albums');
  }
  return res.json();
}

export default async function Home() {
  const albums = await getAlbums();

  return (
    <main className="min-h-screen bg-[#111] text-[#eee]">
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 w-full">
        {albums.map((album: Album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </main>
  );
}
