import type { MetadataRoute } from "next";
import { buildWebAppManifest } from "@/features/pwa/manifestConfig";

/** Next 16 App Router web app manifest (see node_modules/next/dist/docs/.../manifest.md). */
export default function manifest(): MetadataRoute.Manifest {
  return buildWebAppManifest();
}
