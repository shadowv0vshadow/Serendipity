export const getApiBaseUrl = () => {
    // Server-side execution
    if (typeof window === 'undefined') {
        // Allow explicit override of API URL on server side
        if (process.env.NEXT_PUBLIC_API_URL) {
            return process.env.NEXT_PUBLIC_API_URL;
        }
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`;
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
