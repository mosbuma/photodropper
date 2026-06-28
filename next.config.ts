import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  allowedDevOrigins: ['192.168.178.*'],
  env: {
    SHOW_TEST_COMMENTS: process.env.SHOW_TEST_COMMENTS,
  },
  experimental: {
    proxyClientMaxBodySize: '550mb',
  },
};

export default nextConfig;
