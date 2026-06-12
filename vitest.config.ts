import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Tests must pass without a running database (see plan): they exercise pure
    // logic and mock shapes only, never a live Prisma connection.
  },
});
