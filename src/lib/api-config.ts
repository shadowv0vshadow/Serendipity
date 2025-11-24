export const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:8000';
    }
    // In production, use relative path (proxied by Next.js rewrites)
    return '';
};
