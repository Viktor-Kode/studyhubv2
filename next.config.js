const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow either NEXT_PUBLIC_FIREBASE_VAPID_KEY or VITE_FIREBASE_VAPID_KEY (Vite-style) in CI/Vercel
  env: {
    NEXT_PUBLIC_FIREBASE_VAPID_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY || '',
  },
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {},
  serverExternalPackages: ['officeparser'],
  outputFileTracingRoot: path.resolve(__dirname),
  transpilePackages: ['pdfjs-dist'],
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    // Mitigates known next/image optimizer abuse in self-hosted setups.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
