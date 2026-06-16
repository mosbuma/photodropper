import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
