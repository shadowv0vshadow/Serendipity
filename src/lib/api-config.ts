export const getApiBaseUrl = () => {
    // Server-side execution
    if (typeof window === 'undefined') {
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`;
        }
        // Local development server-side or if explicit URL provided
        if (process.env.NEXT_PUBLIC_API_URL) {
            return process.env.NEXT_PUBLIC_API_URL;
        }
        return 'http://localhost:8000';
    }

    // Client-side execution
    // In development, always use relative path to leverage Next.js proxy
    // This avoids CORS issues and ensures cookies work correctly
    if (process.env.NODE_ENV === 'development') {
        return '';
    }

    // In production client-side
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    return '';
};
