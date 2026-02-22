/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['pdfjs-dist'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Treat optional server-only modules as externals so missing packages don't break builds
    config.externals = config.externals || []
    config.externals.push({
      officeparser: 'commonjs officeparser',
    })
    // Handle canvas for PDF.js
    if (isServer) {
      config.externals.push({
        canvas: 'commonjs canvas',
      });
    }

    // Handle PDF.js worker
    config.resolve.alias.canvas = false;

    return config;
  },
  // Ensure CSS is properly processed
  images: {
    domains: ['lh3.googleusercontent.com']
  },
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig
