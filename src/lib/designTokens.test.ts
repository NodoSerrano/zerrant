import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PENCIL_TOKENS } from "./designTokens";

const TOKEN_TABLE = PENCIL_TOKENS;

describe("PENCIL_TOKENS", () => {
  it("has light hex values matching Pencil design system", () => {
    const L = TOKEN_TABLE.light;
    expect(L.bg).toBe("#f8f4ed");
    expect(L.surface).toBe("#fefbf6");
    expect(L["surface-inset"]).toBe("#f1ebe0");
    expect(L.border).toBe("#e6dfd3");
    expect(L["text-primary"]).toBe("#1a1614");
    expect(L["text-secondary"]).toBe("#5a5550");
    expect(L["text-muted"]).toBe("#8a847c");
    expect(L["on-primary"]).toBe("#f8f4ed");
    expect(L["brand-mint"]).toBe("#0a8268");
    expect(L["brand-green"]).toBe("#0c8a5e");
    expect(L["brand-blue"]).toBe("#1158b0");
    expect(L["brand-violet"]).toBe("#6b3fa8");
    expect(L.primary).toBe("#0c8a5e");
    expect(L.coral).toBe("#c70067");
    expect(L["warm-yellow"]).toBe("#ff9728");
    expect(L["warm-orange"]).toBe("#ff4d21");
    expect(L["warm-red"]).toBe("#ff3121");
    expect(L["warm-violet"]).toBe("#9e1fd0");
    expect(L["mint-raw"]).toBe("#4fe6c3");
    expect(L["blue-raw"]).toBe("#2e9bff");
    expect(L["violet-raw"]).toBe("#b57fe0");
    expect(L["grad-violet"]).toBe("#c87fe5");
  });

  it("has dark themed token values differing from light", () => {
    const D = TOKEN_TABLE.dark;
    expect(D.bg).toBe("#1a1614");
    expect(D.surface).toBe("#262019");
    expect(D["surface-inset"]).toBe("#201b17");
    expect(D.border).toBe("#37302a");
    expect(D["text-primary"]).toBe("#f8f4ed");
    expect(D["text-secondary"]).toBe("#c4bdb2");
    expect(D["text-muted"]).toBe("#8a847c");
    expect(D["on-primary"]).toBe("#f8f4ed");

    expect(D.bg).not.toBe(TOKEN_TABLE.light.bg);
    expect(D.surface).not.toBe(TOKEN_TABLE.light.surface);
  });

  it("has radius tokens matching Pencil values", () => {
    expect(TOKEN_TABLE.radius.sm).toBe("12px");
    expect(TOKEN_TABLE.radius.md).toBe("18px");
    expect(TOKEN_TABLE.radius.lg).toBe("24px");
    expect(TOKEN_TABLE.radius.xl).toBe("30px");
    expect(TOKEN_TABLE.radius.pill).toBe("999px");
  });

  it("has font tokens matching Pencil values", () => {
    expect(TOKEN_TABLE.font.display).toBe("Space Grotesk");
    expect(TOKEN_TABLE.font.body).toBe("Inter");
  });

  it("PENCIL_TOKENS is frozen", () => {
    expect(Object.isFrozen(TOKEN_TABLE)).toBe(true);
    expect(Object.isFrozen(TOKEN_TABLE.light)).toBe(true);
    expect(Object.isFrozen(TOKEN_TABLE.dark)).toBe(true);
    expect(Object.isFrozen(TOKEN_TABLE.radius)).toBe(true);
    expect(Object.isFrozen(TOKEN_TABLE.font)).toBe(true);
  });
});

function hasDarkClassRule(haystack: string): boolean {
  return /\.dark\s*\{/.test(haystack);
}

function extractDarkBlock(css: string): string {
  const match = css.match(/\.dark\s*\{([^}]*)\}/);
  return match ? match[0] : "";
}

describe("globals.css dark class selectors", () => {
  const cssPath = resolve(__dirname, "../app/globals.css");

  it("has a .dark CSS class rule (not just @variant)", () => {
    const css = readFileSync(cssPath, "utf-8");
    expect(hasDarkClassRule(css)).toBe(true);
  });

  it("contains --color-bg with dark hex #1a1614 inside .dark rule", () => {
    const css = readFileSync(cssPath, "utf-8");
    const block = extractDarkBlock(css);
    expect(block).toContain("--color-bg");
    expect(block).toContain("#1a1614");
  });

  it("contains --color-surface with dark hex #262019 inside .dark rule", () => {
    const css = readFileSync(cssPath, "utf-8");
    const block = extractDarkBlock(css);
    expect(block).toContain("--color-surface");
    expect(block).toContain("#262019");
  });

  it("contains --color-border with dark hex #37302a inside .dark rule", () => {
    const css = readFileSync(cssPath, "utf-8");
    const block = extractDarkBlock(css);
    expect(block).toContain("--color-border");
    expect(block).toContain("#37302a");
  });

  it("contains dark text tokens inside .dark rule", () => {
    const css = readFileSync(cssPath, "utf-8");
    const block = extractDarkBlock(css);
    expect(block).toContain("--color-text-primary");
    expect(block).toContain("#f8f4ed");
    expect(block).toContain("--color-text-secondary");
    expect(block).toContain("#c4bdb2");
  });
});

describe("dark class applies CSS variables in DOM", () => {
  it("resolves --color-bg to dark value when .dark is set", () => {
    const style = document.createElement("style");
    style.textContent = `
      :root { --color-bg: #f8f4ed; }
      .dark { --color-bg: #1a1614; }
    `;
    document.head.appendChild(style);

    document.documentElement.classList.add("dark");
    const value = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
    document.documentElement.classList.remove("dark");
    document.head.removeChild(style);

    expect(value).toBe("#1a1614");
  });

  it("resolves --color-bg to light value when .dark is NOT set", () => {
    const style = document.createElement("style");
    style.textContent = `
      :root { --color-bg: #f8f4ed; }
      .dark { --color-bg: #1a1614; }
    `;
    document.head.appendChild(style);

    const value = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
    document.head.removeChild(style);

    expect(value).toBe("#f8f4ed");
  });
});
