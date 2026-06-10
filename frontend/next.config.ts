import type { NextConfig } from 'next';

const config: NextConfig = {
  // When USE_BACKEND_PROXY=true, requests to /api/* are forwarded to the Express backend.
  // By default the Next.js API route handlers (src/app/api/**) serve directly via Prisma.
  ...(process.env.USE_BACKEND_PROXY === 'true' && {
    async rewrites() {
      const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';
      return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
    },
  }),
};

export default config;
