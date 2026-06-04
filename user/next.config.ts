import type { NextConfig } from 'next';
import million from 'million/compiler';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { i18n } = require('./next-i18next.config.js');

const nextConfig: NextConfig = {
  i18n,
  compress: true,
  reactStrictMode: false,
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    unoptimized: true,
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.base-code.local',
        pathname: '**'
      }
    ],
    domains: ['localhost']
  },
  poweredByHeader: false,
  serverRuntimeConfig: {
    API_ENDPOINT: process.env.API_SERVER_ENDPOINT || process.env.API_ENDPOINT
  },
  publicRuntimeConfig: {
    SITE_URL: process.env.SITE_URL,
    API_ENDPOINT: process.env.API_ENDPOINT || 'http://localhost:5001',
    MAX_SIZE_IMAGE: process.env.MAX_SIZE_IMAGE || 1000,
    MAX_SIZE_FILE: process.env.MAX_SIZE_FILE || 1000,
    MAX_SIZE_VIDEO: process.env.MAX_SIZE_VIDEO || 5000,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_SOCKET_ENDPOINT: process.env.NEXT_PUBLIC_SOCKET_ENDPOINT
  },
  webpack(config, { buildId, webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env': {
          BUILD_ID: JSON.stringify(buildId)
        }
      })
    );

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false
    };

    return config;
  },
  transpilePackages: []
};

export default million.next(nextConfig);
