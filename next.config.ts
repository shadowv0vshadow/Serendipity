import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/index',
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
