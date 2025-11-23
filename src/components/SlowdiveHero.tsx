'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import AuthModal from './AuthModal';
import { getApiBaseUrl } from '@/lib/api-config';

export default function SlowdiveHero() {
    const { scrollY } = useScroll();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [user, setUser] = useState<{ id: number; username: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isDiving, setIsDiving] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    // Auto-hide navbar on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show navbar when scrolling up or at the top
            if (currentScrollY < lastScrollY || currentScrollY < 10) {
                setIsVisible(true);
            }
            // Hide navbar when scrolling down (and not at the top)
            else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleLogin = (userData: { id: number; username: string }) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        window.location.reload();
    };

    const handleLogout = async () => {
        const baseUrl = getApiBaseUrl();
        try {
            await fetch(`${baseUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (e) {
            console.error('Logout failed:', e);
        }

        setUser(null);
        localStorage.removeItem('user');
        window.location.reload();
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // Only animate if not already on home page
        if (pathname !== '/') {
            setIsDiving(true);

            // Navigate after animation starts
            setTimeout(() => {
                router.push('/');
            }, 400);

            // Reset animation state
            setTimeout(() => {
                setIsDiving(false);
            }, 1000);
        }
    };

    // Background opacity: 0 at top, 0.9 after scrolling 100px
    const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.9]);
    // Border opacity: 0 at top, 0.1 after scrolling 100px
    const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.1]);

    return (
        <>
            <motion.div
                style={{
                    backgroundColor: useTransform(bgOpacity, o => `rgba(0, 0, 0, ${o})`),
                    borderColor: useTransform(borderOpacity, o => `rgba(255, 255, 255, ${o})`),
                    backdropFilter: useTransform(bgOpacity, o => o > 0.5 ? 'blur(8px)' : 'none')
                }}
                animate={{
                    y: isVisible ? 0 : -100,
                }}
                transition={{
                    duration: 0.3,
                    ease: 'easeInOut'
                }}
                className="fixed top-0 left-0 w-full z-50 border-b border-transparent"
            >
                <div className="w-full px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
                    <motion.a
                        href="/"
                        onClick={handleLogoClick}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 relative"
                        animate={isDiving ? {
                            y: [0, 5, 15, 30, 50, 80],
                            opacity: [1, 0.9, 0.7, 0.4, 0.2, 0],
                            scale: [1, 0.98, 0.95, 0.9, 0.85, 0.8],
                        } : {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: 0.6,
                            ease: [0.4, 0.0, 0.6, 1], // Custom easing for dive effect
                        }}
                    >
                        <motion.svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-white"
                            animate={isDiving ? {
                                rotate: [0, 5, 10, 15, 20, 25],
                            } : {
                                rotate: 0,
                            }}
                            transition={{
                                duration: 0.6,
                            }}
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8" />
                            <path d="M8 12l4 4 4-4" />
                        </motion.svg>
                        <h1 className="text-lg sm:text-xl font-bold tracking-widest text-white uppercase hidden sm:block">
                            SLOWDIVE
                        </h1>
                    </motion.a>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-sm transition-all duration-200"
                            />
                        </div>
                    </form>

                    <div className="flex-shrink-0">
                        {user ? (
                            <div className="flex items-center gap-3 sm:gap-4">
                                <Link
                                    href="/profile"
                                    className="text-sm text-gray-300 hover:text-white transition-colors hidden md:inline font-medium truncate max-w-[120px]"
                                >
                                    {user.username}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs border border-white/20 rounded px-3 py-1.5 text-gray-400 hover:text-white hover:border-white transition-colors"
                                >
                                    LOGOUT
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthOpen(true)}
                                className="text-sm font-medium text-white hover:text-gray-300 transition-colors tracking-wide"
                            >
                                LOGIN
                            </button>
                        )}
                    </div>
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

