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
    // Only proxy in production, not in development
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: 'https://api-gamma-lyart.vercel.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
