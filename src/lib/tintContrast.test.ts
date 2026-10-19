import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ZER-175 — chips and badges draw text on a translucent tint of a brand color
 * (`bg-mint-raw/20 text-…`). The tint changes with the surface below it, so this
 * composites it over every surface, in both themes, and requires AA (4.5:1)
 * for the `on-*-tint` text tokens.
 */
const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function block(selector: "@theme" | ".dark"): string {
  const start = CSS.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing ${selector} block`);
  return CSS.slice(start, CSS.indexOf("\n}", start));
}

function colors(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, name, hex] of source.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[name] = hex.toLowerCase();
  }
  return out;
}

const LIGHT = colors(block("@theme"));
const DARK = { ...LIGHT, ...colors(block(".dark")) };

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function luminance(channels: number[]): number {
  const [r, g, b] = channels.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `fill` at `alpha` composited over an opaque `base`. */
function tint(fill: string, base: string, alpha: number): number[] {
  const f = rgb(fill);
  return rgb(base).map((b, i) => Math.round(alpha * f[i] + (1 - alpha) * b));
}

// [tint name, fill token behind it]
const TINTS: [string, string][] = [
  ["mint", "mint-raw"],
  ["blue", "blue-raw"],
  ["violet", "violet-raw"],
  ["coral", "coral"],
  ["yellow", "warm-yellow"],
  ["orange", "warm-orange"],
  ["green", "brand-green"],
];
const SURFACES = ["bg", "surface", "surface-inset"];
// Chips use /20; error boxes use /10 and will reuse on-coral-tint.
const ALPHAS = [0.1, 0.2];

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
] as const)("text on tinted fills — %s theme", (_theme, palette) => {
  for (const [name, fill] of TINTS) {
    it(`on-${name}-tint meets AA on ${fill} tints over every surface`, () => {
      const text = palette[`on-${name}-tint`];
      expect(text, `--color-on-${name}-tint`).toBeDefined();
      for (const surface of SURFACES) {
        for (const alpha of ALPHAS) {
          const ratio = contrast(rgb(text), tint(palette[fill], palette[surface], alpha));
          expect(ratio, `${surface} @ ${alpha}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});

describe("chips and badges use the tint text tokens", () => {
  it.each([
    "src/components/Chip.tsx",
    "src/components/TierBadge.tsx",
    "src/components/PlatformAdminBadge.tsx",
    "src/components/SupabaseHealthcheck.tsx",
    "src/features/events/RsvpControl.tsx",
    "src/features/projects/ProjectDetail.tsx",
    "src/features/tasks/taskDisplay.ts",
    "src/features/plantel/EditSkills.tsx",
  ])("%s does not put brand-colored text on its own tint", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    expect(source).not.toMatch(
      // Same line, any opacity: covers class strings and { bg, text } maps.
      /bg-(mint-raw|blue-raw|violet-raw|coral|warm-yellow|warm-orange|brand-green)\/\d+\b[^\n]*\btext-(brand-mint|brand-blue|brand-violet|coral|warm-yellow|warm-orange|brand-green)\b/,
    );
  });
});
