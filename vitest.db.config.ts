import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Integration tests against the local Supabase stack (`supabase start`).
 * Kept out of `src/` so the default unit gate stays DB-free:
 *   ./node_modules/.bin/vitest run -c vitest.db.config.ts
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.db.test.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
