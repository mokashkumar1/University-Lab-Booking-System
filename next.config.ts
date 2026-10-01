import type { NextConfig } from 'next';
const config: NextConfig = { 
  allowedDevOrigins: ['127.0.0.1'], 
  images: { 
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
    minimumCacheTTL: 31536000 
  },
  async headers() {
    return [
      {
        source: '/images/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
    ];
  }
};
export default config;

