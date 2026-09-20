import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PWA_ICON_PATHS, buildWebAppManifest } from "./manifestConfig";

const repoRoot = resolve(__dirname, "../../..");

describe("buildWebAppManifest", () => {
  it("returns installable web app fields aligned with design tokens", () => {
    const manifest = buildWebAppManifest();

    expect(manifest.name).toBe("Nodo Serrano");
    expect(manifest.short_name).toBe("Nodo");
    expect(manifest.description).toBe("Backoffice de la comunidad Nodo Serrano");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("es");
    expect(manifest.background_color).toBe("#f8f4ed");
    expect(manifest.theme_color).toBe("#0c8a5e");
    expect(manifest.icons).toEqual([
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ]);
  });

  it("points every icon src at a real non-empty public asset", () => {
    expect(PWA_ICON_PATHS.length).toBeGreaterThan(0);

    for (const relativePath of PWA_ICON_PATHS) {
      const publicRelative = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
      const absolutePath = resolve(repoRoot, "public", publicRelative);
      expect(existsSync(absolutePath), `missing ${relativePath}`).toBe(true);
      expect(statSync(absolutePath).size).toBeGreaterThan(100);
    }
  });
});
