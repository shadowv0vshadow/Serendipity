export const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:8000';
    }
    // Fallback to production API URL
    return 'https://api-gamma-lyart.vercel.app';
};
