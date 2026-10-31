import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/features/membership/ser-serrano-cta-server", () => ({
  resolveSerSerranoCtaVisibility: vi.fn(),
}));

/**
 * ZER-206 — the Proyectos y Tareas lists are TabBar destinations, so they live
 * under the (app) route group. Detail and forms stay focused under (modal)
 * (ZER-116). Public URLs stay /nodo/projects and /nodo/tasks.
 */
const ROOT = join(process.cwd(), "src/app");

const HUB_LISTS = ["(app)/nodo/projects/page.tsx", "(app)/nodo/tasks/page.tsx"] as const;

const MODAL_LEFTOVERS = ["(modal)/nodo/projects/page.tsx", "(modal)/nodo/tasks/page.tsx"] as const;

describe("Proyectos y Tareas hub shell placement (ZER-206)", () => {
  it("keeps the project and task lists under the app shell with TabBar", () => {
    for (const rel of HUB_LISTS) {
      const source = readFileSync(join(ROOT, rel), "utf8");
      expect(source, rel).toContain("FAB_ABOVE_TAB_BAR_CLASS");
      expect(source, rel).not.toContain("(modal)");
    }
  });

  it("does not leave the lists under the focused (modal) shell", () => {
    for (const rel of MODAL_LEFTOVERS) {
      expect(existsSync(join(ROOT, rel)), `still under modal shell: ${rel}`).toBe(false);
    }
  });

  it("gates the lists with the same members-only layout as the detail screens (ZER-204)", async () => {
    const { default: appNodoLayout } = await import("./layout");
    const { default: modalNodoLayout } = await import("../../(modal)/nodo/layout");
    expect(appNodoLayout).toBe(modalNodoLayout);
  });
});
