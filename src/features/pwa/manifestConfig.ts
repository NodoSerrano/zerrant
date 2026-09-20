import type { MetadataRoute } from "next";
import { PENCIL_TOKENS } from "@/lib/designTokens";

/** Public paths referenced by the installable web app manifest (FR55). */
export const PWA_ICON_PATHS = ["/icons/icon-192.png", "/icons/icon-512.png"] as const;

/**
 * Pure installability config for Next App Router `app/manifest.ts`.
 * Colors come from Pencil tokens (NFR22): light bg + brand primary.
 */
export function buildWebAppManifest(): MetadataRoute.Manifest {
  return {
    name: "Nodo Serrano",
    short_name: "Nodo",
    description: "Backoffice de la comunidad Nodo Serrano",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "es",
    background_color: PENCIL_TOKENS.light.bg,
    theme_color: PENCIL_TOKENS.light.primary,
    icons: [
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
    ],
  };
}
