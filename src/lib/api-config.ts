export const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:8000';
    }
    // Fallback for client-side relative requests
    return '';
};
