import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import {
  getSupabaseAvatarRemotePatterns,
  shouldAllowLocalIPForAvatars,
} from "./src/lib/avatar-image-url";
import { getEventCoverRemotePatterns } from "./src/features/events/event-cover-image-url";
import { OFFLINE_FALLBACK_PATH } from "./src/features/pwa/offlineShellPolicy";

// Revision for additional precache entries (offline shell page).
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Serwist classic webpack path — Next 16 Turbopack needs --webpack for this plugin.
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  additionalPrecacheEntries: [{ url: OFFLINE_FALLBACK_PATH, revision }],
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  reactCompiler: false,
  images: {
    // Keep in lockstep with isServableAvatarImageUrl (Avatar + AvatarPicker fallback).
    remotePatterns: [...getSupabaseAvatarRemotePatterns(), ...getEventCoverRemotePatterns()],
    // Local Supabase serves avatars on 127.0.0.1/localhost. Next 16 blocks private
    // IPs in the image optimizer unless this is true — without it, /_next/image
    // answers 400 "url parameter is not allowed" while Storage itself is 200.
    dangerouslyAllowLocalIP: shouldAllowLocalIPForAvatars(),
  },
  experimental: {
    serverActions: {
      // El body de una server action está capado en 1 MB por default, pero el
      // avatar acepta hasta 5 MB: sin esto, cualquier foto de celular moría en el
      // framework y nunca llegaba a la validación que devuelve el error en español.
      // El margen extra cubre el overhead del multipart.
      bodySizeLimit: "6mb",
    },
  },
};

export default withSerwist(nextConfig);
