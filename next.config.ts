import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'e.snmc.io',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // In development, proxy to local FastAPI server
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }

    // In production (Vercel), route to the Python entry point
    return [
      {
        source: '/api/:path*',
        destination: '/api/index',
      },
    ];
  },
};

export default nextConfig;
