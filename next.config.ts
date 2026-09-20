import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep optional production previews independent from concurrent development builds.
  distDir: process.env.AI4S_PREVIEW_DIR || '.next',
  turbopack: { root: process.cwd() },
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
