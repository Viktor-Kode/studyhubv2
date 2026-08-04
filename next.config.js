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
  experimental: {
    // Reduce client-side router cache so dashboard pages don't show stale data
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  serverExternalPackages: ['officeparser', 'pdfjs-dist', 'mammoth'],
  outputFileTracingRoot: path.resolve(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    
    if (isServer) {
        // Fix for pdfjs-dist on the server: exclude from bundle and use standard paths
        config.externals = [...(config.externals || []), 'pdfjs-dist'];
    }

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
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://js.paystack.co https://pagead2.googlesyndication.com https://va.vercel-scripts.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://api.dicebear.com https://res.cloudinary.com https://*.google.com https://*.googlesyndication.com",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.cloud.google.com https://api.cloudinary.com https://vitals.vercel-insights.com wss://*.firebaseio.com https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com",
              "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://js.paystack.co https://checkout.paystack.com https://standard.paystack.co https://mozilla.github.io",
              "font-src 'self' https://fonts.gstatic.com",
              "worker-src 'self' blob: https://cdn.jsdelivr.net https://unpkg.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
