import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BRAND_CTA_SHADOW_CLASS,
  BRAND_GRADIENT_CLASS,
  WARM_GRADIENT_CLASS,
} from "./brandGradients";
import { PENCIL_TOKENS } from "./designTokens";

describe("brand gradient utilities (ZER-120)", () => {
  it("exports reusable class names for brand and warm ramps", () => {
    expect(BRAND_GRADIENT_CLASS).toBe("bg-gradient-brand");
    expect(WARM_GRADIENT_CLASS).toBe("bg-gradient-warm");
    expect(BRAND_CTA_SHADOW_CLASS).toContain("shadow-[");
  });

  it("globals.css defines bg-gradient-brand with mint-raw → blue-raw → grad-violet stops", () => {
    const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf-8");
    expect(css).toMatch(/@utility\s+bg-gradient-brand/);
    expect(css).toContain("var(--color-mint-raw)");
    expect(css).toContain("var(--color-blue-raw)");
    expect(css).toContain("var(--color-grad-violet)");
    expect(css).toMatch(/46\.66%/);
    expect(css).toMatch(/93\.25%/);
  });

  it("globals.css defines bg-gradient-warm with yellow → warm-red → warm-violet", () => {
    const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf-8");
    expect(css).toMatch(/@utility\s+bg-gradient-warm/);
    expect(css).toContain("var(--color-warm-yellow)");
    expect(css).toContain("var(--color-warm-red)");
    expect(css).toContain("var(--color-warm-violet)");
  });

  it("keeps Pencil solid brand-mint as teal (not landing light mint)", () => {
    expect(PENCIL_TOKENS.light["brand-mint"]).toBe("#0a8268");
    expect(PENCIL_TOKENS.light["mint-raw"]).toBe("#4fe6c3");
  });

  it("exposes landing grad-primary violet stop as grad-violet", () => {
    expect(PENCIL_TOKENS.light["grad-violet"]).toBe("#c87fe5");
    expect(PENCIL_TOKENS.light["warm-red"]).toBe("#ff3121");
  });
});
