/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['pdfjs-dist'],
  // Ensure CSS is properly processed
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig
