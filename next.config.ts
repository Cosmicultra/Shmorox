import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["framer-motion", "motion-dom"],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  webpack: (config, { dev }) => {
    // In-memory cache avoids Windows pack.gz rename races when multiple dev
    // servers or hot reload compete for the same .next/cache/webpack folder.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
