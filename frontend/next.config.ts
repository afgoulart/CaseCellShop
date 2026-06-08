import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../..'),
  async rewrites() {
    return [
      {
        // Proxy /api/* → backend on port 3001
        // Only needed for any remaining client-side fetches.
        // Server Components and Server Actions call the backend directly.
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default config;
