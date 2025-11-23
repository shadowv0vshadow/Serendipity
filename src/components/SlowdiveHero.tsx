'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import AuthModal from './AuthModal';

export default function SlowdiveHero() {
    const { scrollY } = useScroll();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [user, setUser] = useState<{ id: number; username: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const handleLogin = (userData: { id: number; username: string }) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        // Reload to refresh recommendations with new cookie
        window.location.reload();
    };

    import { getApiBaseUrl } from '@/lib/api-config';

    const handleLogout = async () => {
        const baseUrl = getApiBaseUrl();
        try {
            await fetch(`${baseUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include', // Important: send cookie
            });
        } catch (e) {
            console.error('Logout failed:', e);
        }

        setUser(null);
        localStorage.removeItem('user');
        window.location.reload();
    };

    // Opacity: 1 at top, 0 after scrolling 100px
    const opacity = useTransform(scrollY, [0, 100], [1, 0]);

    return (
        <>
            <motion.div
                style={{ opacity }}
                className="fixed top-0 left-0 w-full h-12 bg-black flex items-center justify-between px-4 z-50 border-b border-white/10"
            >
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8" />
                        <path d="M8 12l4 4 4-4" />
                    </svg>
                    <h1 className="text-lg font-bold tracking-widest text-white uppercase">
                        SLOWDIVE
                    </h1>
                </Link>

                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <a
                                href="/profile"
                                className="text-sm text-gray-300 hover:text-white transition-colors hidden sm:inline"
                            >
                                Hi, {user.username}
                            </a>
                            <button
                                onClick={handleLogout}
                                className="text-xs border border-white/20 rounded px-2 py-1 text-gray-400 hover:text-white hover:border-white transition-colors"
                            >
                                LOGOUT
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
                        >
                            LOGIN
                        </button>
                    )}
                </div>
            </motion.div>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onLogin={handleLogin}
            />
        </>
    );
}
