'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Album } from '@/types';

interface AlbumCardProps {
    album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
    return (
        <Link href={`/album/${album.id}`}>
            <motion.div
                className="relative w-full aspect-square overflow-hidden bg-gray-900 cursor-pointer group"
                whileHover={{ scale: 1.05, zIndex: 10 }}
                transition={{ duration: 0.3 }}
            >
                <Image
                    src={album.image_path}
                    alt={album.title}
                    fill
                    className="object-cover transition-all duration-300 group-hover:brightness-75"
                    sizes="(max-width: 600px) 33vw, (max-width: 1200px) 12vw, 10vw"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-black/40 backdrop-blur-sm">
                    <h3 className="text-white font-bold text-sm line-clamp-2 my-1">{album.title}</h3>
                    <p className="text-gray-300 text-xs line-clamp-1">{album.artist_name}</p>
                </div>
            </motion.div>
        </Link>
    );
}
