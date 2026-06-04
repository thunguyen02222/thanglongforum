/**
 * @type { import('next').NextConfig }
 */

const million = require('million/compiler');
const { i18n } = require('./next-i18next.config.js');

const nextConfig = {
  i18n,
  compress: true,
  reactStrictMode: false,
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    unoptimized: true,
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.base-code.local',
        pathname: '**'
      }
    ],
    domains: ['localhost']
  },
  rewrites() {
    return [
      {
        source: '/',
        destination: '/login'
      }
    ];
  },
  experimental: { scrollRestoration: true },
  poweredByHeader: false,
  transpilePackages: [],
  serverRuntimeConfig: {
    API_ENDPOINT: process.env.API_ENDPOINT || process.env.API_SERVER_ENDPOINT,
    SITE_URL: process.env.SITE_URL,
    USER_URL: process.env.USER_URL
  },
  publicRuntimeConfig: {
    API_ENDPOINT: process.env.API_ENDPOINT || 'http://localhost:5001',
    SITE_URL: process.env.SITE_URL,
    USER_URL: process.env.USER_URL,
    MAX_SIZE_IMAGE: process.env.MAX_SIZE_IMAGE || 1000,
    MAX_SIZE_FILE: process.env.MAX_SIZE_FILE || 1000,
    MAX_SIZE_VIDEO: process.env.MAX_SIZE_VIDEO || 5000,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'base-code-secret-key',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
  },
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    SITE_URL: process.env.SITE_URL,
    USER_URL: process.env.USER_URL,
    MAX_SIZE_IMAGE: process.env.MAX_SIZE_IMAGE || '1000',
    MAX_SIZE_FILE: process.env.MAX_SIZE_FILE || '1000',
    MAX_SIZE_VIDEO: process.env.MAX_SIZE_VIDEO || '5000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'base-code-secret-key',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
  }
};

module.exports = million.next(nextConfig);
