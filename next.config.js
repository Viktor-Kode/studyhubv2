/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow either NEXT_PUBLIC_FIREBASE_VAPID_KEY or VITE_FIREBASE_VAPID_KEY (Vite-style) in CI/Vercel
  env: {
    NEXT_PUBLIC_FIREBASE_VAPID_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY || '',
  },
  reactStrictMode: true,
  transpilePackages: ['pdfjs-dist'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    domains: ['lh3.googleusercontent.com']
  },
}

module.exports = nextConfig
