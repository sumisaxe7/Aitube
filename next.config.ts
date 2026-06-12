import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public video pages are SSR for SEO (CLAUDE.md). Nothing exotic needed at scaffold time.
  reactStrictMode: true,
  // Pin the workspace root to this project — a lockfile in the parent home dir
  // otherwise makes Next infer the wrong root for output file tracing.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
