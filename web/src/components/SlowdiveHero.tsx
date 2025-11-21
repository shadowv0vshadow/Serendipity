'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export default function SlowdiveHero() {
    const { scrollY } = useScroll();

    // Opacity: 1 at top, 0 after scrolling 100px
    const opacity = useTransform(scrollY, [0, 100], [1, 0]);

    return (
        <motion.div
            style={{ opacity }}
            className="fixed top-0 left-0 w-full h-12 bg-black flex items-center justify-between px-4 z-50 border-b border-white/10"
        >
            <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8" />
                    <path d="M8 12l4 4 4-4" />
                </svg>
                <h1 className="text-lg font-bold tracking-widest text-white uppercase">
                    SLOWDIVE
                </h1>
            </div>
        </motion.div>
    );
}
