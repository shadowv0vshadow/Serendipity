```typescript
import { Metadata } from 'next';

import AlbumGrid from '@/components/AlbumGrid';
import SlowdiveHero from '@/components/SlowdiveHero';
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
  console.error(`API Error: ${res.status} ${res.statusText} at ${baseUrl}/api/albums`);
  // Try to read body if possible
  const text = await res.text().catch(() => 'No body');
  console.error(`API Response: ${text}`);
  throw new Error(`Failed to fetch albums: ${res.status} ${res.statusText}`);
}
return res.json();
}

export default async function Home() {
  const albums = await getAlbums();

  return (
    <main className="min-h-screen bg-[#111] text-[#eee] relative">
      <SlowdiveHero />

      {/* Spacer to push grid down initially */}
      <div className="h-12 w-full" />

      <AlbumGrid allAlbums={albums} />
    </main>
  );
}
```
