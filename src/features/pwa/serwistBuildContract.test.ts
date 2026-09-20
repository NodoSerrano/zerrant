import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildWebAppManifest } from "./manifestConfig";

const repoRoot = resolve(__dirname, "../../..");

describe("Serwist production build contract", () => {
  it("keeps the installable manifest valid alongside the offline shell work", () => {
    const manifest = buildWebAppManifest();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons?.length).toBeGreaterThan(0);
  });

  it("wires Serwist into Next config and package scripts (webpack required on Next 16)", () => {
    const nextConfig = readFileSync(resolve(repoRoot, "next.config.ts"), "utf8");
    const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(nextConfig).toMatch(/withSerwistInit|@serwist\/next/);
    expect(nextConfig).toMatch(/OFFLINE_FALLBACK_PATH|\/~offline/);
    expect(nextConfig).toContain("additionalPrecacheEntries");
    expect(packageJson.dependencies["@serwist/next"]).toBeTruthy();
    expect(packageJson.devDependencies.serwist).toBeTruthy();
    expect(packageJson.scripts.build).toContain("--webpack");
    expect(packageJson.scripts.dev).toContain("--webpack");
  });

  it("ships a service worker source and offline route module", () => {
    expect(existsSync(resolve(repoRoot, "src/app/sw.ts"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "src/app/~offline/page.tsx"))).toBe(true);
  });
});
