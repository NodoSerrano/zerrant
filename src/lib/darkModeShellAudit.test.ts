import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ZER-103 / Story 7.6 — primary-shell dark polish gate.
 * Tokens from story 1.1 remain SSOT; no light-only hardcodes in checklist surfaces.
 */
const ROOT = join(process.cwd(), "src");

const PRIMARY_SHELL_FILES = [
  // auth
  "app/auth/login/page.tsx",
  "app/auth/signup/page.tsx",
  // onboarding
  "app/(onboarding)/layout.tsx",
  // plantel / nodo / agenda / profile / admin / inicio
  "app/(app)/plantel/page.tsx",
  "app/(app)/nodo/tasks/page.tsx",
  "app/(app)/nodo/projects/page.tsx",
  "app/(app)/agenda/page.tsx",
  "app/(app)/profile/page.tsx",
  "app/(app)/profile/PendingMembershipCard.tsx",
  "app/(app)/profile/TouristMenu.tsx",
  "app/(app)/profile/SerranoMenu.tsx",
  "app/(app)/admin/membresias/page.tsx",
  "app/(app)/admin/roles/page.tsx",
  "app/(app)/(inicio)/page.tsx",
  // system states
  "app/not-found.tsx",
  "app/~offline/page.tsx",
  "app/(app)/error.tsx",
  "features/system-states/SystemStateView.tsx",
  "features/home/InicioHub.tsx",
] as const;

const BANNED = [
  { name: "bg-white", re: /\bbg-white\b/ },
  { name: "text-white", re: /\btext-white\b/ },
  { name: "bg-black", re: /\bbg-black\b/ },
  { name: "text-black", re: /\btext-black\b/ },
  { name: "arbitrary hex bg/text/border", re: /(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/ },
];

describe("dark mode primary shell audit (ZER-103)", () => {
  it("keeps checklist shells free of light-only hardcodes", () => {
    const violations: string[] = [];

    for (const rel of PRIMARY_SHELL_FILES) {
      const abs = join(ROOT, rel);
      let source: string;
      try {
        source = readFileSync(abs, "utf8");
      } catch {
        violations.push(`${rel}: missing (expected primary shell file)`);
        continue;
      }

      for (const ban of BANNED) {
        if (ban.re.test(source)) {
          violations.push(`${rel}: ${ban.name}`);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
