/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Keep these for now until all errors are fixed
  eslint: {
    ignoreDuringBuilds: true, // TODO: Fix all ESLint errors
  },
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix all TypeScript errors
  },
  
  // Security headers for production
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Only add strict security headers in production
          ...(isDev ? [] : [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload'
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()'
            }
          ])
        ],
      },
    ]
  },
  
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;