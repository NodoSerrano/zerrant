import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // DB integration suites need a running Supabase stack; they run in the
    // CI db job via vitest.db.config.ts, not in the unit gate.
    exclude: [...configDefaults.exclude, "supabase/tests/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
