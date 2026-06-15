import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public video pages are SSR for SEO (CLAUDE.md). Nothing exotic needed at scaffold time.
  reactStrictMode: true,
  // Pin the workspace root to this project — a lockfile in the parent home dir
  // otherwise makes Next infer the wrong root for output file tracing.
  outputFileTracingRoot: __dirname,
  // Keep these SDK packages as native Node.js modules so Next.js doesn't
  // re-bundle them — bundling breaks their internal fetch/network stacks.
  serverExternalPackages: ["@mux/mux-node", "@anthropic-ai/sdk"],
};

export default nextConfig;
