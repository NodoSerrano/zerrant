import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ZER-116 — project detail + join-request queue are focused screens.
 * They must live under the (modal) route group so they inherit no TabBar.
 * Public URLs stay /nodo/projects/[id] and /nodo/projects/[id]/requests.
 */
const ROOT = join(process.cwd(), "src/app");

const FOCUSED_PROJECT_PAGES = [
  "(modal)/nodo/projects/[id]/page.tsx",
  "(modal)/nodo/projects/[id]/page.test.tsx",
  "(modal)/nodo/projects/[id]/requests/page.tsx",
  "(modal)/nodo/projects/[id]/requests/page.test.tsx",
] as const;

const APP_SHELL_LEFTOVERS = [
  "(app)/nodo/projects/[id]/page.tsx",
  "(app)/nodo/projects/[id]/requests/page.tsx",
] as const;

describe("project detail focused shell placement (ZER-116)", () => {
  it("keeps detail and requests pages under the modal route group", () => {
    for (const rel of FOCUSED_PROJECT_PAGES) {
      expect(existsSync(join(ROOT, rel)), `missing ${rel}`).toBe(true);
    }
  });

  it("does not leave detail or requests under the app shell with TabBar", () => {
    for (const rel of APP_SHELL_LEFTOVERS) {
      expect(existsSync(join(ROOT, rel)), `still under app shell: ${rel}`).toBe(false);
    }
  });
});
