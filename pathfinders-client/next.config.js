/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
    ]
  },
  // Force HTTPS in production
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        permanent: true,
        destination: 'https://:path*'
      }
    ]
  },
  // Add basePath if you're not serving from root
  // basePath: '',
  // Update API proxy configuration for development
  async rewrites() {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Development: Proxy to local Django server
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*'
        },
        {
          source: '/api/fastapi/:path*',
          destination: 'http://localhost:8001/:path*'
        }
      ]
    } else {
      // Production: Proxy to production server
      return [
        {
          source: '/api/:path*',
          destination: 'https://pathfindersgifts.com/api/:path*'
        },
        {
          source: '/api/fastapi/:path*',
          destination: 'https://pathfindersgifts.com/api/fastapi/:path*'
        }
      ]
    }
  }
}

module.exports = nextConfig 