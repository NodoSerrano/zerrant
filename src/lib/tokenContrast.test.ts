import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ZER-175 — WCAG AA gate on the color tokens in globals.css, in both themes.
 * Normal text needs 4.5:1. If a token changes and breaks a pair, this fails
 * instead of the regression showing up as hard-to-read screens.
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

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const BACKGROUNDS = ["bg", "surface", "surface-inset"];
const TEXT_ON_BACKGROUNDS = [
  "text-primary",
  "text-secondary",
  "text-muted",
  "coral",
  "primary",
  "brand-green",
  "brand-blue",
  "brand-violet",
];
// Filled controls: the fill token and the text drawn on top of it.
const TEXT_ON_FILLS: [fill: string, text: string][] = [
  ["primary", "on-primary"],
  ["coral", "on-primary"],
  ["brand-blue", "on-primary"],
  ["picker-selected", "on-picker-selected"],
];

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
] as const)("token contrast — %s theme", (_theme, palette) => {
  for (const text of TEXT_ON_BACKGROUNDS) {
    for (const bg of BACKGROUNDS) {
      it(`${text} on ${bg} meets AA (4.5:1)`, () => {
        expect(palette[text], `--color-${text}`).toBeDefined();
        expect(contrast(palette[text], palette[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  // Non-text UI (WCAG 1.4.11) needs 3:1: the off switch track and its knob.
  it("switch-track stands out from surface and from its knob (3:1)", () => {
    expect(contrast(palette["switch-track"], palette.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(palette["switch-track"], palette["on-primary"])).toBeGreaterThanOrEqual(3);
  });

  for (const [fill, text] of TEXT_ON_FILLS) {
    it(`${text} on ${fill} meets AA (4.5:1)`, () => {
      expect(palette[fill], `--color-${fill}`).toBeDefined();
      expect(palette[text], `--color-${text}`).toBeDefined();
      expect(contrast(palette[text], palette[fill])).toBeGreaterThanOrEqual(4.5);
    });
  }
});

// bg-gradient-brand stops (globals.css @utility): text on any part of it must read.
const GRADIENT_STOPS = ["mint-raw", "blue-raw", "grad-violet"];

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
] as const)("text on the brand gradient — %s theme", (_theme, palette) => {
  it.each(GRADIENT_STOPS)("on-gradient on %s meets AA (4.5:1)", (stop) => {
    expect(palette["on-gradient"], "--color-on-gradient").toBeDefined();
    expect(contrast(palette["on-gradient"], palette[stop])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("no hardcoded hex colors in the date and time pickers (ZER-175 AC3)", () => {
  it.each(["src/features/events/DateField.tsx", "src/features/events/TimeField.tsx"])(
    "%s uses tokens",
    (file) => {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/\[#[0-9a-fA-F]{3,8}\]/);
    },
  );
});
