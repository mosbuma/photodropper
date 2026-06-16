import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  allowedDevOrigins: ['192.168.178.*'],
  experimental: {
    proxyClientMaxBodySize: '25mb',
  },
};

export default nextConfig;
