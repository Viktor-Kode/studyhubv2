/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure CSS is properly processed
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig
