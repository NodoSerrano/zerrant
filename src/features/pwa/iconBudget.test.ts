import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PWA_ICON_PATHS } from "./manifestConfig";
import { PWA_ICON_MAX_BYTES } from "./iconBudget";

const repoRoot = resolve(__dirname, "../../..");

describe("PWA icon budget (ZER-104)", () => {
  it("keeps install icons under a small byte budget (no LCP bombs)", () => {
    expect(PWA_ICON_MAX_BYTES).toBeLessThanOrEqual(32 * 1024);

    for (const relativePath of PWA_ICON_PATHS) {
      const publicRelative = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
      const absolutePath = resolve(repoRoot, "public", publicRelative);
      expect(existsSync(absolutePath)).toBe(true);
      const size = statSync(absolutePath).size;
      expect(size).toBeGreaterThan(100);
      expect(size, `${relativePath} is ${size} bytes`).toBeLessThanOrEqual(PWA_ICON_MAX_BYTES);
    }
  });
});
