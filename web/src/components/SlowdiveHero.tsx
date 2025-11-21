'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export default function SlowdiveHero() {
    const { scrollY } = useScroll();

    // Opacity: 1 at top, 0 after scrolling 300px
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    // Scale: Slight zoom out effect
    const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
    // Blur: Increase blur as it fades
    const filter = useTransform(scrollY, [0, 300], ["blur(0px)", "blur(10px)"]);

    return (
        <div className="fixed inset-0 w-full h-[50vh] flex flex-col items-center justify-center pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent" />

            <motion.div style={{ opacity, scale, filter }} className="flex flex-col items-center">
                <h1 className="text-[10rem] md:text-[15rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 select-none leading-none">
                    slowdive
                </h1>
                <p className="text-gray-400 tracking-[1.5em] uppercase text-sm mt-4 opacity-80">
                    Music Discovery
                </p>
            </motion.div>
        </div>
    );
}
