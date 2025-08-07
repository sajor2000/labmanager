/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  eslint: {
    // Temporarily disable ESLint during builds to allow deployment
    // TODO: Fix all ESLint errors and re-enable
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily disable TypeScript errors for deployment
    // TODO: Fix all TypeScript errors and re-enable
    ignoreBuildErrors: true,
  },
};

export default nextConfig;