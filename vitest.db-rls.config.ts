import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Dedicated config so `pnpm db:check-rls` only runs the live DB RLS harness
 * (not the whole app suite).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/check-membership-request-rls.harness.ts"],
    globals: false,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
