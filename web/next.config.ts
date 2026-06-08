import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  // Must match outputFileTracingRoot (required for Vercel monorepo builds).
  turbopack: {
    root: monorepoRoot,
  },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    optimizePackageImports: [
      "thirdweb",
      "thirdweb/react",
      "thirdweb/wallets",
      "thirdweb/extensions",
      "thirdweb/chains",
    ],
    // Safe with turbopack.root = webDir; use `npm run dev:clean` if cache corrupts.
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
