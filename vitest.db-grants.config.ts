import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Dedicated config so `pnpm db:check-grants` only runs the live DB grant
 * harness (not the whole app suite).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/check-public-table-grants.harness.ts"],
    globals: false,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
