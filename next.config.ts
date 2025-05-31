import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build for now
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@prisma/client', 'node-fetch', 'form-data'],
  // Optimize for production
  experimental: {
    // Enable optimizations
    optimizePackageImports: ['@anthropic-ai/sdk', '@supabase/supabase-js'],
  },
  // Configure webpack for better module resolution
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure proper module resolution for server-side rendering
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
  // Configure headers for better performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
