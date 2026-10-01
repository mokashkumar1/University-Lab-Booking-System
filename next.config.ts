import type { NextConfig } from 'next';
const config: NextConfig = { allowedDevOrigins: ['127.0.0.1'], images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] } };
export default config;

