import { Metadata } from 'next';
import { cookies } from 'next/headers';

import AlbumGrid from '@/components/AlbumGrid';
import { Album } from '@/types';

export const metadata: Metadata = {
  title: 'Slowdive',
  description: 'Immerse yourself in music',
};

async function getAlbums() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:8000');

  // Get cookies from the request to forward to API
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  const res = await fetch(`${baseUrl}/api/albums?limit=40&offset=0`, {
    cache: 'no-store',
    next: { revalidate: 1800 }, // Cache for 30 minutes (1800 seconds)
    credentials: 'include',
    headers: {
      // Forward the session cookie to the API
      ...(sessionToken ? { Cookie: `session_token=${sessionToken.value}` } : {}),
    },
  });
  if (!res.ok) {
    console.error(`API Error: ${res.status} ${res.statusText} at ${baseUrl}/api/albums`);
    const text = await res.text().catch(() => 'No body');
    console.error(`API Response: ${text}`);
    throw new Error(`Failed to fetch albums: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.albums; // Extract albums array from paginated response
}

export default async function Home() {
  const albums = await getAlbums();

  return (
    <main className="min-h-screen bg-[#111] text-[#eee] relative pt-12">
      <AlbumGrid allAlbums={albums} />
    </main>
  );
}
