import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/covers/:path*',
        destination: 'http://localhost:8000/covers/:path*',
      },
    ];
  },
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
